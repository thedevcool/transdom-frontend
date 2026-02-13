import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

/**
 * DELETE /api/admin/admins/[adminId] - Delete admin account
 * Only accessible by admins with "admin" role
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ adminId: string }> },
) {
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
        { status: 401 },
      );
    }

    const { adminId } = await params;

    // Forward to FastAPI backend
    const response = await fetch(
      `${API_BASE_URL}/api/admin/admins/${adminId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ detail: "Failed to delete admin" }));
      return NextResponse.json(
        { detail: error.detail || "Failed to delete admin" },
        { status: response.status },
      );
    }

    const data = await response.json();

    return NextResponse.json(data, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        Pragma: "no-cache",
      },
    });
  } catch (error) {
    console.error("Error deleting admin:", error);
    return NextResponse.json(
      { detail: "Failed to delete admin" },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
export const revalidate = 0;
