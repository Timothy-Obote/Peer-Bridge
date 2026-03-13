import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

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
}

const TuteeMatches = () => {
  const navigate = useNavigate();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const userStr = localStorage.getItem("user");
  const token = localStorage.getItem("token");

  // Fetch data function – can be reused if needed
  const fetchMatches = useCallback(async () => {
    if (!userStr || !token) {
      navigate("/");
      return;
    }

    try {
      const user = JSON.parse(userStr);

      const matchesRes = await fetch(
        `${import.meta.env.VITE_API_URL}/api/matches/tutee/${user.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!matchesRes.ok) throw new Error("Failed to fetch matches");
      const matchesData = await matchesRes.json();
      setMatches(matchesData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [navigate, userStr, token]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  if (loading) return <div className="loading">Loading your matches...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="tutee-matches">
      <h2>Your Tutors</h2>

      <section className="matches-section">
        <h3>Confirmed Tutors ({matches.length})</h3>
        {matches.length === 0 ? (
          <p>You don't have any confirmed tutors yet.</p>
        ) : (
          <div className="matches-list">
            {matches.map((match) => (
              <div key={match.id} className="match-card">
                <div className="match-header">
                  <span className="match-with">Tutor #{match.tutor_id}</span>
                  <span className="match-date">Since {formatDate(match.created_at)}</span>
                </div>
                <div className="match-courses">
                  <strong>Courses:</strong>
                  <ul>
                    {match.courses.map((c, i) => (
                      <li key={i}>
                        {c.code} – {c.name}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default TuteeMatches;