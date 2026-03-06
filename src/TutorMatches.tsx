import { useEffect, useState } from "react";
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

interface Suggestion {
  id: number;
  tutee_id: number;
  course_id: number;
  code: string;
  name: string;
  status: string;
  created_at: string;
}

const TutorMatches = () => {
  const navigate = useNavigate();
  const [matches, setMatches] = useState<Match[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Get current user from localStorage
  const userStr = localStorage.getItem("user");
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!userStr || !token) {
      navigate("/");
      return;
    }

    const fetchData = async () => {
      try {
        const user = JSON.parse(userStr);

        // Fetch confirmed matches
        const matchesRes = await fetch(
          `${import.meta.env.VITE_API_URL}/api/matches/${user.id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!matchesRes.ok) throw new Error("Failed to fetch matches");
        const matchesData = await matchesRes.json();
        setMatches(matchesData);

        // Fetch pending suggestions
        const suggestionsRes = await fetch(
          `${import.meta.env.VITE_API_URL}/api/suggestions/${user.id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!suggestionsRes.ok) throw new Error("Failed to fetch suggestions");
        const suggestionsData = await suggestionsRes.json();
        setSuggestions(suggestionsData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate, userStr, token]);

  const handleAccept = async (suggestionId: number) => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/suggestions/${suggestionId}/accept`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error("Accept failed");
      // Refresh data after acceptance
      window.location.reload(); // simple way; you could refetch without reload
    } catch (err: any) {
      alert("Error accepting suggestion: " + err.message);
    }
  };

  const handleReject = async (suggestionId: number) => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/suggestions/${suggestionId}/reject`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error("Reject failed");
      window.location.reload();
    } catch (err: any) {
      alert("Error rejecting suggestion: " + err.message);
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  if (loading) return <div className="loading">Loading your matches...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="tutor-matches">
      <h2>Your Matches & Requests</h2>

      {/* Section 1: Confirmed Matches */}
      <section className="matches-section">
        <h3>Confirmed Matches ({matches.length})</h3>
        {matches.length === 0 ? (
          <p>You don't have any confirmed matches yet.</p>
        ) : (
          <div className="matches-list">
            {matches.map((match) => (
              <div key={match.id} className="match-card">
                <div className="match-header">
                  <span className="match-with">Tutee #{match.tutee_id}</span>
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

      {/* Section 2: Pending Suggestions */}
      <section className="suggestions-section">
        <h3>Pending Requests ({suggestions.length})</h3>
        {suggestions.length === 0 ? (
          <p>No pending requests at the moment.</p>
        ) : (
          <div className="suggestions-list">
            {suggestions.map((s) => (
              <div key={s.id} className="suggestion-card">
                <div className="suggestion-info">
                  <p>
                    <strong>Tutee #{s.tutee_id}</strong> requests tutoring in{" "}
                    <strong>{s.code} – {s.name}</strong>
                  </p>
                  <p className="suggestion-date">Received {formatDate(s.created_at)}</p>
                </div>
                <div className="suggestion-actions">
                  <button
                    className="accept-btn"
                    onClick={() => handleAccept(s.id)}
                  >
                    Accept
                  </button>
                  <button
                    className="reject-btn"
                    onClick={() => handleReject(s.id)}
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default TutorMatches;