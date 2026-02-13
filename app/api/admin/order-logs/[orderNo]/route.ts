import { NextRequest, NextResponse } from "next/server";

// Disable caching for this route
export const dynamic = "force-dynamic";
export const revalidate = 0;

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

/**
 * GET /api/admin/order-logs/[orderNo]
 * Get order logs for a specific order
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderNo: string }> },
) {
  try {
    const { orderNo } = await params;

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

    // Forward to backend
    const response = await fetch(
      `${API_BASE_URL}/api/admin/order-logs/${encodeURIComponent(orderNo)}`,
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
        .catch(() => ({ detail: "Failed to fetch order logs" }));
      return NextResponse.json(
        { detail: error.detail || "Failed to fetch order logs" },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Admin order logs error:", error);
    return NextResponse.json(
      { detail: "Internal server error" },
      { status: 500 },
    );
  }
}
