import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const TuteeDashboard = () => {
  const navigate = useNavigate();
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

  return (
    <div className="dashboard-home">
      <section className="dashboard-home__greeting">
        <h1>Hey {tuteeName} 👋, good to see you.</h1>
        <p>
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </p>
        <p className="dashboard-home__status">Your learning hub is all set up.</p>
      </section>

      <section className="dashboard-home__stats" aria-label="Dashboard summary">
        <article className="dashboard-home__stat">
          <h2>Tutors</h2>
          <p>Searching for your match</p>
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

      <section className="dashboard-home__nudge">
        <h2>Next step: Tell us what you want to learn.</h2>
        <p>Tutors across the university are available right now, but they can&apos;t match with you just yet.</p>
        <div className="dashboard-home__actions">
          <button onClick={() => navigate("/tutee/profile")}>Set Preferences →</button>
          <button className="secondary" onClick={() => {}}>🔔 Remind me later</button>
        </div>
      </section>

      <footer className="dashboard-home__footer">
        <a href="#help">❓ Help Center</a>
        <a href="#support">💬 Contact Support</a>
        <a href="#study-tips">📚 Study Tips</a>
      </footer>
    </div>
  );
};

export default TuteeDashboard;
