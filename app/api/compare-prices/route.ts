import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

/**
 * GET /api/compare-prices
 * Compare shipping prices across all carriers (DHL, FedEx, UPS)
 * Public endpoint - no authentication required
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const from_country = searchParams.get("from_country");
    const to_country = searchParams.get("to_country");
    const weight = searchParams.get("weight");

    // Validate required parameters
    if (!from_country || !to_country || !weight) {
      return NextResponse.json(
        {
          detail:
            "Missing required parameters: from_country, to_country, weight",
        },
        { status: 400 },
      );
    }

    // Validate weight
    const weightNum = parseFloat(weight);
    if (isNaN(weightNum) || weightNum <= 0 || weightNum > 1000) {
      return NextResponse.json(
        { detail: "Weight must be a positive number between 0.1 and 1000 kg" },
        { status: 400 },
      );
    }

    // Forward to FastAPI backend
    const response = await fetch(
      `${API_BASE_URL}/api/compare-prices?from_country=${encodeURIComponent(from_country)}&to_country=${encodeURIComponent(to_country)}&weight=${weight}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ detail: "Failed to fetch prices" }));
      return NextResponse.json(
        { detail: error.detail || `HTTP ${response.status}` },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Compare prices error:", error);
    return NextResponse.json(
      {
        detail:
          error instanceof Error ? error.message : "Failed to compare prices",
        prices: [],
      },
      { status: 500 },
    );
  }
}
