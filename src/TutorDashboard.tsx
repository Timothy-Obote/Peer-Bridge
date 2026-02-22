import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./TutorDashboard.css";

interface SummaryData {
  totalStudents: number;
  activeSessions: number;
  pendingRequests: number;
}

const TutorDashboard = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<SummaryData>({
    totalStudents: 0,
    activeSessions: 0,
    pendingRequests: 0,
  });
  const [loading, setLoading] = useState(true);
  const [tutorName, setTutorName] = useState("Tutor");

  useEffect(() => {
    // Get user from localStorage
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      navigate("/");
      return;
    }
    const user = JSON.parse(userStr);
    setTutorName(user.full_name || "Tutor");

    const fetchSummary = async () => {
      try {
        const token = localStorage.getItem("token");
        // Fetch matches for this tutor
        const matchesRes = await fetch(`/api/matches/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const matches = await matchesRes.json();
        const totalStudents = matches.length;

        // Fetch pending suggestions for this tutor
        const suggestionsRes = await fetch(`/api/suggestions/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const suggestions = await suggestionsRes.json();
        const pendingRequests = suggestions.length;

        setSummary({
          totalStudents,
          activeSessions: matches.length, // you can refine this later
          pendingRequests,
        });
      } catch (error) {
        console.error("Error fetching summary:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [navigate]);

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div className="tutor-dashboard">
      <aside className="sidebar">
        <h2 className="logo">Tutor Panel</h2>
        <nav className="nav-links">
          <a onClick={() => handleNavigation("/tutor")} className="nav-item">
            Dashboard
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
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </aside>

      <main className="main-content">
        <header className="dashboard-header">
          <h1 style={{ color: 'white' }}>Welcome, {tutorName}</h1>
          <p>
            Manage your tutoring sessions, monitor student requests, and track your
            performance — all in one place.
          </p>
        </header>

        {loading ? (
          <div className="loading-spinner">Loading...</div>
        ) : (
          <section className="dashboard-summary">
            <div className="summary-card">
              <h3>Total Students</h3>
              <p>{summary.totalStudents}</p>
            </div>
            <div className="summary-card">
              <h3>Active Sessions</h3>
              <p>{summary.activeSessions}</p>
            </div>
            <div className="summary-card">
              <h3>Pending Requests</h3>
              <p>{summary.pendingRequests}</p>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default TutorDashboard;