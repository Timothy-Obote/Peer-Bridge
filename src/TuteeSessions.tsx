import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./TutorSessions.css";

interface MatchCourse {
  code: string;
  name: string;
}

export interface TuteeSession {
  id: number;
  tutor_id: number;
  tutor_name: string;
  courses: MatchCourse[];
  started_at: string;
  status: "upcoming" | "ongoing" | "completed";
  chat_id: number | null;
}

interface SessionSummary {
  total: number;
  upcoming: number;
  ongoing: number;
  completed: number;
}

export interface WeeklyActivity {
  day: string;
  sessions: number;
  hours: number;
}

export interface TuteeSessionInsights {
  weeklyActivity: WeeklyActivity[];
  mostActiveDay: string;
  mostActiveDayHours: number;
  sessionsThisWeek: number;
  tutorsHelped: number;
}

interface TuteeSessionsResponse {
  sessions: TuteeSession[];
  summary: SessionSummary;
  insights: TuteeSessionInsights;
}

interface SessionWithMeta extends TuteeSession {
  rating?: number;
  feedback?: string;
  scheduled_at?: string;
}

// ---------------------------------------------------------------
// Sample / mock data – used to illustrate the UI when the backend
// does not yet store scheduled sessions, ratings, or feedback.
// Replace with real API fields once those tables exist.
// ---------------------------------------------------------------

const SAMPLE_UPCOMING: TuteeSession[] = [
  {
    id: 201,
    tutor_id: 301,
    tutor_name: "Prof. John Mwangi",
    courses: [
      { code: "FIN 4030", name: "Investments" },
      { code: "MGT 3010", name: "Overview of Management" },
    ],
    started_at: "2026-04-04T00:00:00Z",
    status: "upcoming",
    chat_id: null,
  },
  {
    id: 202,
    tutor_id: 302,
    tutor_name: "Dr. Sarah Kim",
    courses: [
      { code: "FIN 3010", name: "Financial Management" },
    ],
    started_at: "2026-04-08T00:00:00Z",
    status: "upcoming",
    chat_id: null,
  },
];

const MOCK_SCHEDULED: Record<number, string> = {
  201: "2026-04-06T15:00:00Z",
  202: "2026-04-12T14:00:00Z",
};

const MOCK_RATINGS: Record<number, number> = {
  1: 5, 2: 4, 3: 5, 4: 3, 5: 4,
};

const MOCK_FEEDBACK: Record<number, string> = {
  1: "Very patient and clear explanations!",
  2: "Helped me understand the concepts quickly.",
  3: "Great session, would recommend to others.",
  4: "Good but a bit rushed at the end.",
  5: "Patient and thorough — highly recommend!",
};

const DAY_LABELS_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// ---------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------

const formatDateLong = (iso: string): string =>
  new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

const formatDateTime = (iso: string): string =>
  new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }) + " · " +
  new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

const getDaysLabel = (iso: string): string => {
  const diffMs = new Date(iso).getTime() - Date.now();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  return `In ${diffDays} days`;
};

const renderStars = (rating: number): string => {
  const full = "★".repeat(rating);
  const empty = "☆".repeat(5 - rating);
  return full + empty;
};

const computeUpcomingStatusText = (iso: string): string => {
  return `🟢 Session ready · Join ${getDaysLabel(iso)}`;
};

// ---------------------------------------------------------------
// Component
// ---------------------------------------------------------------

