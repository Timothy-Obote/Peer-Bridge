import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./TutorDashboard.css";

const TutorDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tutorName, setTutorName] = useState("Tutor");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      navigate("/");
      return;
    }
    const user = JSON.parse(userStr);
    setTutorName(user.name || "Tutor");
    setLoading(false);
  }, [navigate]);

  const handleNavigation = (path: string) => {
    setSidebarOpen(false);
    navigate(path);
  };

  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div className="tutor-dashboard">
      <button
        type="button"
        className="hamburger"
        onClick={() => setSidebarOpen((prev) => !prev)}
        aria-label={sidebarOpen ? "Close menu" : "Open menu"}
        aria-expanded={sidebarOpen}
      >
        <span className="hamburger-line" />
        <span className="hamburger-line" />
        <span className="hamburger-line" />
      </button>

      {sidebarOpen && (
        <div
          className="sidebar-backdrop sidebar-backdrop--visible"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`sidebar ${sidebarOpen ? "sidebar--open" : ""}`}>
        <div className="sidebar-top">
          <h2 className="logo">PeerBridge</h2>
        </div>

        <div className="sidebar-middle">
          <p className="sidebar-heading">Tutor Panel</p>
          <nav className="nav-links">
            <a onClick={() => handleNavigation("/tutor")} className="nav-item">
              Register
            </a>
            <a onClick={() => handleNavigation("/tutor/sessions")} className="nav-item">
              My Sessions
            </a>
            <a onClick={() => handleNavigation("/tutor/performance")} className="nav-item">
              Performance Reports
            </a>
            <a onClick={() => handleNavigation("/tutor/matches")} className="nav-item">
              View Matches
            </a>
            <a onClick={() => handleNavigation("/tutor/profile")} className="nav-item">
              Profile
            </a>
          </nav>
        </div>

        <div className="sidebar-bottom">
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </aside>

      <main className="main-content">
        <section className="greeting-section">
          <h1 className="greeting-title">Hey {tutorName} 👋, good to see you.</h1>
          <p className="greeting-date">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric'
            })}
          </p>
          <p className="greeting-status">Your hub is all set up.</p>
        </section>

        {loading ? (
          <div className="loading-spinner">Loading...</div>
        ) : (
          <section className="stats-section">
            <div className="stat-card">
              <h3>Students</h3>
              <p className="stat-text">Waiting for your first student</p>
            </div>
            <div className="stat-card">
              <h3>Sessions</h3>
              <p className="stat-text">None Scheduled</p>
            </div>
            <div className="stat-card">
              <h3>Pending</h3>
              <p className="stat-text">Empty Inbox</p>
            </div>
          </section>
        )}

        <section className="nudge-card">
          <h2 className="nudge-title">✍️ Next step: Complete your registration.</h2>
          <p className="nudge-description">
            Students are browsing the platform right now, but they can't find you just yet.
          </p>
          <div className="nudge-actions">
            <button className="nudge-primary" onClick={() => handleNavigation("/tutor")}>
              Go to Register →
            </button>
            <button className="nudge-secondary" onClick={() => {}}>
              🔔 Remind me later
            </button>
          </div>
        </section>

        <footer className="utility-footer">
          <a href="#" className="utility-link">📖 Help Center</a>
          <a href="#" className="utility-link">✉️ Contact Support</a>
          <a href="#" className="utility-link">💡 Send Feedback</a>
        </footer>
      </main>
    </div>
  );
};

export default TutorDashboard;
