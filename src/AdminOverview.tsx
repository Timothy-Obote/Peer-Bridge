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

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/overview`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch overview");
        const data = await res.json();
        setSummary(data.summary);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, []);

  if (loading) return <div className="loading-screen">Loading dashboard...</div>;
  if (error) return <div className="error-message">Error: {error}</div>;

  return (
    <section>
      <h1>Welcome, System Administrator</h1>
      <p className="subtitle">Overview of PACS Platform Activity</p>
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