"use client";

import { Suspense, useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { hasValidAuth, getAuthUser } from "@/lib/auth";

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

interface PaymentVerificationData {
  reference: string;
  amount: number;
  currency: string;
  status: string;
  paid_at: string;
  channel: string;
  metadata: {
    zone: string;
    weight: number;
    delivery_speed: string;
  };
}

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference") || "";
  const user = getAuthUser();
  const isAuth = hasValidAuth();

  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(true);
  const [orderCreated, setOrderCreated] = useState(false);
  const [orderData, setOrderData] = useState<OrderResponse | null>(null);
  const [paymentData, setPaymentData] =
    useState<PaymentVerificationData | null>(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const [error, setError] = useState("");

  // Use ref to ensure order is only created once
  const orderCreationAttempted = useRef(false);

  // Wrap the function in useCallback to prevent re-creation on every render
  const verifyPaymentAndCreateOrder = useCallback(async () => {
    try {
      setVerifying(true);
      setLoading(true);

      // Step 1: Verify payment with Paystack
      const verifyResponse = await fetch(
        `/api/payments/verify?reference=${reference}`,
      );

      if (!verifyResponse.ok) {
        const errorData = await verifyResponse.json();
        throw new Error(errorData.detail || "Payment verification failed");
      }

      const verifyData = await verifyResponse.json();

      // Check if payment was successful
      if (verifyData.status !== "success") {
        throw new Error("Payment was not successful");
      }

      setPaymentData(verifyData.data);
      setVerifying(false);

      // Step 2: Create order with verified payment data
      const { metadata, amount } = verifyData.data;

      if (!metadata.zone || !metadata.weight) {
        throw new Error("Missing order details from payment");
      }

      const createOrderResponse = await fetch("/api/orders/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          zone_picked: metadata.zone,
          weight: parseFloat(metadata.weight),
          email: user?.email,
          amount_paid: amount,
        }),
      });

      if (!createOrderResponse.ok) {
        const errorData = await createOrderResponse.json();
        throw new Error(errorData.detail || "Failed to create order");
      }

      const order = await createOrderResponse.json();
      setOrderData(order);
      setOrderCreated(true);
      setShowOverlay(true);

      // Step 3: Clear the quotation from localStorage since order is created
      localStorage.removeItem("transdom_quotation_form");

      // Step 4: Log successful order creation
      console.log("✅ Order created successfully:", {
        order_no: order.order_no,
        amount: order.amount_paid,
        reference: reference,
        timestamp: new Date().toISOString(),
      });

      // Step 5: Redirect to dashboard after 4 seconds
      setTimeout(() => {
        router.push("/dashboard");
      }, 4000);
    } catch (err) {
      console.error("❌ Payment verification or order creation error:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
      setVerifying(false);
      setShowOverlay(true);
    } finally {
      setLoading(false);
    }
  }, [reference, user?.email, router]);

  useEffect(() => {
    // Check authentication
    if (!isAuth || !user) {
      router.push("/sign-in");
      return;
    }

    // Verify payment reference exists
    if (!reference) {
      setError("No payment reference found");
      setVerifying(false);
      setShowOverlay(true);
      return;
    }

    // Prevent multiple verifications
    if (orderCreationAttempted.current) {
      return;
    }

    orderCreationAttempted.current = true;

    // Verify payment and create order
    verifyPaymentAndCreateOrder();
  }, [reference, isAuth, user, router, verifyPaymentAndCreateOrder]);

  const handleDashboardRedirect = () => {
    router.push("/dashboard");
  };

  if (!isAuth || !user) {
    return null;
  }

  return (
    <>
      {/* Overlay Modal */}
      {showOverlay && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "#fff",
              padding: "2rem",
              borderRadius: "0.5rem",
              maxWidth: "500px",
              width: "90%",
              boxShadow: "0 20px 25px rgba(0, 0, 0, 0.15)",
            }}
          >
            {error ? (
              <>
                <div
                  style={{
                    fontSize: "48px",
                    marginBottom: "1rem",
                    textAlign: "center",
                  }}
                >
                  ⚠️
                </div>
                <h2
                  style={{
                    fontSize: "20px",
                    fontWeight: "bold",
                    color: "#dc2626",
                    marginBottom: "1rem",
                    textAlign: "center",
                  }}
                >
                  Payment Error
                </h2>
                <p
                  style={{
                    color: "#6b7280",
                    marginBottom: "1.5rem",
                    textAlign: "center",
                  }}
                >
                  {error}
                </p>
                <button
                  onClick={handleDashboardRedirect}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    backgroundColor: "#dc2626",
                    color: "#fff",
                    border: "none",
                    borderRadius: "0.375rem",
                    fontSize: "16px",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  Go to Dashboard
                </button>
              </>
            ) : verifying ? (
              <>
                <div
                  style={{
                    fontSize: "48px",
                    marginBottom: "1rem",
                    textAlign: "center",
                    animation: "spin 1s linear infinite",
                  }}
                >
                  ⏳
                </div>
                <h2
                  style={{
                    fontSize: "20px",
                    fontWeight: "bold",
                    color: "#1f2937",
                    marginBottom: "1rem",
                    textAlign: "center",
                  }}
                >
                  Verifying Payment...
                </h2>
                <p
                  style={{
                    color: "#6b7280",
                    textAlign: "center",
                  }}
                >
                  Please wait while we confirm your payment with Paystack.
                </p>
              </>
            ) : orderData ? (
              <>
                <div
                  style={{
                    fontSize: "48px",
                    marginBottom: "1rem",
                    textAlign: "center",
                  }}
                >
                  ✓
                </div>
                <h2
                  style={{
                    fontSize: "20px",
                    fontWeight: "bold",
                    color: "#10b981",
                    marginBottom: "1rem",
                    textAlign: "center",
                  }}
                >
                  Order Created Successfully!
                </h2>

                <div
                  style={{
                    backgroundColor: "#ecfdf5",
                    padding: "1rem",
                    borderRadius: "0.375rem",
                    marginBottom: "1.5rem",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "0.75rem",
                      fontSize: "14px",
                    }}
                  >
                    <span style={{ color: "#6b7280" }}>Order Number:</span>
                    <span
                      style={{
                        color: "#1f2937",
                        fontWeight: "bold",
                        fontFamily: "monospace",
                      }}
                    >
                      {orderData.order_no}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "0.75rem",
                      fontSize: "14px",
                    }}
                  >
                    <span style={{ color: "#6b7280" }}>Amount:</span>
                    <span style={{ color: "#1f2937", fontWeight: "bold" }}>
                      ₦{orderData.amount_paid.toLocaleString()}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "0.75rem",
                      fontSize: "14px",
                    }}
                  >
                    <span style={{ color: "#6b7280" }}>Status:</span>
                    <span style={{ color: "#10b981", fontWeight: "600" }}>
                      {orderData.status}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "14px",
                    }}
                  >
                    <span style={{ color: "#6b7280" }}>Payment Ref:</span>
                    <span
                      style={{
                        color: "#1f2937",
                        fontFamily: "monospace",
                        fontSize: "12px",
                      }}
                    >
                      {reference}
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: "#f0fdf4",
                    border: "1px solid #86efac",
                    padding: "1rem",
                    borderRadius: "0.375rem",
                    marginBottom: "1.5rem",
                  }}
                >
                  <p
                    style={{
                      fontSize: "14px",
                      color: "#15803d",
                      margin: 0,
                      textAlign: "center",
                    }}
                  >
                    ✓ Your quotation has been cleared and your new order is now
                    visible in your dashboard.
                  </p>
                </div>

                <p
                  style={{
                    color: "#6b7280",
                    fontSize: "14px",
                    marginBottom: "1.5rem",
                    textAlign: "center",
                  }}
                >
                  Redirecting you to your dashboard...
                </p>

                <button
                  onClick={handleDashboardRedirect}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    backgroundColor: "#10b981",
                    color: "#fff",
                    border: "none",
                    borderRadius: "0.375rem",
                    fontSize: "16px",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  Go to Dashboard Now
                </button>
              </>
            ) : (
              <>
                <div
                  style={{
                    fontSize: "48px",
                    marginBottom: "1rem",
                    textAlign: "center",
                    animation: "spin 1s linear infinite",
                  }}
                >
                  ⏳
                </div>
                <h2
                  style={{
                    fontSize: "20px",
                    fontWeight: "bold",
                    color: "#1f2937",
                    marginBottom: "1rem",
                    textAlign: "center",
                  }}
                >
                  Creating Your Order...
                </h2>
                <p
                  style={{
                    color: "#6b7280",
                    textAlign: "center",
                  }}
                >
                  Please wait while we process your order.
                </p>
              </>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Header */}
      <header
        style={{
          backgroundColor: "#fff",
          borderBottom: "1px solid #e5e7eb",
          padding: "1rem 2rem",
        }}
      >
        <nav
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            maxWidth: "1200px",
            margin: "0 auto",
          }}
        >
          <div
            style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
          >
            <Link
              href="/"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <Image
                src="/assets/transdom_logo.svg"
                alt="Transdom Logistics"
                width={40}
                height={40}
              />
              <span
                style={{
                  fontSize: "18px",
                  fontWeight: "bold",
                  color: "#1f2937",
                }}
              >
                Transdom Logistics
              </span>
            </Link>
          </div>
        </nav>
      </header>

      {/* Success Section */}
      <section
        style={{
          padding: "4rem 2rem",
          backgroundColor: "#f9fafb",
          minHeight: "80vh",
          display: "flex",
          alignItems: "center",
        }}
      >
        <div
          style={{ maxWidth: "600px", margin: "0 auto", textAlign: "center" }}
        >
          {/* Success Icon */}
          <div style={{ fontSize: "60px", marginBottom: "1.5rem" }}>
            {verifying ? "⏳" : error ? "⚠️" : "✓"}
          </div>

          <div
            style={{
              backgroundColor: "#fff",
              padding: "3rem",
              borderRadius: "0.5rem",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
            }}
          >
            <h1
              style={{
                fontSize: "28px",
                fontWeight: "bold",
                color: error ? "#dc2626" : "#10b981",
                marginBottom: "1rem",
              }}
            >
              {verifying
                ? "Verifying Payment..."
                : error
                  ? "Payment Failed"
                  : "Payment Successful!"}
            </h1>

            <p
              style={{
                color: "#6b7280",
                fontSize: "16px",
                marginBottom: "1.5rem",
              }}
            >
              {verifying
                ? "Please wait while we verify your payment with Paystack."
                : error
                  ? error
                  : "Your payment has been confirmed and your order has been created."}
            </p>

            {paymentData && !error && (
              <div
                style={{
                  backgroundColor: "#f3f4f6",
                  padding: "1.5rem",
                  borderRadius: "0.375rem",
                  marginBottom: "2rem",
                  textAlign: "left",
                }}
              >
                <h2
                  style={{
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#1f2937",
                    marginBottom: "1rem",
                    textTransform: "uppercase",
                  }}
                >
                  Payment Details
                </h2>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "0.75rem",
                    fontSize: "14px",
                  }}
                >
                  <span style={{ color: "#6b7280" }}>Reference:</span>
                  <span
                    style={{
                      color: "#1f2937",
                      fontWeight: "500",
                      fontFamily: "monospace",
                      fontSize: "12px",
                    }}
                  >
                    {reference}
                  </span>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "0.75rem",
                    fontSize: "14px",
                  }}
                >
                  <span style={{ color: "#6b7280" }}>Amount:</span>
                  <span style={{ color: "#1f2937", fontWeight: "600" }}>
                    ₦{paymentData.amount.toLocaleString()}
                  </span>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "0.75rem",
                    fontSize: "14px",
                  }}
                >
                  <span style={{ color: "#6b7280" }}>Status:</span>
                  <span style={{ color: "#10b981", fontWeight: "600" }}>
                    ✓ {paymentData.status}
                  </span>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "14px",
                  }}
                >
                  <span style={{ color: "#6b7280" }}>Channel:</span>
                  <span
                    style={{ color: "#1f2937", textTransform: "capitalize" }}
                  >
                    {paymentData.channel}
                  </span>
                </div>
              </div>
            )}

            {!verifying && (
              <div style={{ display: "grid", gap: "1rem" }}>
                <button
                  onClick={handleDashboardRedirect}
                  disabled={loading}
                  style={{
                    padding: "0.75rem 1.5rem",
                    backgroundColor: loading
                      ? "#9ca3af"
                      : error
                        ? "#dc2626"
                        : "#3b82f6",
                    color: "#fff",
                    border: "none",
                    borderRadius: "0.375rem",
                    fontSize: "16px",
                    fontWeight: "600",
                    cursor: loading ? "not-allowed" : "pointer",
                  }}
                >
                  {loading ? "Processing..." : "Go to Dashboard"}
                </button>

                {!error && (
                  <Link
                    href="/quotation"
                    style={{
                      padding: "0.75rem 1.5rem",
                      backgroundColor: "#f3f4f6",
                      color: "#1f2937",
                      border: "none",
                      borderRadius: "0.375rem",
                      fontSize: "16px",
                      fontWeight: "600",
                      cursor: "pointer",
                      textDecoration: "none",
                      display: "block",
                    }}
                  >
                    Create Another Shipment
                  </Link>
                )}
              </div>
            )}
          </div>

          <p style={{ color: "#6b7280", fontSize: "12px", marginTop: "2rem" }}>
            {!error && "You can track your shipment from your dashboard."}
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          backgroundColor: "#1f2937",
          color: "#fff",
          padding: "2rem",
          textAlign: "center",
        }}
      >
        <p>&copy; 2026 Transdom Logistics. All rights reserved.</p>
      </footer>
    </>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
