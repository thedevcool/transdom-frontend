import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

/**
 * GET /api/rates/[zone]/price
 * Get price for a specific zone and weight
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ zone: string }> },
) {
  try {
    const { searchParams } = new URL(request.url);
    const weight = searchParams.get("weight");
    const { zone } = await params;

    if (!weight) {
      return NextResponse.json(
        { detail: "Weight parameter is required" },
        { status: 400 },
      );
    }

    const weightNum = parseFloat(weight);
    if (isNaN(weightNum) || weightNum <= 0) {
      return NextResponse.json(
        { detail: "Weight must be greater than 0" },
        { status: 400 },
      );
    }

    const url = `${API_BASE_URL}/api/rates/${zone}/price?weight=${weight}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ detail: "Failed to fetch price" }));
      return NextResponse.json(
        { detail: errorData.detail || "Failed to fetch price" },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Error fetching price:", error);
    return NextResponse.json(
      { detail: "Internal server error" },
      { status: 500 },
    );
  }
}
