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
        const msg = data?.message || `Server returned ${resp.status}`;
        setError(msg);
        return;
      }

      //  Role-based redirect logic
      const user = data.user || { email, role: "user"};
      localStorage.setItem("user", JSON.stringify(user));
      onClose();
       // role based redirect logic with elif statements 
      if (user.role === "admin") {
        console.log("Redirecting admin to dashboard...");
        navigate("/admin-dashboard", { state: { user } });
      }else if (user.role === "tutor") {
        console.log("Redirecting tutor...");
        navigate("/tutor-dashboard", { state: { user } });
      } else if (user.role === "tutee") {
        console.log("Redirecting tutee...");
        navigate("/tutee-dashboard", { state: { user } });
      } else {
        console.log("Redirecting normal user to dashboard...");
        navigate("/dashboard", { state: { user } });
      }

    } catch (err: any) {
      console.error("Sign-in failed:", err);
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
