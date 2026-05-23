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
    const user = location.state.user;
    if (typeof user === "string") {
      userEmail = user;
    } else if (typeof user === "object" && user !== null) {
      userEmail = user.email || "User";
    }
  }

  const userName = capitalizeFirst(userEmail.split("@")[0]);

  const handleSignOut = () => {
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