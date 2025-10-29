import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

interface SignInFormProps {
  onClose: () => void;
}

export default function SignInForm({ onClose }: SignInFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost:5000/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Invalid credentials");
        return;
      }

      // Store user info locally
      localStorage.setItem("user", JSON.stringify(data.user));

      const role = data.user?.role;

      // Redirect user based on their role
      switch (role) {
        case "admin":
          navigate("/admin-dashboard");
          break;
        case "tutor":
          navigate("/tutor-dashboard");
          break;
        case "tutee":
          navigate("/tutee-dashboard");
          break;
        default:
          navigate("/dashboard"); // fallback
          break;
      }

      // Close modal after navigation
      onClose();
    } catch (error) {
      console.error("Sign-in failed:", error);
      alert("Network or server error. Please try again.");
    }
  };

  return (
    <div className="modal">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>Sign In</h2>

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

        <div className="button-group">
          <button type="submit" className="sign-in-btn">
            Sign In
          </button>
          <button type="button" className="cancel-btn" onClick={onClose}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
