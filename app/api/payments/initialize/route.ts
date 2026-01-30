import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_API_URL = "https://api.paystack.co/transaction/initialize";

/**
 * POST /api/payments/initialize
 * Initialize a Paystack payment transaction
 */
export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated
    const cookieStore = await cookies();
    const authToken = cookieStore.get("backend_auth_token");

    if (!authToken) {
      return NextResponse.json(
        { detail: "Not authenticated" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { amount, email, zone, weight, delivery_speed } = body;

    // Validate required fields
    if (!amount || !email || !zone || !weight) {
      return NextResponse.json(
        { detail: "Missing required fields: amount, email, zone, weight" },
        { status: 422 },
      );
    }

    // Validate amount
    if (typeof amount !== "number" || amount <= 0) {
      return NextResponse.json(
        { detail: "Amount must be a positive number" },
        { status: 422 },
      );
    }

    // Convert amount to kobo (Paystack uses kobo, not naira)
    const amountInKobo = Math.round(amount * 100);

    // Generate a unique reference for this transaction
    const reference = `TDL_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Prepare callback URL (where Paystack will redirect after payment)
    const callbackUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/payment/success`;

    // Initialize payment with Paystack
    const paystackResponse = await fetch(PAYSTACK_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: amountInKobo,
        reference,
        callback_url: callbackUrl,
        metadata: {
          zone,
          weight,
          delivery_speed: delivery_speed || "standard",
          custom_fields: [
            {
              display_name: "Destination Zone",
              variable_name: "zone",
              value: zone,
            },
            {
              display_name: "Weight (kg)",
              variable_name: "weight",
              value: weight.toString(),
            },
            {
              display_name: "Delivery Speed",
              variable_name: "delivery_speed",
              value: delivery_speed || "standard",
            },
          ],
        },
      }),
    });

    if (!paystackResponse.ok) {
      const errorData = await paystackResponse.json().catch(() => ({}));
      console.error("Paystack initialization failed:", errorData);

      return NextResponse.json(
        {
          detail: errorData.message || "Payment initialization failed",
          error: errorData,
        },
        { status: paystackResponse.status },
      );
    }

    const paystackData = await paystackResponse.json();

    // Return the authorization URL and reference
    return NextResponse.json(
      {
        status: "success",
        message: "Payment initialized",
        data: {
          authorization_url: paystackData.data.authorization_url,
          access_code: paystackData.data.access_code,
          reference: paystackData.data.reference,
        },
        metadata: {
          zone,
          weight,
          delivery_speed: delivery_speed || "standard",
          amount,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Payment initialization error:", error);
    return NextResponse.json(
      {
        detail:
          error instanceof Error
            ? error.message
            : "Payment initialization failed",
      },
      { status: 500 },
    );
  }
}
