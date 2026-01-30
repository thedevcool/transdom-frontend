import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/admin/logout
 * Clear admin authentication cookies to log out admin
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
      { success: true, message: "Admin logged out successfully" },
      { status: 200 },
    );

    // Clear admin authentication cookies
    nextResponse.cookies.set("admin_auth_token", "", cookieOptions);
    nextResponse.cookies.set("admin_user", "", {
      ...cookieOptions,
      httpOnly: false,
    });

    return nextResponse;
  } catch (error) {
    console.error("Admin logout error:", error);
    return NextResponse.json({ detail: "Logout failed" }, { status: 500 });
  }
}
