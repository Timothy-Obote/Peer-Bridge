import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function SignUpForm({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null); //  new success state
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

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
        setSuccess("Signup successful! Redirecting..."); // show success
        setTimeout(() => {
          navigate("/dashboard", { state: { user: email } });
        }, 1500); // small delay to show message before redirect
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
        {success && <p className="success">{success}</p>} {/*  show success */}
      </form>
    </div>
  );
}
