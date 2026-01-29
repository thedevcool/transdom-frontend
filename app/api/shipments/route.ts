import { NextRequest, NextResponse } from "next/server";

interface Shipment {
  _id: string;
  order_no: string;
  zone_picked: string;
  weight: number;
  email: string;
  amount_paid: number;
  status: string;
  date_created: string;
}

/**
 * GET /api/shipments
 * Fetch user's shipments/orders from FastAPI backend
 * Uses Bearer token from HTTP-only cookie
 */
export async function GET(request: NextRequest) {
  try {
    // Get token from HTTP-only cookie
    const token = request.cookies.get("backend_auth_token")?.value;
    if (!token) {
      return NextResponse.json(
        {
          detail: "Unauthorized",
          shipments: [],
          total: 0,
        },
        { status: 401 },
      );
    }

    // Forward to FastAPI backend with the token
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"}/api/shipments`,
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

    // Backend returns array directly, wrap it in proper format
    const shipments = Array.isArray(data) ? data : [];

    return NextResponse.json(
      {
        shipments,
        total: shipments.length,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Shipments fetch error:", error);
    return NextResponse.json(
      {
        detail:
          error instanceof Error ? error.message : "Failed to fetch shipments",
        shipments: [],
        total: 0,
      },
      { status: 400 },
    );
  }
}
