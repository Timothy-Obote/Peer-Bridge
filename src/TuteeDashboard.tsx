import { useNavigate } from "react-router-dom";
import "./tuteeDashboard.css";

const TuteeDashboard = () => {
  const navigate = useNavigate();

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>Tutee Panel</h2>
        </div>
        <nav className="sidebar-nav">
          <a onClick={() => handleNavigation("/tutee")} className="nav-link">
            Register
          </a>
          <a onClick={() => handleNavigation("/sessions")} className="nav-link">
            My Sessions
          </a>
          <a onClick={() => handleNavigation("/feedback")} className="nav-link">
            Feedback
          </a>
          <a onClick={() => handleNavigation("/matches")} className="nav-link">
            View Matches
          </a>
          <a onClick={() => handleNavigation("/profile")} className="nav-link">
            Profile
          </a>
        </nav>
        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </aside>

      {/* Main content */}
      <main className="main-content">
        <header className="main-header">
          <h1>Welcome, Tutee</h1>
          <p>Manage your sessions, feedback, and matches all in one place.</p>
        </header>

        <section className="dashboard-cards">
          <div className="card">
            <h3>Total Tutors</h3>
            <p>8</p>
          </div>
          <div className="card">
            <h3>Active Sessions</h3>
            <p>3</p>
          </div>
          <div className="card">
            <h3>Pending Requests</h3>
            <p>2</p>
          </div>
        </section>
      </main>
    </div>
  );
};

export default TuteeDashboard;
