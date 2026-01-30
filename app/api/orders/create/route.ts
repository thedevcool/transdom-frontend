import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

interface MakeOrderRequest {
  zone_picked: string;
  weight: number;
  email: string;
  amount_paid: number;
}

interface OrderResponse {
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
 * POST /api/orders/create
 * Create a new order after successful payment
 * Calls FastAPI /api/make-order endpoint
 */
export async function POST(request: NextRequest) {
  try {
    // Get the auth token from HTTP-only cookie
    const cookieStore = await cookies();
    const authToken = cookieStore.get("backend_auth_token");

    if (!authToken) {
      return NextResponse.json(
        { detail: "Not authenticated" },
        { status: 401 },
      );
    }

    const body = (await request.json()) as MakeOrderRequest;

    // Validate required fields
    const required = ["zone_picked", "weight", "email", "amount_paid"];
    for (const field of required) {
      if (
        !(field in body) ||
        body[field as keyof MakeOrderRequest] === undefined
      ) {
        return NextResponse.json(
          { detail: `Missing required field: ${field}` },
          { status: 422 },
        );
      }
    }

    // Validate types
    if (typeof body.weight !== "number" || body.weight <= 0) {
      return NextResponse.json(
        { detail: "Weight must be a positive number" },
        { status: 422 },
      );
    }

    if (typeof body.amount_paid !== "number" || body.amount_paid <= 0) {
      return NextResponse.json(
        { detail: "Amount paid must be a positive number" },
        { status: 422 },
      );
    }

    // Forward to FastAPI backend with authentication
    const response = await fetch(`${API_BASE_URL}/api/make-order`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken.value}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        zone_picked: body.zone_picked,
        weight: body.weight,
        email: body.email,
        amount_paid: body.amount_paid,
      }),
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ detail: "Order creation failed" }));
      return NextResponse.json(
        { detail: error.detail || "Order creation failed" },
        { status: response.status },
      );
    }

    const orderResponse = (await response.json()) as OrderResponse;

    return NextResponse.json(
      {
        _id: orderResponse._id,
        order_no: orderResponse.order_no,
        zone_picked: orderResponse.zone_picked,
        weight: orderResponse.weight,
        email: orderResponse.email,
        amount_paid: orderResponse.amount_paid,
        status: orderResponse.status,
        date_created: orderResponse.date_created,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Order creation error:", error);
    return NextResponse.json(
      {
        detail:
          error instanceof Error ? error.message : "Order creation failed",
      },
      { status: 400 },
    );
  }
}
