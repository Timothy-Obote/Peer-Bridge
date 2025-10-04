import { useLocation, useNavigate } from "react-router-dom";
import "./LoggedIn.css";

function capitalizeFirst(str: string) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export default function LoggedIn() {
  const location = useLocation();
  const navigate = useNavigate();

  // Safely extract email string from state
  let userEmail = "User";
  if (location.state?.user) {
    if (typeof location.state.user === "string") {
      userEmail = location.state.user;
    } else if (typeof location.state.user === "object" && location.state.user.email) {
      userEmail = location.state.user.email;
    }
  }
  const userName = capitalizeFirst(userEmail.split("@")[0]);

  const handleSignOut = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div className="dashboard-bg">
      <header className="dashboard-header">
        <div className="dashboard-logo">PeerBridge</div>
        <button className="signout-btn" onClick={handleSignOut}>Sign Out</button>
      </header>
      <div className="dashboard-content">
        <h1>Welcome <span className="username">{userName}</span></h1>
        <h2>Choose your role</h2>
        <div className="role-selection">
          <div
            className="role-card tutor"
            onClick={() => navigate("/tutor")}
          >
            <h3>Tutor</h3>
          </div>
          <div
            className="role-card tutee"
            onClick={() => navigate("/tutee")}
          >
            <h3>Tutee</h3>
          </div>
          <div
            className="role-card admin"
            onClick={() => navigate("/admin")}
          >
            <h3>Admin</h3>
          </div>
        </div>
      </div>
      <footer className="footer">
        <p>
          © {new Date().getFullYear()} PeerBridge · Connecting Students at USIU Africa
        </p>
      </footer>
    </div>
  );
}