import "./App.css";
import SignInForm from "./SignInForm";
import LoggedIn from "./LoggedIn";
import Tutor from "./tutor";
import Tutee from "./tutee";
import TutorDashboard from "./TutorDashboard";
import TuteeDashboard from "./TuteeDashboard";
import AdminDashboard from "./Admin";

import { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
} from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

// ---------------- HOME COMPONENT ----------------
function Home() {
  const [showSignIn, setShowSignIn] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const navigate = useNavigate();

  const previews: Record<string, string> = {
    Learn: "Access tutorials, study resources, and tips shared by top-performing peers.",
    "How it Works":
      "PeerBridge connects students needing academic help with volunteer tutors from their university.",
    Community:
      "Join study groups, mentorship programs, and peer-driven Q&A forums to grow together.",
  };

  // When user clicks Sign Up → go to LoggedIn.tsx to pick role
  const handleSignUpClick = () => {
    navigate("/dashboard");
  };

  // When user clicks Sign In → open SignInForm modal
  const handleSignInClick = () => {
    setShowSignIn(true);
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header relative">
        <div className="logo">PeerBridge</div>

        {/* Navigation */}
        <nav className="main-nav">
          {Object.keys(previews).map((item) => (
            <a
              key={item}
              href={`#${item.replace(/\s+/g, "")}`}
              onMouseEnter={() => setHovered(item)}
              onMouseLeave={() => setHovered(null)}
            >
              {item}
            </a>
          ))}
        </nav>

        {/* Hover preview */}
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="hover-box"
            >
              <h3>{hovered}</h3>
              <p>{previews[hovered]}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Auth Buttons */}
        <div className="auth-buttons">
          <button className="sign-in" onClick={handleSignInClick}>
            Sign In
          </button>
          <button className="sign-up" onClick={handleSignUpClick}>
            Sign Up
          </button>
        </div>
      </header>

      {/* Body */}
      <main className="main-bg">
        <div className="main-content">
          <h1>Placement And Career Services</h1>
          <p>
            Struggling in a Unit? Worry no more... <br />
            Get Help from Your Peers and raise your GPA.
          </p>
        </div>
        <div className="main-image"></div>
      </main>

      {/* Scrollable Sections */}
      <motion.section
        id="Learn"
        className="section learn-section"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        <h2>Learn</h2>
        <p>
          Access tutorials, shared notes, and study materials from top-performing students at USIU.
        </p>
      </motion.section>

      <motion.section
        id="HowitWorks"
        className="section how-section"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        <h2>How It Works</h2>
        <p>
          PeerBridge connects students who need academic help with tutors from their own university.
          Simply sign up, choose your role, and start learning or tutoring.
        </p>
      </motion.section>

      <motion.section
        id="Community"
        className="section community-section"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        <h2>Community</h2>
        <p>
          Join a thriving peer-learning community. Engage in discussions, join study groups,
          and support others while sharpening your own skills.
        </p>
      </motion.section>

      {/* Footer */}
      <footer className="footer">
        <p>© {new Date().getFullYear()} PeerBridge · Connecting Students at USIU Africa</p>
      </footer>

      {/* Sign In Modal — just closes itself after redirect */}
      {showSignIn && <SignInForm onClose={() => setShowSignIn(false)} />}
    </div>
  );
}

// ---------------- APP COMPONENT ----------------
export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />

        {/* After signing up → choose role */}
        <Route path="/dashboard" element={<LoggedIn />} />

        {/* Role registration */}
        <Route path="/tutor" element={<Tutor />} />
        <Route path="/tutee" element={<Tutee />} />

        {/* Dashboards */}
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/tutor-dashboard" element={<TutorDashboard />} />
        <Route path="/tutee-dashboard" element={<TuteeDashboard />} />
      </Routes>
    </Router>
  );
}
