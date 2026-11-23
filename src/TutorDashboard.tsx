import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const TutorDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tutorName, setTutorName] = useState("Tutor");

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

  return (
    <div className="dashboard-home">
      <section className="dashboard-home__greeting">
        <h1>Hey {tutorName} 👋, good to see you.</h1>
        <p>
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </p>
        <p className="dashboard-home__status">Your hub is all set up.</p>
      </section>

      {loading ? (
        <div role="status">Loading dashboard...</div>
      ) : (
        <section className="dashboard-home__stats" aria-label="Dashboard summary">
          <article className="dashboard-home__stat">
            <h2>Students</h2>
            <p>Waiting for your first student</p>
          </article>
          <article className="dashboard-home__stat">
            <h2>Sessions</h2>
            <p>None Scheduled</p>
          </article>
          <article className="dashboard-home__stat">
            <h2>Pending</h2>
            <p>Empty Inbox</p>
          </article>
        </section>
      )}

      <section className="dashboard-home__nudge">
        <h2>✍️ Next step: Complete your registration.</h2>
        <p>Students are browsing the platform right now, but they can&apos;t find you just yet.</p>
        <div className="dashboard-home__actions">
          <button onClick={() => navigate("/tutor")}>Go to Register →</button>
          <button className="secondary" onClick={() => {}}>🔔 Remind me later</button>
        </div>
      </section>

      <footer className="dashboard-home__footer">
        <a href="#help">📖 Help Center</a>
        <a href="#support">✉️ Contact Support</a>
        <a href="#feedback">💡 Send Feedback</a>
      </footer>
    </div>
  );
};

export default TutorDashboard;
