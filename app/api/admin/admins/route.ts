import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

/**
 * GET /api/admin/admins - List all admin accounts
 * POST /api/admin/admins - Create new admin account
 * Only accessible by admins with "admin" role
 */
export async function GET(request: NextRequest) {
  try {
    // Get admin token from cookie or Authorization header
    let token = request.cookies.get("admin_auth_token")?.value;
    if (!token) {
      const authHeader = request.headers.get("Authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return NextResponse.json(
        { detail: "Admin authentication required" },
        { status: 401 }
      );
    }

    // Forward to FastAPI backend
    const response = await fetch(`${API_BASE_URL}/api/admin/admins`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Failed to fetch admins" }));
      return NextResponse.json(
        { detail: error.detail || "Failed to fetch admins" },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json(data, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "Pragma": "no-cache",
      },
    });

  } catch (error) {
    console.error("Error fetching admins:", error);
    return NextResponse.json(
      { detail: "Failed to fetch admins" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get admin token from cookie or Authorization header
    let token = request.cookies.get("admin_auth_token")?.value;
    if (!token) {
      const authHeader = request.headers.get("Authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return NextResponse.json(
        { detail: "Admin authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.password || !body.role) {
      return NextResponse.json(
        { detail: "Name, password, and role are required" },
        { status: 422 }
      );
    }

    // Validate role
    const allowedRoles = ["admin", "account", "support"];
    if (!allowedRoles.includes(body.role)) {
      return NextResponse.json(
        { detail: `Role must be one of: ${allowedRoles.join(", ")}` },
        { status: 422 }
      );
    }

    // Forward to FastAPI backend
    const response = await fetch(`${API_BASE_URL}/api/admin/admins`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Failed to create admin" }));
      return NextResponse.json(
        { detail: error.detail || "Failed to create admin" },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json(data, {
      status: 201,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "Pragma": "no-cache",
      },
    });

  } catch (error) {
    console.error("Error creating admin:", error);
    return NextResponse.json(
      { detail: "Failed to create admin" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
export const revalidate = 0;