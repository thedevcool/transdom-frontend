"use client";

import { useState, FormEvent, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, CheckCircle2, Lock } from "lucide-react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordReset, setPasswordReset] = useState(false);
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    // Get token from URL query parameter
    const tokenParam = searchParams.get("token");
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      setError("Invalid or missing reset token");
    }
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long");
      setIsLoading(false);
      return;
    }

    if (!token) {
      setError("Invalid or missing reset token");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          new_password: formData.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setPasswordReset(true);
        // Redirect to sign in after 3 seconds
        setTimeout(() => {
          router.push("/sign-in");
        }, 3000);
      } else {
        setError(data.detail || "Failed to reset password");
      }
    } catch (error) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate password strength
  const getPasswordStrength = () => {
    const password = formData.password;
    if (!password) return { strength: 0, label: "", color: "" };

    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (password.length >= 12) strength += 25;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
    if (/\d/.test(password)) strength += 12.5;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 12.5;

    let label = "";
    let color = "";
    if (strength <= 25) {
      label = "Weak";
      color = "#dc2626";
    } else if (strength <= 50) {
      label = "Fair";
      color = "#f59e0b";
    } else if (strength <= 75) {
      label = "Good";
      color = "#3b82f6";
    } else {
      label = "Strong";
      color = "#16a34a";
    }

    return { strength, label, color };
  };

  const passwordStrength = getPasswordStrength();

  if (!token && !error) {
    return (
      <div className="signup-page">
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
          }}
        >
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="signup-page">
      <div className="signup-container">
        {/* Left Side - Form */}
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
            {!passwordReset ? (
              <>
                <h1 className="signup-title">Reset Your Password</h1>
                <p className="signup-subtitle">
                  Enter your new password below. Make sure it&apos;s strong and
                  secure.
                </p>

                <form className="signup-form" onSubmit={handleSubmit}>
                  <div
                    className={`form-group-signup animated-input ${focusedField === "password" ? "focused" : ""} ${formData.password ? "filled" : ""}`}
                  >
                    <div className="password-input-wrapper">
                      <Lock
                        size={18}
                        style={{
                          position: "absolute",
                          left: "12px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          color: formData.password ? "#00a8e8" : "#999",
                          transition: "color 0.3s ease",
                        }}
                      />
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
                        style={{ paddingLeft: "45px" }}
                      />
                      <label htmlFor="password" style={{ left: "45px" }}>
                        New Password
                      </label>
                      <span className="input-border"></span>
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <Eye size={18} />
                        ) : (
                          <EyeOff size={18} />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Password Strength Indicator */}
                  {formData.password && (
                    <div style={{ marginBottom: "1rem" }}>
                      <div
                        style={{
                          height: "6px",
                          backgroundColor: "#e5e7eb",
                          borderRadius: "3px",
                          overflow: "hidden",
                          marginBottom: "0.5rem",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${passwordStrength.strength}%`,
                            backgroundColor: passwordStrength.color,
                            transition: "all 0.3s ease",
                          }}
                        ></div>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          fontSize: "0.85rem",
                        }}
                      >
                        <span style={{ color: passwordStrength.color }}>
                          {passwordStrength.label}
                        </span>
                        <span style={{ color: "#6b7280" }}>
                          {formData.password.length} characters
                        </span>
                      </div>
                    </div>
                  )}

                  <div
                    className={`form-group-signup animated-input ${focusedField === "confirmPassword" ? "focused" : ""} ${formData.confirmPassword ? "filled" : ""}`}
                  >
                    <div className="password-input-wrapper">
                      <Lock
                        size={18}
                        style={{
                          position: "absolute",
                          left: "12px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          color: formData.confirmPassword ? "#00a8e8" : "#999",
                          transition: "color 0.3s ease",
                        }}
                      />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        id="confirmPassword"
                        name="confirmPassword"
                        placeholder=" "
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        onFocus={() => setFocusedField("confirmPassword")}
                        onBlur={() => setFocusedField(null)}
                        required
                        style={{ paddingLeft: "45px" }}
                      />
                      <label htmlFor="confirmPassword" style={{ left: "45px" }}>
                        Confirm New Password
                      </label>
                      <span className="input-border"></span>
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                      >
                        {showConfirmPassword ? (
                          <Eye size={18} />
                        ) : (
                          <EyeOff size={18} />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Password Matching Indicator */}
                  {formData.confirmPassword && (
                    <div
                      style={{
                        marginBottom: "1rem",
                        fontSize: "0.85rem",
                        color:
                          formData.password === formData.confirmPassword
                            ? "#16a34a"
                            : "#dc2626",
                      }}
                    >
                      {formData.password === formData.confirmPassword
                        ? "✓ Passwords match"
                        : "✗ Passwords do not match"}
                    </div>
                  )}

                  {error && (
                    <div
                      className="error-message"
                      style={{
                        color: "white",
                        backgroundColor: "#dc2626",
                        padding: "12px 16px",
                        borderRadius: "8px",
                        marginBottom: "1rem",
                        textAlign: "center",
                        fontSize: "0.9rem",
                      }}
                    >
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="btn-signup-submit"
                    disabled={isLoading || !token}
                  >
                    {isLoading ? "Resetting..." : "Reset Password"}
                  </button>
                </form>

                <div
                  style={{
                    marginTop: "1.5rem",
                    paddingTop: "1.5rem",
                    borderTop: "1px solid #e5e7eb",
                    textAlign: "center",
                  }}
                >
                  <Link
                    href="/sign-in"
                    style={{
                      color: "#00a8e8",
                      textDecoration: "none",
                      fontWeight: "500",
                      fontSize: "0.95rem",
                    }}
                  >
                    ← Back to Sign In
                  </Link>
                </div>
              </>
            ) : (
              <div
                style={{
                  textAlign: "center",
                  padding: "2rem 1rem",
                }}
              >
                <div
                  style={{
                    width: "80px",
                    height: "80px",
                    borderRadius: "50%",
                    backgroundColor: "#dcfce7",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 1.5rem",
                  }}
                >
                  <CheckCircle2 size={40} color="#16a34a" />
                </div>

                <h1 className="signup-title" style={{ marginBottom: "1rem" }}>
                  Password Reset Successful!
                </h1>
                <p
                  className="signup-subtitle"
                  style={{ marginBottom: "1.5rem" }}
                >
                  Your password has been reset successfully. You can now sign in
                  with your new password.
                </p>

                <div
                  style={{
                    backgroundColor: "#f0f9ff",
                    border: "1px solid #bae6fd",
                    borderRadius: "8px",
                    padding: "1rem",
                    marginBottom: "1.5rem",
                    fontSize: "0.9rem",
                    color: "#0c4a6e",
                  }}
                >
                  Redirecting to sign in page in 3 seconds...
                </div>

                <Link href="/sign-in" className="btn-signup-submit">
                  Sign In Now
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Illustration */}
        <div className="signup-illustration-section">
          <div className="illustration-bg"></div>
          <div className="illustration-content active">
            <h2>Create a Strong Password</h2>
            <p>
              Choose a password that is at least 8 characters long and includes
              a mix of letters, numbers, and special characters.
            </p>

            <div className="illustration-progress">
              <div className="progress-circle active"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPassword() {
  return (
    <Suspense
      fallback={
        <div className="signup-page">
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100vh",
            }}
          >
            <p>Loading...</p>
          </div>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
