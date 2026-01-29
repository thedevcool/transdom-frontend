import { NextRequest, NextResponse } from "next/server";
import { getZoneForCountry } from "@/lib/zone-mapping";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

interface QuotationRequest {
  pickupCountry: string;
  destinationCountry: string;
  weight: number;
}

interface PriceResponse {
  zone: string;
  weight: number;
  price: string;
  currency: string;
}

interface DeliveryOption {
  speed: "economy" | "standard" | "express";
  price: string;
  estimated_delivery: string;
  multiplier: number;
}

/**
 * POST /api/quotations
 * Calculate shipping quote based on pickup/destination countries and weight
 * Returns all 3 delivery speed options for user to choose
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as QuotationRequest;

    // Validate required fields
    if (!body.pickupCountry || !body.destinationCountry || !body.weight) {
      return NextResponse.json(
        {
          detail:
            "Missing required fields: pickupCountry, destinationCountry, weight",
        },
        { status: 422 },
      );
    }

    if (body.weight <= 0) {
      return NextResponse.json(
        { detail: "Weight must be greater than 0" },
        { status: 422 },
      );
    }

    // Map destination country to zone
    const destinationZone = getZoneForCountry(body.destinationCountry);

    if (!destinationZone) {
      return NextResponse.json(
        {
          detail: `Unsupported destination country: ${body.destinationCountry}`,
          suggestion:
            "Please check the country name or contact support for shipping to this location.",
        },
        { status: 400 },
      );
    }

    console.log(`Mapped ${body.destinationCountry} -> ${destinationZone}`);

    // Round up weight to nearest whole number
    const weightRounded = Math.ceil(body.weight);

    // Fetch base price from FastAPI backend: GET /api/rates/{zone}/price?weight={weight}
    const priceUrl = `${API_BASE_URL}/api/rates/${encodeURIComponent(destinationZone)}/price?weight=${weightRounded}`;
    console.log(`Fetching price from: ${priceUrl}`);

    const response = await fetch(priceUrl);

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ detail: "Failed to fetch price" }));
      return NextResponse.json(
        {
          detail:
            error.detail ||
            `Failed to fetch price for zone: ${destinationZone}`,
        },
        { status: response.status },
      );
    }

    const priceResponse = (await response.json()) as PriceResponse;

    // Parse the price (handles both numeric and formatted string like "1,234.56")
    const basePriceStr = priceResponse.price.toString().replace(/,/g, "");
    const standardPrice = parseFloat(basePriceStr);

    if (isNaN(standardPrice)) {
      return NextResponse.json(
        { detail: "Invalid price returned from backend" },
        { status: 500 },
      );
    }

    // Calculate all three delivery options
    // Standard is the base price from DB
    // Express is 2x standard
    // Economy is standard / 2
    const deliveryOptions: DeliveryOption[] = [
      {
        speed: "economy",
        price: (standardPrice / 2).toFixed(2),
        estimated_delivery: "14-21 business days",
        multiplier: 0.5,
      },
      {
        speed: "standard",
        price: standardPrice.toFixed(2),
        estimated_delivery: "7-10 business days",
        multiplier: 1.0,
      },
      {
        speed: "express",
        price: (standardPrice * 2).toFixed(2),
        estimated_delivery: "3-5 business days",
        multiplier: 2.0,
      },
    ];

    return NextResponse.json(
      {
        pickup_country: body.pickupCountry,
        destination_country: body.destinationCountry,
        destination_zone: destinationZone,
        weight: body.weight,
        weight_rounded: weightRounded,
        currency: priceResponse.currency || "NGN",
        delivery_options: deliveryOptions,
        base_price: standardPrice.toFixed(2), // Standard price from DB
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Quotation error:", error);
    return NextResponse.json(
      {
        detail:
          error instanceof Error
            ? error.message
            : "Quotation calculation failed",
      },
      { status: 500 },
    );
  }
}
