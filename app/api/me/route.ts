import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

/**
 * DELETE /api/me
 * Delete the authenticated user's own account
 */
export async function DELETE(request: NextRequest) {
  try {
    // Get user token from HTTP-only cookie
    const token = request.cookies.get("backend_auth_token")?.value;

    if (!token) {
      return NextResponse.json(
        { detail: "Unauthorized - Please log in" },
        { status: 401 },
      );
    }

    // Forward to FastAPI backend
    const response = await fetch(`${API_BASE_URL}/api/me`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ detail: "Failed to delete account" }));
      return NextResponse.json(
        { detail: error.detail || "Failed to delete account" },
        { status: response.status },
      );
    }

    const data = await response.json();

    // Clear authentication cookies
    const isProduction = process.env.NODE_ENV === "production";
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax" as const,
      maxAge: 0, // Expire immediately
      path: "/",
      ...(isProduction && process.env.COOKIE_DOMAIN
        ? { domain: process.env.COOKIE_DOMAIN }
        : {}),
    };

    const nextResponse = NextResponse.json(data, { status: 200 });

    // Clear authentication cookies
    nextResponse.cookies.set("backend_auth_token", "", cookieOptions);
    nextResponse.cookies.set("auth_user", "", {
      ...cookieOptions,
      httpOnly: false,
    });

    return nextResponse;
  } catch (error) {
    console.error("Account deletion error:", error);
    return NextResponse.json(
      { detail: "Internal server error" },
      { status: 500 },
    );
  }
}
