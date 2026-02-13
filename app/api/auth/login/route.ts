import { NextRequest, NextResponse } from "next/server";
import { apiPost } from "@/lib/api-client";

interface LoginPayload {
  email: string;
  password: string;
}

interface AuthUser {
  firstname: string;
  lastname: string;
  gender: string;
  email: string;
  phone_number?: string;
  country: string;
  referral_code?: string | null;
  photo_url?: string | null;
  is_suspended?: boolean;
}

interface LoginResponse {
  access_token: string;
  token_type: string;
  user?: AuthUser;
}

/**
 * POST /api/auth/login
 * Authenticate user and return JWT access token in HTTP-only cookie
 */
export async function POST(request: NextRequest) {
  try {
    // Check if request has a body
    const contentType = request.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      return NextResponse.json(
        { detail: "Content-Type must be application/json" },
        { status: 400 },
      );
    }

    const text = await request.text();
    if (!text) {
      return NextResponse.json(
        { detail: "Request body is required" },
        { status: 400 },
      );
    }

    const body = JSON.parse(text) as LoginPayload;

    // Validate required fields
    if (!body.email || !body.password) {
      return NextResponse.json(
        { detail: "Email and password are required" },
        { status: 422 },
      );
    }

    // Forward to FastAPI backend
    const response = await apiPost<LoginResponse>("/api/login", body);

    // Determine if we're in production
    const isProduction = process.env.NODE_ENV === "production";

    // Cookie configuration based on environment
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction, // HTTPS only in production
      sameSite: "lax" as const, // Use lax for better compatibility
      maxAge: 24 * 60 * 60, // 24 hours
      path: "/",
    };

    // Create response with HTTP-only cookies
    const nextResponse = NextResponse.json(
      {
        success: true,
        user: response.user,
      },
      { status: 200 },
    );

    // Set security headers
    if (isProduction) {
      nextResponse.headers.set("X-Content-Type-Options", "nosniff");
      nextResponse.headers.set("X-Frame-Options", "DENY");
      nextResponse.headers.set("X-XSS-Protection", "1; mode=block");
    }

    // Set HTTP-only cookie for backend JWT
    nextResponse.cookies.set(
      "backend_auth_token",
      response.access_token,
      cookieOptions,
    );

    // Set user data in cookie (not HTTP-only, accessible to client)
    if (response.user) {
      nextResponse.cookies.set("auth_user", JSON.stringify(response.user), {
        ...cookieOptions,
        httpOnly: false, // Must be false so client can read it
      });
    }

    return nextResponse;
  } catch (error) {
    console.error("Login error:", error);

    // Check if it's a suspension error from backend
    if (
      error instanceof Error &&
      (error.message.includes("suspended") ||
        error.message.includes("Suspended") ||
        error.message.includes("403"))
    ) {
      return NextResponse.json(
        {
          detail:
            "Your account has been suspended. Please contact support for assistance or wait until it is lifted.",
          error_code: "ACCOUNT_SUSPENDED",
          contact_support: true,
        },
        { status: 403 },
      );
    }

    // Don't expose internal error details in production
    const isProduction = process.env.NODE_ENV === "production";
    const errorMessage = isProduction
      ? "Invalid credentials. Please try again."
      : error instanceof Error
        ? error.message
        : "Login failed";

    return NextResponse.json(
      {
        detail: errorMessage,
      },
      { status: 401 },
    );
  }
}
