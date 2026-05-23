import { useEffect, useState } from "react";

interface Summary {
  total_users: number;
  tutors: number;
  tutees: number;
}

const AdminOverview = () => {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [matching, setMatching] = useState(false);
  const [matchingMessage, setMatchingMessage] = useState<string | null>(null);

  const fetchSummary = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/overview`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch overview");
      const data = await res.json();
      setSummary(data.summary);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const handleRunMatching = async () => {
    setMatching(true);
    setMatchingMessage(null);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/matching/run`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.message || "Failed to run matching");
      }

      setMatchingMessage(data.message || "Matching completed successfully.");
      await fetchSummary();
    } catch (err: any) {
      setMatchingMessage(err.message || "Failed to run matching.");
    } finally {
      setMatching(false);
    }
  };

  if (loading) return <div className="loading-screen">Loading dashboard...</div>;
  if (error) return <div className="error-message">Error: {error}</div>;

  return (
    <section>
      <h1>Welcome, System Administrator</h1>
      <p className="subtitle">Overview of PACS Platform Activity</p>
      <div style={{ marginBottom: "1.5rem" }}>
        <button
          onClick={handleRunMatching}
          disabled={matching}
          style={{
            backgroundColor: "#facc15",
            color: "#111827",
            border: "none",
            borderRadius: "8px",
            padding: "0.75rem 1rem",
            fontWeight: 600,
            cursor: matching ? "not-allowed" : "pointer",
          }}
        >
          {matching ? "Running Matching..." : "Run Matching"}
        </button>
        {matchingMessage && (
          <p style={{ marginTop: "0.75rem" }}>{matchingMessage}</p>
        )}
      </div>
      {summary && (
        <div className="summary-cards">
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
    </section>
  );
};

export default AdminOverview;
