"use client";

import { useState, FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import { useRouter } from "next/navigation";
import { hasValidAuth } from "@/lib/auth";

const QUOTATION_STORAGE_KEY = "transdom_quotation_form";

// Country options with proper names that match zone mapping
const COUNTRIES = [
  // Africa
  { value: "Nigeria", label: "Nigeria" },
  { value: "Ghana", label: "Ghana" },
  { value: "Kenya", label: "Kenya" },
  { value: "South Africa", label: "South Africa" },
  { value: "Egypt", label: "Egypt" },

  // Europe
  { value: "United Kingdom", label: "United Kingdom" },
  { value: "France", label: "France" },
  { value: "Germany", label: "Germany" },
  { value: "Spain", label: "Spain" },
  { value: "Italy", label: "Italy" },
  { value: "Netherlands", label: "Netherlands" },

  // Americas
  { value: "United States", label: "United States" },
  { value: "Canada", label: "Canada" },
  { value: "Brazil", label: "Brazil" },
  { value: "Mexico", label: "Mexico" },

  // Asia
  { value: "China", label: "China" },
  { value: "Japan", label: "Japan" },
  { value: "India", label: "India" },
  { value: "Singapore", label: "Singapore" },
  { value: "United Arab Emirates", label: "United Arab Emirates" },
  { value: "Saudi Arabia", label: "Saudi Arabia" },
];

export default function QuotationPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"international" | "local">(
    "international",
  );

  const handleInternationalSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const pickupCountry = formData.get("pickup-country") as string;
    const destinationCountry = formData.get("destination-country") as string;
    const weight = formData.get("weight") as string;

    if (!pickupCountry || !destinationCountry || !weight) {
      alert("Please fill in all required fields");
      return;
    }

    // Save quotation to localStorage
    const quotationData = {
      pickupCountry,
      destinationCountry,
      weight,
      isLocal: false,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(QUOTATION_STORAGE_KEY, JSON.stringify(quotationData));

    // Check if user is authenticated
    const isAuth = hasValidAuth();
    if (isAuth) {
      // User is authenticated, go to dashboard
      router.push("/dashboard");
    } else {
      // User not authenticated, redirect to sign-in with redirect param
      router.push("/sign-in?redirect=quotation");
    }
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

            {/* International Form */}
            {activeTab === "international" && (
              <form
                className="quotation-form"
                onSubmit={handleInternationalSubmit}
              >
                <h3 className="form-section-title">Pickup</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="pickup-country">Country</label>
                    <select
                      name="pickup-country"
                      id="pickup-country"
                      className="form-control"
                      required
                    >
                      <option value="">Select Country</option>
                      {COUNTRIES.map((country) => (
                        <option key={country.value} value={country.value}>
                          {country.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <h3 className="form-section-title">Destination</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="destination-country">Country</label>
                    <select
                      name="destination-country"
                      id="destination-country"
                      className="form-control"
                      required
                    >
                      <option value="">Select Country</option>
                      {COUNTRIES.map((country) => (
                        <option key={country.value} value={country.value}>
                          {country.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="weight">Weight (KG)</label>
                    <input
                      type="number"
                      name="weight"
                      id="weight"
                      className="form-control"
                      placeholder="Enter weight"
                      min="0.1"
                      step="0.1"
                      required
                    />
                  </div>
                </div>

                <button type="submit" className="btn-calculate">
                  GET PRICING
                </button>
              </form>
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
                <div style={{ fontSize: "3rem", opacity: "0.3" }}>🚚</div>
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
    </>
  );
}
