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
  const [showUserManagement, setShowUserManagement] = useState(false);

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

  if (loading) return <div className="admin-dashboard">Loading data...</div>;
  if (error) return <div className="admin-dashboard">Error: {error}</div>;

  return (
    <div className="admin-dashboard">
      {/* HEADER */}
      <header className="admin-header">
        <h1>Admin Dashboard</h1>
        <div className="admin-header-right">
          <span>{adminInfo.email}</span>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="admin-main">
        <h2>Welcome, {adminInfo.name}</h2>

        {/* DASHBOARD CARDS */}
        <div className="admin-grid">
          <div
            className="admin-card"
            onClick={() => setShowUserManagement(true)}
          >
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

        {/* USER MANAGEMENT SECTION */}
        {showUserManagement && (
          <div className="user-management-section">
            <h2>User Management Section</h2>
            <button
              className="return-btn"
              onClick={() => setShowUserManagement(false)}
            >
              Return to Dashboard
            </button>

            {summary && (
              <div className="admin-summary">
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

            {/* USERS TABLE */}
            <h3>Registered Users</h3>
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

            {/* TUTORS TABLE */}
            <h3>Registered Tutors</h3>
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
                {tutors.map((tutor) => (
                  <tr key={tutor.id}>
                    <td>{tutor.id}</td>
                    <td>{tutor.name}</td>
                    <td>{tutor.email}</td>
                    <td>{tutor.id_number}</td>
                    <td>{tutor.department}</td>
                    <td>{tutor.term}</td>
                    <td>{tutor.units}</td>
                    <td>{new Date(tutor.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* TUTEES TABLE */}
            <h3>Registered Tutees</h3>
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
                {tutees.map((tutee) => (
                  <tr key={tutee.id}>
                    <td>{tutee.id}</td>
                    <td>{tutee.name}</td>
                    <td>{tutee.email}</td>
                    <td>{tutee.id_number}</td>
                    <td>{tutee.department}</td>
                    <td>{tutee.term}</td>
                    <td>{tutee.unit}</td>
                    <td>{new Date(tutee.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="admin-footer">
        © {new Date().getFullYear()} USIU Africa | PACS Admin Panel
      </footer>
    </div>
  );
};

export default AdminDashboard;
