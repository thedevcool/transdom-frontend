import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/auth/logout
 * Clear authentication cookies to log out user
 */
export async function POST(request: NextRequest) {
  try {
    const isProduction = process.env.NODE_ENV === "production";

    // Cookie configuration for deletion
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

    const nextResponse = NextResponse.json(
      { success: true, message: "Logged out successfully" },
      { status: 200 },
    );

    // Clear authentication cookies
    nextResponse.cookies.set("backend_auth_token", "", cookieOptions);
    nextResponse.cookies.set("auth_user", "", {
      ...cookieOptions,
      httpOnly: false,
    });

    return nextResponse;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json({ detail: "Logout failed" }, { status: 500 });
  }
}
