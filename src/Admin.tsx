import { useNavigate, NavLink, Outlet } from "react-router-dom";
import "./admin.css";

const AdminDashboard = () => {
  const navigate = useNavigate();

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