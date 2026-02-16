import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { io } from "socket.io-client";
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
  let userId = null;
  let userRole = "";

  if (location.state?.user) {
    const user = location.state.user;
    if (typeof user === "string") {
      userEmail = user;
    } else if (typeof user === "object") {
      userEmail = user.email || "User";
      userId = user.id || null;
      userRole = user.role || "";
    }
  }

  const userName = capitalizeFirst(userEmail.split("@")[0]);

  // Socket.io connection setup
  useEffect(() => {
    if (!userEmail) return;

    const socket = io("http://localhost:5001");

    socket.on("connect", () => {
      console.log("Connected to socket server");
      socket.emit("registerUser", userEmail);
    });

    socket.on("matchFound", (data) => {
      console.log("Match found:", data.match);
      alert(` Match found!\n\n${data.match.name} (${data.match.role}) for unit: ${data.match.unit}`);
    });

    return () => {
      socket.disconnect();
    };
  }, [userEmail]);

  const handleSignOut = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  // Navigation handlers with fallback
  const goToTutor = () => {
    console.log("Attempting to navigate to /tutor");
    try {
      navigate("/tutor");
    } catch (err) {
      console.warn("navigate failed, using fallback", err);
      window.location.href = "/tutor";
    }
  };

  const goToTutee = () => {
    console.log("Attempting to navigate to /tutee");
    try {
      navigate("/tutee");
    } catch (err) {
      console.warn("navigate failed, using fallback", err);
      window.location.href = "/tutee";
    }
  };

  return (
    <div className="dashboard-bg">
      <header className="dashboard-header">
        <div className="dashboard-logo">PeerBridge</div>

        <div className="header-buttons">
          <button className="signout-btn" onClick={handleSignOut}>
            Back
          </button>
        </div>
      </header>

      <div className="dashboard-content">
        <h1>
          Welcome <span className="username">{userName}</span>
        </h1>
        <h2>Choose your role</h2>

        <div className="role-selection">
          <div className="role-card tutor" onClick={goToTutor}>
            <h3>Tutor</h3>
          </div>
          <div className="role-card tutee" onClick={goToTutee}>
            <h3>Tutee</h3>
          </div>
        </div>
      </div>

      <footer className="footer">
        <p>© {new Date().getFullYear()} PeerBridge · Connecting Students at USIU Africa</p>
      </footer>
    </div>
  );
}