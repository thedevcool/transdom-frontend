"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { hasValidAuth } from "@/lib/auth";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  BadgeDollarSign,
  CheckCircle,
  Download,
  Inbox,
  Package,
  Printer,
  Send,
} from "lucide-react";

interface OrderDetails {
  _id: string;
  order_no: string;
  sender_name: string;
  sender_phone: string;
  sender_address: string;
  sender_state: string;
  sender_city: string;
  sender_country: string;
  sender_email: string;
  receiver_name: string;
  receiver_phone: string;
  receiver_address: string;
  receiver_state: string;
  receiver_city: string;
  receiver_post_code: string;
  receiver_country: string;
  shipment_description: string;
  shipment_quantity: number;
  shipment_value?: number;
  shipment_weight: number;
  zone_picked: string;
  delivery_speed: string;
  amount_paid: number;
  add_insurance: boolean;
  insurance_fee: number;
  status: string;
  date_created: string;
  date_approved?: string;
}

export default function ReceiptPage() {
  const params = useParams();
  const router = useRouter();
  const orderNo = params.orderNo as string;
  
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const checkAuthAndFetchOrder = async () => {
      // Check authentication
      if (!hasValidAuth()) {
        router.push("/sign-in");
        return;
      }

      try {
        // Fetch order details from shipments API
        const response = await fetch("/api/shipments", {
          method: "GET",
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Failed to fetch order");
        }

        const data = await response.json();
        const foundOrder = data.shipments?.find((s: any) => s.order_no === orderNo);

        if (!foundOrder) {
          setError("Order not found");
          setLoading(false);
          return;
        }

        // Only show receipt for approved orders
        if (foundOrder.status !== "approved") {
          setError("Receipt is only available for approved orders");
          setLoading(false);
          return;
        }

        setOrder(foundOrder);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load order");
        setLoading(false);
      }
    };

    checkAuthAndFetchOrder();
  }, [orderNo, router]);

  const handleDownloadPDF = async () => {
    if (!order) return;

    setDownloading(true);
    try {
      const receiptElement = document.getElementById("receipt-content");
      if (!receiptElement) return;

      // Capture the receipt as canvas
      const canvas = await html2canvas(receiptElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      // Calculate PDF dimensions
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Create PDF
      const pdf = new jsPDF({
        orientation: imgHeight > imgWidth ? "portrait" : "portrait",
        unit: "mm",
        format: "a4",
      });

      const imgData = canvas.toDataURL("image/png");
      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      pdf.save(`Transdom_Receipt_${order.order_no}.pdf`);
    } catch (err) {
      console.error("Failed to generate PDF:", err);
      alert("Failed to download PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <>
        <Header />
        <div style={{ padding: "4rem 2rem", textAlign: "center" }}>
          <div className="loading-spinner"></div>
          <p>Loading receipt...</p>
        </div>
        <Footer />
      </>
    );
  }

  if (error || !order) {
    return (
      <>
        <Header />
        <div style={{ padding: "4rem 2rem", textAlign: "center" }}>
          <h2 style={{ color: "#dc2626", marginBottom: "1rem" }}>
            {error || "Order not found"}
          </h2>
          <button
            onClick={() => router.push("/dashboard")}
            style={{
              padding: "0.75rem 1.5rem",
              background: "#10b981",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "16px",
            }}
          >
            Back to Dashboard
          </button>
        </div>
        <Footer />
      </>
    );
  }

  const subtotal = order.amount_paid - (order.insurance_fee || 0);

  return (
    <>
      <Header />
      
      <div className="receipt-page">
        <div className="receipt-actions no-print">
          <button onClick={() => router.push("/dashboard")} className="btn-back">
            ← Back to Dashboard
          </button>
          <div className="action-buttons">
            <button onClick={handlePrint} className="btn-print">
              <Printer size={16} /> Print
            </button>
            <button 
              onClick={handleDownloadPDF} 
              className="btn-download"
              disabled={downloading}
            >
              {downloading ? "Generating PDF..." : (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
                  <Download size={16} /> Download PDF
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="receipt-container" id="receipt-content">
          {/* Receipt Header */}
          <div className="receipt-header">
            <div className="company-info">
              <h1 className="company-name">Transdom Logistics</h1>
              <p className="company-tagline">Your Trusted Shipping Partner</p>
            </div>
            <div className="receipt-badge">
              <div className="badge-label">RECEIPT</div>
              <div className="badge-status">
                <CheckCircle size={14} /> APPROVED
              </div>
            </div>
          </div>

          {/* Order Information */}
          <div className="info-section">
            <div className="info-row">
              <div className="info-item">
                <span className="info-label">Order Number:</span>
                <span className="info-value">{order.order_no}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Date Created:</span>
                <span className="info-value">
                  {new Date(order.date_created).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
            </div>
            {order.date_approved && (
              <div className="info-row">
                <div className="info-item">
                  <span className="info-label">Date Approved:</span>
                  <span className="info-value">
                    {new Date(order.date_approved).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="divider"></div>

          {/* Sender & Receiver Information */}
          <div className="parties-section">
            <div className="party-box">
              <h3 className="party-title">
                <Send size={16} /> Sender Details
              </h3>
              <div className="party-details">
                <p><strong>Name:</strong> {order.sender_name}</p>
                <p><strong>Email:</strong> {order.sender_email}</p>
                <p><strong>Phone:</strong> {order.sender_phone}</p>
                <p><strong>Address:</strong> {order.sender_address}</p>
                <p>
                  <strong>Location:</strong>{" "}
                  {[order.sender_city, order.sender_state, order.sender_country]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              </div>
            </div>

            <div className="party-box">
              <h3 className="party-title">
                <Inbox size={16} /> Receiver Details
              </h3>
              <div className="party-details">
                <p><strong>Name:</strong> {order.receiver_name}</p>
                <p><strong>Phone:</strong> {order.receiver_phone}</p>
                <p><strong>Address:</strong> {order.receiver_address}</p>
                <p>
                  <strong>Location:</strong>{" "}
                  {[
                    order.receiver_city,
                    order.receiver_state,
                    order.receiver_country,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </p>
                {order.receiver_post_code && (
                  <p><strong>Postal Code:</strong> {order.receiver_post_code}</p>
                )}
              </div>
            </div>
          </div>

          <div className="divider"></div>

          {/* Shipment Details */}
          <div className="shipment-section">
            <h3 className="section-title">
              <Package size={18} /> Shipment Information
            </h3>
            <div className="shipment-grid">
              <div className="shipment-detail">
                <span className="detail-label">Description:</span>
                <span className="detail-value">{order.shipment_description}</span>
              </div>
              <div className="shipment-detail">
                <span className="detail-label">Quantity:</span>
                <span className="detail-value">{order.shipment_quantity} item(s)</span>
              </div>
              <div className="shipment-detail">
                <span className="detail-label">Weight:</span>
                <span className="detail-value">{order.shipment_weight} kg</span>
              </div>
              {order.shipment_value && (
                <div className="shipment-detail">
                  <span className="detail-label">Declared Value:</span>
                  <span className="detail-value">₦{order.shipment_value.toLocaleString()}</span>
                </div>
              )}
              <div className="shipment-detail">
                <span className="detail-label">Destination Zone:</span>
                <span className="detail-value">{order.zone_picked.replace(/_/g, " ")}</span>
              </div>
              <div className="shipment-detail">
                <span className="detail-label">Delivery Speed:</span>
                <span className="detail-value" style={{ textTransform: "capitalize" }}>
                  {order.delivery_speed}
                </span>
              </div>
            </div>
          </div>

          <div className="divider"></div>

          {/* Payment Summary */}
          <div className="payment-section">
            <h3 className="section-title">
              <BadgeDollarSign size={18} /> Payment Summary
            </h3>
            <div className="payment-table">
              <div className="payment-row">
                <span className="payment-label">Shipping Fee:</span>
                <span className="payment-value">₦{subtotal.toLocaleString()}</span>
              </div>
              {order.add_insurance && order.insurance_fee > 0 && (
                <div className="payment-row">
                  <span className="payment-label">Insurance Fee (2%):</span>
                  <span className="payment-value">₦{order.insurance_fee.toLocaleString()}</span>
                </div>
              )}
              <div className="payment-divider"></div>
              <div className="payment-row total">
                <span className="payment-label">Total Amount Paid:</span>
                <span className="payment-value">₦{order.amount_paid.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="receipt-footer">
            <p className="footer-note">
              Thank you for choosing Transdom Logistics. This is a computer-generated receipt
              and does not require a signature.
            </p>
            <p className="footer-contact">
              For inquiries, contact us at: support@transdomlogistics.com | +234 XXX XXX XXXX
            </p>
          </div>
        </div>
      </div>

      <Footer />

      <style jsx>{`
        .receipt-page {
          min-height: 100vh;
          background-color: #f3f4f6;
          padding: 2rem 1rem;
        }

        .receipt-actions {
          max-width: 900px;
          margin: 0 auto 1.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .action-buttons {
          display: flex;
          gap: 1rem;
        }

        .btn-back,
        .btn-print,
        .btn-download {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-back {
          background: white;
          color: #047857;
          border: 2px solid #047857;
        }

        .btn-back:hover {
          background: #047857;
          color: white;
        }

        .btn-print {
          background: #6366f1;
          color: white;
        }

        .btn-print:hover {
          background: #4f46e5;
          transform: translateY(-2px);
        }

        .btn-download {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
        }

        .btn-download:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 12px rgba(16, 185, 129, 0.3);
        }

        .btn-download:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .receipt-container {
          max-width: 900px;
          margin: 0 auto;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          padding: 3rem;
        }

        .receipt-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
        }

        .company-name {
          font-size: 32px;
          font-weight: 800;
          color: #047857;
          margin: 0;
        }

        .company-tagline {
          font-size: 14px;
          color: #6b7280;
          margin: 0.25rem 0 0;
        }

        .receipt-badge {
          text-align: right;
        }

        .badge-label {
          font-size: 28px;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 0.25rem;
        }

        .badge-status {
          display: inline-block;
          background: #10b981;
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
        }

        .info-section {
          margin-bottom: 1.5rem;
        }

        .info-row {
          display: flex;
          gap: 2rem;
          margin-bottom: 0.75rem;
        }

        .info-item {
          flex: 1;
        }

        .info-label {
          font-weight: 600;
          color: #4b5563;
          margin-right: 0.5rem;
        }

        .info-value {
          color: #1f2937;
        }

        .divider {
          height: 2px;
          background: linear-gradient(90deg, #10b981, transparent);
          margin: 2rem 0;
        }

        .parties-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .party-box {
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          padding: 1.5rem;
        }

        .party-title {
          font-size: 18px;
          font-weight: 700;
          color: #047857;
          margin: 0 0 1rem;
        }

        .party-details p {
          margin: 0.5rem 0;
          color: #374151;
          line-height: 1.6;
        }

        .party-details strong {
          color: #1f2937;
          font-weight: 600;
        }

        .shipment-section,
        .payment-section {
          margin-bottom: 2rem;
        }

        .section-title {
          font-size: 20px;
          font-weight: 700;
          color: #1f2937;
          margin: 0 0 1rem;
        }

        .shipment-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
        }

        .shipment-detail {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .detail-label {
          font-size: 14px;
          font-weight: 600;
          color: #6b7280;
        }

        .detail-value {
          font-size: 16px;
          color: #1f2937;
        }

        .payment-table {
          background: #f9fafb;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          padding: 1.5rem;
        }

        .payment-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.75rem;
        }

        .payment-row.total {
          margin-top: 1rem;
          font-size: 18px;
          font-weight: 700;
        }

        .payment-label {
          color: #4b5563;
        }

        .payment-value {
          color: #1f2937;
          font-weight: 600;
        }

        .payment-row.total .payment-label,
        .payment-row.total .payment-value {
          color: #047857;
        }

        .payment-divider {
          height: 2px;
          background: #d1d5db;
          margin: 1rem 0;
        }

        .receipt-footer {
          margin-top: 3rem;
          padding-top: 2rem;
          border-top: 2px dashed #d1d5db;
          text-align: center;
        }

        .footer-note {
          font-size: 14px;
          color: #6b7280;
          margin-bottom: 0.5rem;
        }

        .footer-contact {
          font-size: 14px;
          color: #9ca3af;
          margin: 0;
        }

        .loading-spinner {
          width: 50px;
          height: 50px;
          border: 4px solid rgba(16, 185, 129, 0.3);
          border-top-color: #10b981;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 1rem;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media print {
          .receipt-page {
            background: white;
            padding: 0;
          }

          .no-print {
            display: none !important;
          }

          .receipt-container {
            box-shadow: none;
            border-radius: 0;
            padding: 1rem;
          }
        }

        @media (max-width: 768px) {
          .receipt-container {
            padding: 1.5rem;
          }

          .parties-section {
            grid-template-columns: 1fr;
          }

          .shipment-grid {
            grid-template-columns: 1fr;
          }

          .receipt-actions {
            flex-direction: column;
            gap: 1rem;
            align-items: stretch;
          }

          .action-buttons {
            flex-direction: column;
          }
        }
      `}</style>
    </>
  );
}
