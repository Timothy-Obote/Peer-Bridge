import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./TuteeFeedback.css";

interface FeedbackItem {
  id: number;
  rating: number;
  name: string;
  course: string;
  date: string;
  summary: string;
  detail: string;
}

const feedbackGiven: FeedbackItem[] = [
  {
    id: 1,
    rating: 5,
    name: "Paul Kagame",
    course: "FIN 4030 - Investments",
    date: "2026-08-15",
    summary: "Great explanation! Very patient",
    detail: "Helped me understand the concepts clearly.",
  },
  {
    id: 2,
    rating: 4,
    name: "Paul Kagame",
    course: "MGT 3010 - Overview of Management",
    date: "2026-07-22",
    summary: "Good session, could use more examples",
    detail: "Explained well but I needed more practice.",
  },
];

const feedbackReceived: FeedbackItem[] = [
  {
    id: 3,
    rating: 5,
    name: "Anonymous Tutor",
    course: "FIN 4030 - Investments",
    date: "2026-08-16",
    summary: "Great questions and engagement!",
    detail: "This student comes prepared and asks great questions.",
  },
  {
    id: 4,
    rating: 4,
    name: "Anonymous Tutor",
    course: "MGT 3010 - Overview of Management",
    date: "2026-07-23",
    summary: "Good progress, keep practicing",
    detail: "Shows improvement but needs more confidence.",
  },
];

const renderStars = (rating: number) => "★".repeat(rating) + "☆".repeat(5 - rating);

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

const TuteeFeedback = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tuteeName, setTuteeName] = useState("Tutee");

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      navigate("/");
      return;
    }
    const user = JSON.parse(userStr);
    setTuteeName(user.name || "Tutee");
  }, [navigate]);

  const handleNavigation = (path: string) => {
    setSidebarOpen(false);
    navigate(path);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/");
  };

  const renderFeedbackCards = (items: FeedbackItem[]) => (
    <div className="tutee-feedback-list">
      {items.map((item) => (
        <article key={item.id} className="tutee-feedback-card">
          <div className="tutee-feedback-card-header">
            <span className="tutee-feedback-stars" aria-label={`${item.rating} out of 5 stars`}>
              {renderStars(item.rating)}
            </span>
            <time dateTime={item.date}>{formatDate(item.date)}</time>
          </div>
          <h3>{item.name}</h3>
          <p className="tutee-feedback-course">{item.course}</p>
          <p className="tutee-feedback-summary">{item.summary}</p>
          <p className="tutee-feedback-detail">{item.detail}</p>
        </article>
      ))}
    </div>
  );

  return (
    <div className="tutee-feedback-page">
      <button
        type="button"
        className="tutee-feedback-menu"
        onClick={() => setSidebarOpen((open) => !open)}
        aria-label={sidebarOpen ? "Close menu" : "Open menu"}
        aria-expanded={sidebarOpen}
      >
        <span />
        <span />
        <span />
      </button>

      {sidebarOpen && <div className="tutee-feedback-backdrop" onClick={() => setSidebarOpen(false)} />}

      <aside className={`tutee-feedback-sidebar${sidebarOpen ? " is-open" : ""}`}>
        <div>
          <h2 className="tutee-feedback-brand">PeerBridge</h2>
          <div className="tutee-feedback-divider" />
          <p className="tutee-feedback-panel-label">TUTEE PANEL</p>
          <nav className="tutee-feedback-nav" aria-label="Tutee navigation">
            <a onClick={() => handleNavigation("/tutee")}>Register</a>
            <a onClick={() => handleNavigation("/tutee/sessions")}>My Sessions</a>
            <a className="is-active" onClick={() => handleNavigation("/tutee/feedback")}>Feedback</a>
            <a onClick={() => handleNavigation("/tutee/matches")}>View Matches</a>
            <a onClick={() => handleNavigation("/tutee/profile")}>Profile</a>
          </nav>
        </div>
        <div className="tutee-feedback-logout-wrap">
          <div className="tutee-feedback-divider" />
          <button type="button" onClick={handleLogout}>Logout</button>
        </div>
      </aside>

      <main className="tutee-feedback-main">
        <header className="tutee-feedback-header">
          <p className="tutee-feedback-eyebrow">Feedback and growth</p>
          <h1>{tuteeName}&apos;s feedback</h1>
          <p>Review your learning relationships and turn each insight into progress.</p>
        </header>

        <section className="tutee-feedback-summary-grid" aria-label="Feedback summary">
          <div><span>Average Rating</span><strong>4.7</strong></div>
          <div><span>Feedback Received</span><strong>8</strong></div>
          <div><span>Feedback Given</span><strong>6</strong></div>
          <div><span>Monthly Trend</span><strong className="tutee-feedback-trend">+0.3</strong><small>from last month</small></div>
        </section>

        <section className="tutee-feedback-section">
          <div className="tutee-feedback-section-heading">
            <div><p className="tutee-feedback-eyebrow">Your perspective</p><h2>Feedback Given</h2></div>
            <a href="#feedback-given">View all feedback given</a>
          </div>
          {renderFeedbackCards(feedbackGiven)}
        </section>

        <section className="tutee-feedback-section">
          <div className="tutee-feedback-section-heading">
            <div><p className="tutee-feedback-eyebrow">Tutor perspective</p><h2>Feedback Received</h2></div>
            <a href="#feedback-received">View all feedback received</a>
          </div>
          {renderFeedbackCards(feedbackReceived)}
        </section>

        <section className="tutee-feedback-section tutee-feedback-insights">
          <div className="tutee-feedback-section-heading">
            <div><p className="tutee-feedback-eyebrow">Reflection guide</p><h2>Feedback Insights</h2></div>
          </div>
          <div className="tutee-feedback-insight-grid">
            <article><h3>Strengths</h3><ul><li>Comes prepared to sessions</li><li>Asks thoughtful clarifying questions</li></ul></article>
            <article><h3>Areas for Growth</h3><ul><li>Practice more before sessions</li><li>Review material after sessions</li></ul></article>
            <article><h3>Progress</h3><strong>4.2 to 4.7</strong><p>Your average rating improved this semester. Keep up the great work.</p></article>
          </div>
        </section>

        <footer className="tutee-feedback-footer">
          <a href="#help">Help Center</a><span aria-hidden="true">·</span><a href="#support">Contact Support</a><span aria-hidden="true">·</span><a href="#study-tips">Study Tips</a>
        </footer>
      </main>
    </div>
  );
};

export default TuteeFeedback;