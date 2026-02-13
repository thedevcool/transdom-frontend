"use client";

import { useState, FormEvent, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import SearchableSelect from "@/app/components/SearchableSelect";
import { useRouter } from "next/navigation";
import { hasValidAuth } from "@/lib/auth";
import { Package, Truck } from "lucide-react";
import {
  getAllCountries,
  getCountryIsoCode,
  getStatesOfCountry,
  getCitiesOfState,
  getStateIsoCode,
  StateOption,
  CityOption,
} from "@/lib/countries-data";

const BASIC_QUOTE_STORAGE_KEY = "transdom_basic_quote";

// Get all countries with zone mapping
const COUNTRIES = getAllCountries();

interface CarrierPrice {
  carrier: string;
  zone: string;
  price: string;
  currency?: string;
}

interface DeliveryOption {
  speed: "economy" | "standard" | "express";
  price: string;
  estimated_delivery: string;
  multiplier: number;
  carrier?: string;
  zone?: string;
}

interface QuotationResult {
  pickup_country: string;
  destination_country: string;
  from_country_iso: string;
  to_country_iso: string;
  weight: number;
  weight_rounded: number;
  currency: string;
  delivery_options: DeliveryOption[];
  carriers_data: CarrierPrice[];
  unified_zone?: string;
  unified_zone_display?: string;
}

type Step = "basic" | "delivery";

// Map generic speed names to carrier names
const getCarrierName = (speed: string): string => {
  const speedMap: Record<string, string> = {
    economy: "UPS",
    standard: "FedEx",
    express: "DHL",
  };
  return speedMap[speed.toLowerCase()] || speed;
};

export default function QuotationPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"international" | "local">(
    "international",
  );
  const [currentStep, setCurrentStep] = useState<Step>("basic");
  const [quotationResult, setQuotationResult] =
    useState<QuotationResult | null>(null);
  const [selectedSpeed, setSelectedSpeed] = useState<
    "economy" | "standard" | "express"
  >("standard");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Basic quote data
  const [quoteData, setQuoteData] = useState({
    pickupCountry: "",
    pickupState: "",
    pickupCity: "",
    destinationCountry: "",
    destinationState: "",
    destinationCity: "",
    weight: "",
  });

  // Dynamic state and city options
  const [pickupStates, setPickupStates] = useState<StateOption[]>([]);
  const [pickupCities, setPickupCities] = useState<CityOption[]>([]);
  const [destStates, setDestStates] = useState<StateOption[]>([]);
  const [destCities, setDestCities] = useState<CityOption[]>([]);
  const [pickupCountryIso, setPickupCountryIso] = useState<string>("");
  const [destCountryIso, setDestCountryIso] = useState<string>("");
  const [pickupStateIso, setPickupStateIso] = useState<string>("");
  const [destStateIso, setDestStateIso] = useState<string>("");

  // Step 1: Basic Quote Info
  const handleBasicSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formDataObj = new FormData(e.currentTarget);
    const pickupCountry = formDataObj.get("pickup-country") as string;
    const pickupState = formDataObj.get("pickup-state") as string;
    const pickupCity = formDataObj.get("pickup-city") as string;
    const destinationCountry = formDataObj.get("destination-country") as string;
    const destinationState = formDataObj.get("destination-state") as string;
    const destinationCity = formDataObj.get("destination-city") as string;
    const weight = formDataObj.get("weight") as string;

    setQuoteData({
      pickupCountry,
      pickupState,
      pickupCity,
      destinationCountry,
      destinationState,
      destinationCity,
      weight,
    });

    setError(null);
    getPricing();
  };

  // Get Pricing from API
  const getPricing = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/quotations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pickupCountry: quoteData.pickupCountry,
          destinationCountry: quoteData.destinationCountry,
          weight: parseFloat(quoteData.weight),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to calculate quotation");
      }

      const result: QuotationResult = await response.json();
      setQuotationResult(result);
      setSelectedSpeed("standard");
      setCurrentStep("delivery");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setCurrentStep("basic"); // Go back to start on error
    } finally {
      setIsLoading(false);
    }
  };

  // Load pickup states when pickup country changes
  useEffect(() => {
    if (quoteData.pickupCountry) {
      const isoCode = getCountryIsoCode(quoteData.pickupCountry);
      if (isoCode) {
        setPickupCountryIso(isoCode);
        const states = getStatesOfCountry(isoCode);
        setPickupStates(states);
        // Reset state and city when country changes
        setQuoteData((prev) => ({ ...prev, pickupState: "", pickupCity: "" }));
        setPickupCities([]);
        setPickupStateIso("");
      }
    }
  }, [quoteData.pickupCountry]);

  // Load pickup cities when pickup state changes
  useEffect(() => {
    if (pickupCountryIso && quoteData.pickupState) {
      const stateIso = getStateIsoCode(pickupCountryIso, quoteData.pickupState);
      if (stateIso) {
        setPickupStateIso(stateIso);
        const cities = getCitiesOfState(pickupCountryIso, stateIso);
        setPickupCities(cities);
        // Reset city when state changes
        setQuoteData((prev) => ({ ...prev, pickupCity: "" }));
      }
    }
  }, [pickupCountryIso, quoteData.pickupState]);

  // Load destination states when destination country changes
  useEffect(() => {
    if (quoteData.destinationCountry) {
      const isoCode = getCountryIsoCode(quoteData.destinationCountry);
      if (isoCode) {
        setDestCountryIso(isoCode);
        const states = getStatesOfCountry(isoCode);
        setDestStates(states);
        // Reset state and city when country changes
        setQuoteData((prev) => ({
          ...prev,
          destinationState: "",
          destinationCity: "",
        }));
        setDestCities([]);
        setDestStateIso("");
      }
    }
  }, [quoteData.destinationCountry]);

  // Load destination cities when destination state changes
  useEffect(() => {
    if (destCountryIso && quoteData.destinationState) {
      const stateIso = getStateIsoCode(
        destCountryIso,
        quoteData.destinationState,
      );
      if (stateIso) {
        setDestStateIso(stateIso);
        const cities = getCitiesOfState(destCountryIso, stateIso);
        setDestCities(cities);
        // Reset city when state changes
        setQuoteData((prev) => ({ ...prev, destinationCity: "" }));
      }
    }
  }, [destCountryIso, quoteData.destinationState]);

  // Step 3: Book Now - Save and redirect
  const handleCreateOrder = () => {
    if (!quotationResult || !selectedSpeed) {
      setError("Please select a delivery speed");
      return;
    }

    const selectedOption = quotationResult.delivery_options.find(
      (opt) => opt.speed === selectedSpeed,
    );

    if (!selectedOption) return;

    // Save basic quote to localStorage
    const basicQuote = {
      pickup_country: quotationResult.pickup_country,
      pickup_state: quoteData.pickupState,
      pickup_city: quoteData.pickupCity,
      destination_country: quotationResult.destination_country,
      destination_state: quoteData.destinationState,
      destination_city: quoteData.destinationCity,
      weight: quotationResult.weight,
      zone_picked:
        quotationResult.unified_zone_display ||
        quotationResult.carriers_data.map((c) => c.carrier).join(", "),
      delivery_speed: selectedSpeed,
      amount_paid: parseFloat(selectedOption.price),
      estimated_delivery: selectedOption.estimated_delivery,
      currency: quotationResult.currency,
      timestamp: new Date().toISOString(),
    };

    localStorage.setItem(BASIC_QUOTE_STORAGE_KEY, JSON.stringify(basicQuote));

    // Check authentication
    const isAuth = hasValidAuth();
    if (isAuth) {
      // Redirect directly to booking page
      router.push("/booking");
    } else {
      // Redirect to sign-in
      router.push("/sign-in?redirect=booking");
    }
  };

  // Start Over - Clear all data
  const handleStartOver = () => {
    setCurrentStep("basic");
    setQuotationResult(null);
    setSelectedSpeed("standard");
    setError(null);
    setQuoteData({
      pickupCountry: "",
      pickupState: "",
      pickupCity: "",
      destinationCountry: "",
      destinationState: "",
      destinationCity: "",
      weight: "",
    });
    setPickupStates([]);
    setPickupCities([]);
    setDestStates([]);
    setDestCities([]);
  };

  return (
    <>
      <Header />

      {/* Quotation Form Section */}
      <section className="quotation-form-section">
        <div className="quotation-wrapper">
          <div className="quotation-text-content">
            <h1>Shipping Price Calculator</h1>
            <p>
              Calculate your shipping costs in seconds. Easily determine the
              cost of shipping your packages by inputting your country, shipment
              weight, and delivery options and receive an instant, accurate
              estimate of your shipping cost.
            </p>
            <div className="quotation-text-image">
              <Image
                src="/assets/hero_image.svg"
                alt="Shipping Illustration"
                width={600}
                height={400}
              />
            </div>
          </div>
          <div className="quotation-container">
            <div className="shipping-tabs">
              <button
                className={`tab-btn ${activeTab === "international" ? "active" : ""}`}
                onClick={() => setActiveTab("international")}
              >
                INTERNATIONAL
              </button>
              <button
                className={`tab-btn ${activeTab === "local" ? "active" : ""}`}
                onClick={() => setActiveTab("local")}
              >
                LOCAL
              </button>
            </div>

            {error && (
              <div
                style={{
                  padding: "1rem",
                  backgroundColor: "#fee",
                  color: "#c33",
                  borderRadius: "4px",
                  marginBottom: "1rem",
                }}
              >
                {error}
              </div>
            )}

            {/* Basic Quote Form */}
            {activeTab === "international" && currentStep === "basic" && (
              <form className="quotation-form" onSubmit={handleBasicSubmit}>
                <h3 className="form-section-title">Pickup Location</h3>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="pickup-country">Country *</label>
                    <SearchableSelect
                      options={COUNTRIES}
                      value={quoteData.pickupCountry}
                      onChange={(value) =>
                        setQuoteData({
                          ...quoteData,
                          pickupCountry: value,
                        })
                      }
                      placeholder="Search country..."
                      name="pickup-country"
                      id="pickup-country"
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="pickup-state">State/Province</label>
                    {pickupStates.length > 0 ? (
                      <SearchableSelect
                        options={pickupStates}
                        value={quoteData.pickupState}
                        onChange={(value) =>
                          setQuoteData({
                            ...quoteData,
                            pickupState: value,
                          })
                        }
                        placeholder="Search state/province..."
                        name="pickup-state"
                        id="pickup-state"
                      />
                    ) : (
                      <input
                        type="text"
                        name="pickup-state"
                        id="pickup-state"
                        className="form-control"
                        placeholder="Enter state/province (optional)"
                        value={quoteData.pickupState}
                        onChange={(e) =>
                          setQuoteData({
                            ...quoteData,
                            pickupState: e.target.value,
                          })
                        }
                      />
                    )}
                  </div>
                  <div className="form-group">
                    <label htmlFor="pickup-city">City</label>
                    {pickupCities.length > 0 ? (
                      <SearchableSelect
                        options={pickupCities}
                        value={quoteData.pickupCity}
                        onChange={(value) =>
                          setQuoteData({
                            ...quoteData,
                            pickupCity: value,
                          })
                        }
                        placeholder="Search city..."
                        name="pickup-city"
                        id="pickup-city"
                      />
                    ) : (
                      <input
                        type="text"
                        name="pickup-city"
                        id="pickup-city"
                        className="form-control"
                        placeholder="Enter city (optional)"
                        value={quoteData.pickupCity}
                        onChange={(e) =>
                          setQuoteData({
                            ...quoteData,
                            pickupCity: e.target.value,
                          })
                        }
                      />
                    )}
                  </div>
                </div>

                <h3 className="form-section-title">Destination</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="destination-country">Country *</label>
                    <SearchableSelect
                      options={COUNTRIES}
                      value={quoteData.destinationCountry}
                      onChange={(value) =>
                        setQuoteData({
                          ...quoteData,
                          destinationCountry: value,
                        })
                      }
                      placeholder="Search country..."
                      name="destination-country"
                      id="destination-country"
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="destination-state">State/Province</label>
                    {destStates.length > 0 ? (
                      <SearchableSelect
                        options={destStates}
                        value={quoteData.destinationState}
                        onChange={(value) =>
                          setQuoteData({
                            ...quoteData,
                            destinationState: value,
                          })
                        }
                        placeholder="Search state/province..."
                        name="destination-state"
                        id="destination-state"
                      />
                    ) : (
                      <input
                        type="text"
                        name="destination-state"
                        id="destination-state"
                        className="form-control"
                        placeholder="Enter state/province (optional)"
                        value={quoteData.destinationState}
                        onChange={(e) =>
                          setQuoteData({
                            ...quoteData,
                            destinationState: e.target.value,
                          })
                        }
                      />
                    )}
                  </div>
                  <div className="form-group">
                    <label htmlFor="destination-city">City</label>
                    {destCities.length > 0 ? (
                      <SearchableSelect
                        options={destCities}
                        value={quoteData.destinationCity}
                        onChange={(value) =>
                          setQuoteData({
                            ...quoteData,
                            destinationCity: value,
                          })
                        }
                        placeholder="Search city..."
                        name="destination-city"
                        id="destination-city"
                      />
                    ) : (
                      <input
                        type="text"
                        name="destination-city"
                        id="destination-city"
                        className="form-control"
                        placeholder="Enter city (optional)"
                        value={quoteData.destinationCity}
                        onChange={(e) =>
                          setQuoteData({
                            ...quoteData,
                            destinationCity: e.target.value,
                          })
                        }
                      />
                    )}
                  </div>
                </div>

                <h3 className="form-section-title">Shipment Details</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="weight">Weight (KG)</label>
                    <input
                      type="number"
                      name="weight"
                      id="weight"
                      className="form-control"
                      placeholder="Enter weight in kilograms"
                      min="0.1"
                      step="0.1"
                      value={quoteData.weight}
                      onChange={(e) =>
                        setQuoteData({ ...quoteData, weight: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn-calculate"
                  disabled={isLoading}
                >
                  {isLoading ? "CALCULATING..." : "GET QUOTE"}
                </button>
              </form>
            )}

            {/* Step 5: Pricing Results & Delivery Selection */}
            {activeTab === "international" &&
              currentStep === "delivery" &&
              quotationResult && (
                <div className="quotation-form">
                  <h3 className="form-section-title">Shipping Quote</h3>

                  <div style={{ marginBottom: "1.5rem" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "0.5rem",
                        fontSize: "0.9rem",
                        color: "#666",
                      }}
                    >
                      <span>From:</span>
                      <strong>{quotationResult.pickup_country}</strong>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "0.5rem",
                        fontSize: "0.9rem",
                        color: "#666",
                      }}
                    >
                      <span>To:</span>
                      <strong>{quotationResult.destination_country}</strong>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "0.5rem",
                        fontSize: "0.9rem",
                        color: "#666",
                      }}
                    >
                      <span>Weight:</span>
                      <strong>{quotationResult.weight} KG</strong>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "0.9rem",
                        color: "#666",
                      }}
                    >
                      <span>Zone:</span>
                      <strong>
                        {quotationResult.unified_zone_display ||
                          quotationResult.carriers_data
                            .map((c) => c.carrier)
                            .join(", ")}
                      </strong>
                    </div>
                  </div>

                  <h3 className="form-section-title">Select Delivery Speed</h3>

                  <div style={{ marginBottom: "1.5rem" }}>
                    {quotationResult.delivery_options.map((option) => (
                      <div
                        key={option.speed}
                        onClick={() => setSelectedSpeed(option.speed)}
                        style={{
                          border: "2px solid",
                          borderColor:
                            selectedSpeed === option.speed ? "#fdd835" : "#ddd",
                          borderRadius: "8px",
                          padding: "1rem",
                          marginBottom: "1rem",
                          cursor: "pointer",
                          transition: "all 0.3s ease",
                          backgroundColor:
                            selectedSpeed === option.speed
                              ? "#fffef0"
                              : "white",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "0.5rem",
                          }}
                        >
                          <div>
                            <input
                              type="radio"
                              name="delivery-speed"
                              value={option.speed}
                              checked={selectedSpeed === option.speed}
                              onChange={() => setSelectedSpeed(option.speed)}
                              style={{ marginRight: "0.5rem" }}
                            />
                            <strong
                              style={{
                                textTransform: "capitalize",
                                fontSize: "1.1rem",
                              }}
                            >
                              {getCarrierName(option.speed)}
                            </strong>
                          </div>
                          <div
                            style={{
                              fontSize: "1.3rem",
                              fontWeight: "bold",
                              color: "#047857",
                            }}
                          >
                            {quotationResult.currency}{" "}
                            {parseFloat(option.price).toLocaleString()}
                          </div>
                        </div>
                        <div
                          style={{
                            fontSize: "0.9rem",
                            color: "#666",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                          }}
                        >
                          <Package size={14} /> Estimated delivery:{" "}
                          {option.estimated_delivery}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: "1rem",
                      flexDirection: "column",
                    }}
                  >
                    <button
                      type="button"
                      className="btn-calculate"
                      onClick={handleCreateOrder}
                    >
                      BOOK NOW
                    </button>
                    <button
                      type="button"
                      onClick={handleStartOver}
                      style={{
                        padding: "1rem",
                        backgroundColor: "transparent",
                        color: "#047857",
                        border: "2px solid #047857",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontSize: "1rem",
                        fontWeight: "bold",
                        transition: "all 0.3s ease",
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = "#f0fdf4";
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      START OVER
                    </button>
                  </div>
                </div>
              )}

            {/* Local Form */}
            {activeTab === "local" && (
              <div
                className="quotation-form"
                style={{ textAlign: "center", padding: "4rem 2rem" }}
              >
                <h3
                  className="form-section-title"
                  style={{ fontSize: "2rem", marginBottom: "1rem" }}
                >
                  Coming Soon
                </h3>
                <p
                  style={{
                    fontSize: "1.1rem",
                    color: "#666",
                    marginBottom: "2rem",
                  }}
                >
                  Local delivery calculator will be available soon. Stay tuned!
                </p>
                <div style={{ opacity: "0.3" }}>
                  <Truck size={48} />
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="final-cta" id="contact">
        <h2>Ready to Ship with Transdom?</h2>
        <p>
          Start shipping today and experience the difference of world-class
          logistics
        </p>
        <Link href="/sign-up" className="btn-primary">
          Get Started Now
        </Link>
      </section>

      <Footer />

      <style jsx>{`
        .quotation-form-section {
          padding: 4rem 2rem;
          background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
          min-height: calc(100vh - 200px);
        }

        .quotation-wrapper {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 3rem;
          align-items: start;
        }

        .quotation-text-content h1 {
          font-size: 2.5rem;
          color: #047857;
          margin-bottom: 1rem;
          font-weight: 700;
          line-height: 1.2;
        }

        .quotation-text-content p {
          font-size: 1.1rem;
          color: #374151;
          line-height: 1.8;
          margin-bottom: 2rem;
        }

        .quotation-text-image {
          text-align: center;
          margin-top: 2rem;
        }

        .quotation-container {
          background: white;
          border-radius: 12px;
          padding: 2rem;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        }

        .shipping-tabs {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 2rem;
          border-bottom: 2px solid #e0e0e0;
        }

        .tab-btn {
          flex: 1;
          padding: 1rem;
          background: transparent;
          border: none;
          color: #666;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          border-bottom: 3px solid transparent;
          font-size: 0.9rem;
          letter-spacing: 0.5px;
          position: relative;
        }

        .tab-btn.active {
          color: #047857;
        }

        .tab-btn.active::after {
          content: "";
          position: absolute;
          bottom: -2px;
          left: 0;
          right: 0;
          height: 3px;
          background-color: #fdd835;
        }

        .tab-btn:hover {
          color: #047857;
        }

        .quotation-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .form-section-title {
          font-size: 1.3rem;
          font-weight: 700;
          color: #047857;
          margin-bottom: 0.5rem;
          padding-bottom: 0.5rem;
        }

        .form-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-group label {
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: #1f1f1f;
          font-size: 0.95rem;
        }

        .form-control {
          padding: 0.9rem 1rem;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          font-size: 1rem;
          transition: all 0.3s ease;
          font-family: inherit;
          background-color: white;
        }

        .form-control:focus {
          border-color: #047857;
          outline: none;
          box-shadow: 0 0 0 3px rgba(4, 120, 87, 0.1);
        }

        .form-control:disabled {
          background-color: #f9fafb;
          cursor: not-allowed;
        }

        .form-control::placeholder {
          color: #999;
        }

        textarea.form-control {
          resize: vertical;
        }

        select.form-control {
          cursor: pointer;
          background-color: white;
        }

        .btn-calculate {
          width: 100%;
          padding: 1rem 2.5rem;
          background-color: #fdd835;
          color: #047857;
          border: none;
          border-radius: 8px;
          font-size: 1.1rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
          letter-spacing: 0.5px;
          margin-top: 1rem;
        }

        .btn-calculate:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(253, 216, 53, 0.4);
        }

        .btn-calculate:disabled {
          background: #d1d5db;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
          color: #666;
        }

        .final-cta {
          text-align: center;
          padding: 5rem 2rem;
          background: linear-gradient(135deg, #047857 0%, #065f46 100%);
          color: white;
        }

        .final-cta h2 {
          font-size: 2.5rem;
          margin-bottom: 1rem;
          font-weight: 700;
        }

        .final-cta p {
          font-size: 1.2rem;
          margin-bottom: 2rem;
          opacity: 0.9;
        }

        .btn-primary {
          display: inline-block;
          padding: 1rem 2.5rem;
          background: white;
          color: #047857;
          border-radius: 8px;
          font-weight: 700;
          text-decoration: none;
          transition: all 0.3s ease;
          font-size: 1.1rem;
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
        }

        @media (max-width: 768px) {
          .quotation-wrapper {
            grid-template-columns: 1fr;
            gap: 2rem;
          }

          .quotation-text-content {
            order: 1;
          }

          .quotation-container {
            order: 2;
          }

          .quotation-text-content h1 {
            font-size: 2rem;
          }

          .quotation-text-content p {
            font-size: 1rem;
          }

          .quotation-container {
            padding: 1.5rem;
          }

          .shipping-tabs {
            gap: 0.5rem;
          }

          .tab-btn {
            padding: 0.8rem 1rem;
            font-size: 0.9rem;
          }

          .form-row {
            grid-template-columns: 1fr;
            gap: 1rem;
          }

          .btn-calculate {
            width: 100%;
            align-self: stretch;
          }

          .quotation-form-section {
            padding: 2rem 1rem;
          }

          .final-cta h2 {
            font-size: 1.8rem;
          }

          .final-cta p {
            font-size: 1rem;
          }

          .form-control {
            font-size: 16px; /* Prevent zoom on iOS */
          }
        }
      `}</style>
    </>
  );
}
