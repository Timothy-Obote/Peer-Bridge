import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import "./LoggedIn.css";

function capitalizeFirst(str: string) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export default function LoggedIn() {
  const location = useLocation();
  const navigate = useNavigate();
  const [socket, setSocket] = useState<Socket | null>(null);

  // Get backend URL from environment variable or use default
  // For Vite: import.meta.env.VITE_API_URL
  // For Create React App: process.env.REACT_APP_API_URL
  const API_URL = import.meta.env.VITE_API_URL || "https://peerbridgepacs.vercel.app";
  
  // For Socket.io, use the same base URL
  const SOCKET_URL = API_URL; // Assuming same server for socket

  // Safely extract email string from state
  let userEmail = "User";

  if (location.state?.user) {
    const user = location.state.user;
    if (typeof user === "string") {
      userEmail = user;
    } else if (typeof user === "object" && user !== null) {
      userEmail = user.email || "User";
    }
  }

  const userName = capitalizeFirst(userEmail.split("@")[0]);

  // Socket.io connection setup
  useEffect(() => {
    if (!userEmail) return;

    console.log(`Connecting to socket server at: ${import.meta.env.VITE_API_URL}`);
    
    // Create socket connection to deployed backend
    const newSocket = io(import.meta.env.VITE_API_URL, {
    withCredentials: true,
    path: '/socket.io', // Explicitly set the path
    transports: ['polling', 'websocket'],
    reconnectionAttempts: 5
});

    newSocket.on("connect", () => {
      console.log("Connected to socket server");
      newSocket.emit("registerUser", userEmail);
    });

    newSocket.on("connect_error", (error) => {
      console.error(" Socket connection error:", error);
    });

    newSocket.on("matchFound", (data) => {
      console.log("Match found:", data.match);
      alert(`Match found!\n\n${data.match.name} (${data.match.role}) for unit: ${data.match.unit}`);
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      console.log("Disconnecting socket...");
      newSocket.disconnect();
    };
  }, [userEmail, SOCKET_URL]);

  const handleSignOut = () => {
    // Disconnect socket before signing out
    if (socket) {
      socket.disconnect();
    }
    localStorage.removeItem("user");
    localStorage.removeItem("token"); // Clear token if you're using JWT
    navigate("/");
  };

  // Navigation handlers with fallback
  const goToTutor = () => {
    console.log("Attempting to navigate to /tutor");
    try {
      navigate("/tutor", { 
        state: { 
          userEmail,
          fromLoggedIn: true 
        } 
      });
    } catch (err) {
      console.warn("navigate failed, using fallback", err);
      window.location.href = "/tutor";
    }
  };

  const goToTutee = () => {
    console.log("Attempting to navigate to /tutee");
    try {
      navigate("/tutee", { 
        state: { 
          userEmail,
          fromLoggedIn: true 
        } 
      });
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
            <p>Help other students learn</p>
          </div>
          <div className="role-card tutee" onClick={goToTutee}>
            <h3>Tutee</h3>
            <p>Get help with your courses</p>
          </div>
        </div>
      </div>

      <footer className="footer">
        <p>© {new Date().getFullYear()} PeerBridge · Connecting Students at USIU Africa</p>
      </footer>
    </div>
  );
}