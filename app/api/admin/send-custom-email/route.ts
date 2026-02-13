import { NextRequest, NextResponse } from "next/server";

// Disable caching for this route
export const dynamic = "force-dynamic";
export const revalidate = 0;

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

/**
 * POST /api/admin/send-custom-email
 * Send custom email to a user (admin only)
 * Uses admin Bearer token from HTTP-only cookie
 */
export async function POST(request: NextRequest) {
  try {
    // Get admin token from HTTP-only cookie OR Authorization header
    let token = request.cookies.get("admin_auth_token")?.value;

    // Fallback to Authorization header if cookie not present
    if (!token) {
      const authHeader = request.headers.get("authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return NextResponse.json(
        { detail: "Unauthorized - Admin access required" },
        { status: 401 },
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate required fields
    if (!body.to_email) {
      return NextResponse.json(
        { detail: "Recipient email is required" },
        { status: 422 },
      );
    }

    if (!body.subject) {
      return NextResponse.json(
        { detail: "Email subject is required" },
        { status: 422 },
      );
    }

    if (!body.message) {
      return NextResponse.json(
        { detail: "Email message is required" },
        { status: 422 },
      );
    }

    // Forward to FastAPI backend with admin token
    const response = await fetch(`${API_BASE_URL}/api/admin/send-custom-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ detail: "Failed to send email" }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Admin send custom email error:", error);

    // Don't expose internal error details in production
    const isProduction = process.env.NODE_ENV === "production";
    const errorMessage = isProduction
      ? "Failed to send email. Please try again."
      : error instanceof Error
        ? error.message
        : "Failed to send email";

    return NextResponse.json({ detail: errorMessage }, { status: 400 });
  }
}
