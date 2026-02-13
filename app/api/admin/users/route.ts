import { NextRequest, NextResponse } from "next/server";

// Disable caching for this route
export const dynamic = "force-dynamic";
export const revalidate = 0;

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

/**
 * GET /api/admin/users
 * List all users for admin
 * Uses admin Bearer token from HTTP-only cookie
 */
export async function GET(request: NextRequest) {
  try {
    // Get admin token from HTTP-only cookie OR Authorization header
    let token = request.cookies.get("admin_auth_token")?.value;

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

    // Forward to FastAPI backend
    const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ detail: "Failed to fetch users" }));
      return NextResponse.json(
        { detail: error.detail || "Failed to fetch users" },
        { status: response.status },
      );
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
    console.error("Admin users fetch error:", error);
    return NextResponse.json(
      {
        detail:
          error instanceof Error ? error.message : "Failed to fetch users",
        users: [],
        total: 0,
      },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/admin/users
 * Delete all users or a specific user by identifier
 */
export async function DELETE(request: NextRequest) {
  try {
    // Get admin token
    let token = request.cookies.get("admin_auth_token")?.value;
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

    const { searchParams } = new URL(request.url);
    const identifier = searchParams.get("identifier");

    let url = `${API_BASE_URL}/api/admin/users`;
    if (identifier) {
      url += `/${encodeURIComponent(identifier)}`;
    }

    // Forward to backend
    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ detail: "Failed to delete user(s)" }));
      return NextResponse.json(
        { detail: error.detail || "Failed to delete user(s)" },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Admin users delete error:", error);
    return NextResponse.json(
      { detail: "Internal server error" },
      { status: 500 },
    );
  }
}
