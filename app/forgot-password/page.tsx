"use client";

import { useState, FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Mail, CheckCircle2 } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setEmailSent(true);
      } else {
        setError(data.detail || "Failed to send reset email");
      }
    } catch (error) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

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
            {!emailSent ? (
              <>
                <Link
                  href="/sign-in"
                  className="back-link"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    color: "#00a8e8",
                    textDecoration: "none",
                    marginBottom: "1.5rem",
                    fontSize: "0.9rem",
                    fontWeight: "500",
                    transition: "all 0.3s ease",
                  }}
                >
                  <ArrowLeft size={16} />
                  Back to Sign In
                </Link>

                <h1 className="signup-title">Forgot Password?</h1>
                <p className="signup-subtitle">
                  No worries! Enter your email address and we&apos;ll send you
                  instructions to reset your password.
                </p>

                <form className="signup-form" onSubmit={handleSubmit}>
                  <div
                    className={`form-group-signup animated-input ${focusedField === "email" ? "focused" : ""} ${email ? "filled" : ""}`}
                  >
                    <div className="password-input-wrapper">
                      <Mail
                        size={18}
                        style={{
                          position: "absolute",
                          left: "12px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          color: email ? "#00a8e8" : "#999",
                          transition: "color 0.3s ease",
                        }}
                      />
                      <input
                        type="email"
                        id="email"
                        name="email"
                        placeholder=" "
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onFocus={() => setFocusedField("email")}
                        onBlur={() => setFocusedField(null)}
                        required
                        style={{ paddingLeft: "45px" }}
                      />
                      <label htmlFor="email" style={{ left: "45px" }}>
                        Email Address
                      </label>
                      <span className="input-border"></span>
                    </div>
                  </div>

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
                    disabled={isLoading}
                  >
                    {isLoading ? "Sending..." : "Send Reset Link"}
                  </button>
                </form>

                <div className="signup-divider">
                  <span>Or</span>
                </div>

                <p className="signup-login-link">
                  Remember your password?{" "}
                  <Link href="/sign-in">Sign In</Link>
                </p>
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
                  Check Your Email
                </h1>
                <p
                  className="signup-subtitle"
                  style={{ marginBottom: "1.5rem" }}
                >
                  We&apos;ve sent password reset instructions to:
                  <br />
                  <strong style={{ color: "#00a8e8" }}>{email}</strong>
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
                    lineHeight: "1.6",
                  }}
                >
                  <strong>Next Steps:</strong>
                  <br />
                  1. Check your inbox (and spam folder)
                  <br />
                  2. Click the reset link in the email
                  <br />
                  3. Create a new password
                </div>

                <button
                  onClick={() => {
                    setEmailSent(false);
                    setEmail("");
                  }}
                  className="btn-signup-submit"
                  style={{
                    backgroundColor: "transparent",
                    border: "2px solid #00a8e8",
                    color: "#00a8e8",
                  }}
                >
                  Send Another Email
                </button>

                <div
                  style={{
                    marginTop: "1.5rem",
                    paddingTop: "1.5rem",
                    borderTop: "1px solid #e5e7eb",
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
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Illustration */}
        <div className="signup-illustration-section">
          <div className="illustration-bg"></div>
          <div className="illustration-content active">
            <h2>Reset Your Password</h2>
            <p>
              Don&apos;t worry, it happens to the best of us. We&apos;ll help
              you get back into your account securely.
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
