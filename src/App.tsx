import "./App.css";
import SignInForm from "./SignInForm";
import SignUpForm from "./SignUpForm";
import { useState } from "react";
export default function App() {
  const [showSignIn, setShowSignIn] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);

  return (
    
    <div className="app-container">

      {/* Header */}
      <header className="header">
        {/* Left: App Name */}
        <div className="logo">PeerBridge</div>

        {/* Middle: Navigation Links */}
        <nav className="main-nav">
          <a href="#Learn">Learn</a>
          <a href="#How it works">How it Works</a>
          <a href="#Communities">Communities</a>
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
         <p>Struggling in a Unit? Worry no more...<br></br> Get Help from Your Peers and raise your GPA</p>
       </div>
       <div className="main-image"></div>
      </main>

      {/* Footer */}
      <footer className="footer">
        <p >
          © {new Date().getFullYear()} PeerBridge · Connecting Students at USIU Africa
        </p >
      </footer>

      {/* Modals */}
      {showSignIn && <SignInForm onClose={() => setShowSignIn(false)} />}
      {showSignUp && <SignUpForm onClose={() => setShowSignUp(false)} />}
    </div>
  );
}
