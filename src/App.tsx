import "./App.css";
import SignInForm from "./SignInForm";
import SignUpForm from "./SignUpForm";
import LoggedIn from "./LoggedIn";
import Tutor from "./tutor";
import Tutee from "./tutee";
import TutorDashboard from "./TutorDashboard";
import TuteeDashboard from "./TuteeDashboard";
import AdminDashboard from "./admin";
import Matches from "./matches";

import { useState } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

function Home() {
  const [showSignIn, setShowSignIn] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const navigate = useNavigate();

  const previews: Record<string, string> = {
    Learn: "Access tutorials, study resources, and tips shared by top-performing peers.",
    "How it Works":
      "PeerBridge connects students needing academic help with volunteer tutors from their university.",
    Community:
      "Join study groups, mentorship programs, and peer-driven Q&A forums to grow together.",
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

        {/* Hover box preview */}
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              onMouseEnter={() => setHovered(hovered)}
              onMouseLeave={() => setHovered(null)}
              className="hover-box"
            >
              <h3>{hovered}</h3>
              <p>{previews[hovered]}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Auth Buttons */}
        <div className="auth-buttons">
          <button className="sign-in" onClick={() => setShowSignIn(true)}>
            Sign In
          </button>
          <button className="sign-up" onClick={() => setShowSignUp(true)}>
            Sign Up
          </button>
        </div>
      </header>

      {/* Body */}
      <main className="main-bg">
        <div className="main-content">
          <h1>Placement And Career Services.</h1>
          <p>
            Struggling in a Unit? Worry no more... <br />
            Get Help from Your Peers and raise your GPA
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
          Access tutorials, shared notes, and study materials from top-performing
          students at USIU.
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
          PeerBridge connects students who need academic help with tutors from
          their own university. Simply sign up, choose your role, and start
          learning or tutoring.
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
          Join a thriving peer-learning community. Engage in discussions, join
          study groups, and support others while sharpening your own skills.
        </p>
      </motion.section>

      <motion.section
        id="Tutor"
        className="section tutor-section"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        <h2>Become a Tutor</h2>
        <p>
          Share your expertise, build leadership skills, and earn recognition for
          helping others succeed in their academic journey.
        </p>
      </motion.section>

      <motion.section
        id="Tutee"
        className="section tutee-section"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        <h2>Become a Tutee</h2>
        <p>
          Get one-on-one guidance from experienced peers. Learn faster, improve
          your grades, and build confidence in your coursework.
        </p>
      </motion.section>

      {/* Footer */}
      <footer className="footer">
        <p>
          © {new Date().getFullYear()} PeerBridge · Connecting Students at USIU Africa
        </p>
      </footer>

      {/* Modals */}
      {showSignIn && <SignInForm onClose={() => setShowSignIn(false)} />}
      {showSignUp && <SignUpForm onClose={() => setShowSignUp(false)} />}
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<LoggedIn />} />
        <Route path="/tutor" element={<Tutor />} />
        <Route path="/tutee" element={<Tutee />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/tutor-dashboard" element={<TutorDashboard />} />
        <Route path="/tutee-dashboard" element={<TuteeDashboard />} />
        <Route path="/matches" element={<Matches />} />
      </Routes>
    </Router>
  );
}
