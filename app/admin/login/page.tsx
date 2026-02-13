"use client";

import { useState, FormEvent, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle, Eye, EyeOff, Lock } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    password: "",
  });

  // Calculate form completion progress
  const formProgress = useMemo(() => {
    const filledFields = [formData.name, formData.password].filter(
      (field) => field.length > 0,
    );
    return Math.round((filledFields.length / 2) * 100);
  }, [formData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Critical for cookies in production
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Login failed");
      }

      // Store admin data in localStorage as backup (for production cookie issues)
      if (data.admin) {
        localStorage.setItem("admin_user", JSON.stringify(data.admin));
        console.log("Stored admin in localStorage");
      }

      // CRITICAL: Store token in localStorage for API calls
      if (data.access_token) {
        localStorage.setItem("admin_auth_token", data.access_token);
        console.log("Stored admin token in localStorage");
      }

      // Show success message
      setSuccess(true);

      // Redirect immediately - cookies should be set by now
      router.push("/admin/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-page">
      <div className="signup-container">
        {/* Left Side - Admin Login Form */}
        <div className="signup-form-section">
          <div className="signup-header">
            <Link href="/">
              <Image
                src="/assets/transdom_logo.svg"
                alt="Transdom Logistics"
                width={50}
                height={50}
              />
            </Link>
          </div>

          <div className="signup-form-wrapper">
            <h1 className="signup-title">Admin Portal</h1>
            <p className="signup-subtitle">
              Sign in to access the admin dashboard
            </p>

            {/* Progress Bar */}
            <div className="form-progress-container">
              <div className="form-progress-bar">
                <div
                  className="form-progress-fill"
                  style={{ width: `${formProgress}%` }}
                >
                  <span className="form-progress-text">{formProgress}%</span>
                </div>
              </div>
            </div>

            <form className="signup-form" onSubmit={handleSubmit}>
              <div
                className={`form-group-signup animated-input ${focusedField === "name" ? "focused" : ""} ${formData.name ? "filled" : ""}`}
              >
                <input
                  type="text"
                  id="name"
                  name="name"
                  placeholder=" "
                  value={formData.name}
                  onChange={handleChange}
                  onFocus={() => setFocusedField("name")}
                  onBlur={() => setFocusedField(null)}
                  required
                />
                <label htmlFor="name">Admin Username</label>
                <span className="input-border"></span>
              </div>

              <div
                className={`form-group-signup animated-input ${focusedField === "password" ? "focused" : ""} ${formData.password ? "filled" : ""}`}
              >
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    placeholder=" "
                    value={formData.password}
                    onChange={handleChange}
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => setFocusedField(null)}
                    required
                  />
                  <label htmlFor="password">Password</label>
                  <span className="input-border"></span>
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn-signup-submit"
                disabled={loading || success}
                style={{
                  backgroundColor: success ? "#10b981" : undefined,
                  cursor: loading || success ? "not-allowed" : "pointer",
                }}
              >
                {success ? (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <CheckCircle size={18} /> Success! Redirecting...
                  </span>
                ) : loading ? (
                  "Signing In..."
                ) : (
                  "Sign In to Admin Portal"
                )}
              </button>
            </form>

            {error && (
              <div
                className="error-message"
                style={{
                  color: "white",
                  backgroundColor: "#dc2626",
                  padding: "12px",
                  borderRadius: "8px",
                  marginTop: "10px",
                  textAlign: "center",
                  fontWeight: "500",
                }}
              >
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <AlertTriangle size={16} /> {error}
                </span>
              </div>
            )}

            {success && (
              <div
                style={{
                  color: "white",
                  backgroundColor: "#10b981",
                  padding: "12px",
                  borderRadius: "8px",
                  marginTop: "10px",
                  textAlign: "center",
                  fontWeight: "500",
                }}
              >
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <CheckCircle size={16} /> Login successful! Redirecting to
                  dashboard...
                </span>
              </div>
            )}

            <div className="signup-divider">
              <span>Authorized Personnel Only</span>
            </div>

            <p className="signup-login-link">
              <Link href="/">← Back to Homepage</Link>
            </p>

            {/* Security Notice */}
            <div
              style={{
                marginTop: "1rem",
                padding: "12px",
                backgroundColor: "#fef3c7",
                border: "1px solid #fde68a",
                borderRadius: "8px",
              }}
            >
              <p style={{ fontSize: "12px", color: "#92400e", margin: 0 }}>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <Lock size={14} /> This is a secure admin area. All actions
                  are logged and
                </span>
                monitored.
              </p>
            </div>
          </div>
        </div>

        {/* Right Side - Illustrations */}
        <div className="signup-illustration-section">
          <div className="illustration-bg"></div>
          <div
            className={`illustration-content ${formProgress === 100 ? "active" : ""}`}
          >
            <h2>Admin Dashboard Access</h2>
            <p>
              Manage orders, track shipments, and oversee operations. Welcome to
              the Transdom Logistics Admin Portal!
            </p>

            {/* Animated progress circles */}
            <div className="illustration-progress">
              <div
                className={`progress-circle ${formProgress >= 50 ? "active" : ""}`}
              ></div>
              <div
                className={`progress-circle ${formProgress === 100 ? "active" : ""}`}
              ></div>
            </div>

            {/* Admin Icon */}
            <div style={{ marginTop: "2rem" }}>
              <Lock size={64} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
