// src/SignIn.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./SignIn.css"; // optional styling

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.message || "Invalid credentials");
        setIsLoading(false);
        return;
      }

      localStorage.setItem("user", JSON.stringify(data.user));
      if (data.token) localStorage.setItem("token", data.token);

      const role = data.user?.role;
      // Redirect based on role
      if (role === "admin") navigate("/admin-dashboard");
      else if (role === "tutor") window.location.href = "/tutor-dashboard";
      else if (role === "tutee") window.location.href = "/tutee-dashboard";
      else window.location.href = "/dashboard";
    } catch (error) {
      setErrorMessage("Network error. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="signin-page">
      <div className="signin-container">
        <button className="back-home" onClick={() => navigate("/")}>
          ← Back to Home
        </button>
        <h2>Sign In</h2>
        {errorMessage && <div className="error-message">{errorMessage}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          <div className="form-group">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          <button type="submit" disabled={isLoading} className="signin-btn">
            {isLoading ? "Signing in..." : "Sign In"}
          </button>
        </form>
        <p className="signup-link">
          Don't have an account? <a href="/dashboard">Sign Up</a>
        </p>
      </div>
    </div>
  );
}