const TuteeSessions = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tuteeName, setTuteeName] = useState("Tutee");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"all" | "upcoming" | "ongoing" | "completed">("all");
  const [apiData, setApiData] = useState<TuteeSessionsResponse | null>(null);

  const userStr = localStorage.getItem("user");
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!userStr || !token) {
      navigate("/");
      return;
    }
    const user = JSON.parse(userStr);
    setTuteeName(user.name || "Tutee");
  }, [navigate, userStr, token]);

  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [sidebarOpen]);

  useEffect(() => {
    const fetchData = async () => {
      if (!userStr || !token) return;
      try {
        const user = JSON.parse(userStr);
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/tutee-sessions/${user.id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!res.ok) throw new Error("Failed to fetch sessions");
        const data = await res.json();
        setApiData(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userStr, token]);

  const handleNavigation = (path: string) => {
    setSidebarOpen(false);
    navigate(path);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/");
  };

  // Augment API sessions with mock metadata (rating, feedback, scheduled time)
  const allSessions: SessionWithMeta[] = [];

  // Add sample upcoming sessions
  SAMPLE_UPCOMING.forEach((s) => {
    allSessions.push({
      ...s,
      scheduled_at: MOCK_SCHEDULED[s.id],
    });
  });

  // Add real API sessions (all completed) with mock rating/feedback
  if (apiData) {
    apiData.sessions.forEach((s) => {
      allSessions.push({
        ...s,
        rating: MOCK_RATINGS[s.id] ?? 4,
        feedback: MOCK_FEEDBACK[s.id] ?? "Thank you for the great session!",
      });
    });
  }

  // Filter sessions based on active filter
  const filteredSessions = allSessions.filter((s) => {
    if (activeFilter === "all") return true;
    return s.status === activeFilter;
  });

  const upcomingSessions = filteredSessions.filter((s) => s.status === "upcoming");
  const completedSessions = filteredSessions.filter((s) => s.status === "completed");
  const recentCompleted = completedSessions.slice(0, 3);

  // Summary counts – combine API summary with sample upcoming
  const summary = apiData?.summary ?? { total: 0, upcoming: 0, ongoing: 0, completed: 0 };
  const summaryWithUpcoming = {
    total: summary.total + SAMPLE_UPCOMING.length,
    upcoming: summary.upcoming + SAMPLE_UPCOMING.length,
    ongoing: summary.ongoing,
    completed: summary.completed,
  };

  // Insights from API
  const insights = apiData?.insights ?? {
    weeklyActivity: DAY_LABELS_SHORT.map((d) => ({ day: d, sessions: 0, hours: 0 })),
    mostActiveDay: "Monday",
    mostActiveDayHours: 0,
    sessionsThisWeek: 0,
    tutorsHelped: 0,
  };

  const maxHours = Math.max(...insights.weeklyActivity.map((w) => w.hours), 1);

  if (loading) {
    return (
      <div className="my-sessions-loading">Loading your sessions...</div>
    );
  }

  return (
    <div className="my-sessions-page">
      {/* —— Hamburger (mobile) —— */}
      <button
        type="button"
        className="hamburger"
        onClick={() => setSidebarOpen((prev) => !prev)}
        aria-label={sidebarOpen ? "Close menu" : "Open menu"}
        aria-expanded={sidebarOpen}
      >
        <span className="hamburger-line" />
        <span className="hamburger-line" />
        <span className="hamburger-line" />
      </button>

      {sidebarOpen && (
        <div
          className="sidebar-backdrop sidebar-backdrop--visible"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* —— Sidebar —— */}
      <aside className={`my-sessions-sidebar ${sidebarOpen ? "my-sessions-sidebar--open" : ""}`}>
        <div className="sidebar-top">
          <h2 className="logo">PeerBridge</h2>
          <div className="sidebar-middle">
            <p className="sidebar-heading">TUTEE PANEL</p>
            <nav className="nav-links">
              <a onClick={() => handleNavigation("/tutee")} className="nav-item">
                Register
              </a>
              <a
                onClick={() => handleNavigation("/tutee/sessions")}
                className="nav-item nav-item--active"
              >
                My Sessions
              </a>
              <a onClick={() => handleNavigation("/tutee/feedback")} className="nav-item">
                Feedback
              </a>
              <a onClick={() => handleNavigation("/tutee/matches")} className="nav-item">
                View Matches
              </a>
              <a onClick={() => handleNavigation("/tutee/profile")} className="nav-item">
                Profile
              </a>
            </nav>
          </div>
        </div>

        <div className="sidebar-bottom">
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </aside>

      {/* —— Main content —— */}
      <main className="my-sessions-main">
        {/* Greeting */}
        <section className="greeting-section">
          <h1 className="greeting-title">
            Hey {tuteeName} <span aria-hidden="true">👋</span>, good to see you.
          </h1>
          <p className="greeting-date">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
        </section>

        {error && <div className="my-sessions-error">{error}</div>}

        {/* 1. Summary Cards */}
        <section>
          <div className="section-header">
            <h2>Session Overview</h2>
            <p className="section-subtitle">
              You have been tutored in {summaryWithUpcoming.total} session(s) in total.
            </p>
          </div>
          <div className="summary-cards">
            <div className="summary-card">
              <span className="card-label">Total Sessions</span>
              <span className="card-value">{summaryWithUpcoming.total}</span>
              <span className="card-detail">
                All completed and upcoming sessions
              </span>
            </div>
            <div className="summary-card">
              <span className="card-label">Upcoming</span>
              <span className="card-value">{summaryWithUpcoming.upcoming}</span>
              <span className="card-detail">
                Sessions scheduled for the future
              </span>
            </div>
            <div className="summary-card">
              <span className="card-label">Ongoing</span>
              <span className="card-value">{summaryWithUpcoming.ongoing}</span>
              <span className="card-detail">
                Sessions currently in progress
              </span>
            </div>
            <div className="summary-card">
              <span className="card-label">Completed</span>
              <span className="card-value">{summaryWithUpcoming.completed}</span>
              <span className="card-detail">
                Sessions you have finished
              </span>
            </div>
          </div>
        </section>

        {/* 2. Filter Tabs */}
        <section>
          <div className="filter-bar">
            <button
              type="button"
              className={`filter-tab ${activeFilter === "all" ? "filter-tab--active" : ""}`}
              onClick={() => setActiveFilter("all")}
            >
              All
            </button>
            <button
              type="button"
              className={`filter-tab ${activeFilter === "upcoming" ? "filter-tab--active" : ""}`}
              onClick={() => setActiveFilter("upcoming")}
            >
              Upcoming
            </button>
            <button
              type="button"
              className={`filter-tab ${activeFilter === "ongoing" ? "filter-tab--active" : ""}`}
              onClick={() => setActiveFilter("ongoing")}
            >
              Ongoing
            </button>
            <button
              type="button"
              className={`filter-tab ${activeFilter === "completed" ? "filter-tab--active" : ""}`}
              onClick={() => setActiveFilter("completed")}
            >
              Completed
            </button>
          </div>
        </section>

        {/* 3. Upcoming Sessions */}
        <section>
          <div className="section-header">
            <h2>Upcoming Sessions</h2>
            <p className="section-subtitle">
              {upcomingSessions.length === 0
                ? "No upcoming sessions scheduled."
                : `${upcomingSessions.length} session(s) on the way.`}
            </p>
          </div>

          {upcomingSessions.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📅</div>
              <p className="empty-text">You have no upcoming sessions at the moment.</p>
            </div>
          ) : (
            <div className="sessions-grid">
              {upcomingSessions.map((session) => (
                <div key={session.id} className="session-card upcoming-session-card">
                  <div className="session-card-header">
                    <h3 className="student-name">{session.tutor_name}</h3>
                    <span className="session-status">
                      {session.scheduled_at
                        ? computeUpcomingStatusText(session.scheduled_at)
                        : "🟢 Session ready"}
                    </span>
                  </div>

                  <div className="course-list">
                    {session.courses.map((c, idx) => (
                      <span key={idx} className="course-tag">
                        {c.code} – {c.name}
                      </span>
                    ))}
                  </div>

                  <p className="session-card-detail">
                    Started: {formatDateLong(session.started_at)}
                  </p>

                  <div className="session-card-actions">
                    <a
                      className="action-link action-link--primary"
                      onClick={() => session.chat_id && navigate(`/chat/${session.chat_id}`)}
                    >
                      Join Session →
                    </a>
                    <a className="action-link">Reschedule</a>
                    <a className="action-link">Cancel</a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 4. Recent Completed Sessions */}
        <section>
          <div className="section-header">
            <h2>Recent Completed Sessions</h2>
            <p className="section-subtitle">
              {completedSessions.length === 0
                ? "No completed sessions yet."
                : `Showing the last ${Math.min(3, completedSessions.length)} of ${completedSessions.length} session(s).`}
            </p>
          </div>

          {recentCompleted.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">✓</div>
              <p className="empty-text">No completed sessions to display yet.</p>
            </div>
          ) : (
            <div className="sessions-grid">
              {recentCompleted.map((session) => (
                <div key={session.id} className="session-card completed-session-card">
                  <h3 className="student-name">{session.tutor_name}</h3>

                  <p className="session-date-time">
                    {formatDateTime(session.started_at)}
                  </p>

                  <div className="course-list">
                    {session.courses.map((c, idx) => (
                      <span key={idx} className="course-tag">
                        {c.code} – {c.name}
                      </span>
                    ))}
                  </div>

                  {session.rating !== undefined && (
                    <div className="star-rating">
                      {renderStars(session.rating)}
                    </div>
                  )}

                  {session.feedback ? (
                    <p className="student-feedback">{session.feedback}</p>
                  ) : (
                    <p className="student-feedback">No feedback yet.</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 5. Session Insights */}
        <section>
          <div className="section-header">
            <h2>Session Insights</h2>
            <p className="section-subtitle">
              Your learning activity at a glance.
            </p>
          </div>

          <div className="insights-panel">
            {/* Bar chart */}
            <div className="chart-container">
              <div className="bar-chart">
                {insights.weeklyActivity.map((item) => {
                  const barHeight = (item.hours / maxHours) * 100;
                  return (
                    <div key={item.day} className="bar-container">
                      <div
                        className="bar"
                        style={{ height: `${barHeight}%` }}
                      >
                        <span className="bar-value">{item.hours.toFixed(1)}h</span>
                      </div>
                      <span className="bar-label">{item.day.slice(0, 3)}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Stats grid */}
            <div className="insights-grid">
              <div className="insight-stat">
                <span className="insight-label">Most Active Day</span>
                <span className="insight-value">
                  🔥 {insights.mostActiveDay}
                  <br />
                  <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 500 }}>
                    {insights.mostActiveDayHours} hours average
                  </span>
                </span>
              </div>
              <div className="insight-stat">
                <span className="insight-label">Sessions This Week</span>
                <span className="insight-value">{insights.sessionsThisWeek}</span>
              </div>
              <div className="insight-stat">
                <span className="insight-label">Tutors Helped</span>
                <span className="insight-value">{insights.tutorsHelped}</span>
              </div>
            </div>
          </div>
        </section>

        {/* 6. Footer */}
        <footer className="utility-footer">
          <a href="#help" className="utility-link">Help Center</a>
          <span className="utility-divider" />
          <a href="#support" className="utility-link">Contact Support</a>
          <span className="utility-divider" />
          <a href="#tips" className="utility-link">Study Tips</a>
        </footer>
      </main>
    </div>
  );
};

export default TuteeSessions;
