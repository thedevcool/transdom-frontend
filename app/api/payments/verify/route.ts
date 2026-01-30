import { NextRequest, NextResponse } from "next/server";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

/**
 * GET /api/payments/verify?reference=xxx
 * Verify a Paystack payment transaction
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get("reference");

    if (!reference) {
      return NextResponse.json(
        { detail: "Payment reference is required" },
        { status: 422 },
      );
    }

    // Verify payment with Paystack
    const paystackResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!paystackResponse.ok) {
      const errorData = await paystackResponse.json().catch(() => ({}));
      console.error("Paystack verification failed:", errorData);

      return NextResponse.json(
        {
          detail: errorData.message || "Payment verification failed",
          error: errorData,
        },
        { status: paystackResponse.status },
      );
    }

    const paystackData = await paystackResponse.json();

    // Check if payment was successful
    if (!paystackData.data || paystackData.data.status !== "success") {
      return NextResponse.json(
        {
          status: "failed",
          message: "Payment was not successful",
          data: paystackData.data,
        },
        { status: 400 },
      );
    }

    // Extract metadata
    const metadata = paystackData.data.metadata || {};
    const amountInNaira = paystackData.data.amount / 100; // Convert from kobo to naira

    // Return verified payment data
    return NextResponse.json(
      {
        status: "success",
        message: "Payment verified successfully",
        data: {
          reference: paystackData.data.reference,
          amount: amountInNaira,
          currency: paystackData.data.currency,
          status: paystackData.data.status,
          paid_at: paystackData.data.paid_at,
          channel: paystackData.data.channel,
          metadata: {
            zone: metadata.zone,
            weight: metadata.weight,
            delivery_speed: metadata.delivery_speed,
          },
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.json(
      {
        detail:
          error instanceof Error
            ? error.message
            : "Payment verification failed",
      },
      { status: 500 },
    );
  }
}
