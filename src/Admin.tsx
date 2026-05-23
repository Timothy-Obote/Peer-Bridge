import { useNavigate, NavLink, Outlet } from "react-router-dom";
import { useEffect } from "react";
import "./admin.css";

const AdminDashboard = () => {
  const navigate = useNavigate();

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
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>PACS Admin</h2>
          <p>System Administrator</p>
        </div>
        <nav className="sidebar-nav">
          <NavLink
            to="/admin-dashboard"
            end
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/admin-dashboard/users"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            User Management
          </NavLink>
          <NavLink
            to="/admin-dashboard/reports"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            Reports & Analytics
          </NavLink>
          <NavLink
            to="/admin-dashboard/settings"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            System Settings
          </NavLink>
        </nav>
        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn">
            Logout
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