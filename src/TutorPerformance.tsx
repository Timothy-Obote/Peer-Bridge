import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface Stats {
  totalMatches: number;
  pendingSuggestions: number;
  uniqueStudents: number;
}

const TutorPerformance = () => {
  const [stats, setStats] = useState<Stats>({ totalMatches: 0, pendingSuggestions: 0, uniqueStudents: 0 });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const token = localStorage.getItem("token");

    if (!user.id) {
      navigate("/");
      return;
    }

    const fetchStats = async () => {
      try {
        // matches
        const matchesRes = await fetch(`${import.meta.env.VITE_API_URL}/api/matches/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const matches = await matchesRes.json();
        const totalMatches = matches.length;

        // unique students (distinct tutee_ids)
        const uniqueStudents = new Set(matches.map((m: any) => m.tutee_id)).size;

        // pending suggestions
        const suggestionsRes = await fetch(`${import.meta.env.VITE_API_URL}/api/suggestions/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const suggestions = await suggestionsRes.json();
        const pendingSuggestions = suggestions.length;

        setStats({ totalMatches, pendingSuggestions, uniqueStudents });
      } catch (error) {
        console.error("Error fetching performance stats:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [navigate]);

  if (loading) return <div className="loading">Loading performance data...</div>;

  return (
    <div className="page-container">
      <h1>Performance Reports</h1>
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Sessions</h3>
          <p>{stats.totalMatches}</p>
        </div>
        <div className="stat-card">
          <h3>Unique Students</h3>
          <p>{stats.uniqueStudents}</p>
        </div>
        <div className="stat-card">
          <h3>Pending Suggestions</h3>
          <p>{stats.pendingSuggestions}</p>
        </div>
      </div>
    </div>
  );
};

export default TutorPerformance;