import "./App.css";
import SignInForm from "./SignInForm";
import SignUpForm from "./SignUpForm";
import LoggedIn from "./LoggedIn";
import { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

function Home() {
  const [showSignIn, setShowSignIn] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header">
        <div className="logo">PeerBridge</div>
        <nav className="main-nav">
          <a href="#Learn">Learn</a>
          <a href="#How it works">How it Works</a>
          <a href="#Community">Community</a>
        </nav>
        <div className="auth-buttons">
          <button className="sign-in" onClick={() => setShowSignIn(true)}>Sign In</button>
          <button className="sign-up" onClick={() => setShowSignUp(true)}>Sign Up</button>
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
      </Routes>
    </Router>
  );
}
