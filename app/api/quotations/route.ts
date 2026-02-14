import { NextRequest, NextResponse } from "next/server";
import {
  getZoneForCountry,
  getZoneDisplayName,
} from "../../../lib/zone-mapping";
import { getCountryIsoCode } from "../../../lib/countries-data";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

interface QuotationRequest {
  pickupCountry: string;
  destinationCountry: string;
  weight: number;
}

interface BookingDetailsRequest {
  pickupCountry: string;
  destinationCountry: string;
  weight: number;
  // Sender details
  sender_name: string;
  sender_phone: string;
  sender_address: string;
  sender_state: string;
  sender_city: string;
  sender_country: string;
  sender_email: string;
  // Receiver details
  receiver_name: string;
  receiver_phone: string;
  receiver_address: string;
  receiver_state: string;
  receiver_city: string;
  receiver_post_code: string;
  receiver_country: string;
  // Shipment details
  shipment_description: string;
  shipment_quantity: number;
  shipment_value?: number;
  shipment_weight: number;
  delivery_speed: "economy" | "standard" | "express";
}

interface CarrierPrice {
  carrier: string;
  zone: string;
  price: string;
  currency?: string;
}

interface ComparePricesResponse {
  from_country: string;
  to_country: string;
  weight: number;
  prices: CarrierPrice[];
}

interface DeliveryOption {
  speed: "economy" | "standard" | "express";
  price: string;
  estimated_delivery: string;
  multiplier: number;
  carrier?: string;
  zone?: string;
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

    // Get ISO codes for countries
    const fromCountryIso = getCountryIsoCode(body.pickupCountry);
    const toCountryIso = getCountryIsoCode(body.destinationCountry);

    if (!fromCountryIso || !toCountryIso) {
      return NextResponse.json(
        {
          detail: `Invalid country names. Could not find ISO codes for: ${body.pickupCountry} or ${body.destinationCountry}`,
        },
        { status: 400 },
      );
    }

    // Round up weight to nearest whole number
    const weightRounded = Math.ceil(body.weight);

    // Fetch prices from all carriers using compare-prices endpoint
    const compareUrl = `${API_BASE_URL}/api/compare-prices?from_country=${encodeURIComponent(fromCountryIso)}&to_country=${encodeURIComponent(toCountryIso)}&weight=${weightRounded}`;

