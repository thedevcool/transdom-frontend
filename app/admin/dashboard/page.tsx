"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  BadgeDollarSign,
  CheckCircle,
  Clock,
  LogOut,
  MailX,
  Inbox,
  Package,
  RefreshCw,
  Send,
  Trash2,
  XCircle,
  DollarSign,
  Edit,
  Plus,
  Save,
  X,
} from "lucide-react";

interface Order {
  _id: string;
  order_no: string;
  zone_picked: string;
  delivery_speed: string;
  weight: number;
  email: string;
  amount_paid: number;
  status: string;
  date_created: string;
  // Complete booking details
  sender_name?: string;
  sender_phone?: string;
  sender_address?: string;
  sender_state?: string;
  sender_city?: string;
  sender_country?: string;
  sender_email?: string;
  receiver_name?: string;
  receiver_phone?: string;
  receiver_address?: string;
  receiver_state?: string;
  receiver_city?: string;
  receiver_post_code?: string;
  receiver_country?: string;
  shipment_description?: string;
  shipment_quantity?: number;
  shipment_value?: number;
  shipment_weight?: number;
}

interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  approvedOrders: number;
  rejectedOrders: number;
  totalRevenue: number;
}

interface RateEntry {
  weight: number;
  price: string | number;
}

interface ShippingRate {
  _id?: string;
  zone: string;
  currency: string;
  unit: string;
  rates: RateEntry[];
}

