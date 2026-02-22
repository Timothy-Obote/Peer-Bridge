import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface Match {
  id: number;
  tutee_id: number;
  created_at: string;
  courses: { code: string; name: string }[];
  tutee_name?: string;
}

const TutorMatches = () => {
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

  if (loading) return <div className="loading">Loading matches...</div>;

  return (
    <div className="page-container">
      <h1>My Matches</h1>
      {matches.length === 0 ? (
        <p>You have no matches yet.</p>
      ) : (
        <table className="matches-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Courses</th>
              <th>Since</th>
            </tr>
          </thead>
          <tbody>
            {matches.map((match) => (
              <tr key={match.id}>
                <td>{match.tutee_name || `ID ${match.tutee_id}`}</td>
                <td>{match.courses.map(c => c.code).join(", ")}</td>
                <td>{new Date(match.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default TutorMatches;