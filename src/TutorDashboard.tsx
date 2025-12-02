import { useNavigate } from "react-router-dom";
import "./TutorDashboard.css";

const TutorDashboard = () => {
  const navigate = useNavigate();

  // Explicitly define the type for path
  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div className="tutor-dashboard">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <h2 className="logo">Tutor Panel</h2>
        <nav className="nav-links">
          <a onClick={() => handleNavigation("/tutor")} className="nav-item">
            Register
          </a>
          <a onClick={() => handleNavigation("/courses")} className="nav-item">
            Add Course
          </a>
          <a onClick={() => handleNavigation("/sessions")} className="nav-item">
            My Sessions
          </a>
          <a onClick={() => handleNavigation("/performance")} className="nav-item">
            Performance Reports
          </a>
          <a onClick={() => handleNavigation("/matches")} className="nav-item">
            View Matches
          </a>
          <a onClick={() => handleNavigation("/profile")} className="nav-item">
            Profile
          </a>
        </nav>

        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <header className="dashboard-header">
          <h1 style={{ color: 'white' }}>Welcome, Tutor</h1>
          <p>
            Manage your tutoring sessions, monitor student requests, and track your
            performance — all in one place.
          </p>
        </header>

        <section className="dashboard-summary">
          <div className="summary-card">
            <h3>Total Students</h3>
            <p>15</p>
          </div>
          <div className="summary-card">
            <h3>Active Sessions</h3>
            <p>4</p>
          </div>
          <div className="summary-card">
            <h3>Pending Requests</h3>
            <p>2</p>
          </div>
        </section>
      </main>
    </div>
  );
};

export default TutorDashboard;
