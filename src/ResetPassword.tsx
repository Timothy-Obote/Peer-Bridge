import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import PasswordInput from "./PasswordInput";
import "./SignIn.css";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/password-reset/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, password }),
      });
      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.message || "Unable to reset your password.");
        return;
      }

      setSuccessMessage("Your password has been updated. You can now sign in.");
    } catch {
      setErrorMessage("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="signin-page">
      <main className="signin-container" aria-labelledby="reset-password-title">
        <p className="auth-brand">PeerBridge</p>
        <h1 id="reset-password-title">Choose a new password</h1>

        {errorMessage && <div className="error-message" role="alert">{errorMessage}</div>}
        {successMessage && <div className="recovery-success" role="status">{successMessage}</div>}

        {successMessage ? (
          <p className="signup-link"><Link to="/signin">Go to sign in</Link></p>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="reset-email">Email</label>
              <input
                id="reset-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="reset-password">New password</label>
              <PasswordInput
                id="reset-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
                minLength={6}
                required
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="reset-confirm-password">Confirm new password</label>
              <PasswordInput
                id="reset-confirm-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                minLength={6}
                required
                disabled={isLoading}
              />
            </div>

            <button type="submit" disabled={isLoading || !token} className="signin-btn">
              {isLoading ? "Updating password..." : "Update password"}
            </button>
            {!token && (
              <p className="recovery-token-error" role="alert">
                This reset link is incomplete. Request a new reset link to continue.
              </p>
            )}
          </form>
        )}

        {!successMessage && (
          <p className="signup-link">
            <Link to="/forgot-password">Request another reset link</Link>
          </p>
        )}
      </main>
    </div>
  );
}
