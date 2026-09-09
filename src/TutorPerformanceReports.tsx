import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./TutorPerformanceReports.css";

interface SummaryStats {
  averageRating: number;
  ratingGrowth: number;
  totalReviews: number;
  reviewsGrowth: number;
  studentsHelped: number;
  studentsGrowth: number;
  sessionsThisMonth: number;
  sessionsGrowth: number;
}

interface RatingDistribution {
  stars: number;
  count: number;
  percentage: number;
}

interface FeedbackItem {
  id: number;
  rating: number;
  quote: string;
  date: string;
  course: string;
}

interface CategoryScore {
  name: string;
  score: number;
  label: string;
}

interface Suggestion {
  text: string;
}

interface Badge {
  id: number;
  title: string;
  description: string;
  earned: boolean;
}

const TutorPerformanceReports = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tutorName, setTutorName] = useState("Tutor");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [summaryStats] = useState<SummaryStats>({
    averageRating: 4.8,
    ratingGrowth: 0.3,
    totalReviews: 9,
    reviewsGrowth: 3,
    studentsHelped: 8,
    studentsGrowth: 2,
    sessionsThisMonth: 11,
    sessionsGrowth: 22,
  });
  const [ratingDistribution] = useState<RatingDistribution[]>([
    { stars: 5, count: 6, percentage: 70 },
    { stars: 4, count: 2, percentage: 20 },
    { stars: 3, count: 1, percentage: 10 },
    { stars: 2, count: 0, percentage: 0 },
    { stars: 1, count: 0, percentage: 0 },
  ]);
  const [performanceData] = useState<{ month: string; rating: number }[]>([
    { month: "Jan", rating: 4.2 },
    { month: "Feb", rating: 4.3 },
    { month: "Mar", rating: 4.4 },
    { month: "Apr", rating: 4.5 },
    { month: "May", rating: 4.6 },
    { month: "Jun", rating: 4.7 },
    { month: "Jul", rating: 4.7 },
    { month: "Aug", rating: 4.8 },
    { month: "Sep", rating: 4.8 },
  ]);
  const [feedback] = useState<FeedbackItem[]>([
    {
      id: 1,
      rating: 5,
      quote: "\"Excellent tutor! Explained complex concepts with great clarity and patience. The examples used were very relevant to our coursework.\"",
      date: "2026-08-15",
      course: "FIN 4030 - Investments",
    },
    {
      id: 2,
      rating: 5,
      quote: "\"Very helpful session. Broke down difficult topics into manageable parts. Felt much more confident after our meeting.\"",
      date: "2026-07-22",
      course: "MGT 3010 - Overview of Management",
    },
    {
      id: 3,
      rating: 4,
      quote: "\"Good session overall. Would appreciate more practice problems to work through together during the session.\"",
      date: "2026-06-10",
      course: "FIN 3010 - Financial Management",
    },
    {
      id: 4,
      rating: 5,
      quote: "\"Amazing tutor! Always prepared and structures sessions with clear goals. Highly recommend.\"",
      date: "2026-05-05",
      course: "FIN 4030 - Investments",
    },
    {
      id: 5,
      rating: 3,
      quote: "\"Session was okay but could have been more structured. Some topics felt rushed.\"",
      date: "2026-04-18",
      course: "MGT 3010 - Overview of Management",
    },
  ]);
  const [categoryScores] = useState<CategoryScore[]>([
    { name: "Clarity", score: 4.9, label: "Excellent" },
    { name: "Pacing", score: 4.5, label: "Good" },
    { name: "Resources", score: 4.3, label: "Room for Improvement" },
  ]);
  const [suggestions] = useState<Suggestion[]>([
    { text: "Provide more examples during sessions to illustrate key concepts" },
    { text: "Share materials before the session so students can prepare in advance" },
    { text: "Structure the session with clear goals and agenda shared at the start" },
  ]);
  const [badges] = useState<Badge[]>([
    { id: 1, title: "10 Sessions Complete", description: "Completed 10 tutoring sessions", earned: true },
    { id: 2, title: "50 Hours Taught", description: "Accumulated 50 hours of teaching", earned: true },
    { id: 3, title: "8 Students Helped", description: "Helped 8 different students", earned: true },
    { id: 4, title: "5.0 Rating Earned", description: "Achieved a perfect 5.0 rating", earned: true },
  ]);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      navigate("/");
      return;
    }
    const user = JSON.parse(userStr);
    setTutorName(user.name || "Tutor");
    setLoading(false);
  }, [navigate]);

  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  const handleNavigation = (path: string) => {
    setSidebarOpen(false);
    navigate(path);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/");
  };

  const renderStars = (rating: number): string => {
    const full = "★".repeat(rating);
    const empty = "☆".repeat(5 - rating);
    return full + empty;
  };

  if (loading) {
    return (
      <div className="performance-reports-page">
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
        <aside className={`sidebar ${sidebarOpen ? "sidebar--open" : ""}`}>
          <div className="sidebar-top">
            <h2 className="logo">PeerBridge</h2>
          </div>
          <div className="sidebar-middle">
            <p className="sidebar-heading">Tutor Panel</p>
            <nav className="nav-links">
              <a onClick={() => handleNavigation("/tutor")} className="nav-item">Register</a>
              <a onClick={() => handleNavigation("/tutor/sessions")} className="nav-item">My Sessions</a>
              <a onClick={() => handleNavigation("/tutor/performance")} className="nav-item nav-item--active">Performance Reports</a>
              <a onClick={() => handleNavigation("/tutor/matches")} className="nav-item">View Matches</a>
              <a onClick={() => handleNavigation("/tutor/profile")} className="nav-item">Profile</a>
            </nav>
          </div>
          <div className="sidebar-bottom">
            <button className="logout-btn" onClick={handleLogout}>Logout</button>
          </div>
        </aside>
        <main className="main-content">
          <div className="loading-spinner">Loading performance reports...</div>
        </main>
      </div>
    );
  }

  const minRating = Math.min(...performanceData.map((d) => d.rating));
  const maxRating = Math.max(...performanceData.map((d) => d.rating));
  const ratingRange = maxRating - minRating || 1;

  return (
    <div className="performance-reports-page">
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
        <div className="sidebar-backdrop sidebar-backdrop--visible" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`sidebar ${sidebarOpen ? "sidebar--open" : ""}`}>
        <div className="sidebar-top">
          <h2 className="logo">PeerBridge</h2>
        </div>

        <div className="sidebar-middle">
          <p className="sidebar-heading">Tutor Panel</p>
          <nav className="nav-links">
            <a onClick={() => handleNavigation("/tutor")} className="nav-item">Register</a>
            <a onClick={() => handleNavigation("/tutor/sessions")} className="nav-item">My Sessions</a>
            <a onClick={() => handleNavigation("/tutor/performance")} className="nav-item nav-item--active">Performance Reports</a>
            <a onClick={() => handleNavigation("/tutor/matches")} className="nav-item">View Matches</a>
            <a onClick={() => handleNavigation("/tutor/profile")} className="nav-item">Profile</a>
          </nav>
        </div>

        <div className="sidebar-bottom">
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </aside>

      <main className="main-content">
        <section className="greeting-section">
          <h1 className="greeting-title">Hey {tutorName} <span aria-hidden="true">👋</span>, good to see you.</h1>
          <p className="greeting-date">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
          <p className="greeting-status">Your performance overview is ready.</p>
        </section>

        {/* 1. Summary Cards */}
        <section className="summary-section">
          <div className="summary-cards">
            <div className="summary-card">
              <span className="card-label">Average Rating</span>
              <span className="card-value">{summaryStats.averageRating.toFixed(1)}</span>
              <span className="card-detail">
                <span className="growth-indicator positive">+{summaryStats.ratingGrowth.toFixed(1)} from last month</span>
              </span>
            </div>
            <div className="summary-card">
              <span className="card-label">Total Reviews</span>
              <span className="card-value">{summaryStats.totalReviews}</span>
              <span className="card-detail">
                <span className="growth-indicator positive">+{summaryStats.reviewsGrowth} from last month</span>
              </span>
            </div>
            <div className="summary-card">
              <span className="card-label">Students Helped</span>
              <span className="card-value">{summaryStats.studentsHelped}</span>
              <span className="card-detail">
                <span className="growth-indicator positive">+{summaryStats.studentsGrowth} from last month</span>
              </span>
            </div>
            <div className="summary-card">
              <span className="card-label">Sessions This Month</span>
              <span className="card-value">{summaryStats.sessionsThisMonth}</span>
              <span className="card-detail">
                <span className="growth-indicator positive">+{summaryStats.sessionsGrowth}% from last month</span>
              </span>
            </div>
          </div>
        </section>

        {/* 2. Rating Distribution */}
        <section className="rating-distribution-section">
          <div className="section-header">
            <h2>Rating Distribution</h2>
            <p className="section-subtitle">Breakdown of student ratings across all sessions</p>
          </div>
          <div className="rating-distribution">
            {ratingDistribution.map((item) => (
              <div key={item.stars} className="rating-row">
                <div className="rating-stars">
                  {renderStars(item.stars)}
                </div>
                <div className="rating-count">{item.count} review{item.count !== 1 ? "s" : ""}</div>
                <div className="rating-bar-container">
                  <div
                    className="rating-bar"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
                <div className="rating-percentage">{item.percentage}%</div>
              </div>
            ))}
          </div>
        </section>

        {/* 3. Performance Over Time */}
        <section className="performance-time-section">
          <div className="section-header">
            <h2>Performance Over Time</h2>
            <p className="section-subtitle">Average rating trend over the last 9 months</p>
          </div>
          <div className="line-chart-container">
            <svg className="line-chart" viewBox="0 0 800 300" preserveAspectRatio="none">
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#facc15" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#facc15" stopOpacity="0" />
                </linearGradient>
              </defs>
              {/* Grid lines */}
              {[4.0, 4.2, 4.4, 4.6, 4.8, 5.0].map((val) => (
                <line
                  key={val}
                  x1={60}
                  y1={220 - ((val - minRating) / ratingRange) * 200}
                  x2={780}
                  y2={220 - ((val - minRating) / ratingRange) * 200}
                  stroke="#e2e8f0"
                  strokeWidth="1"
                  strokeDasharray="4,4"
                />
              ))}
              {/* Area under curve */}
              <path
                d={[
                  `M ${60} ${220}`,
                  ...performanceData.map((point, i) => {
                    const x = 60 + (i / (performanceData.length - 1)) * 720;
                    const y = 220 - ((point.rating - minRating) / ratingRange) * 200;
                    return i === 0 ? `L ${x} ${y}` : `L ${x} ${y}`;
                  }),
                  `L ${780} ${220}`,
                  `Z`,
                ].join(" ")}
                fill="url(#chartGradient)"
              />
              {/* Line */}
              <path
                d={performanceData
                  .map((point, i) => {
                    const x = 60 + (i / (performanceData.length - 1)) * 720;
                    const y = 220 - ((point.rating - minRating) / ratingRange) * 200;
                    return `${i === 0 ? "M" : "L"} ${x} ${y}`;
                  })
                  .join(" ")}
                stroke="#facc15"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Data points */}
              {performanceData.map((point, i) => (
                <circle
                  key={point.month}
                  cx={60 + (i / (performanceData.length - 1)) * 720}
                  cy={220 - ((point.rating - minRating) / ratingRange) * 200}
                  r="5"
                  fill="#facc15"
                  stroke="#ffffff"
                  strokeWidth="2"
                />
              ))}
              {/* X-axis labels */}
              {performanceData.map((point, i) => (
                <text
                  key={point.month}
                  x={60 + (i / (performanceData.length - 1)) * 720}
                  y={245}
                  textAnchor="middle"
                  fontSize="11"
                  fill="#64748b"
                  fontFamily="system-ui, sans-serif"
                >
                  {point.month}
                </text>
              ))}
              {/* Y-axis labels */}
              {[4.0, 4.2, 4.4, 4.6, 4.8, 5.0].map((val) => (
                <text
                  key={val}
                  x={45}
                  y={220 - ((val - minRating) / ratingRange) * 200 + 4}
                  textAnchor="end"
                  fontSize="11"
                  fill="#64748b"
                  fontFamily="system-ui, sans-serif"
                >
                  {val.toFixed(1)}
                </text>
              ))}
            </svg>
          </div>
          <div className="chart-insight">
            <span className="insight-icon">📈</span>
            <p>You've improved from <strong>4.2</strong> to <strong>4.8</strong> this year. Keep up the great work!</p>
          </div>
        </section>

        {/* 4. Anonymous Student Feedback */}
        <section className="feedback-section">
          <div className="section-header">
            <h2>Anonymous Student Feedback</h2>
            <p className="section-subtitle">Honest reviews from your students (most recent first)</p>
          </div>
          <div className="feedback-cards">
            {feedback.map((item) => (
              <div key={item.id} className="feedback-card">
                <div className="feedback-header">
                  <span className="feedback-stars">{renderStars(item.rating)}</span>
                  <span className="feedback-date">{new Date(item.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
                </div>
                <p className="feedback-quote">{item.quote}</p>
                <span className="feedback-course">{item.course}</span>
              </div>
            ))}
          </div>
          <div className="section-footer">
            <a href="#" className="view-all-link">View all reviews →</a>
          </div>
        </section>

        {/* 5. Areas for Improvement */}
        <section className="improvement-section">
          <div className="section-header">
            <h2>Areas for Improvement</h2>
            <p className="section-subtitle">Constructive insights based on student feedback patterns</p>
          </div>
          <div className="category-scores">
            {categoryScores.map((cat) => (
              <div key={cat.name} className="category-card">
                <div className="category-header">
                  <span className="category-name">{cat.name}</span>
                  <span className="category-score">{cat.score.toFixed(1)} / 5.0</span>
                </div>
                <div className="category-bar-container">
                  <div className="category-bar" style={{ width: `${(cat.score / 5) * 100}%` }} />
                </div>
                <span className="category-label">{cat.label}</span>
              </div>
            ))}
          </div>
          <div className="suggestions-list">
            <h3>Actionable Suggestions</h3>
            <ul>
              {suggestions.map((suggestion, i) => (
                <li key={i}>{suggestion.text}</li>
              ))}
            </ul>
          </div>
          <div className="section-footer">
            <a href="#" className="view-all-link">View full feedback analysis →</a>
          </div>
        </section>

        {/* 6. Achievements & Milestones */}
        <section className="achievements-section">
          <div className="section-header">
            <h2>Achievements & Milestones</h2>
            <p className="section-subtitle">Your teaching journey progress and upcoming goals</p>
          </div>
          <div className="badges-grid">
            {badges.map((badge) => (
              <div key={badge.id} className="badge-card earned">
                <div className="badge-icon">🏆</div>
                <h4 className="badge-title">{badge.title}</h4>
                <p className="badge-description">{badge.description}</p>
              </div>
            ))}
          </div>
          <div className="milestone-progress">
            <div className="milestone-header">
              <span className="milestone-title">Next Milestone: 15 Sessions Complete</span>
              <span className="milestone-progress-text">12 / 15 sessions</span>
            </div>
            <div className="progress-bar-container">
              <div className="progress-bar" style={{ width: "80%" }} />
            </div>
            <p className="milestone-note">3 more sessions to reach your next milestone!</p>
          </div>
        </section>

        {/* 7. Utility Footer */}
        <footer className="utility-footer">
          <a href="#" className="utility-link">Help Center</a>
          <span className="utility-divider" aria-hidden="true">·</span>
          <a href="#" className="utility-link">Contact Support</a>
          <span className="utility-divider" aria-hidden="true">·</span>
          <a href="#" className="utility-link">Tutor Tips</a>
        </footer>
      </main>
    </div>
  );
};

export default TutorPerformanceReports;