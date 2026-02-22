import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./TuteeDashboard.css";

interface SummaryData {
  totalTutors: number;
  activeSessions: number;
  pendingRequests: number;
}

const TuteeDashboard = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<SummaryData>({
    totalTutors: 0,
    activeSessions: 0,
    pendingRequests: 0,
  });
  const [loading, setLoading] = useState(true);
  const [tuteeName, setTuteeName] = useState("Tutee");

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      navigate("/");
      return;
    }
    const user = JSON.parse(userStr);
    setTuteeName(user.full_name || "Tutee");

    const fetchSummary = async () => {
      try {
        const token = localStorage.getItem("token");
        // Fetch matches for this tutee
        const matchesRes = await fetch(`${import.meta.env.VITE_API_URL}/api/matches/tutee/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const matches = await matchesRes.json();
        const totalTutors = matches.length; // each match is a tutor

        // Fetch pending suggestions for this tutee
        const suggestionsRes = await fetch(`${import.meta.env.VITE_API_URL}/api/suggestions/tutee/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const suggestions = await suggestionsRes.json();
        const pendingRequests = suggestions.length;

        setSummary({
          totalTutors,
          activeSessions: matches.length, // same as totalTutors for now
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
    <div className="dashboard-container">
      <aside className="sidebar">
        <h2 className="sidebar-title" style={{ color: '#facc15' }}>Tutee Panel</h2>
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
        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </aside>

      <main className="main-content">
        <header className="main-header">
          <h1>Welcome, {tuteeName}</h1>
          <p>Find tutors, track your learning, and manage your sessions.</p>
        </header>

        {loading ? (
          <div className="loading-spinner">Loading...</div>
        ) : (
          <section className="dashboard-cards">
            <div className="card">
              <h3>Total Tutors</h3>
              <p>{summary.totalTutors}</p>
            </div>
            <div className="card">
              <h3>Active Sessions</h3>
              <p>{summary.activeSessions}</p>
            </div>
            <div className="card">
              <h3>Pending Requests</h3>
              <p>{summary.pendingRequests}</p>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default TuteeDashboard;