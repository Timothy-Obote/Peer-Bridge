import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./LoggedIn.css";

type Role = "tutor" | "tutee";

const roleDetails: Record<Role, { title: string; description: string }> = {
  tutor: {
    title: "Tutor",
    description: "Help other students learn",
  },
  tutee: {
    title: "Tutee",
    description: "Get support with your courses",
  },
};

function TutorIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="m2.5 9.5 9.5-5 9.5 5-9.5 5-9.5-5Z" />
      <path d="M6 11.35V16c2.95 2.5 9.05 2.5 12 0v-4.65" />
      <path d="M21.5 10v5" />
    </svg>
  );
}

function TuteeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M4 5.5c2.8-.75 5.5-.25 8 1.5v12c-2.5-1.75-5.2-2.25-8-1.5v-12Z" />
      <path d="M20 5.5c-2.8-.75-5.5-.25-8 1.5v12c2.5-1.75 5.2-2.25 8-1.5v-12Z" />
    </svg>
  );
}

export default function SignUp() {
  const [role, setRole] = useState<Role | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!role) {
      setErrorMessage("Please choose whether you are registering as a tutor or tutee.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: fullName.trim(), email, password, role }),
      });
      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.message || "Unable to create your account.");
        return;
      }

      setSuccessMessage("Registration successful! Redirecting to sign in...");
      setTimeout(() => {
        navigate("/signin", { replace: true });
      }, 1500);
    } catch {
      setErrorMessage("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="signup-page">
      <main className="signup-container" aria-labelledby="signup-title">
        <p className="signup-brand">PeerBridge</p>
        <h1 id="signup-title">Create an account</h1>

        {errorMessage && <div className="signup-error" role="alert">{errorMessage}</div>}
        {successMessage && <div className="signup-success" role="status">{successMessage}</div>}

        <form onSubmit={handleSubmit}>
          <fieldset className="role-fieldset" disabled={isLoading}>
            <legend>Choose your role</legend>
            <div className="role-options">
              {(Object.keys(roleDetails) as Role[]).map((option) => {
                const details = roleDetails[option];
                const isSelected = role === option;

                return (
                  <button
                    key={option}
                    type="button"
                    className={`signup-role-card ${option} ${isSelected ? "is-selected" : ""}`}
                    onClick={() => setRole(option)}
                    aria-pressed={isSelected}
                  >
                    <span className="signup-role-icon">
                      {option === "tutor" ? <TutorIcon /> : <TuteeIcon />}
                    </span>
                    <span className="signup-role-copy">
                      <strong>{details.title}</strong>
                      <small>{details.description}</small>
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="signup-form-group">
            <label htmlFor="signup-name">Full name</label>
            <input
              id="signup-name"
              type="text"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              autoComplete="name"
              required
              disabled={isLoading}
            />
          </div>

          <div className="signup-form-group">
            <label htmlFor="signup-email">Email</label>
            <input
              id="signup-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
              disabled={isLoading}
            />
          </div>

          <div className="signup-form-group">
            <label htmlFor="signup-password">Password</label>
            <input
              id="signup-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              minLength={6}
              required
              disabled={isLoading}
            />
          </div>

          <div className="signup-form-group">
            <label htmlFor="signup-confirm-password">Confirm password</label>
            <input
              id="signup-confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              minLength={6}
              required
              disabled={isLoading}
            />
          </div>

          <button type="submit" className="signup-submit" disabled={isLoading}>
            {isLoading ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        <p className="signin-link">
          Already have an account? <Link to="/signin">Sign in</Link>
        </p>
        <p className="signin-link">
          <Link to="/">← Back to Home</Link>
        </p>
      </main>
    </div>
  );
}
