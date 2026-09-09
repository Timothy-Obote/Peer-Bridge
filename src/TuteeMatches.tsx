import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./matches.css";

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

  const goToChat = (matchId: number) => {
    navigate(`/chat/${matchId}`);
  };

  if (loading) return <div className="loading">Loading your matches...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="tutee-matches">
      <header className="matches-page-header">
        <p className="matches-eyebrow">Tutee opportunities</p>
        <h1>View Matches</h1>
        <p>Your confirmed tutor connections in one focused view.</p>
      </header>

      <section className="matches-summary-grid" aria-label="Match summary">
        <div><span>Total Matches</span><strong>{matches.length}</strong></div>
        <div><span>New Matches</span><strong>{matches.length}</strong></div>
        <div><span>Active Connections</span><strong>{matches.length}</strong></div>
      </section>

      <section className="matches-section">
        <div className="matches-section-heading"><h2>Matched Tutors</h2><span>{matches.length} available</span></div>
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
                <div className="match-actions">
                  <button
                    className="chat-button"
                    onClick={() => goToChat(match.id)}
                  >
                    Message Tutor
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <footer className="matches-footer"><a href="#help">Help Center</a><span>·</span><a href="#support">Contact Support</a><span>·</span><a href="#study-tips">Study Tips</a></footer>
    </div>
  );
};

export default TuteeMatches;

