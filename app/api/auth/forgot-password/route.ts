import { NextRequest, NextResponse } from "next/server";
import { apiPost } from "@/lib/api-client";

interface ForgotPasswordPayload {
  email: string;
}

interface ForgotPasswordResponse {
  message: string;
  detail?: string;
}

/**
 * POST /api/auth/forgot-password
 * Request password reset email for user
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

    const body = JSON.parse(text) as ForgotPasswordPayload;

    // Validate required fields
    if (!body.email) {
      return NextResponse.json(
        { detail: "Email is required" },
        { status: 422 },
      );
    }

    // Email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { detail: "Invalid email format" },
        { status: 422 },
      );
    }

    // Forward to FastAPI backend
    const response = await apiPost<ForgotPasswordResponse>(
      "/api/forgot-password",
      body,
    );

    return NextResponse.json(
      {
        success: true,
        message:
          response.message ||
          "Password reset email sent successfully. Please check your inbox.",
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Forgot password error:", error);

    // Handle different error scenarios
    if (error.response) {
      const status = error.response.status;
      const errorData = error.response.data;

      // User not found - return success anyway for security (don't reveal if email exists)
      if (status === 404) {
        return NextResponse.json(
          {
            success: true,
            message:
              "If that email exists in our system, a password reset link has been sent.",
          },
          { status: 200 },
        );
      }

      // Other backend errors
      return NextResponse.json(
        {
          detail:
            errorData?.detail ||
            "Failed to process password reset request. Please try again.",
        },
        { status: status || 500 },
      );
    }

    // Network or other errors
    return NextResponse.json(
      {
        detail:
          "Unable to process your request at this time. Please try again later.",
      },
      { status: 500 },
    );
  }
}
