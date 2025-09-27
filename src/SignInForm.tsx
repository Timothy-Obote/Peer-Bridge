import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function SignInForm({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      console.log("Sending signin:", { email });
      const resp = await fetch("http://localhost:5000/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      console.log("Received response:", resp.status, resp.statusText);

      // Try to parse JSON safely
      let data: any = null;
      try {
        data = await resp.json();
        console.log("Parsed JSON:", data);
      } catch (parseErr) {
        const text = await resp.text();
        console.warn("Response not JSON:", text);
        throw new Error(`Unexpected server response: ${resp.status} ${text}`);
      }

      if (!resp.ok) {
        // Show server-provided message when possible
        const msg = data?.message || `Server returned ${resp.status}`;
        setError(msg);
        return;
      }

      // Success: store minimal user info and redirect
      localStorage.setItem("user", JSON.stringify(data.user || { email }));
      onClose();
      navigate("/dashboard", { state: { user: data.user || { email } } });
    } catch (err: any) {
      console.error("Sign-in failed:", err);
      // Show the actual error message so it's actionable
      setError(err?.message || "Network or server error");
    }
  };

  return (
    <div className="modal">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>Sign In</h2>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" className="sign-in-btn">Sign In</button>
        <button type="button" className="cancel-btn" onClick={onClose}>Cancel</button>
      </form>
    </div>
  );
}