    const response = await fetch(compareUrl);

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ detail: "Failed to fetch prices" }));
      return NextResponse.json(
        {
          detail:
            error.detail ||
            `Failed to fetch prices for route: ${fromCountryIso} to ${toCountryIso}`,
        },
        { status: response.status },
      );
    }

    const compareResponse = (await response.json()) as ComparePricesResponse;

    if (!compareResponse.prices || compareResponse.prices.length === 0) {
      return NextResponse.json(
        {
          detail: `No shipping rates found for route: ${body.pickupCountry} to ${body.destinationCountry}`,
        },
        { status: 404 },
      );
    }

    // Map carriers to delivery options
    // DHL -> express, FedEx -> standard, UPS -> economy
    const carrierToSpeed: Record<string, "economy" | "standard" | "express"> = {
      DHL: "express",
      FEDEX: "standard",
      UPS: "economy",
    };

    const deliveryOptions: DeliveryOption[] = compareResponse.prices
      .filter((price) => carrierToSpeed[price.carrier.toUpperCase()])
      .map((price) => {
        const speed = carrierToSpeed[price.carrier.toUpperCase()];
        const priceNum = parseFloat(price.price.replace(/,/g, ""));

        let estimated_delivery: string;
        switch (speed) {
          case "express":
            estimated_delivery = "3-5 business days";
            break;
          case "standard":
            estimated_delivery = "5-8 business days";
            break;
          case "economy":
            estimated_delivery = "5-7 business days";
            break;
        }

        return {
          speed,
          price: priceNum.toFixed(2),
          estimated_delivery,
          multiplier: 1.0, // Not used anymore, but keep for compatibility
          carrier: price.carrier,
          zone: price.zone,
        };
      });

    // Sort by speed order: economy, standard, express
    deliveryOptions.sort((a, b) => {
      const order = { economy: 0, standard: 1, express: 2 };
      return order[a.speed] - order[b.speed];
    });

    // Use the first price's currency, or default to NGN
    const currency = compareResponse.prices[0]?.currency || "NGN";

    // Get unified zone for display purposes
    const unifiedZone = getZoneForCountry(body.destinationCountry);
    const unifiedZoneDisplay = unifiedZone
      ? getZoneDisplayName(unifiedZone)
      : "Multiple Carriers";

    return NextResponse.json(
      {
        pickup_country: body.pickupCountry,
        destination_country: body.destinationCountry,
        from_country_iso: fromCountryIso,
        to_country_iso: toCountryIso,
        weight: body.weight,
        weight_rounded: weightRounded,
        currency,
        delivery_options: deliveryOptions,
        carriers_data: compareResponse.prices, // Include full carrier data for reference
        unified_zone: unifiedZone,
        unified_zone_display: unifiedZoneDisplay,
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

/**
 * PUT /api/quotations
 * Create an order with complete booking details
 * This stores the quotation details temporarily for the user to review before payment
 */
export async function PUT(request: NextRequest) {
  try {
    const body = (await request.json()) as BookingDetailsRequest;

    // Validate booking details
    if (
      !body.sender_name ||
      !body.receiver_name ||
      !body.shipment_description
    ) {
      return NextResponse.json(
        { detail: "Missing required booking details" },
        { status: 422 },
      );
    }

    if (!body.delivery_speed) {
      return NextResponse.json(
        { detail: "Missing delivery speed selection" },
        { status: 422 },
      );
    }

    // Get token from HTTP-only cookie
    const token = request.cookies.get("backend_auth_token")?.value;
    if (!token) {
      return NextResponse.json(
        { detail: "Unauthorized - Please login to create a quotation" },
        { status: 401 },
      );
    }

    // Get ISO codes for countries
    const fromCountryIso = getCountryIsoCode(body.sender_country);
    const toCountryIso = getCountryIsoCode(body.destinationCountry);

    if (!fromCountryIso || !toCountryIso) {
      return NextResponse.json(
        {
          detail: `Invalid country names. Could not find ISO codes for: ${body.sender_country} or ${body.destinationCountry}`,
        },
        { status: 400 },
      );
    }

    // Calculate final price based on delivery speed using compare-prices
    const weightRounded = Math.ceil(body.shipment_weight);
    const compareUrl = `${API_BASE_URL}/api/compare-prices?from_country=${encodeURIComponent(fromCountryIso)}&to_country=${encodeURIComponent(toCountryIso)}&weight=${weightRounded}`;
    const compareResponse = await fetch(compareUrl);

    if (!compareResponse.ok) {
      return NextResponse.json(
        { detail: "Failed to fetch carrier prices" },
        { status: 500 },
      );
    }

    const compareData = (await compareResponse.json()) as ComparePricesResponse;

    if (!compareData.prices || compareData.prices.length === 0) {
      return NextResponse.json(
        { detail: "No carrier prices found for this route" },
        { status: 404 },
      );
    }

    // Map delivery speed to carrier
    const speedToCarrier: Record<string, string> = {
      express: "DHL",
      standard: "FEDEX",
      economy: "UPS",
    };

    const selectedCarrier = speedToCarrier[body.delivery_speed];
    const carrierPrice = compareData.prices.find(
      (price) => price.carrier.toUpperCase() === selectedCarrier,
    );

    if (!carrierPrice) {
      return NextResponse.json(
        { detail: `Price not available for ${selectedCarrier} on this route` },
        { status: 400 },
      );
    }

    const finalPrice = parseFloat(carrierPrice.price.replace(/,/g, ""));

    // Get unified zone for display purposes
    const unifiedZone = getZoneForCountry(body.destinationCountry);
    const unifiedZoneDisplay = unifiedZone
      ? getZoneDisplayName(unifiedZone)
      : `${fromCountryIso} to ${toCountryIso}`;

    // Return quotation summary for user to review before payment
    // This does NOT create the order yet - that happens after payment
    return NextResponse.json(
      {
        zone_picked:
          unifiedZone || compareData.prices.map((p) => p.carrier).join(", "),
        zone_display: unifiedZoneDisplay,
        weight: body.shipment_weight,
        delivery_speed: body.delivery_speed,
        carrier: selectedCarrier,
        amount: finalPrice,
        currency: carrierPrice.currency || "NGN",
        booking_details: {
          sender: {
            name: body.sender_name,
            phone: body.sender_phone,
            address: body.sender_address,
            state: body.sender_state,
            city: body.sender_city,
            country: body.sender_country,
            email: body.sender_email,
          },
          receiver: {
            name: body.receiver_name,
            phone: body.receiver_phone,
            address: body.receiver_address,
            state: body.receiver_state,
            city: body.receiver_city,
            post_code: body.receiver_post_code,
            country: body.receiver_country,
          },
          shipment: {
            description: body.shipment_description,
            quantity: body.shipment_quantity,
            value: body.shipment_value,
            weight: body.shipment_weight,
          },
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Quotation creation error:", error);
    return NextResponse.json(
      {
        detail:
          error instanceof Error ? error.message : "Failed to create quotation",
      },
      { status: 500 },
    );
  }
}
