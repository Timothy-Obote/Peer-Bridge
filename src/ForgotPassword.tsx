import { useState } from "react";
import { Link } from "react-router-dom";
import "./SignIn.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/password-reset/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.message || "Unable to send a password reset email.");
        return;
      }

      setSuccessMessage(data.message);
    } catch {
      setErrorMessage("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="signin-page">
      <main className="signin-container" aria-labelledby="forgot-password-title">
        <p className="auth-brand">PeerBridge</p>
        <h1 id="forgot-password-title">Reset your password</h1>
        <p className="recovery-intro">
          Enter your account email and we’ll send you a secure, one-time password reset link.
        </p>

        {errorMessage && <div className="error-message" role="alert">{errorMessage}</div>}
        {successMessage && <div className="recovery-success" role="status">{successMessage}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="recovery-email">Email</label>
            <input
              id="recovery-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
              disabled={isLoading}
            />
          </div>

          <button type="submit" disabled={isLoading} className="signin-btn">
            {isLoading ? "Sending link..." : "Send reset link"}
          </button>
        </form>

        <p className="signup-link">
          <Link to="/signin">Back to sign in</Link>
        </p>
      </main>
    </div>
  );
}
