import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./TuteePages.css";

interface Match {
  id: number;
  tutor_id: number;
  created_at: string;
  courses: { code: string; name: string }[];
  tutor_name?: string;
}

const TuteeSessions = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const token = localStorage.getItem("token");

    if (!user.id) {
      navigate("/");
      return;
    }

    const fetchMatches = async () => {
      try {
        const res = await fetch(`/api/matches/tutee/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        // Enrich with tutor names
        const withNames = await Promise.all(
          data.map(async (match: Match) => {
            const tutorRes = await fetch(`/api/users/${match.tutor_id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            const tutor = await tutorRes.json();
            return { ...match, tutor_name: tutor.name };
          })
        );
        setMatches(withNames);
      } catch (error) {
        console.error("Error fetching matches:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMatches();
  }, [navigate]);

  if (loading) return <div className="loading">Loading sessions...</div>;

  return (
    <div className="page-container">
      <h1>My Sessions</h1>
      {matches.length === 0 ? (
        <p>You have no active sessions.</p>
      ) : (
        <div className="sessions-grid">
          {matches.map((match) => (
            <div key={match.id} className="session-card">
              <h3>Tutor: {match.tutor_name || `ID ${match.tutor_id}`}</h3>
              <p>Started: {new Date(match.created_at).toLocaleDateString()}</p>
              <h4>Courses:</h4>
              <ul>
                {match.courses.map((c, idx) => (
                  <li key={idx}>{c.code} – {c.name}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TuteeSessions;