export default function AdminDashboard() {
  const router = useRouter();
  const [admin, setAdmin] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    pendingOrders: 0,
    approvedOrders: 0,
    rejectedOrders: 0,
    totalRevenue: 0,
  });
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Zones management states
  const [activeTab, setActiveTab] = useState<"orders" | "zones">("orders");
  const [zones, setZones] = useState<ShippingRate[]>([]);
  const [zonesLoading, setZonesLoading] = useState(false);
  const [showZoneModal, setShowZoneModal] = useState(false);
  const [editingZone, setEditingZone] = useState<ShippingRate | null>(null);
  const [zoneForm, setZoneForm] = useState({
    zone: "",
    currency: "NGN",
    unit: "kg",
    rates: [{ weight: 0, price: 0 }],
  });

  const checkAdminAuth = useCallback(() => {
    try {
      // First try to get from cookie
      const adminCookie = document.cookie
        .split("; ")
        .find((row) => row.startsWith("admin_user="));

      let adminData = null;

      if (adminCookie) {
        adminData = JSON.parse(decodeURIComponent(adminCookie.split("=")[1]));
      } else {
        // Fallback to localStorage (for production cookie issues)
        const storedAdmin = localStorage.getItem("admin_user");
        if (storedAdmin) {
          adminData = JSON.parse(storedAdmin);
        }
      }

      if (!adminData) {
        router.push("/admin/login");
        return false;
      }

      setAdmin(adminData);
      setLoading(false);
      return true;
    } catch (err) {
      console.error("Auth check failed:", err);
      router.push("/admin/login");
      return false;
    }
  }, [router]);

  const fetchOrders = useCallback(
    async (status?: string) => {
      try {
        const params = new URLSearchParams();
        if (status && status !== "all") {
          params.append("status_filter", status);
        }
        params.append("limit", "100");

        console.log("Fetching orders with credentials...");

        // Get token from localStorage
        const token = localStorage.getItem("admin_auth_token");
        console.log("Token from localStorage:", !!token);

        const headers: HeadersInit = {
          "Content-Type": "application/json",
        };

        // Add Authorization header if token exists
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const response = await fetch(
          `/api/admin/shipments?${params.toString()}`,
          {
            method: "GET",
            credentials: "include",
            headers,
            cache: "no-store",
            next: { revalidate: 0 },
          },
        );

        if (!response.ok) {
          console.error(
            "Fetch orders failed:",
            response.status,
            response.statusText,
          );
          if (response.status === 401) {
            console.error("Unauthorized - redirecting to login");
            router.push("/admin/login");
            return;
          }
          throw new Error("Failed to fetch orders");
        }

        const data = await response.json();
        const ordersData = data.shipments || [];
        setOrders(ordersData);

        // Calculate stats
        const totalOrders = ordersData.length;
        const pendingOrders = ordersData.filter(
          (o: Order) => o.status === "pending",
        ).length;
        const approvedOrders = ordersData.filter(
          (o: Order) => o.status === "approved",
        ).length;
        const rejectedOrders = ordersData.filter(
          (o: Order) => o.status === "rejected",
        ).length;
        const totalRevenue = ordersData
          .filter((o: Order) => o.status === "approved")
          .reduce((sum: number, o: Order) => sum + o.amount_paid, 0);

        setStats({
          totalOrders,
          pendingOrders,
          approvedOrders,
          rejectedOrders,
          totalRevenue,
        });
      } catch (error) {
        console.error("Failed to fetch orders:", error);
      }
    },
    [router],
  );

  const handleStatusChange = async (order: Order, newStatus: string) => {
    setActionLoading(true);
    try {
      const response = await fetch("/api/admin/approve-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        cache: "no-store",
        body: JSON.stringify({
          order_no: order.order_no,
          status: newStatus,
        }),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ detail: "Failed to update order status" }));
        throw new Error(errorData.detail || "Failed to update order status");
      }

      // Always fetch all orders to update stats correctly
      // This ensures the complete dataset and stats are refreshed
      await fetchOrders(undefined);

      // Close modal after successful update
      setShowModal(false);
      setSelectedOrder(null);
    } catch (error) {
      console.error("Failed to update order:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to update order status";
      alert(
        `❌ Error: ${errorMessage}\n\nPlease try again or contact support if the issue persists.`,
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this order? This action cannot be undone.",
      )
    ) {
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: "DELETE",
        credentials: "include",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to delete order");
      }

      // Refresh orders
      await fetchOrders(filterStatus === "all" ? undefined : filterStatus);
      setShowModal(false);
      setSelectedOrder(null);
    } catch (error) {
      console.error("Failed to delete order:", error);
      alert("Failed to delete order");
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = () => {
    // Clear admin cookies
    document.cookie =
      "admin_auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    document.cookie =
      "admin_user=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";

    // Clear localStorage backup AND token
    localStorage.removeItem("admin_user");
    localStorage.removeItem("admin_auth_token");

    router.push("/admin/login");
  };

  // Zones management functions
  const fetchZones = useCallback(async () => {
    setZonesLoading(true);
    try {
      const token = localStorage.getItem("admin_auth_token");
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch("/api/admin/rates", {
        method: "GET",
        credentials: "include",
        headers,
        cache: "no-store",
        next: { revalidate: 0 },
      });

      if (!response.ok) {
        console.error("Failed to fetch zones:", response.status);
        if (response.status === 401) {
          router.push("/admin/login");
          return;
        }
        throw new Error("Failed to fetch zones");
      }

      const data = await response.json();
      setZones(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching zones:", error);
      setZones([]);
    } finally {
      setZonesLoading(false);
    }
  }, [router]);

  useEffect(() => {
    // Check auth first, then fetch orders and zones if authenticated
    const isAuthenticated = checkAdminAuth();
    if (isAuthenticated) {
      // Add small delay to ensure cookies are fully loaded in production
      setTimeout(() => {
        fetchOrders();
        if (activeTab === "zones") {
          fetchZones();
        }
      }, 300);
    }
  }, [checkAdminAuth, fetchOrders, fetchZones, activeTab]);

  const handleAddZone = () => {
    setEditingZone(null);
    setZoneForm({
      zone: "",
      currency: "NGN",
      unit: "kg",
      rates: [{ weight: 0, price: 0 }],
    });
    setShowZoneModal(true);
  };

  const handleEditZone = (zone: ShippingRate) => {
    setEditingZone(zone);
    setZoneForm({
      zone: zone.zone,
      currency: zone.currency,
      unit: zone.unit,
      rates: zone.rates.map((r) => ({
        weight: r.weight,
        price:
          typeof r.price === "string"
            ? parseFloat(r.price.replace(/,/g, ""))
            : r.price,
      })),
    });
    setShowZoneModal(true);
  };

  const handleDeleteZone = async (zone: string) => {
    if (
      !confirm(
        `Are you sure you want to delete zone "${zone}"? This action cannot be undone.`,
      )
    ) {
      return;
    }

    setActionLoading(true);
    try {
      const token = localStorage.getItem("admin_auth_token");
      const response = await fetch(`/api/admin/rates?zone=${zone}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to delete zone");
      }

      await fetchZones();
    } catch (error) {
      console.error("Failed to delete zone:", error);
      alert("Failed to delete zone");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveZone = async () => {
    // Validation
    if (!zoneForm.zone.trim()) {
      alert("Zone name is required");
      return;
    }

    if (zoneForm.rates.length === 0) {
      alert("At least one rate is required");
      return;
    }

    for (const rate of zoneForm.rates) {
      if (rate.weight <= 0 || rate.price <= 0) {
        alert("Weight and price must be greater than 0");
        return;
      }
    }

    setActionLoading(true);
    try {
      const token = localStorage.getItem("admin_auth_token");
      const response = await fetch("/api/admin/rates", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        cache: "no-store",
        body: JSON.stringify(zoneForm),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to save zone");
      }

      await fetchZones();
      setShowZoneModal(false);
      setEditingZone(null);
      setZoneForm({
        zone: "",
        currency: "NGN",
        unit: "kg",
        rates: [{ weight: 0, price: 0 }],
      });
    } catch (error: any) {
      console.error("Failed to save zone:", error);
      alert(error.message || "Failed to save zone");
    } finally {
      setActionLoading(false);
    }
  };

  const addRateRow = () => {
    setZoneForm({
      ...zoneForm,
      rates: [...zoneForm.rates, { weight: 0, price: 0 }],
    });
  };

  const removeRateRow = (index: number) => {
    if (zoneForm.rates.length === 1) {
      alert("At least one rate is required");
      return;
    }
    setZoneForm({
      ...zoneForm,
      rates: zoneForm.rates.filter((_, i) => i !== index),
    });
  };

  const updateRateRow = (
    index: number,
    field: "weight" | "price",
    value: number,
  ) => {
    const newRates = [...zoneForm.rates];
    newRates[index][field] = value;
    setZoneForm({
      ...zoneForm,
      rates: newRates,
    });
  };

  const filteredOrders = orders.filter((order) => {
    const matchesStatus =
      filterStatus === "all" || order.status === filterStatus;
    const matchesSearch =
      order.order_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.sender_email?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock size={16} />;
      case "approved":
        return <CheckCircle size={16} />;
      case "rejected":
        return <XCircle size={16} />;
      default:
        return <Package size={16} />;
    }
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f3f4f6",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ marginBottom: "1rem" }}>
            <Clock size={48} />
          </div>
          <p style={{ color: "#6b7280", fontSize: "18px" }}>
            Loading admin dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f5f5f5" }}>
      {/* Header */}
      <header
        style={{
          backgroundColor: "#1B5E20",
          color: "white",
          padding: "1rem 0",
          position: "sticky",
          top: 0,
          zIndex: 1000,
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
      >
        <div
          className="admin-header-inner"
          style={{
            maxWidth: "1400px",
            margin: "0 auto",
            padding: "0 clamp(1rem, 3vw, 2rem)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <div
            className="admin-header-brand"
            style={{ display: "flex", alignItems: "center", gap: "1rem" }}
          >
            <Link href="/">
              <Image
                src="/assets/transdom_logo.svg"
                alt="Transdom Logistics"
                width={50}
                height={50}
                style={{ cursor: "pointer" }}
              />
            </Link>
            <div>
              <h1 style={{ fontSize: "24px", fontWeight: "bold", margin: 0 }}>
                Admin Dashboard
              </h1>
              <p style={{ fontSize: "14px", color: "#e8f5e9", margin: 0 }}>
                Welcome back, {admin?.name}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="admin-logout-btn"
            style={{
              padding: "0.5rem 1.5rem",
              backgroundColor: "#d32f2f",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main
        className="admin-main"
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "clamp(1rem, 3vw, 2rem)",
        }}
      >
        {/* Tabs */}
        <div
          style={{
            marginBottom: "2rem",
            borderBottom: "2px solid #e5e7eb",
          }}
        >
          <div style={{ display: "flex", gap: "1rem" }}>
            <button
              onClick={() => setActiveTab("orders")}
              style={{
                padding: "1rem 2rem",
                fontSize: "16px",
                fontWeight: "600",
                color: activeTab === "orders" ? "#1B5E20" : "#6b7280",
                backgroundColor: "transparent",
                border: "none",
                borderBottom:
                  activeTab === "orders"
                    ? "3px solid #1B5E20"
                    : "3px solid transparent",
                cursor: "pointer",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <Package size={20} />
              Orders Management
            </button>
            <button
              onClick={() => {
                setActiveTab("zones");
                fetchZones();
              }}
              style={{
                padding: "1rem 2rem",
                fontSize: "16px",
                fontWeight: "600",
                color: activeTab === "zones" ? "#1B5E20" : "#6b7280",
                backgroundColor: "transparent",
                border: "none",
                borderBottom:
                  activeTab === "zones"
                    ? "3px solid #1B5E20"
                    : "3px solid transparent",
                cursor: "pointer",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <DollarSign size={20} />
              Zones & Prices
            </button>
          </div>
        </div>

        {/* Orders Tab Content */}
        {activeTab === "orders" && (
          <>
            {/* Stats Cards */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: "1.5rem",
                marginBottom: "2rem",
              }}
            >
              {/* Total Orders */}
              <div
                style={{
                  backgroundColor: "white",
                  padding: "1.5rem",
                  borderRadius: "12px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  borderLeft: "4px solid #1B5E20",
                }}
              >
                <div
                  className="admin-modal-header"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <p
                      style={{
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#6b7280",
                        textTransform: "uppercase",
                        margin: 0,
                      }}
                    >
                      Total Orders
                    </p>
                    <p
                      style={{
                        fontSize: "32px",
                        fontWeight: "bold",
                        color: "#1f2937",
                        marginTop: "0.5rem",
                        marginBottom: 0,
                      }}
                    >
                      {stats.totalOrders}
                    </p>
                  </div>
                  <div>
                    <Package size={48} />
                  </div>
                </div>
              </div>

              {/* Pending */}
              <div
                style={{
                  backgroundColor: "white",
                  padding: "1.5rem",
                  borderRadius: "12px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  borderLeft: "4px solid #f59e0b",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <p
                      style={{
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#6b7280",
                        textTransform: "uppercase",
                        margin: 0,
                      }}
                    >
                      Pending
                    </p>
                    <p
                      style={{
                        fontSize: "32px",
                        fontWeight: "bold",
                        color: "#f59e0b",
                        marginTop: "0.5rem",
                        marginBottom: 0,
                      }}
                    >
                      {stats.pendingOrders}
                    </p>
                  </div>
                  <div>
                    <Clock size={48} />
                  </div>
                </div>
              </div>

              {/* Approved */}
              <div
                style={{
                  backgroundColor: "white",
                  padding: "1.5rem",
                  borderRadius: "12px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  borderLeft: "4px solid #10b981",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <p
                      style={{
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#6b7280",
                        textTransform: "uppercase",
                        margin: 0,
                      }}
                    >
                      Approved
                    </p>
                    <p
                      style={{
                        fontSize: "32px",
                        fontWeight: "bold",
                        color: "#10b981",
                        marginTop: "0.5rem",
                        marginBottom: 0,
                      }}
                    >
                      {stats.approvedOrders}
                    </p>
                  </div>
                  <div>
                    <CheckCircle size={48} />
                  </div>
                </div>
              </div>

              {/* Rejected */}
              <div
                style={{
                  backgroundColor: "white",
                  padding: "1.5rem",
                  borderRadius: "12px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  borderLeft: "4px solid #ef4444",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <p
                      style={{
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#6b7280",
                        textTransform: "uppercase",
                        margin: 0,
                      }}
                    >
                      Rejected
                    </p>
                    <p
                      style={{
                        fontSize: "32px",
                        fontWeight: "bold",
                        color: "#ef4444",
                        marginTop: "0.5rem",
                        marginBottom: 0,
                      }}
                    >
                      {stats.rejectedOrders}
                    </p>
                  </div>
                  <div>
                    <XCircle size={48} />
                  </div>
                </div>
              </div>

              {/* Revenue */}
              <div
                style={{
                  background:
                    "linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%)",
                  padding: "1.5rem",
                  borderRadius: "12px",
                  boxShadow: "0 4px 12px rgba(27,94,32,0.3)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <p
                      style={{
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#e8f5e9",
                        textTransform: "uppercase",
                        margin: 0,
                      }}
                    >
                      Total Revenue
                    </p>
                    <p
                      style={{
                        fontSize: "24px",
                        fontWeight: "bold",
                        color: "white",
                        marginTop: "0.5rem",
                        marginBottom: 0,
                      }}
                    >
                      ₦{stats.totalRevenue.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <BadgeDollarSign size={48} />
                  </div>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div
              style={{
                backgroundColor: "white",
                padding: "1.5rem",
                borderRadius: "12px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                marginBottom: "1.5rem",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "1rem",
                  alignItems: "end",
                }}
              >
                {/* Status Filter */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#374151",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Filter by Status
                  </label>
                  <select
                    value={filterStatus}
                    onChange={(e) => {
                      // Just update the filter state - orders are already loaded
                      // Frontend filtering via filteredOrders will handle the display
                      setFilterStatus(e.target.value);
                    }}
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "2px solid #e5e7eb",
                      borderRadius: "6px",
                      fontSize: "14px",
                      outline: "none",
                    }}
                  >
                    <option value="all">All Orders</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                {/* Search */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#374151",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Search Orders
                  </label>
                  <input
                    type="text"
                    placeholder="Order number or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "2px solid #e5e7eb",
                      borderRadius: "6px",
                      fontSize: "14px",
                      outline: "none",
                    }}
                  />
                </div>

                {/* Refresh Button */}
                <button
                  onClick={() => {
                    // Always fetch all orders to ensure stats are correct
                    fetchOrders(undefined);
                  }}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: "#1B5E20",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                  }}
                  title="Refresh all orders and update statistics"
                >
                  <span
                    style={{ display: "inline-flex", alignItems: "center" }}
                  >
                    <RefreshCw size={20} />
                  </span>
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {/* Orders Table */}
            <div
              style={{
                backgroundColor: "white",
                borderRadius: "12px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "1.5rem",
                  borderBottom: "1px solid #e5e7eb",
                  background: "linear-gradient(90deg, #f9fafb 0%, white 100%)",
                }}
              >
                <h2
                  style={{
                    fontSize: "20px",
                    fontWeight: "bold",
                    color: "#1f2937",
                    margin: 0,
                  }}
                >
                  Orders{" "}
                  <span style={{ color: "#1B5E20" }}>
                    ({filteredOrders.length})
                  </span>
                </h2>
              </div>

              {filteredOrders.length === 0 ? (
                <div style={{ padding: "3rem", textAlign: "center" }}>
                  <div style={{ marginBottom: "1rem" }}>
                    <MailX size={64} />
                  </div>
                  <p style={{ color: "#6b7280", fontSize: "18px" }}>
                    No orders found
                  </p>
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead
                      style={{
                        background:
                          "linear-gradient(90deg, #f9fafb 0%, #f3f4f6 100%)",
                      }}
                    >
                      <tr>
                        <th
                          style={{
                            padding: "1rem 1.5rem",
                            textAlign: "left",
                            fontSize: "12px",
                            fontWeight: "bold",
                            color: "#6b7280",
                            textTransform: "uppercase",
                          }}
                        >
                          Order #
                        </th>
                        <th
                          style={{
                            padding: "1rem 1.5rem",
                            textAlign: "left",
                            fontSize: "12px",
                            fontWeight: "bold",
                            color: "#6b7280",
                            textTransform: "uppercase",
                          }}
                        >
                          Customer
                        </th>
                        <th
                          style={{
                            padding: "1rem 1.5rem",
                            textAlign: "left",
                            fontSize: "12px",
                            fontWeight: "bold",
                            color: "#6b7280",
                            textTransform: "uppercase",
                          }}
                        >
                          Route
                        </th>
                        <th
                          style={{
                            padding: "1rem 1.5rem",
                            textAlign: "left",
                            fontSize: "12px",
                            fontWeight: "bold",
                            color: "#6b7280",
                            textTransform: "uppercase",
                          }}
                        >
                          Weight
                        </th>
                        <th
                          style={{
                            padding: "1rem 1.5rem",
                            textAlign: "left",
                            fontSize: "12px",
                            fontWeight: "bold",
                            color: "#6b7280",
                            textTransform: "uppercase",
                          }}
                        >
                          Amount
                        </th>
                        <th
                          style={{
                            padding: "1rem 1.5rem",
                            textAlign: "left",
                            fontSize: "12px",
                            fontWeight: "bold",
                            color: "#6b7280",
                            textTransform: "uppercase",
                          }}
                        >
                          Status
                        </th>
                        <th
                          style={{
                            padding: "1rem 1.5rem",
                            textAlign: "left",
                            fontSize: "12px",
                            fontWeight: "bold",
                            color: "#6b7280",
                            textTransform: "uppercase",
                          }}
                        >
                          Date
                        </th>
                        <th
                          style={{
                            padding: "1rem 1.5rem",
                            textAlign: "center",
                            fontSize: "12px",
                            fontWeight: "bold",
                            color: "#6b7280",
                            textTransform: "uppercase",
                          }}
                        >
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.map((order) => (
                        <tr
                          key={order._id}
                          style={{
                            borderBottom: "1px solid #e5e7eb",
                            transition: "background-color 0.2s",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.backgroundColor = "#f9fafb")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.backgroundColor =
                              "transparent")
                          }
                        >
                          <td style={{ padding: "1rem 1.5rem" }}>
                            <span
                              style={{
                                fontSize: "14px",
                                fontFamily: "monospace",
                                fontWeight: "600",
                                color: "#1f2937",
                              }}
                            >
                              {order.order_no}
                            </span>
                          </td>
                          <td style={{ padding: "1rem 1.5rem" }}>
                            <div style={{ fontSize: "14px" }}>
                              <div
                                style={{ fontWeight: "500", color: "#1f2937" }}
                              >
                                {order.sender_name || "N/A"}
                              </div>
                              <div
                                style={{ color: "#6b7280", fontSize: "13px" }}
                              >
                                {order.sender_email || order.email}
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: "1rem 1.5rem" }}>
                            <div style={{ fontSize: "14px" }}>
                              <div
                                style={{ fontWeight: "500", color: "#1f2937" }}
                              >
                                {order.sender_country || "N/A"}
                              </div>
                              <div
                                style={{ color: "#6b7280", fontSize: "13px" }}
                              >
                                →{" "}
                                {order.receiver_country ||
                                  order.zone_picked.replace(/_/g, " ")}
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: "1rem 1.5rem" }}>
                            <span
                              style={{
                                fontSize: "14px",
                                fontWeight: "600",
                                color: "#1f2937",
                              }}
                            >
                              {order.shipment_weight || order.weight} kg
                            </span>
                          </td>
                          <td style={{ padding: "1rem 1.5rem" }}>
                            <span
                              style={{
                                fontSize: "14px",
                                fontWeight: "bold",
                                color: "#10b981",
                              }}
                            >
                              ₦{order.amount_paid.toLocaleString()}
                            </span>
                          </td>
                          <td style={{ padding: "1rem 1.5rem" }}>
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.25rem",
                                padding: "0.25rem 0.75rem",
                                borderRadius: "9999px",
                                fontSize: "12px",
                                fontWeight: "600",
                                backgroundColor:
                                  order.status === "pending"
                                    ? "#fef3c7"
                                    : order.status === "approved"
                                      ? "#d1fae5"
                                      : "#fee2e2",
                                color:
                                  order.status === "pending"
                                    ? "#92400e"
                                    : order.status === "approved"
                                      ? "#065f46"
                                      : "#991b1b",
                              }}
                            >
                              {getStatusIcon(order.status)} {order.status}
                            </span>
                          </td>
                          <td
                            style={{
                              padding: "1rem 1.5rem",
                              fontSize: "14px",
                              color: "#6b7280",
                            }}
                          >
                            {new Date(order.date_created).toLocaleDateString()}
                          </td>
                          <td
                            style={{
                              padding: "1rem 1.5rem",
                              textAlign: "center",
                            }}
                          >
                            <button
                              onClick={() => {
                                setSelectedOrder(order);
                                setShowModal(true);
                              }}
                              style={{
                                backgroundColor: "#1B5E20",
                                color: "white",
                                padding: "0.5rem 1rem",
                                border: "none",
                                borderRadius: "8px",
                                fontSize: "14px",
                                fontWeight: "600",
                                cursor: "pointer",
                              }}
                              onMouseOver={(e) =>
                                (e.currentTarget.style.backgroundColor =
                                  "#2E7D32")
                              }
                              onMouseOut={(e) =>
                                (e.currentTarget.style.backgroundColor =
                                  "#1B5E20")
                              }
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* Zones Tab Content */}
        {activeTab === "zones" && (
          <>
            {/* Header with Add Button */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1.5rem",
              }}
            >
              <h2
                style={{
                  fontSize: "24px",
                  fontWeight: "bold",
                  color: "#1f2937",
                  margin: 0,
                }}
              >
                Shipping Zones & Prices
              </h2>
              <button
                onClick={handleAddZone}
                style={{
                  padding: "0.75rem 1.5rem",
                  backgroundColor: "#1B5E20",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.backgroundColor = "#2E7D32")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.backgroundColor = "#1B5E20")
                }
              >
                <Plus size={20} />
                Add New Zone
              </button>
            </div>

            {/* Zones Grid */}
            {zonesLoading ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "3rem",
                  backgroundColor: "white",
                  borderRadius: "12px",
                }}
              >
                <Clock size={48} />
                <p
                  style={{
                    color: "#6b7280",
                    fontSize: "18px",
                    marginTop: "1rem",
                  }}
                >
                  Loading zones...
                </p>
              </div>
            ) : zones.length === 0 ? (
              <div
                style={{
                  backgroundColor: "white",
                  borderRadius: "12px",
                  padding: "3rem",
                  textAlign: "center",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                }}
              >
                <DollarSign size={64} style={{ margin: "0 auto 1rem" }} />
                <p style={{ color: "#6b7280", fontSize: "18px" }}>
                  No zones found. Add your first shipping zone!
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
                  gap: "1.5rem",
                }}
              >
                {zones.map((zone) => (
                  <div
                    key={zone._id || zone.zone}
                    style={{
                      backgroundColor: "white",
                      borderRadius: "12px",
                      padding: "1.5rem",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                      border: "2px solid #e5e7eb",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "#1B5E20";
                      e.currentTarget.style.boxShadow =
                        "0 4px 12px rgba(27,94,32,0.2)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "#e5e7eb";
                      e.currentTarget.style.boxShadow =
                        "0 2px 8px rgba(0,0,0,0.1)";
                    }}
                  >
                    {/* Zone Header */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "1rem",
                        paddingBottom: "0.75rem",
                        borderBottom: "2px solid #e5e7eb",
                      }}
                    >
                      <h3
                        style={{
                          fontSize: "20px",
                          fontWeight: "bold",
                          color: "#1B5E20",
                          margin: 0,
                        }}
                      >
                        {zone.zone.replace(/_/g, " ")}
                      </h3>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button
                          onClick={() => handleEditZone(zone)}
                          style={{
                            padding: "0.5rem",
                            backgroundColor: "#3b82f6",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                          }}
                          title="Edit Zone"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteZone(zone.zone)}
                          style={{
                            padding: "0.5rem",
                            backgroundColor: "#dc2626",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                          }}
                          title="Delete Zone"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Zone Info */}
                    <div
                      style={{
                        display: "flex",
                        gap: "1rem",
                        marginBottom: "1rem",
                        fontSize: "14px",
                        color: "#6b7280",
                      }}
                    >
                      <div>
                        <strong>Currency:</strong> {zone.currency}
                      </div>
                      <div>
                        <strong>Unit:</strong> {zone.unit}
                      </div>
                    </div>

                    {/* Rates Table */}
                    <div
                      style={{
                        backgroundColor: "#f9fafb",
                        borderRadius: "8px",
                        padding: "1rem",
                      }}
                    >
                      <h4
                        style={{
                          fontSize: "14px",
                          fontWeight: "600",
                          color: "#374151",
                          marginBottom: "0.75rem",
                        }}
                      >
                        Price Tiers
                      </h4>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.5rem",
                        }}
                      >
                        {zone.rates
                          .sort((a, b) => a.weight - b.weight)
                          .map((rate, index) => (
                            <div
                              key={index}
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                padding: "0.5rem 0.75rem",
                                backgroundColor: "white",
                                borderRadius: "6px",
                                fontSize: "14px",
                              }}
                            >
                              <span
                                style={{ fontWeight: "600", color: "#1f2937" }}
                              >
                                {rate.weight} {zone.unit}
                              </span>
                              <span
                                style={{ fontWeight: "bold", color: "#1B5E20" }}
                              >
                                {zone.currency}{" "}
                                {typeof rate.price === "string"
                                  ? rate.price
                                  : rate.price.toLocaleString()}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* Zone Add/Edit Modal */}
      {showZoneModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "1rem",
          }}
          onClick={() => !actionLoading && setShowZoneModal(false)}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "16px",
              boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
              maxWidth: "600px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                background: "linear-gradient(90deg, #1B5E20 0%, #2E7D32 100%)",
                color: "white",
                padding: "1.5rem",
                borderTopLeftRadius: "16px",
                borderTopRightRadius: "16px",
                position: "sticky",
                top: 0,
                zIndex: 10,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <h2 style={{ fontSize: "24px", fontWeight: "bold", margin: 0 }}>
                  {editingZone ? "Edit Zone" : "Add New Zone"}
                </h2>
                <button
                  onClick={() => !actionLoading && setShowZoneModal(false)}
                  disabled={actionLoading}
                  style={{
                    color: "white",
                    fontSize: "36px",
                    fontWeight: "bold",
                    background: "none",
                    border: "none",
                    cursor: actionLoading ? "not-allowed" : "pointer",
                    lineHeight: "1",
                  }}
                >
                  ×
                </button>
              </div>
            </div>

            <div style={{ padding: "1.5rem" }}>
              {/* Zone Name */}
              <div style={{ marginBottom: "1.5rem" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#374151",
                    marginBottom: "0.5rem",
                  }}
                >
                  Zone Name *
                </label>
                <input
                  type="text"
                  value={zoneForm.zone}
                  onChange={(e) =>
                    setZoneForm({
                      ...zoneForm,
                      zone: e.target.value.toUpperCase(),
                    })
                  }
                  placeholder="e.g., UK_IRELAND, EUROPE, ASIA"
                  disabled={!!editingZone || actionLoading}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "2px solid #e5e7eb",
                    borderRadius: "8px",
                    fontSize: "14px",
                    outline: "none",
                    backgroundColor: editingZone ? "#f3f4f6" : "white",
                  }}
                />
                {editingZone && (
                  <p
                    style={{
                      fontSize: "12px",
                      color: "#6b7280",
                      marginTop: "0.25rem",
                    }}
                  >
                    Zone name cannot be changed when editing
                  </p>
                )}
              </div>

              {/* Currency and Unit */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1rem",
                  marginBottom: "1.5rem",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#374151",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Currency *
                  </label>
                  <input
                    type="text"
                    value={zoneForm.currency}
                    onChange={(e) =>
                      setZoneForm({
                        ...zoneForm,
                        currency: e.target.value.toUpperCase(),
                      })
                    }
                    placeholder="NGN"
                    disabled={actionLoading}
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      border: "2px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: "14px",
                      outline: "none",
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#374151",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Unit *
                  </label>
                  <input
                    type="text"
                    value={zoneForm.unit}
                    onChange={(e) =>
                      setZoneForm({
                        ...zoneForm,
                        unit: e.target.value.toLowerCase(),
                      })
                    }
                    placeholder="kg"
                    disabled={actionLoading}
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      border: "2px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: "14px",
                      outline: "none",
                    }}
                  />
                </div>
              </div>

              {/* Rates */}
              <div style={{ marginBottom: "1.5rem" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "0.75rem",
                  }}
                >
                  <label
                    style={{
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#374151",
                    }}
                  >
                    Price Tiers *
                  </label>
                  <button
                    onClick={addRateRow}
                    disabled={actionLoading}
                    style={{
                      padding: "0.5rem 1rem",
                      backgroundColor: "#1B5E20",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      fontSize: "13px",
                      fontWeight: "600",
                      cursor: actionLoading ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.25rem",
                    }}
                  >
                    <Plus size={16} />
                    Add Tier
                  </button>
                </div>

                <div
                  style={{
                    backgroundColor: "#f9fafb",
                    borderRadius: "8px",
                    padding: "1rem",
                    maxHeight: "300px",
                    overflowY: "auto",
                  }}
                >
                  {zoneForm.rates.map((rate, index) => (
                    <div
                      key={index}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr auto",
                        gap: "0.75rem",
                        marginBottom: "0.75rem",
                        alignItems: "center",
                      }}
                    >
                      <input
                        type="number"
                        value={rate.weight}
                        onChange={(e) =>
                          updateRateRow(
                            index,
                            "weight",
                            parseFloat(e.target.value) || 0,
                          )
                        }
                        placeholder="Weight"
                        disabled={actionLoading}
                        min="0"
                        step="0.1"
                        style={{
                          padding: "0.75rem",
                          border: "2px solid #e5e7eb",
                          borderRadius: "6px",
                          fontSize: "14px",
                          outline: "none",
                        }}
                      />
                      <input
                        type="number"
                        value={rate.price}
                        onChange={(e) =>
                          updateRateRow(
                            index,
                            "price",
                            parseFloat(e.target.value) || 0,
                          )
                        }
                        placeholder="Price"
                        disabled={actionLoading}
                        min="0"
                        step="0.01"
                        style={{
                          padding: "0.75rem",
                          border: "2px solid #e5e7eb",
                          borderRadius: "6px",
                          fontSize: "14px",
                          outline: "none",
                        }}
                      />
                      <button
                        onClick={() => removeRateRow(index)}
                        disabled={actionLoading || zoneForm.rates.length === 1}
                        style={{
                          padding: "0.75rem",
                          backgroundColor:
                            zoneForm.rates.length === 1 ? "#e5e7eb" : "#dc2626",
                          color:
                            zoneForm.rates.length === 1 ? "#9ca3af" : "white",
                          border: "none",
                          borderRadius: "6px",
                          cursor:
                            actionLoading || zoneForm.rates.length === 1
                              ? "not-allowed"
                              : "pointer",
                        }}
                        title="Remove Tier"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1rem",
                  paddingTop: "1rem",
                  borderTop: "1px solid #e5e7eb",
                }}
              >
                <button
                  onClick={handleSaveZone}
                  disabled={actionLoading}
                  style={{
                    padding: "0.75rem 1.5rem",
                    backgroundColor: actionLoading ? "#9ca3af" : "#1B5E20",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: actionLoading ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                  }}
                >
                  <Save size={16} />
                  {actionLoading
                    ? "Saving..."
                    : editingZone
                      ? "Update Zone"
                      : "Create Zone"}
                </button>
                <button
                  onClick={() => !actionLoading && setShowZoneModal(false)}
                  disabled={actionLoading}
                  style={{
                    padding: "0.75rem 1.5rem",
                    backgroundColor: "#f3f4f6",
                    color: "#374151",
                    border: "2px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: actionLoading ? "not-allowed" : "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {showModal && selectedOrder && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "1rem",
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "16px",
              boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
              maxWidth: "56rem",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                background: "linear-gradient(90deg, #1B5E20 0%, #2E7D32 100%)",
                color: "white",
                padding: "1.5rem",
                borderTopLeftRadius: "16px",
                borderTopRightRadius: "16px",
                position: "sticky",
                top: 0,
                zIndex: 10,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <h2
                    style={{ fontSize: "24px", fontWeight: "bold", margin: 0 }}
                  >
                    Order Details
                  </h2>
                  <p
                    style={{
                      color: "#c8e6c9",
                      fontSize: "14px",
                      marginTop: "0.25rem",
                      marginBottom: 0,
                    }}
                  >
                    Order #{selectedOrder.order_no}
                  </p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  style={{
                    color: "white",
                    fontSize: "36px",
                    fontWeight: "bold",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    lineHeight: "1",
                  }}
                >
                  ×
                </button>
              </div>
            </div>

            <div style={{ padding: "1.5rem" }}>
              {/* Status Badge */}
              <div
                className="admin-status-row"
                style={{
                  marginBottom: "1.5rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.5rem 1rem",
                    borderRadius: "9999px",
                    fontSize: "14px",
                    fontWeight: "bold",
                    backgroundColor:
                      selectedOrder.status === "pending"
                        ? "#fef3c7"
                        : selectedOrder.status === "approved"
                          ? "#d1fae5"
                          : "#fee2e2",
                    color:
                      selectedOrder.status === "pending"
                        ? "#92400e"
                        : selectedOrder.status === "approved"
                          ? "#065f46"
                          : "#991b1b",
                  }}
                >
                  {getStatusIcon(selectedOrder.status)}{" "}
                  {selectedOrder.status.toUpperCase()}
                </span>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontSize: "14px", color: "#6b7280", margin: 0 }}>
                    Order Date
                  </p>
                  <p
                    style={{
                      fontSize: "18px",
                      fontWeight: "600",
                      color: "#1f2937",
                      marginTop: "0.25rem",
                      marginBottom: 0,
                    }}
                  >
                    {new Date(selectedOrder.date_created).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Sender & Receiver Info */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                  gap: "1.5rem",
                  marginBottom: "1.5rem",
                }}
              >
                {/* Sender Details */}
                <div
                  style={{
                    backgroundColor: "#eff6ff",
                    borderRadius: "12px",
                    padding: "1.25rem",
                    borderLeft: "4px solid #3b82f6",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "18px",
                      fontWeight: "bold",
                      color: "#1e3a8a",
                      marginBottom: "1rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <span
                      style={{ display: "inline-flex", alignItems: "center" }}
                    >
                      <Send size={20} />
                    </span>{" "}
                    Sender Information
                  </h3>
                  <div style={{ fontSize: "14px" }}>
                    <div style={{ marginBottom: "0.5rem" }}>
                      <span style={{ fontWeight: "600", color: "#374151" }}>
                        Name:
                      </span>
                      <p style={{ color: "#1f2937", margin: 0 }}>
                        {selectedOrder.sender_name || "N/A"}
                      </p>
                    </div>
                    <div style={{ marginBottom: "0.5rem" }}>
                      <span style={{ fontWeight: "600", color: "#374151" }}>
                        Email:
                      </span>
                      <p style={{ color: "#1f2937", margin: 0 }}>
                        {selectedOrder.sender_email || selectedOrder.email}
                      </p>
                    </div>
                    <div style={{ marginBottom: "0.5rem" }}>
                      <span style={{ fontWeight: "600", color: "#374151" }}>
                        Phone:
                      </span>
                      <p style={{ color: "#1f2937", margin: 0 }}>
                        {selectedOrder.sender_phone || "N/A"}
                      </p>
                    </div>
                    <div style={{ marginBottom: "0.5rem" }}>
                      <span style={{ fontWeight: "600", color: "#374151" }}>
                        Address:
                      </span>
                      <p style={{ color: "#1f2937", margin: 0 }}>
                        {selectedOrder.sender_address || "N/A"}
                      </p>
                    </div>
                    <div>
                      <span style={{ fontWeight: "600", color: "#374151" }}>
                        Location:
                      </span>
                      <p style={{ color: "#1f2937", margin: 0 }}>
                        {selectedOrder.sender_city},{" "}
                        {selectedOrder.sender_state},{" "}
                        {selectedOrder.sender_country}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Receiver Details */}
                <div
                  style={{
                    backgroundColor: "#f0fdf4",
                    borderRadius: "12px",
                    padding: "1.25rem",
                    borderLeft: "4px solid #22c55e",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "18px",
                      fontWeight: "bold",
                      color: "#14532d",
                      marginBottom: "1rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <span
                      style={{ display: "inline-flex", alignItems: "center" }}
                    >
                      <Inbox size={20} />
                    </span>{" "}
                    Receiver Information
                  </h3>
                  <div style={{ fontSize: "14px" }}>
                    <div style={{ marginBottom: "0.5rem" }}>
                      <span style={{ fontWeight: "600", color: "#374151" }}>
                        Name:
                      </span>
                      <p style={{ color: "#1f2937", margin: 0 }}>
                        {selectedOrder.receiver_name || "N/A"}
                      </p>
                    </div>
                    <div style={{ marginBottom: "0.5rem" }}>
                      <span style={{ fontWeight: "600", color: "#374151" }}>
                        Phone:
                      </span>
                      <p style={{ color: "#1f2937", margin: 0 }}>
                        {selectedOrder.receiver_phone || "N/A"}
                      </p>
                    </div>
                    <div style={{ marginBottom: "0.5rem" }}>
                      <span style={{ fontWeight: "600", color: "#374151" }}>
                        Address:
                      </span>
                      <p style={{ color: "#1f2937", margin: 0 }}>
                        {selectedOrder.receiver_address || "N/A"}
                      </p>
                    </div>
                    <div style={{ marginBottom: "0.5rem" }}>
                      <span style={{ fontWeight: "600", color: "#374151" }}>
                        Location:
                      </span>
                      <p style={{ color: "#1f2937", margin: 0 }}>
                        {selectedOrder.receiver_city},{" "}
                        {selectedOrder.receiver_state},{" "}
                        {selectedOrder.receiver_country}
                      </p>
                    </div>
                    <div>
                      <span style={{ fontWeight: "600", color: "#374151" }}>
                        Postal Code:
                      </span>
                      <p style={{ color: "#1f2937", margin: 0 }}>
                        {selectedOrder.receiver_post_code || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Shipment Details */}
              <div
                style={{
                  backgroundColor: "#fefce8",
                  borderRadius: "12px",
                  padding: "1.25rem",
                  borderLeft: "4px solid #eab308",
                  marginBottom: "1.5rem",
                }}
              >
                <h3
                  style={{
                    fontSize: "18px",
                    fontWeight: "bold",
                    color: "#713f12",
                    marginBottom: "1rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <span
                    style={{ display: "inline-flex", alignItems: "center" }}
                  >
                    <Package size={20} />
                  </span>{" "}
                  Shipment Details
                </h3>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "1rem",
                    fontSize: "14px",
                  }}
                >
                  <div>
                    <span style={{ fontWeight: "600", color: "#374151" }}>
                      Description:
                    </span>
                    <p style={{ color: "#1f2937", margin: 0 }}>
                      {selectedOrder.shipment_description || "N/A"}
                    </p>
                  </div>
                  <div>
                    <span style={{ fontWeight: "600", color: "#374151" }}>
                      Quantity:
                    </span>
                    <p style={{ color: "#1f2937", margin: 0 }}>
                      {selectedOrder.shipment_quantity || "N/A"} items
                    </p>
                  </div>
                  <div>
                    <span style={{ fontWeight: "600", color: "#374151" }}>
                      Weight:
                    </span>
                    <p
                      style={{
                        color: "#1f2937",
                        fontWeight: "bold",
                        margin: 0,
                      }}
                    >
                      {selectedOrder.shipment_weight || selectedOrder.weight} kg
                    </p>
                  </div>
                  <div>
                    <span style={{ fontWeight: "600", color: "#374151" }}>
                      Value:
                    </span>
                    <p style={{ color: "#1f2937", margin: 0 }}>
                      ₦{selectedOrder.shipment_value?.toLocaleString() || "N/A"}
                    </p>
                  </div>
                  <div>
                    <span style={{ fontWeight: "600", color: "#374151" }}>
                      Zone:
                    </span>
                    <p style={{ color: "#1f2937", margin: 0 }}>
                      {selectedOrder.zone_picked.replace(/_/g, " ")}
                    </p>
                  </div>
                  <div>
                    <span style={{ fontWeight: "600", color: "#374151" }}>
                      Delivery Speed:
                    </span>
                    <p
                      style={{
                        color: "#1f2937",
                        textTransform: "capitalize",
                        margin: 0,
                      }}
                    >
                      {selectedOrder.delivery_speed}
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Info */}
              <div
                style={{
                  background:
                    "linear-gradient(90deg, #f0fdf4 0%, #d1fae5 100%)",
                  borderRadius: "12px",
                  padding: "1.25rem",
                  borderLeft: "4px solid #10b981",
                  marginBottom: "1.5rem",
                }}
              >
                <h3
                  style={{
                    fontSize: "18px",
                    fontWeight: "bold",
                    color: "#064e3b",
                    marginBottom: "0.75rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <span
                    style={{ display: "inline-flex", alignItems: "center" }}
                  >
                    <BadgeDollarSign size={20} />
                  </span>{" "}
                  Payment Information
                </h3>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <p
                      style={{ fontSize: "14px", color: "#047857", margin: 0 }}
                    >
                      Amount Paid
                    </p>
                    <p
                      style={{
                        fontSize: "30px",
                        fontWeight: "bold",
                        color: "#059669",
                        marginTop: "0.25rem",
                        marginBottom: 0,
                      }}
                    >
                      ₦{selectedOrder.amount_paid.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <CheckCircle size={48} />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div>
                <h3
                  style={{
                    fontSize: "18px",
                    fontWeight: "bold",
                    color: "#1f2937",
                    marginBottom: "0.75rem",
                  }}
                >
                  Update Order Status
                </h3>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                    gap: "0.75rem",
                    marginBottom: "1rem",
                  }}
                >
                  {selectedOrder.status !== "approved" && (
                    <button
                      onClick={() =>
                        handleStatusChange(selectedOrder, "approved")
                      }
                      disabled={actionLoading}
                      style={{
                        padding: "0.75rem 1rem",
                        borderRadius: "8px",
                        fontWeight: "600",
                        color: "white",
                        border: "none",
                        cursor: actionLoading ? "not-allowed" : "pointer",
                        backgroundColor: actionLoading ? "#9ca3af" : "#16a34a",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                        transition: "all 0.2s",
                      }}
                      onMouseOver={(e) =>
                        !actionLoading &&
                        (e.currentTarget.style.backgroundColor = "#15803d")
                      }
                      onMouseOut={(e) =>
                        !actionLoading &&
                        (e.currentTarget.style.backgroundColor = "#16a34a")
                      }
                    >
                      <CheckCircle size={16} /> Approve Order
                    </button>
                  )}

                  {selectedOrder.status !== "rejected" && (
                    <button
                      onClick={() =>
                        handleStatusChange(selectedOrder, "rejected")
                      }
                      disabled={actionLoading}
                      style={{
                        padding: "0.75rem 1rem",
                        borderRadius: "8px",
                        fontWeight: "600",
                        color: "white",
                        border: "none",
                        cursor: actionLoading ? "not-allowed" : "pointer",
                        backgroundColor: actionLoading ? "#9ca3af" : "#dc2626",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                        transition: "all 0.2s",
                      }}
                      onMouseOver={(e) =>
                        !actionLoading &&
                        (e.currentTarget.style.backgroundColor = "#b91c1c")
                      }
                      onMouseOut={(e) =>
                        !actionLoading &&
                        (e.currentTarget.style.backgroundColor = "#dc2626")
                      }
                    >
                      <XCircle size={16} /> Reject Order
                    </button>
                  )}

                  {selectedOrder.status !== "pending" && (
                    <button
                      onClick={() =>
                        handleStatusChange(selectedOrder, "pending")
                      }
                      disabled={actionLoading}
                      style={{
                        padding: "0.75rem 1rem",
                        borderRadius: "8px",
                        fontWeight: "600",
                        color: "white",
                        border: "none",
                        cursor: actionLoading ? "not-allowed" : "pointer",
                        backgroundColor: actionLoading ? "#9ca3af" : "#ca8a04",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                        transition: "all 0.2s",
                      }}
                      onMouseOver={(e) =>
                        !actionLoading &&
                        (e.currentTarget.style.backgroundColor = "#a16207")
                      }
                      onMouseOut={(e) =>
                        !actionLoading &&
                        (e.currentTarget.style.backgroundColor = "#ca8a04")
                      }
                    >
                      <Clock size={16} /> Set to Pending
                    </button>
                  )}
                </div>

                <div
                  style={{
                    paddingTop: "1rem",
                    borderTop: "1px solid #e5e7eb",
                    marginTop: "1rem",
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                    gap: "0.75rem",
                  }}
                >
                  <button
                    onClick={() => handleDeleteOrder(selectedOrder._id)}
                    disabled={actionLoading}
                    style={{
                      padding: "0.75rem 1rem",
                      borderRadius: "8px",
                      fontWeight: "600",
                      color: "white",
                      border: "none",
                      cursor: actionLoading ? "not-allowed" : "pointer",
                      backgroundColor: actionLoading ? "#9ca3af" : "#b91c1c",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                      transition: "all 0.2s",
                    }}
                    onMouseOver={(e) =>
                      !actionLoading &&
                      (e.currentTarget.style.backgroundColor = "#991b1b")
                    }
                    onMouseOut={(e) =>
                      !actionLoading &&
                      (e.currentTarget.style.backgroundColor = "#b91c1c")
                    }
                  >
                    <Trash2 size={16} /> Delete Order
                  </button>

                  <button
                    onClick={() => setShowModal(false)}
                    style={{
                      padding: "0.75rem 1rem",
                      backgroundColor: "#f3f4f6",
                      color: "#374151",
                      border: "2px solid #d1d5db",
                      borderRadius: "8px",
                      fontWeight: "600",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                    onMouseOver={(e) =>
                      (e.currentTarget.style.backgroundColor = "#e5e7eb")
                    }
                    onMouseOut={(e) =>
                      (e.currentTarget.style.backgroundColor = "#f3f4f6")
                    }
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      <style jsx>{`
        @media (max-width: 768px) {
          .admin-header-inner {
            flex-direction: column;
            align-items: flex-start;
          }

          .admin-header-brand {
            flex-direction: column;
            align-items: flex-start;
          }

          .admin-logout-btn {
            width: 100%;
            justify-content: center;
            display: inline-flex;
            align-items: center;
          }

          .admin-modal-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.75rem;
          }

          .admin-status-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.75rem;
          }
        }
      `}</style>
    </div>
  );
}
