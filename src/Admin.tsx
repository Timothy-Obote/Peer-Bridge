import React from "react";
import { useNavigate } from "react-router-dom";
import "./admin.css"; 

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();

  const adminInfo = {
    name: "System Administrator",
    email: "admin@usiu.ac.ke",
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <h1>Admin Dashboard</h1>
        <div className="admin-header-right">
          <span>{adminInfo.email}</span>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </header>

      <main className="admin-main">
        <h2>Welcome, {adminInfo.name}</h2>

        <div className="admin-grid">
          <div className="admin-card">
            <h3>User Management</h3>
            <p>View, approve, or remove registered users.</p>
          </div>

          <div className="admin-card">
            <h3>Reports & Analytics</h3>
            <p>Monitor activity and generate performance reports.</p>
          </div>

          <div className="admin-card">
            <h3>System Settings</h3>
            <p>Configure platform preferences and update admin data.</p>
          </div>
        </div>
      </main>

      <footer className="admin-footer">
        © {new Date().getFullYear()} USIU Africa | PACS Admin Panel
      </footer>
    </div>
  );
};

export default AdminDashboard;
