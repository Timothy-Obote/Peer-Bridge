import "./App.css";

export default function App() {
  return (
    <div className="app-container">

      {/* Header */}
      <header className="header">
        {/* Left: App Name */}
        <div className="logo">PeerBridge</div>

        {/* Middle: USIU Africa Logo */}
        <div className="school-logo">
          <img src="/usiu-logo.png" alt="USIU Africa Logo" />
        </div>

        {/* Right: Auth buttons */}
        <div className="auth-buttons">
          <button className="sign-in">Sign In</button>
          <button className="sign-up">Sign Up</button>
        </div>
      </header>

      {/* Body */}
      <main>
        <div style={{textAlign: "center"}}>Main content goes here</div>
      </main>

      {/* Footer */}
      <footer className="footer">
        <p>
          © {new Date().getFullYear()} PeerBridge · Connecting Students at USIU Africa
        </p>
      </footer>
    </div>
  );
}
