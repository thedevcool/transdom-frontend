import { NextRequest, NextResponse } from "next/server";

// Disable caching for this route
export const dynamic = "force-dynamic";
export const revalidate = 0;

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

/**
 * GET /api/admin/rates
 * Fetch all shipping rates (admin version)
 */
export async function GET(request: NextRequest) {
  try {
    // Get the authorization header from the request
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "") || "";

    const { searchParams } = new URL(request.url);
    const route = searchParams.get("route");
    const zone = searchParams.get("zone");

    const params = new URLSearchParams();
    if (route) {
      params.append("route", route);
    }
    if (zone) {
      params.append("zone", zone);
    }

    const url = `${API_BASE_URL}/api/rates${params.toString() ? `?${params.toString()}` : ""}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ detail: "Failed to fetch rates" }));
      return NextResponse.json(
        { detail: errorData.detail || "Failed to fetch rates" },
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
    console.error("Error fetching rates:", error);
    return NextResponse.json(
      { detail: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/admin/rates
 * Add or update zone rates (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    // Get the authorization header from the request
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "") || "";

    if (!token) {
      return NextResponse.json(
        { detail: "Not authenticated" },
        { status: 401 },
      );
    }

    const body = await request.json();

    // Validate request body
    if (
      !body.zone ||
      !body.currency ||
      !body.unit ||
      !Array.isArray(body.rates)
    ) {
      return NextResponse.json(
        { detail: "Missing required fields: zone, currency, unit, rates" },
        { status: 400 },
      );
    }

    // Validate rates array
    if (body.rates.length === 0) {
      return NextResponse.json(
        { detail: "Rates array cannot be empty" },
        { status: 400 },
      );
    }

    for (const rate of body.rates) {
      if (typeof rate.weight !== "number" || typeof rate.price !== "number") {
        return NextResponse.json(
          { detail: "Each rate must have numeric weight and price" },
          { status: 400 },
        );
      }
    }

    const url = `${API_BASE_URL}/api/add-rates`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ detail: "Failed to add/update rates" }));
      return NextResponse.json(
        { detail: errorData.detail || "Failed to add/update rates" },
        { status: response.status },
      );
    }

    const data = await response.json();
    const res = NextResponse.json(data, { status: response.status });

    // Disable caching
    res.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate",
    );
    res.headers.set("Pragma", "no-cache");
    res.headers.set("Expires", "0");

    return res;
  } catch (error) {
    console.error("Error adding/updating rates:", error);
    return NextResponse.json(
      { detail: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/admin/rates
 * Delete a zone and its rates (admin only)
 */
export async function DELETE(request: NextRequest) {
  try {
    // Get the authorization header from the request
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "") || "";

    if (!token) {
      return NextResponse.json(
        { detail: "Not authenticated" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const zone = searchParams.get("zone");

    if (!zone) {
      return NextResponse.json(
        { detail: "Zone parameter is required" },
        { status: 400 },
      );
    }

    const url = `${API_BASE_URL}/api/rates/${zone}`;

    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ detail: "Failed to delete zone" }));
      return NextResponse.json(
        { detail: errorData.detail || "Failed to delete zone" },
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
    console.error("Error deleting zone:", error);
    return NextResponse.json(
      { detail: "Internal server error" },
      { status: 500 },
    );
  }
}
