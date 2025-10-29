import React, { useEffect, useState } from "react";
import "./matches.css";

interface Match {
  id: number;
  tutor_email: string;
  tutee_email: string;
  unit: string;
  department: string;
  status: "pending" | "accepted" | "declined";
}

interface Suggestion {
  id: number;
  name: string;
  email: string;
  unit: string;
  department: string;
}

const MatchPage: React.FC<{ email: string | null; userType: "tutor" | "tutee" }> = ({ email, userType }) => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!email) {
      setMatches([]);
        setSuggestions([]);
        setLoading(false);
        return;
    }

    const fetchAllData = async () => {
      try {
        const matchRes = await fetch(`http://localhost:5000/matches?email=${email}`);
        const matchData = await matchRes.json();

        const suggestionRes = await fetch(`http://localhost:5000/suggestions?email=${email}&type=${userType}`);
        const suggestionData = await suggestionRes.json();

        setMatches(matchData);
        setSuggestions(suggestionData);
      } catch (err) {
        setError("Failed to fetch data.");
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [email, userType]);

  const handleAction = async (id: number, action: "accept" | "decline") => {
    try {
      await fetch(`http://localhost:5000/matches/${id}/${action}`, { method: "PUT" });
      setMatches((prev) =>
        prev.map((m) => (m.id === id ? { ...m, status: action === "accept" ? "accepted" : "declined" } : m))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendRequest = async (targetEmail: string, unit: string, department: string) => {
    try {
      const response = await fetch("http://localhost:5000/add-match-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tutorEmail: userType === "tutor" ? email : targetEmail,
          tuteeEmail: userType === "tutor" ? targetEmail : email,
          unit,
          department,
        }),
      });

      if (!response.ok) throw new Error("Failed to send request");
      alert("Match request sent!");
    } catch (err) {
      console.error("Error sending match request:", err);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  const pendingMatches = matches.filter((m) => m.status === "pending");
  const acceptedMatches = matches.filter((m) => m.status === "accepted");

  return (
    <div className="match-page">
      <h2>Your Matches</h2>

      {/* Suggestions Section */}
      <section>
        <h3>Suggestions ({userType === "tutor" ? "Tutees" : "Tutors"}) in Your Department</h3>
        {suggestions.length ? (
          suggestions.map((s) => (
            <div key={s.id} className="suggestion-card">
              <p><strong>Name:</strong> {s.name}</p>
              <p><strong>Email:</strong> {s.email}</p>
              <p><strong>Unit:</strong> {s.unit}</p>
              <p><strong>Department:</strong> {s.department}</p>
              <button onClick={() => handleSendRequest(s.email, s.unit, s.department)}>Send Match Request</button>
            </div>
          ))
        ) : (
          <p>No suggestions found in your department.</p>
        )}
      </section>

      {/* Pending Matches */}
      <section>
        <h3>Pending Matches</h3>
        {pendingMatches.length ? (
          pendingMatches.map((m) => (
            <div key={m.id} className="match-card">
              <p><strong>Unit:</strong> {m.unit}</p>
              <p><strong>Department:</strong> {m.department}</p>
              <p><strong>With:</strong> {m.tutor_email === email ? m.tutee_email : m.tutor_email}</p>
              <button onClick={() => handleAction(m.id, "accept")}>Accept</button>
              <button onClick={() => handleAction(m.id, "decline")}>Decline</button>
            </div>
          ))
        ) : (
          <p>No pending matches</p>
        )}
      </section>

      {/* Accepted Matches */}
      <section>
        <h3>Accepted Matches</h3>
        {acceptedMatches.length ? (
          acceptedMatches.map((m) => (
            <div key={m.id} className="match-card accepted">
              <p><strong>Unit:</strong> {m.unit}</p>
              <p><strong>Department:</strong> {m.department}</p>
              <p><strong>With:</strong> {m.tutor_email === email ? m.tutee_email : m.tutor_email}</p>
            </div>
          ))
        ) : (
          <p>No accepted matches yet</p>
        )}
      </section>
    </div>
  );
};

export default MatchPage;
