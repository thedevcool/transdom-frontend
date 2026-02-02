import { NextRequest, NextResponse } from "next/server";

interface InsuranceRequest {
  shipment_value: number;
}

interface InsuranceResponse {
  shipment_value: number;
  insurance_fee: number;
  insurance_rate: number;
  minimum_fee: number;
  currency: string;
}

/**
 * POST /api/calculate-insurance
 * Calculate insurance fee based on shipment value
 * Public endpoint - no authentication required
 *
 * Formula: insurance_fee = max(shipment_value × 2%, ₦500)
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as InsuranceRequest;

    // Validate shipment value
    if (!body.shipment_value || body.shipment_value <= 0) {
      return NextResponse.json(
        { detail: "Shipment value must be greater than 0" },
        { status: 400 },
      );
    }

    // Insurance calculation
    const INSURANCE_RATE = 0.02; // 2%
    const MINIMUM_FEE = 500; // NGN 500

    const calculatedFee = body.shipment_value * INSURANCE_RATE;
    const insurance_fee = Math.max(calculatedFee, MINIMUM_FEE);

    const response: InsuranceResponse = {
      shipment_value: body.shipment_value,
      insurance_fee: parseFloat(insurance_fee.toFixed(2)),
      insurance_rate: INSURANCE_RATE,
      minimum_fee: MINIMUM_FEE,
      currency: "NGN",
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Insurance calculation error:", error);
    return NextResponse.json(
      {
        detail:
          error instanceof Error
            ? error.message
            : "Insurance calculation failed",
      },
      { status: 500 },
    );
  }
}
