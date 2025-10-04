import "./LoggedIn.css"; // Reuse your main dashboard styles

export default function AdminDashboard() {
  return (
    <div className="dashboard-bg">
      <header className="dashboard-header">
        <div className="dashboard-logo">PeerBridge Admin</div>
        <button
          className="signout-btn"
          onClick={() => {
            localStorage.removeItem("user");
            window.location.href = "/";
          }}
        >
          Sign Out
        </button>
      </header>
      <div className="dashboard-content" style={{ maxWidth: 900 }}>
        <h1 style={{ color: "#002244" }}>Admin Dashboard</h1>
        <h2 style={{ color: "#FFD600" }}>Welcome, Admin!</h2>
        <div style={{ margin: "32px 0" }}>
          <ul style={{ listStyle: "none", padding: 0, fontSize: "1.1rem" }}>
            <li>
              <strong>User Management:</strong> View, approve, or remove tutors and tutees.
            </li>
            <li>
              <strong>Unit Management:</strong> Add, edit, or remove units and departments.
            </li>
            <li>
              <strong>Match Oversight:</strong> View and manage tutor-tutee matches.
            </li>
            <li>
              <strong>Reports & Analytics:</strong> See stats on users, units, and sessions.
            </li>
            <li>
              <strong>Feedback Moderation:</strong> Review and moderate feedback or complaints.
            </li>
            <li>
              <strong>Certification Management:</strong> Approve or revoke tutor certifications.
            </li>
          </ul>
        </div>
        <p style={{ color: "#888", fontSize: "0.95rem" }}>
          (Add navigation and management features here as your app grows!)
        </p>
      </div>
      <footer className="footer">
        <p>
          © {new Date().getFullYear()} PeerBridge · Admin Panel
        </p>
      </footer>
    </div>
  );
}