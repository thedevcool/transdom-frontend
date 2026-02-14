"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  BadgeDollarSign,
  BarChart3,
  CheckCircle,
  FileText,
  Hand,
  Inbox,
  MapPin,
  Package,
  Send,
  Settings,
  Trash2,
  Truck,
  User,
} from "lucide-react";
import { getAuthUser, hasValidAuth, clearAuthSession } from "@/lib/auth";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";

// Map generic speed names to carrier names
const getCarrierName = (speed: string): string => {
  const speedMap: Record<string, string> = {
    economy: "UPS",
    standard: "FedEx",
    express: "DHL",
  };
  return speedMap[speed.toLowerCase()] || speed;
};

const BASIC_QUOTE_STORAGE_KEY = "transdom_basic_quote";

interface BasicQuote {
  pickup_country: string;
  pickup_state?: string;
  pickup_city?: string;
  destination_country: string;
  destination_state?: string;
  destination_city?: string;
  weight: number;
  zone_picked: string;
  delivery_speed: string;
  amount_paid: number;
  currency: string;
  estimated_delivery: string;
  timestamp: string;
}

interface Shipment {
  _id: string;
  order_no: string;
  zone_picked: string;
  delivery_speed: string;
  amount_paid: number;
  status: string;
  date_created: string;
  sender_name: string;
  sender_country: string;
  receiver_name: string;
  receiver_country: string;
  shipment_description: string;
  shipment_weight: number;
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [basicQuote, setBasicQuote] = useState<BasicQuote | null>(null);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [shipmentsLoading, setShipmentsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "overview" | "quotation" | "pending" | "settings"
  >("overview");
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleClearQuotation = useCallback(() => {
    localStorage.removeItem(BASIC_QUOTE_STORAGE_KEY);
    setBasicQuote(null);
    setActiveTab("overview");
  }, []);

  const loadQuotation = useCallback(() => {
    const savedQuote = localStorage.getItem(BASIC_QUOTE_STORAGE_KEY);
    if (savedQuote) {
      try {
        const data: BasicQuote = JSON.parse(savedQuote);
        // Only set if we have valid data with required fields
        if (
          data &&
          data.amount_paid &&
          data.pickup_country &&
          data.destination_country &&
          data.weight &&
          data.zone_picked
        ) {
          setBasicQuote(data);
        } else {
          console.warn("Invalid quote data, missing required fields:", data);
        }
      } catch (e) {
        console.error("Failed to parse basic quote:", e);
        localStorage.removeItem(BASIC_QUOTE_STORAGE_KEY);
      }
    }
  }, []);

  const fetchShipments = useCallback(async () => {
    setShipmentsLoading(true);
    try {
      const response = await fetch("/api/shipments", {
        method: "GET",
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setShipments(data.shipments || []);
      } else {
        setShipments([]);
      }
    } catch (err) {
      setShipments([]);
    } finally {
      setShipmentsLoading(false);
    }
  }, []);

  useEffect(() => {
    const checkAuth = () => {
      try {
        if (!hasValidAuth()) {
          router.push("/sign-in");
          return;
        }

        const userData = getAuthUser();
        if (!userData) {
          router.push("/sign-in");
          return;
        }

        setUser(userData);
        setLoading(false);
        loadQuotation();
        fetchShipments();
      } catch (err) {
        console.error("Auth check failed:", err);
        router.push("/sign-in");
      }
    };

    checkAuth();
  }, [router, loadQuotation, fetchShipments]);

  const handleContinueBooking = () => {
    router.push("/booking");
  };

  const handleDeleteAccount = async () => {
    if (
      !confirm(
        "Are you sure you want to delete your account? This action cannot be undone. All your shipment data will be permanently deleted.",
      )
    ) {
      return;
    }

    // Second confirmation for safety
    if (
      !confirm(
        "This is your final warning. Are you absolutely sure you want to delete your account?",
      )
    ) {
      return;
    }

    setDeleteLoading(true);
    try {
      const response = await fetch("/api/me", {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        // Clear local auth session
        clearAuthSession();

        // Show success message
        alert(
          "Your account has been successfully deleted. You will be redirected to the homepage.",
        );

        // Redirect to home page
        router.push("/");
      } else {
        const error = await response.json();
        alert(error.detail || "Failed to delete account. Please try again.");
      }
    } catch (error) {
      console.error("Delete account error:", error);
      alert("An error occurred while deleting your account. Please try again.");
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your dashboard...</p>
        <style jsx>{`
          .loading-container {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            height: 100vh;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            gap: 1rem;
          }
          .loading-spinner {
            width: 50px;
            height: 50px;
            border: 4px solid rgba(255, 255, 255, 0.3);
            border-top-color: white;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <Header />

      <main className="dashboard-main">
        {/* Welcome Section */}
        <div className="welcome-section">
          <div className="welcome-content">
            <h1>
              Welcome back, {user?.firstname}! <Hand size={20} />
            </h1>
            <p>Here&apos;s an overview of your shipments and activity.</p>
          </div>
          <Link href="/quotation" className="btn-new-shipment">
            <span className="btn-icon">
              <Package size={20} />
            </span>
            New Shipment
          </Link>
        </div>

        {/* Tab Navigation */}
        <div className="tab-navigation">
          <button
            className={`tab-btn ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            <span className="tab-icon">
              <BarChart3 size={20} />
            </span>
            Overview
          </button>
          <button
            className={`tab-btn ${activeTab === "pending" ? "active" : ""}`}
            onClick={() => setActiveTab("pending")}
          >
            <span className="tab-icon">
              <Package size={20} />
            </span>
            Pending Orders
            {shipments.filter((s) => s.status === "pending").length > 0 && (
              <span className="badge">
                {shipments.filter((s) => s.status === "pending").length}
              </span>
            )}
          </button>
          <button
            className={`tab-btn ${activeTab === "quotation" ? "active" : ""}`}
            onClick={() => setActiveTab("quotation")}
            disabled={!basicQuote}
          >
            <span className="tab-icon">
              <FileText size={20} />
            </span>
            Pending Quote
            {basicQuote && <span className="badge">1</span>}
          </button>
          <button
            className={`tab-btn ${activeTab === "settings" ? "active" : ""}`}
            onClick={() => setActiveTab("settings")}
          >
            <span className="tab-icon">
              <Settings size={20} />
            </span>
            Settings
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <>
            {/* Statistics Cards */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">
                  <Package size={28} />
                </div>
                <div className="stat-content">
                  <div className="stat-label">Total Shipments</div>
                  <div className="stat-value">{shipments.length}</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  <Truck size={28} />
                </div>
                <div className="stat-content">
                  <div className="stat-label">In Transit</div>
                  <div className="stat-value">
                    {
                      shipments.filter(
                        (s) =>
                          s.status === "pending" || s.status === "in_transit",
                      ).length
                    }
                  </div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  <CheckCircle size={28} />
                </div>
                <div className="stat-content">
                  <div className="stat-label">Delivered</div>
                  <div className="stat-value">
                    {shipments.filter((s) => s.status === "delivered").length}
                  </div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  <BadgeDollarSign size={28} />
                </div>
                <div className="stat-content">
                  <div className="stat-label">Total Spent</div>
                  <div className="stat-value">
                    ₦
                    {shipments
                      .reduce((sum, s) => sum + (s.amount_paid || 0), 0)
                      .toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Shipments List */}
            <div className="shipments-section">
              <div className="section-header">
                <h2>Recent Shipments</h2>
                {basicQuote && (
                  <button
                    className="btn-view-quotation"
                    onClick={() => setActiveTab("quotation")}
                  >
                    View Pending Quote
                  </button>
                )}
              </div>

              {shipmentsLoading ? (
                <div className="loading-state">
                  <div className="loading-spinner"></div>
                  <p>Loading shipments...</p>
                </div>
              ) : shipments.length > 0 ? (
                <div className="shipments-list">
                  {shipments.map((shipment) => (
                    <div key={shipment._id} className="shipment-card">
                      <div className="shipment-header">
                        <div className="shipment-title">
                          <span className="order-no">{shipment.order_no}</span>
                          <span
                            className={`status-badge status-${shipment.status}`}
                          >
                            {shipment.status.replace("_", " ")}
                          </span>
                        </div>
                        <div className="shipment-date">
                          {new Date(shipment.date_created).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            },
                          )}
                        </div>
                      </div>

                      <div className="shipment-details">
                        <div className="detail-row">
                          <div className="detail-item">
                            <span className="detail-icon">
                              <Send size={18} />
                            </span>
                            <div>
                              <div className="detail-label">From</div>
                              <div className="detail-value">
                                {shipment.sender_name}
                              </div>
                              <div className="detail-sub">
                                {shipment.sender_country}
                              </div>
                            </div>
                          </div>
                          <div className="detail-divider">→</div>
                          <div className="detail-item">
                            <span className="detail-icon">
                              <Inbox size={18} />
                            </span>
                            <div>
                              <div className="detail-label">To</div>
                              <div className="detail-value">
                                {shipment.receiver_name}
                              </div>
                              <div className="detail-sub">
                                {shipment.receiver_country}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="shipment-info">
                          <div className="info-col">
                            <div className="info-label">Package</div>
                            <div className="info-text">
                              {shipment.shipment_description}
                            </div>
                          </div>
                          <div className="info-col">
                            <div className="info-label">Weight</div>
                            <div className="info-text">
                              {shipment.shipment_weight} kg
                            </div>
                          </div>
                          <div className="info-col">
                            <div className="info-label">Delivery Speed</div>
                            <div
                              className="info-text"
                              style={{ textTransform: "capitalize" }}
                            >
                              {getCarrierName(shipment.delivery_speed)}
                            </div>
                          </div>
                          <div className="info-col">
                            <div className="info-label">Amount</div>
                            <div className="info-text">
                              ₦{shipment.amount_paid.toLocaleString()}
                            </div>
                          </div>
                        </div>

                        {/* View Receipt Button for Approved Orders */}
                        {shipment.status === "approved" && (
                          <div className="shipment-actions">
                            <Link
                              href={`/receipt/${shipment.order_no}`}
                              className="btn-view-receipt"
                            >
                              <FileText size={16} /> View Receipt
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-shipments">
                  <div className="empty-icon">
                    <Package size={48} />
                  </div>
                  <h3>No Shipments Yet</h3>
                  <p>Start by creating your first shipping quotation.</p>
                  <Link href="/quotation" className="btn-get-started">
                    Get a Quote
                  </Link>
                </div>
              )}
            </div>
          </>
        )}

        {/* Pending Orders Tab */}
        {activeTab === "pending" && (
          <>
            <div className="dashboard-header">
              <h2>Pending Orders</h2>
              <p>Orders waiting for approval or processing</p>
            </div>

            <div className="shipments-grid">
              {shipmentsLoading ? (
                <div className="loading">
                  <div className="loading-spinner"></div>
                  <p>Loading your pending orders...</p>
                </div>
              ) : (
                <>
                  {shipments.filter((shipment) => shipment.status === "pending")
                    .length > 0 ? (
                    <div className="shipments-list">
                      {shipments
                        .filter((shipment) => shipment.status === "pending")
                        .map((shipment) => (
                          <div
                            key={shipment._id}
                            className="shipment-card pending"
                          >
                            <div className="shipment-header">
                              <div className="shipment-info">
                                <h3 className="order-number">
                                  {shipment.order_no}
                                </h3>
                                <p className="order-route">
                                  {shipment.sender_country} →{" "}
                                  {shipment.receiver_country}
                                </p>
                              </div>
                              <div className="shipment-status">
                                <span className="status-badge pending">
                                  <Hand size={14} />
                                  Pending Approval
                                </span>
                              </div>
                            </div>

                            <div className="shipment-details">
                              <div className="detail-row">
                                <span className="detail-label">Weight:</span>
                                <span className="detail-value">
                                  {shipment.shipment_weight}kg
                                </span>
                              </div>
                              <div className="detail-row">
                                <span className="detail-label">Carrier:</span>
                                <span className="detail-value">
                                  {getCarrierName(shipment.delivery_speed)}
                                </span>
                              </div>
                              <div className="detail-row">
                                <span className="detail-label">Amount:</span>
                                <span className="detail-value">
                                  ₦
                                  {new Intl.NumberFormat().format(
                                    shipment.amount_paid,
                                  )}
                                </span>
                              </div>
                              <div className="detail-row">
                                <span className="detail-label">
                                  Description:
                                </span>
                                <span className="detail-value">
                                  {shipment.shipment_description}
                                </span>
                              </div>
                            </div>

                            <div className="shipment-actions">
                              <Link
                                href={`/receipt/${shipment.order_no}`}
                                className="btn-view-receipt"
                              >
                                <FileText size={16} />
                                View Details
                              </Link>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <div className="empty-icon">
                        <CheckCircle size={48} />
                      </div>
                      <h3>No Pending Orders</h3>
                      <p>
                        All your orders have been processed or you haven&apos;t
                        placed any orders yet.
                      </p>
                      <Link href="/quotation" className="btn-get-started">
                        Create New Order
                      </Link>
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}

        {/* Quotation Tab */}
        {activeTab === "quotation" && basicQuote && (
          <div className="quotation-card">
            <div className="quotation-header">
              <h2>Your Shipping Quote</h2>
              <button onClick={handleClearQuotation} className="btn-clear">
                Clear Quote
              </button>
            </div>

            <div className="quote-summary">
              <div className="quote-route">
                <div className="route-point">
                  <span className="route-icon">
                    <MapPin size={18} />
                  </span>
                  <div>
                    <div className="route-label">From</div>
                    <div className="route-value">
                      {basicQuote.pickup_country}
                    </div>
                    {(basicQuote.pickup_city || basicQuote.pickup_state) && (
                      <div
                        style={{
                          fontSize: "14px",
                          color: "#6b7280",
                          marginTop: "4px",
                        }}
                      >
                        {[basicQuote.pickup_city, basicQuote.pickup_state]
                          .filter(Boolean)
                          .join(", ")}
                      </div>
                    )}
                  </div>
                </div>
                <div className="route-arrow">→</div>
                <div className="route-point">
                  <span className="route-icon">
                    <MapPin size={18} />
                  </span>
                  <div>
                    <div className="route-label">To</div>
                    <div className="route-value">
                      {basicQuote.destination_country}
                    </div>
                    {(basicQuote.destination_city ||
                      basicQuote.destination_state) && (
                      <div
                        style={{
                          fontSize: "14px",
                          color: "#6b7280",
                          marginTop: "4px",
                        }}
                      >
                        {[
                          basicQuote.destination_city,
                          basicQuote.destination_state,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="quote-details-grid">
                <div className="quote-detail">
                  <span className="detail-label">Weight</span>
                  <span className="detail-value">{basicQuote.weight} kg</span>
                </div>
                <div className="quote-detail">
                  <span className="detail-label">Zone</span>
                  <span className="detail-value">{basicQuote.zone_picked}</span>
                </div>
                <div className="quote-detail">
                  <span className="detail-label">Delivery Speed</span>
                  <span
                    className="detail-value"
                    style={{ textTransform: "capitalize" }}
                  >
                    {getCarrierName(basicQuote.delivery_speed)}
                  </span>
                </div>
                <div className="quote-detail">
                  <span className="detail-label">Estimated Delivery</span>
                  <span className="detail-value">
                    {basicQuote.estimated_delivery}
                  </span>
                </div>
              </div>

              <div className="quote-price">
                <span className="price-label">Total Price</span>
                <span className="price-value">
                  {basicQuote?.currency || "₦"}{" "}
                  {basicQuote?.amount_paid?.toLocaleString() || "0"}
                </span>
              </div>

              <button
                onClick={handleContinueBooking}
                className="btn-continue-booking"
              >
                Continue with Booking →
              </button>
            </div>
          </div>
        )}

        {/* No Quotation in Quotation Tab */}
        {activeTab === "quotation" && !basicQuote && (
          <div className="empty-state">
            <div className="empty-icon">
              <FileText size={48} />
            </div>
            <h3>No Pending Quote</h3>
            <p>You don&apos;t have any pending quotes at the moment.</p>
            <Link href="/quotation" className="btn-get-started">
              Get a Quote
            </Link>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div className="settings-section">
            {/* Account Information */}
            <div className="settings-card">
              <div className="settings-header">
                <div className="settings-icon">
                  <User size={24} />
                </div>
                <div>
                  <h3>Account Information</h3>
                  <p>Your personal account details</p>
                </div>
              </div>
              <div className="account-info-grid">
                <div className="info-field">
                  <label>Name</label>
                  <div className="info-value">
                    {user?.firstname} {user?.lastname}
                  </div>
                </div>
                <div className="info-field">
                  <label>Email</label>
                  <div className="info-value">{user?.email}</div>
                </div>
                <div className="info-field">
                  <label>Account Type</label>
                  <div className="info-value">
                    <span
                      className={`account-type-badge ${user?.account_type === "business" ? "business" : "individual"}`}
                    >
                      {user?.account_type === "business"
                        ? "Business"
                        : "Individual"}
                    </span>
                  </div>
                </div>
                <div className="info-field">
                  <label>Total Orders</label>
                  <div className="info-value">
                    <span className="order-count">{shipments.length}</span>
                  </div>
                </div>
                <div className="info-field">
                  <label>Country</label>
                  <div className="info-value">{user?.country || "N/A"}</div>
                </div>
                <div className="info-field">
                  <label>Phone</label>
                  <div className="info-value">
                    {user?.phone_number || "N/A"}
                  </div>
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="settings-card danger-zone">
              <div className="settings-header">
                <div className="settings-icon danger">
                  <Trash2 size={24} />
                </div>
                <div>
                  <h3>Danger Zone</h3>
                  <p>Irreversible and destructive actions</p>
                </div>
              </div>
              <div className="danger-content">
                <div className="danger-info">
                  <h4>Delete Account</h4>
                  <p>
                    Once you delete your account, there is no going back. All
                    your shipment data, quotations, and personal information
                    will be permanently deleted.
                  </p>
                </div>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteLoading}
                  className="btn-delete-account"
                >
                  {deleteLoading ? (
                    <>
                      <div className="loading-spinner-small"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 size={18} />
                      Delete My Account
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />

      <style jsx>{`
        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          animation: fadeIn 0.2s ease;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .modal-content {
          background: white;
          border-radius: 16px;
          padding: 2.5rem;
          max-width: 500px;
          width: 90%;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          animation: slideUp 0.3s ease;
          text-align: center;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .modal-icon {
          font-size: 64px;
          margin-bottom: 1rem;
        }

        .modal-title {
          font-size: 28px;
          font-weight: 700;
          color: #047857;
          margin-bottom: 1rem;
        }

        .modal-message {
          font-size: 18px;
          color: #374151;
          line-height: 1.6;
          margin-bottom: 2rem;
        }

        .modal-message strong {
          color: #047857;
          font-weight: 600;
        }

        .modal-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
        }

        .btn-modal-cancel {
          padding: 0.875rem 1.75rem;
          background: transparent;
          color: #6b7280;
          border: 2px solid #d1d5db;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-modal-cancel:hover {
          background: #f3f4f6;
          border-color: #9ca3af;
        }

        .btn-modal-confirm {
          padding: 0.875rem 1.75rem;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 6px rgba(16, 185, 129, 0.2);
        }

        .btn-modal-confirm:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 12px rgba(16, 185, 129, 0.3);
        }

        /* Success Notification */
        .success-notification {
          position: fixed;
          top: 2rem;
          right: 2rem;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          padding: 1rem 1.5rem;
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(16, 185, 129, 0.3);
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 16px;
          font-weight: 500;
          z-index: 1001;
          animation:
            slideInRight 0.3s ease,
            fadeOut 0.3s ease 4.7s;
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(100px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes fadeOut {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
          }
        }

        .success-icon {
          font-size: 24px;
        }

        .dashboard {
          min-height: 100vh;
          background-color: #f9fafb;
        }

        .dashboard-main {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2.5rem 1.5rem;
        }

        /* Welcome Section */
        .welcome-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          padding-bottom: 1.5rem;
          border-bottom: 2px solid #d1fae5;
          background: white;
          padding: 1.5rem;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .welcome-content h1 {
          font-size: 32px;
          font-weight: 700;
          color: #047857;
          margin-bottom: 0.5rem;
        }

        .welcome-content p {
          color: #6b7280;
          font-size: 16px;
        }

        .btn-new-shipment {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.875rem 1.75rem;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 6px rgba(16, 185, 129, 0.2);
        }

        .btn-new-shipment:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 12px rgba(16, 185, 129, 0.3);
        }

        .btn-icon {
          font-size: 20px;
          display: inline-flex;
          align-items: center;
        }

        .btn-icon svg {
          width: 20px;
          height: 20px;
        }

        /* Tab Navigation */
        .tab-navigation {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
          background: white;
          padding: 0.75rem;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .tab-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.875rem 1.5rem;
          background: transparent;
          border: 2px solid transparent;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          color: #6b7280;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
        }

        .tab-btn:hover:not(:disabled) {
          background: #f0fdf4;
          color: #047857;
        }

        .tab-btn.active {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          border-color: #10b981;
        }

        .tab-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .tab-icon {
          font-size: 20px;
          display: inline-flex;
          align-items: center;
        }

        .tab-icon svg {
          width: 20px;
          height: 20px;
        }

        .badge {
          position: absolute;
          top: 4px;
          right: 4px;
          background: #fdd835;
          color: #047857;
          font-size: 12px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 10px;
          min-width: 20px;
          text-align: center;
        }

        /* Stats Grid */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .stat-card {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
        }

        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .stat-icon {
          font-size: 40px;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          width: 70px;
          height: 70px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
        }

        .stat-icon svg {
          width: 28px;
          height: 28px;
        }

        .stat-content {
          flex: 1;
        }

        .stat-label {
          font-size: 14px;
          color: #6b7280;
          font-weight: 600;
          margin-bottom: 0.25rem;
        }

        .stat-value {
          font-size: 28px;
          font-weight: 700;
          color: #047857;
        }

        /* Shipments Section */
        .shipments-section {
          background: white;
          border-radius: 12px;
          padding: 2rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid #f0fdf4;
        }

        .section-header h2 {
          font-size: 24px;
          font-weight: 700;
          color: #047857;
          margin: 0;
        }

        .btn-view-quotation {
          background: #fdd835;
          color: #047857;
          border: none;
          padding: 0.625rem 1.25rem;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-view-quotation:hover {
          background: #fbc02d;
          transform: translateY(-2px);
        }

        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem 2rem;
          gap: 1rem;
        }

        .loading-spinner {
          width: 50px;
          height: 50px;
          border: 4px solid #d1fae5;
          border-top-color: #10b981;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .loading-state p {
          color: #6b7280;
          font-size: 16px;
        }

        /* Shipments List */
        .shipments-list {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .shipment-card {
          background: #f9fafb;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          padding: 1.5rem;
          transition: all 0.3s ease;
        }

        .shipment-card:hover {
          border-color: #10b981;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.15);
        }

        .shipment-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.25rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid #e5e7eb;
        }

        .shipment-title {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .order-no {
          font-size: 18px;
          font-weight: 700;
          color: #047857;
        }

        .status-badge {
          padding: 0.375rem 0.875rem;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .status-pending {
          background: #fef3c7;
          color: #92400e;
        }

        .status-in_transit {
          background: #dbeafe;
          color: #1e40af;
        }

        .status-delivered {
          background: #d1fae5;
          color: #065f46;
        }

        .shipment-date {
          font-size: 14px;
          color: #6b7280;
          font-weight: 500;
        }

        .shipment-details {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .detail-row {
          display: flex;
          align-items: center;
          gap: 2rem;
          background: white;
          padding: 1rem;
          border-radius: 8px;
        }

        .detail-item {
          flex: 1;
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
        }

        .detail-icon {
          font-size: 24px;
          display: inline-flex;
          align-items: center;
        }

        .detail-icon svg {
          width: 18px;
          height: 18px;
          color: #047857;
        }

        .detail-label {
          font-size: 12px;
          color: #6b7280;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 0.25rem;
        }

        .detail-value {
          font-size: 16px;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 0.125rem;
        }

        .detail-sub {
          font-size: 14px;
          color: #6b7280;
        }

        .detail-divider {
          font-size: 24px;
          color: #10b981;
          font-weight: 700;
        }

        .shipment-info {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
          background: white;
          padding: 1rem;
          border-radius: 8px;
        }

        .info-col {
          display: flex;
          flex-direction: column;
        }

        .info-label {
          font-size: 12px;
          color: #6b7280;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 0.375rem;
        }

        .info-text {
          font-size: 14px;
          color: #1f2937;
          font-weight: 600;
        }

        .shipment-actions {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid #e5e7eb;
          display: flex;
          justify-content: flex-end;
        }

        .btn-view-receipt {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.625rem 1.25rem;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          text-decoration: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.3s ease;
          box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2);
        }

        .btn-view-receipt:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(16, 185, 129, 0.3);
        }

        .empty-shipments {
          text-align: center;
          padding: 4rem 2rem;
        }

        .empty-icon {
          font-size: 64px;
          margin-bottom: 1rem;
          opacity: 0.5;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .empty-icon svg {
          width: 64px;
          height: 64px;
        }

        .empty-shipments h3 {
          font-size: 20px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 0.5rem;
        }

        .empty-shipments p {
          color: #6b7280;
          margin-bottom: 1.5rem;
        }

        /* Quotation Card */
        .quotation-card {
          background: white;
          border: 2px solid #d1fae5;
          border-radius: 12px;
          padding: 2rem;
          margin-bottom: 2.5rem;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        }

        .quotation-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid #f0fdf4;
        }

        .quotation-header h2 {
          font-size: 24px;
          font-weight: 700;
          color: #047857;
          margin: 0;
        }

        .btn-clear {
          background: transparent;
          border: 2px solid #dc2626;
          color: #dc2626;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-clear:hover {
          background: #dc2626;
          color: white;
        }

        /* Quote Summary */
        .quote-summary {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .quote-route {
          display: flex;
          justify-content: space-around;
          align-items: center;
          background: linear-gradient(135deg, #f0fdf4 0%, #d1fae5 100%);
          border-radius: 12px;
          padding: 2rem;
          gap: 2rem;
        }

        .route-point {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex: 1;
        }

        .route-icon {
          font-size: 32px;
          display: inline-flex;
          align-items: center;
        }

        .route-icon svg {
          width: 18px;
          height: 18px;
          color: #059669;
        }

        .route-label {
          font-size: 12px;
          color: #6b7280;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 0.25rem;
        }

        .route-value {
          font-size: 18px;
          font-weight: 700;
          color: #047857;
        }

        .route-arrow {
          font-size: 32px;
          color: #10b981;
          font-weight: 700;
        }

        .quote-details-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
          background: #f9fafb;
          border-radius: 12px;
          padding: 2rem;
        }

        .quote-detail {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .detail-label {
          font-size: 12px;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .detail-value {
          font-size: 16px;
          font-weight: 700;
          color: #1f2937;
        }

        .quote-price {
          background: linear-gradient(135deg, #047857 0%, #065f46 100%);
          border-radius: 12px;
          padding: 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .price-label {
          font-size: 18px;
          font-weight: 700;
          color: white;
        }

        .price-value {
          font-size: 32px;
          font-weight: 700;
          color: #fdd835;
        }

        .btn-continue-booking {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          border: none;
          padding: 1.125rem 2rem;
          border-radius: 8px;
          font-size: 18px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 6px rgba(16, 185, 129, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .btn-continue-booking:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 12px rgba(16, 185, 129, 0.3);
        }

        .btn-continue-booking:active {
          transform: translateY(0);
        }

        /* Review Sections */
        .review-section {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .section-title {
          font-size: 18px;
          font-weight: 700;
          color: #047857;
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
        }

        .info-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .info-item.full-width {
          grid-column: span 2;
        }

        .info-label {
          font-size: 12px;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .info-value {
          font-size: 14px;
          color: #1f2937;
          font-weight: 500;
        }

        /* Total Price Section */
        .total-price-section {
          background: linear-gradient(135deg, #047857 0%, #065f46 100%);
          border: none;
          border-radius: 8px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .total-label {
          font-size: 18px;
          font-weight: 700;
          color: white;
        }

        .total-amount {
          font-size: 28px;
          font-weight: 700;
          color: #fdd835;
        }

        /* Payment Method Section */
        .payment-method-section {
          background: #f0fdf4;
          border: 1px solid #d1fae5;
          border-radius: 8px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .payment-options {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
          margin-top: 1rem;
        }

        .payment-option {
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          padding: 1.25rem;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
        }

        .payment-option:hover {
          border-color: #10b981;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.15);
        }

        .payment-option.selected {
          border-color: #10b981;
          background: #f0fdf4;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
        }

        .payment-option input[type="radio"] {
          position: absolute;
          opacity: 0;
          cursor: pointer;
        }

        .option-content {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .option-icon {
          font-size: 32px;
        }

        .option-details {
          flex: 1;
        }

        .option-name {
          font-size: 16px;
          font-weight: 700;
          color: #047857;
          margin-bottom: 0.25rem;
        }

        .option-desc {
          font-size: 13px;
          color: #6b7280;
        }

        /* Error Message */
        .error-message {
          background: #fee2e2;
          border: 1px solid #fecaca;
          color: #dc2626;
          padding: 1rem;
          border-radius: 6px;
          margin-bottom: 1rem;
          font-size: 14px;
          font-weight: 500;
        }

        .btn-proceed-payment {
          width: 100%;
          padding: 1rem;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 6px rgba(16, 185, 129, 0.2);
        }

        .btn-proceed-payment:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 12px rgba(16, 185, 129, 0.3);
        }

        .btn-proceed-payment:disabled {
          background: #9ca3af;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        /* Empty State */
        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
          background: white;
          border-radius: 12px;
          border: 2px solid #d1fae5;
        }

        .empty-icon {
          font-size: 64px;
          margin-bottom: 1rem;
          opacity: 0.5;
        }

        .empty-state h3 {
          font-size: 20px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 0.5rem;
        }

        .empty-state p {
          color: #6b7280;
          margin-bottom: 1.5rem;
        }

        .btn-get-started {
          display: inline-block;
          padding: 0.875rem 1.75rem;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          border-radius: 8px;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.3s ease;
        }

        .btn-get-started:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 12px rgba(16, 185, 129, 0.3);
        }

        /* Settings Section */
        .settings-section {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .settings-card {
          background: white;
          border-radius: 12px;
          padding: 2rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .settings-card.danger-zone {
          border: 2px solid #fee2e2;
          background: #fffbfb;
        }

        .settings-header {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid #f3f4f6;
        }

        .settings-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .settings-icon.danger {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        }

        .settings-header h3 {
          font-size: 20px;
          font-weight: 700;
          color: #1f2937;
          margin: 0 0 0.25rem 0;
        }

        .settings-header p {
          font-size: 14px;
          color: #6b7280;
          margin: 0;
        }

        .account-info-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
        }

        .info-field label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #6b7280;
          margin-bottom: 0.5rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .info-value {
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
        }

        .danger-content {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 2rem;
        }

        .danger-info {
          flex: 1;
        }

        .danger-info h4 {
          font-size: 18px;
          font-weight: 700;
          color: #dc2626;
          margin: 0 0 0.75rem 0;
        }

        .danger-info p {
          font-size: 14px;
          color: #6b7280;
          line-height: 1.6;
          margin: 0;
        }

        .btn-delete-account {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.875rem 1.75rem;
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 6px rgba(239, 68, 68, 0.2);
          white-space: nowrap;
        }

        .btn-delete-account:hover:not(:disabled) {
          background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
          transform: translateY(-2px);
          box-shadow: 0 6px 12px rgba(239, 68, 68, 0.3);
        }

        .btn-delete-account:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .loading-spinner-small {
          width: 18px;
          height: 18px;
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        /* Responsive Design */
        @media (max-width: 1024px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .shipment-info {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .dashboard-main {
            padding: 1.5rem 1rem;
          }

          .welcome-section {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }

          .welcome-content h1 {
            font-size: 24px;
          }

          .btn-new-shipment {
            width: 100%;
            justify-content: center;
          }

          .tab-navigation {
            flex-direction: column;
          }

          .tab-btn {
            justify-content: flex-start;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .stat-card {
            padding: 1.25rem;
          }

          .stat-icon {
            width: 60px;
            height: 60px;
            font-size: 32px;
          }

          .stat-value {
            font-size: 24px;
          }

          .section-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }

          .btn-view-quotation {
            width: 100%;
          }

          .shipment-card {
            padding: 1.25rem;
          }

          .shipment-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }

          .detail-row {
            flex-direction: column;
            gap: 1rem;
          }

          .detail-divider {
            transform: rotate(90deg);
          }

          .shipment-info {
            grid-template-columns: 1fr;
          }

          .shipment-actions {
            justify-content: stretch;
          }

          .btn-view-receipt {
            width: 100%;
            justify-content: center;
          }

          .quotation-card {
            padding: 1.25rem;
          }

          .quotation-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }

          .btn-clear {
            width: 100%;
          }

          .info-grid {
            grid-template-columns: 1fr;
          }

          .info-item.full-width {
            grid-column: span 1;
          }

          .payment-options {
            grid-template-columns: 1fr;
          }

          .total-price-section {
            flex-direction: column;
            gap: 0.5rem;
            text-align: center;
          }

          .account-info-grid {
            grid-template-columns: 1fr;
          }

          .danger-content {
            flex-direction: column;
            gap: 1.5rem;
          }

          .btn-delete-account {
            width: 100%;
            justify-content: center;
          }
        }

        @media (max-width: 480px) {
          .dashboard-main {
            padding: 1rem 0.75rem;
          }

          .welcome-content h1 {
            font-size: 20px;
          }

          .welcome-content p {
            font-size: 13px;
          }

          .btn-new-shipment {
            padding: 0.75rem 1rem;
            font-size: 13px;
          }

          .tab-btn {
            padding: 0.85rem 0.9rem;
            font-size: 13px;
          }

          .stat-card {
            padding: 1rem;
          }

          .stat-icon {
            width: 50px;
            height: 50px;
            font-size: 26px;
          }

          .stat-value {
            font-size: 20px;
          }

          .stat-label {
            font-size: 12px;
          }

          .section-title {
            font-size: 18px;
          }

          .btn-view-quotation {
            padding: 0.75rem 1rem;
            font-size: 13px;
          }

          .shipment-card {
            padding: 1rem;
          }

          .order-no {
            font-size: 15px;
          }

          .status-badge {
            padding: 4px 10px;
            font-size: 11px;
          }

          .detail-label {
            font-size: 12px;
          }

          .detail-value {
            font-size: 13px;
          }

          .info-label {
            font-size: 11px;
          }

          .info-value {
            font-size: 13px;
          }

          .btn-view-receipt {
            padding: 0.7rem 1rem;
            font-size: 13px;
          }

          .quotation-card {
            padding: 1rem;
          }

          .quotation-title {
            font-size: 14px;
          }

          .zone-name {
            font-size: 14px;
          }

          .price-amount {
            font-size: 22px;
          }

          .payment-option {
            padding: 1rem;
          }

          .total-price-section {
            padding: 1rem;
          }

          .total-label {
            font-size: 13px;
          }

          .total-amount {
            font-size: 24px;
          }

          .account-info-item {
            padding: 0.9rem;
          }

          .account-label {
            font-size: 12px;
          }

          .account-value {
            font-size: 13px;
          }

          .btn-delete-account {
            padding: 0.75rem 1rem;
            font-size: 13px;
          }
        }

        /* Pending Orders Styles */
        .shipment-card.pending {
          border-left: 4px solid #f59e0b;
          background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
        }

        .status-badge.pending {
          background-color: #f59e0b;
          color: white;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        /* Account Type Badge Styles */
        .account-type-badge {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          text-transform: capitalize;
          display: inline-block;
        }

        .account-type-badge.individual {
          background-color: #dbeafe;
          color: #1e40af;
        }

        .account-type-badge.business {
          background-color: #dcfce7;
          color: #166534;
        }

        /* Order Count Styles */
        .order-count {
          font-weight: 600;
          color: #374151;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .order-count:before {
          content: "📦";
          font-size: 14px;
        }
      `}</style>
    </div>
  );
}
