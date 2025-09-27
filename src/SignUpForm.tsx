import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function SignUpForm({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:5000/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Signup failed");
      } else {
        // redirect to LoggedIn page with user email
        navigate("/dashboard", { state: { user: email } });
      }
    } catch (err) {
      console.error("Signup error:", err);
      setError("Something went wrong. Try again.");
    }
  };

  return (
    <div className="modal">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>Sign Up</h2>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <button type="submit" className="sign-in-btn">Sign Up</button>
        <button type="button" className="cancel-btn" onClick={onClose}>Cancel</button>
        {error && <p className="error">{error}</p>}
      </form>
    </div>
  );
}
