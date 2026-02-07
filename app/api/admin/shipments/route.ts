import { NextRequest, NextResponse } from "next/server";

// Disable caching for this route
export const dynamic = "force-dynamic";
export const revalidate = 0;

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

/**
 * GET /api/admin/shipments
 * Fetch all shipments for admin (with optional filters) including complete booking details
 * Uses admin Bearer token from HTTP-only cookie
 */
export async function GET(request: NextRequest) {
  try {
    // // Debug: log all cookies
    // const allCookies = request.cookies.getAll();
    // console.log(
    //   "Admin shipments - All cookies:",
    //   allCookies.map((c) => c.name),
    // );

    // Get admin token from HTTP-only cookie OR Authorization header
    let token = request.cookies.get("admin_auth_token")?.value;

    // Fallback to Authorization header if cookie not present
    if (!token) {
      const authHeader = request.headers.get("authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
        console.log("Using token from Authorization header");
      }
    } else {
      console.log("Using token from cookie");
    }

    console.log("Admin auth token present:", !!token);

    if (!token) {
      console.error("No token found in cookie or header");
      return NextResponse.json(
        { detail: "Unauthorized - Admin access required" },
        { status: 401 },
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status_filter = searchParams.get("status_filter");
    const email = searchParams.get("email");
    const limit = searchParams.get("limit") || "100";

    // Build query string
    const params = new URLSearchParams();
    if (status_filter) params.append("status_filter", status_filter);
    if (email) params.append("email", email);
    params.append("limit", limit);

    // Forward to FastAPI backend with admin token
    const response = await fetch(
      `${API_BASE_URL}/api/admin/shipments?${params.toString()}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ detail: "Failed to fetch shipments" }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    const data = await response.json();
    const res = NextResponse.json(data, { status: 200 });

    // Disable caching
    res.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate",
    );
    res.headers.set("Pragma", "no-cache");
    res.headers.set("Expires", "0");

    return res;
  } catch (error) {
    console.error("Admin shipments fetch error:", error);
    return NextResponse.json(
      {
        detail:
          error instanceof Error ? error.message : "Failed to fetch shipments",
        shipments: [],
        count: 0,
      },
      { status: 400 },
    );
  }
}
