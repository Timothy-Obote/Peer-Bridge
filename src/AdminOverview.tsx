import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

interface RecentUser {
  id: number;
  name: string;
  role: string;
  created_at: string;
}

interface Summary {
  total_users: number;
  tutors: number;
  tutees: number;
  pending_matches: number;
  last_match_at: string | null;
  growth: {
    total: { recent: number; previous: number };
    tutor: { recent: number; previous: number };
    tutee: { recent: number; previous: number };
  };
  recent_users: RecentUser[];
}

const AdminOverview = () => {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [matching, setMatching] = useState(false);
  const [matchingMessage, setMatchingMessage] = useState<string | null>(null);
  const [matchingError, setMatchingError] = useState(false);
  const [now, setNow] = useState(new Date());

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
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  const handleRunMatching = async () => {
    setMatching(true);
    setMatchingMessage(null);
    setMatchingError(false);

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
      setMatchingError(true);
    } finally {
      setMatching(false);
    }
  };

  // --- Time-of-day greeting ---
  const greeting = (() => {
    const h = now.getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  })();

  const datetimeLabel = now.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  const formatLastMatch = (iso: string | null) => {
    if (!iso) return "No matches have been run yet";
    const d = new Date(iso);
    const diffH = Math.floor((now.getTime() - d.getTime()) / 36e5);
    if (diffH < 1) {
      const diffM = Math.max(1, Math.floor((now.getTime() - d.getTime()) / 60000));
      return `Last match ran: ${diffM} min ago`;
    }
    if (diffH < 24) return `Last match ran: ${diffH} hr ago`;
    return `Last match ran: ${d.toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}`;
  };

  const relativeTime = (iso: string) => {
    const d = new Date(iso);
    const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diffSec < 60) return "just now";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} min ago`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH} hr ago`;
    const diffD = Math.floor(diffH / 24);
    return `${diffD} day${diffD === 1 ? "" : "s"} ago`;
  };

  const growthDelta = (recent: number, previous: number) => recent - previous;

  if (loading) return <div className="loading-screen">Loading dashboard...</div>;
  if (error) return <div className="error-message">Error: {error}</div>;
  if (!summary) return null;

  const totalDelta = growthDelta(summary.growth.total.recent, summary.growth.total.previous);
  const tutorDelta = growthDelta(summary.growth.tutor.recent, summary.growth.tutor.previous);
  const tuteeDelta = growthDelta(summary.growth.tutee.recent, summary.growth.tutee.previous);

  // Distribution percentages (tutors / tutees / pending)
  const distTotal = Math.max(1, summary.tutors + summary.tutees + summary.pending_matches);
  const tutorPct = Math.round((summary.tutors / distTotal) * 100);
  const tuteePct = Math.round((summary.tutees / distTotal) * 100);
  const pendingPct = 100 - tutorPct - tuteePct;

  return (
    <>
      {/* Section 1: Top Status Bar */}
      <header className="status-bar">
        <div className="status-greeting">
          <h1>{greeting}, Admin</h1>
          <p className="status-log">
            <span aria-hidden="true">📝</span>
            <span>{formatLastMatch(summary.last_match_at)}</span>
          </p>
        </div>
        <div className="status-meta">
          <span className="status-badge" role="status">System Healthy</span>
          <span className="status-datetime">{datetimeLabel}</span>
        </div>
      </header>

      {/* Section 2: Platform Overview & Primary Action */}
      <section className="overview-header">
        <h2>Platform Overview</h2>
        <button
          className="run-matching-btn"
          onClick={handleRunMatching}
          disabled={matching}
          aria-label="Run matching algorithm now"
        >
          <span aria-hidden="true">🔄</span>
          <span>{matching ? "Running Matching…" : "Run Matching Now"}</span>
        </button>
      </section>
      {matchingMessage && (
        <p className={`matching-toast ${matchingError ? "error" : ""}`}>{matchingMessage}</p>
      )}

      {/* Section 3: Four KPI Cards */}
      <section className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-head">
            <span className="kpi-label">Total Users</span>
            <span className="kpi-icon" aria-hidden="true">👥</span>
          </div>
          <span className="kpi-value">{summary.total_users}</span>
          <span className="kpi-growth positive">
            <span aria-hidden="true">↑</span>
            <span>+{Math.max(0, totalDelta)} this week</span>
          </span>
        </div>

        <div className="kpi-card">
          <div className="kpi-head">
            <span className="kpi-label">Tutors</span>
            <span className="kpi-icon" aria-hidden="true">👨‍🏫</span>
          </div>
          <span className="kpi-value">{summary.tutors}</span>
          <span className="kpi-growth positive">
            <span aria-hidden="true">↑</span>
            <span>+{Math.max(0, tutorDelta)} this week</span>
          </span>
        </div>

        <div className="kpi-card">
          <div className="kpi-head">
            <span className="kpi-label">Tutees</span>
            <span className="kpi-icon" aria-hidden="true">🧑‍🎓</span>
          </div>
          <span className="kpi-value">{summary.tutees}</span>
          <span className="kpi-growth positive">
            <span aria-hidden="true">↑</span>
            <span>+{Math.max(0, tuteeDelta)} this week</span>
          </span>
        </div>

        <div className="kpi-card">
          <div className="kpi-head">
            <span className="kpi-label">Pending Matches</span>
            <span className="kpi-icon" aria-hidden="true">🔗</span>
          </div>
          <span className="kpi-value">{summary.pending_matches}</span>
          <span className="kpi-growth neutral">
            {summary.pending_matches === 0 ? "Ready" : `${summary.pending_matches} waiting`}
          </span>
        </div>
      </section>

      {/* Section 4: Two-Column Detailed View */}
      <section className="detail-grid">
        <div className="detail-card">
          <h3>Recent Registrations</h3>
          {summary.recent_users.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", margin: 0 }}>
              No users yet.
            </p>
          ) : (
            <ul className="recent-list">
              {summary.recent_users.map((u) => (
                <li key={u.id} className="recent-item">
                  <span style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <span className="who">{u.name}</span>
                    <span className={`role ${u.role === "tutor" ? "tutor" : "tutee"}`}>
                      {u.role}
                    </span>
                  </span>
                  <span className="when">{relativeTime(u.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
          <Link to="/admin-dashboard/users" className="view-all-link">
            View All Users <span aria-hidden="true">→</span>
          </Link>
        </div>

        <div className="detail-card">
          <h3>Platform Distribution</h3>
          <div className="distribution-list">
            <div className="dist-row">
              <div className="dist-head">
                <span><strong>Tutors</strong></span>
                <span>{tutorPct}%</span>
              </div>
              <div className="dist-bar">
                <div className="dist-fill" style={{ width: `${tutorPct}%` }} />
              </div>
            </div>
            <div className="dist-row">
              <div className="dist-head">
                <span><strong>Tutees</strong></span>
                <span>{tuteePct}%</span>
              </div>
              <div className="dist-bar">
                <div className="dist-fill tutee" style={{ width: `${tuteePct}%` }} />
              </div>
            </div>
            <div className="dist-row">
              <div className="dist-head">
                <span><strong>Pending</strong></span>
                <span>{pendingPct}%</span>
              </div>
              <div className="dist-bar">
                <div className="dist-fill pending" style={{ width: `${pendingPct}%` }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: Utility Footer */}
      <footer className="utility-footer">
        <Link to="/admin-dashboard/reports" className="utility-link">
          <span aria-hidden="true">📈</span>
          <span>System Logs</span>
        </Link>
        <Link to="/admin-dashboard/reports" className="utility-link">
          <span aria-hidden="true">⚡</span>
          <span>Performance</span>
        </Link>
        <Link to="/admin-dashboard/settings" className="utility-link">
          <span aria-hidden="true">❓</span>
          <span>Documentation</span>
        </Link>
      </footer>
    </>
  );
};

export default AdminOverview;