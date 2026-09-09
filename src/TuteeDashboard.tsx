import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./TuteeDashboard.css";

const TuteeDashboard = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tuteeName, setTuteeName] = useState("Tutee");

  const today = new Date();
  const dateString = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      navigate("/");
      return;
    }
    const user = JSON.parse(userStr);
    setTuteeName(user.name || "Tutee");
  }, [navigate]);

  const handleNavigation = (path: string) => {
    setSidebarOpen(false);
    navigate(path);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div className="dashboard-container">
      <button
        type="button"
        className="sidebar-toggle"
        aria-label={sidebarOpen ? "Close menu" : "Open menu"}
        aria-expanded={sidebarOpen}
        onClick={() => setSidebarOpen((v) => !v)}
      >
        <span className="hamburger-line" />
        <span className="hamburger-line" />
        <span className="hamburger-line" />
      </button>

      {sidebarOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`sidebar${sidebarOpen ? " open" : ""}`}>
        <div className="sidebar-brand">
          <h2>PeerBridge</h2>
        </div>

        <div className="sidebar-divider" />

        <div className="sidebar-section-label">TUTEE PANEL</div>

        <nav className="sidebar-nav">
          <a onClick={() => handleNavigation("/tutee")} className="nav-link">
            Register
          </a>
          <a onClick={() => handleNavigation("/tutee/sessions")} className="nav-link">
            My Sessions
          </a>
          <a onClick={() => handleNavigation("/tutee/feedback")} className="nav-link">
            Feedback
          </a>
          <a onClick={() => handleNavigation("/tutee/matches")} className="nav-link">
            View Matches
          </a>
          <a onClick={() => handleNavigation("/tutee/profile")} className="nav-link">
            Profile
          </a>
        </nav>

        <div className="sidebar-divider" />

        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </aside>

      <main className="main-content">
        <header className="main-header greeting-header">
          <div className="greeting-text">
            <h1>
              Hey {tuteeName} <span aria-hidden="true" className="wave-icon">👋</span>
            </h1>
            <p className="greeting-sub">good to see you.</p>
          </div>
          <div className="greeting-meta">
            <span className="greeting-date">{dateString}</span>
            <span className="greeting-status">Your learning hub is all set up.</span>
          </div>
        </header>

        <section className="dashboard-cards stat-cards">
          <div className="card stat-card">
            <h3>Tutors</h3>
            <p className="stat-text">Searching for your match</p>
          </div>
          <div className="card stat-card">
            <h3>Sessions</h3>
            <p className="stat-text">None Scheduled</p>
          </div>
          <div className="card stat-card">
            <h3>Pending</h3>
            <p className="stat-text">Empty Inbox</p>
          </div>
        </section>

        <section className="nudge-card">
          <h3>Next step: Tell us what you want to learn.</h3>
          <p>
            Tutors across the university are available right now, but they can&apos;t match with you just yet.
          </p>
          <div className="nudge-actions">
            <button
              type="button"
              className="nudge-primary-btn"
              onClick={() => handleNavigation("/tutee/profile")}
            >
              Set Preferences <span className="arrow-icon" aria-hidden="true">&rarr;</span>
            </button>
            <button
              type="button"
              className="nudge-secondary-btn"
              onClick={() => {}}
            >
              <span aria-hidden="true" className="bell-icon">🔔</span> Remind me later
            </button>
          </div>
        </section>

        <footer className="utility-footer">
          <a className="utility-link" onClick={() => handleNavigation("/help")}>
            <span aria-hidden="true" className="footer-icon">❓</span> Help Center
          </a>
          <a className="utility-link" onClick={() => handleNavigation("/support")}>
            <span aria-hidden="true" className="footer-icon">💬</span> Contact Support
          </a>
          <a className="utility-link" onClick={() => handleNavigation("/study-tips")}>
            <span aria-hidden="true" className="footer-icon">📚</span> Study Tips
          </a>
        </footer>
      </main>
    </div>
  );
};

export default TuteeDashboard;
