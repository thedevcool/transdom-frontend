"use client";

import { useState, FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    password: "",
  });

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Login failed");
      }

      // Redirect to admin dashboard
      router.push("/admin/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      }}
    >
      {/* Left Side - Branding */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          color: "white",
          padding: "4rem",
        }}
      >
        <div style={{ maxWidth: "500px", textAlign: "center" }}>
          <div style={{ fontSize: "64px", marginBottom: "2rem" }}>🔐</div>
          <h1
            style={{
              fontSize: "48px",
              fontWeight: "bold",
              marginBottom: "1rem",
            }}
          >
            Admin Portal
          </h1>
          <p style={{ fontSize: "20px", opacity: 0.9 }}>
            Manage orders, track shipments, and oversee operations
          </p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "white",
          padding: "2rem",
        }}
      >
        <div style={{ width: "100%", maxWidth: "450px" }}>
          {/* Logo */}
          <div style={{ marginBottom: "2rem", textAlign: "center" }}>
            <Link href="/">
              <Image
                src="/assets/transdom_logo.svg"
                alt="Transdom Logistics"
                width={60}
                height={60}
              />
            </Link>
          </div>

          <div style={{ marginBottom: "2rem" }}>
            <h2
              style={{
                fontSize: "28px",
                fontWeight: "bold",
                color: "#1f2937",
                marginBottom: "0.5rem",
              }}
            >
              Admin Login
            </h2>
            <p style={{ color: "#6b7280" }}>
              Enter your admin credentials to continue
            </p>
          </div>

          {error && (
            <div
              style={{
                padding: "12px",
                marginBottom: "1rem",
                backgroundColor: "#fee2e2",
                border: "1px solid #fecaca",
                borderRadius: "8px",
                color: "#dc2626",
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Admin Name */}
            <div style={{ marginBottom: "1.5rem" }}>
              <label
                htmlFor="name"
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#374151",
                }}
              >
                Admin Username
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  border: "2px solid #e5e7eb",
                  borderRadius: "8px",
                  fontSize: "16px",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#667eea")}
                onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: "1.5rem" }}>
              <label
                htmlFor="password"
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#374151",
                }}
              >
                Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    paddingRight: "48px",
                    border: "2px solid #e5e7eb",
                    borderRadius: "8px",
                    fontSize: "16px",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#667eea")}
                  onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "20px",
                  }}
                >
                  {showPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "14px",
                backgroundColor: loading ? "#9ca3af" : "#667eea",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "16px",
                fontWeight: "600",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "background-color 0.2s",
              }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.backgroundColor = "#5568d3";
              }}
              onMouseLeave={(e) => {
                if (!loading) e.currentTarget.style.backgroundColor = "#667eea";
              }}
            >
              {loading ? "Logging in..." : "Login to Admin Portal"}
            </button>
          </form>

          {/* Back to Home */}
          <div style={{ marginTop: "2rem", textAlign: "center" }}>
            <Link
              href="/"
              style={{
                color: "#667eea",
                textDecoration: "none",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              ← Back to Homepage
            </Link>
          </div>

          {/* Security Notice */}
          <div
            style={{
              marginTop: "2rem",
              padding: "12px",
              backgroundColor: "#fef3c7",
              border: "1px solid #fde68a",
              borderRadius: "8px",
            }}
          >
            <p style={{ fontSize: "12px", color: "#92400e", margin: 0 }}>
              🔒 This is a secure admin area. All actions are logged and
              monitored.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
