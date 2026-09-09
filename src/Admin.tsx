import { useNavigate, NavLink, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import "./admin.css";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      navigate("/");
      return;
    }
    try {
      const user = JSON.parse(userStr);
      if (user.role !== "admin") {
        if (user.role === "tutor") navigate("/tutor-dashboard");
        else if (user.role === "tutee") navigate("/tutee-dashboard");
        else navigate("/");
      }
    } catch {
      navigate("/");
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div className="admin-container">
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
          <div className="brand-icon" aria-hidden="true">⚙️</div>
          <div className="brand-text">
            <h2>PACS Admin</h2>
            <p>System Administrator</p>
          </div>
        </div>

        <nav
          className="sidebar-nav"
          onClick={() => setSidebarOpen(false)}
        >
          <NavLink
            to="/admin-dashboard"
            end
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            <span className="nav-icon" aria-hidden="true">🏠</span>
            <span>Dashboard</span>
          </NavLink>
          <NavLink
            to="/admin-dashboard/users"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            <span className="nav-icon" aria-hidden="true">👥</span>
            <span>User Management</span>
          </NavLink>
          <NavLink
            to="/admin-dashboard/reports"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            <span className="nav-icon" aria-hidden="true">📊</span>
            <span>Reports &amp; Analytics</span>
          </NavLink>
          <NavLink
            to="/admin-dashboard/settings"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            <span className="nav-icon" aria-hidden="true">⚙️</span>
            <span>System Settings</span>
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn">
            <span aria-hidden="true">🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminDashboard;