import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./admin.css";

interface User {
  id: number;
  full_name: string;
  email: string;
  role: string;
  created_at: string;
}

interface Tutor {
  id: number;
  name: string;
  email: string;
  id_number: string;
  department: string;
  term: string;
  units: string;
  created_at: string;
}

interface Tutee {
  id: number;
  name: string;
  email: string;
  id_number: string;
  department: string;
  term: string;
  unit: string;
  created_at: string;
}

interface Summary {
  total_users: number;
  tutors: number;
  tutees: number;
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [tutees, setTutees] = useState<Tutee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState("dashboard");

  const adminInfo = {
    name: "System Administrator",
    email: "admin@usiu.ac.ke",
  };

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const res = await fetch("http://localhost:5000/admin/overview");
        if (!res.ok) throw new Error("Failed to fetch overview data");
        const data = await res.json();
        setSummary(data.summary);
        setUsers(data.users);
        setTutors(data.tutors || []);
        setTutees(data.tutees || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchOverview();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  if (loading) return <div className="loading-screen">Loading data...</div>;
  if (error) return <div className="error-message">Error: {error}</div>;

  return (
    <div className="admin-container">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>PACS Admin</h2>
          <p>{adminInfo.name}</p>
        </div>
        <nav className="sidebar-nav">
          <button
            className={activeSection === "dashboard" ? "active" : ""}
            onClick={() => setActiveSection("dashboard")}
          >
            Dashboard
          </button>
          <button
            className={activeSection === "users" ? "active" : ""}
            onClick={() => setActiveSection("users")}
          >
            User Management
          </button>
          <button
            className={activeSection === "reports" ? "active" : ""}
            onClick={() => setActiveSection("reports")}
          >
            Reports & Analytics
          </button>
          <button
            className={activeSection === "settings" ? "active" : ""}
            onClick={() => setActiveSection("settings")}
          >
            System Settings
          </button>
        </nav>
        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="main-content">
        {activeSection === "dashboard" && (
          <section>
            <h1>Welcome, {adminInfo.name}</h1>
            <p className="subtitle">Overview of PACS Platform Activity</p>

            {summary && (
              <div className="summary-cards">
                <div className="summary-card">
                  <h3>Total Users</h3>
                  <p>{summary.total_users}</p>
                </div>
                <div className="summary-card">
                  <h3>Total Tutors</h3>
                  <p>{summary.tutors}</p>
                </div>
                <div className="summary-card">
                  <h3>Total Tutees</h3>
                  <p>{summary.tutees}</p>
                </div>
              </div>
            )}
          </section>
        )}

        {activeSection === "users" && (
          <section className="user-section">
            <h2>User Management</h2>
            <p>Manage all registered users, tutors, and tutees below.</p>

            <h3>Registered Users</h3>
            <div className="table-container">
              <table className="user-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Full Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Created At</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>{user.id}</td>
                      <td>{user.full_name || "N/A"}</td>
                      <td>{user.email}</td>
                      <td>{user.role}</td>
                      <td>{new Date(user.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h3>Registered Tutors</h3>
            <div className="table-container">
              <table className="user-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>ID Number</th>
                    <th>Department</th>
                    <th>Term</th>
                    <th>Units</th>
                    <th>Created At</th>
                  </tr>
                </thead>
                <tbody>
                  {tutors.map((t) => (
                    <tr key={t.id}>
                      <td>{t.id}</td>
                      <td>{t.name}</td>
                      <td>{t.email}</td>
                      <td>{t.id_number}</td>
                      <td>{t.department}</td>
                      <td>{t.term}</td>
                      <td>{t.units}</td>
                      <td>{new Date(t.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h3>Registered Tutees</h3>
            <div className="table-container">
              <table className="user-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>ID Number</th>
                    <th>Department</th>
                    <th>Term</th>
                    <th>Unit</th>
                    <th>Created At</th>
                  </tr>
                </thead>
                <tbody>
                  {tutees.map((t) => (
                    <tr key={t.id}>
                      <td>{t.id}</td>
                      <td>{t.name}</td>
                      <td>{t.email}</td>
                      <td>{t.id_number}</td>
                      <td>{t.department}</td>
                      <td>{t.term}</td>
                      <td>{t.unit}</td>
                      <td>{new Date(t.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeSection === "reports" && (
          <section>
            <h2>Reports & Analytics</h2>
            <p>Coming soon...</p>
          </section>
        )}

        {activeSection === "settings" && (
          <section>
            <h2>System Settings</h2>
            <p>Configure platform preferences and admin details here.</p>
          </section>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
