import { useNavigate } from "react-router-dom";
import "./tuteeDashboard.css";

const TuteeDashboard = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div className="tutee-dashboard">
      <header className="tutee-header">
        <h1>Tutee Dashboard</h1>
        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </header>

      <main className="tutee-content">
        <h2>Welcome Tutee!</h2>
        <p>Here you can find tutors, track your learning progress, and manage your sessions.</p>

        <div className="tutee-actions">
          <button className="action-btn">Find Tutor</button>
          <button className="action-btn">My Sessions</button>
          <button className="action-btn">Feedback</button>
        </div>
      </main>
    </div>
  );
};

export default TuteeDashboard;
