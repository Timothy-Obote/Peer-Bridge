import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { generateAndStoreKeys } from "./utils/encryption";
import "./SignIn.css";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.message || "Invalid email or password.");
        return;
      }

      localStorage.setItem("user", JSON.stringify(data.user));
      if (data.token) localStorage.setItem("token", data.token);

      if (!localStorage.getItem("privateKey")) {
        try {
          await generateAndStoreKeys();
        } catch (keyError) {
          console.error("Key generation failed after sign in:", keyError);
        }
      }

      const role = data.user?.role;
      if (role === "admin") navigate("/admin-dashboard", { replace: true });
      else if (role === "tutor") navigate("/tutor-dashboard", { replace: true });
      else if (role === "tutee") navigate("/tutee-dashboard", { replace: true });
      else navigate("/signup", { replace: true });
    } catch {
      setErrorMessage("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    setErrorMessage("Password recovery is not available yet. Please contact the PeerBridge administrator.");
  };

  return (
    <div className="signin-page">
      <main className="signin-container" aria-labelledby="signin-title">
        <p className="auth-brand">PeerBridge</p>
        <h1 id="signin-title">Welcome Back</h1>

        {errorMessage && <div className="error-message" role="alert">{errorMessage}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="signin-email">Email</label>
            <input
              id="signin-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <div className="field-label-row">
              <label htmlFor="signin-password">Password</label>
              <button type="button" className="forgot-password" onClick={handleForgotPassword}>
                Forgot?
              </button>
            </div>
            <input
              id="signin-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
              disabled={isLoading}
            />
          </div>

          <button type="submit" disabled={isLoading} className="signin-btn">
            {isLoading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="signup-link">
          Do not have an account? <Link to="/signup">Sign Up</Link>
        </p>
        <p className="signup-link">
          <Link to="/">← Back to Home</Link>
        </p>
      </main>
    </div>
  );
}
