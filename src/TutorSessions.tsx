import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./TutorPages.css"; // shared styles

interface MatchCourse {
  code: string;
  name: string;
}

interface Match {
  id: number;
  tutor_id: number;
  tutee_id: number;
  created_at: string;
  courses: MatchCourse[];
  tutee_name?: string; // we'll fetch separately
}

const TutorSessions = () => {
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
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/matches/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        // For each match, fetch tutee name
        const withNames = await Promise.all(
          data.map(async (match: Match) => {
            const tuteeRes = await fetch(`${import.meta.env.VITE_API_URL}/api/users/${match.tutee_id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            const tutee = await tuteeRes.json();
            return { ...match, tutee_name: tutee.name };
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
              <h3>Student: {match.tutee_name || `ID ${match.tutee_id}`}</h3>
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

export default TutorSessions;