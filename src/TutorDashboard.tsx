import { useNavigate } from "react-router-dom";
import "./TutorDashboard.css";

const TutorDashboard = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div className="tutor-dashboard">
      <header className="tutor-header">
        <h1>Tutor Dashboard</h1>
        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </header>

      <main className="tutor-content">
        <h2>Welcome Tutor!</h2>
        <p>Here you can manage your tutoring sessions, view student requests, and track your progress.</p>

        <div className="tutor-actions">
          <button className="action-btn">View Tutees</button>
          <button className="action-btn">Add Course</button>
          <button className="action-btn">Performance Reports</button>
        </div>
      </main>
    </div>
  );
};

export default TutorDashboard;
