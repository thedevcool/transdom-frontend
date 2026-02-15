import { NextRequest, NextResponse } from "next/server";
import { apiPost } from "@/lib/api-client";

interface ResetPasswordPayload {
  token: string;
  new_password: string;
}

interface ResetPasswordResponse {
  message: string;
  detail?: string;
}

/**
 * POST /api/auth/reset-password
 * Reset user password using reset token
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

    const body = JSON.parse(text) as ResetPasswordPayload;

    // Validate required fields
    if (!body.token || !body.new_password) {
      return NextResponse.json(
        { detail: "Token and new password are required" },
        { status: 422 },
      );
    }

    // Validate password strength
    if (body.new_password.length < 8) {
      return NextResponse.json(
        { detail: "Password must be at least 8 characters long" },
        { status: 422 },
      );
    }

    // Forward to FastAPI backend
    const response = await apiPost<ResetPasswordResponse>(
      "/api/reset-password",
      {
        token: body.token,
        new_password: body.new_password,
      },
    );

    return NextResponse.json(
      {
        success: true,
        message: response.message || "Password reset successful",
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Reset password error:", error);

    // Handle different error scenarios
    if (error.response) {
      const status = error.response.status;
      const errorData = error.response.data;

      // Invalid or expired token
      if (status === 400 || status === 401) {
        return NextResponse.json(
          {
            detail:
              errorData?.detail ||
              "Invalid or expired reset token. Please request a new password reset.",
          },
          { status: 400 },
        );
      }

      // User not found
      if (status === 404) {
        return NextResponse.json(
          {
            detail:
              errorData?.detail ||
              "User not found. Please contact support if this issue persists.",
          },
          { status: 404 },
        );
      }

      // Other backend errors
      return NextResponse.json(
        {
          detail:
            errorData?.detail ||
            "Failed to reset password. Please try again.",
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
