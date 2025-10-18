import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useLocation } from "react-router-dom";
import "./matches.css";

interface Match {
  match_id: number;
  unit: string;
  status: string;
  created_at: string;
  tutor_id?: number;
  tutor_name?: string;
  tutor_email?: string;
  tutee_id?: number;
  tutee_name?: string;
  tutee_email?: string;
}

export default function Matches() {
  const location = useLocation();
  const user = location.state?.user;
  const userEmail = user?.email || "";
  const userRole = user?.role || ""; // "tutor" or "tutee"
  const userId = user?.id || null;

  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState("");

  // Connect to socket.io
  useEffect(() => {
    if (!userEmail) return;
    const socket = io("http://localhost:5000");

    socket.on("connect", () => {
      socket.emit("registerUser", userEmail);
    });

    socket.on("matchFound", (data) => {
      alert("New match found!");
      console.log("Match found:", data.match);
      setMatches((prev) => [...prev, data.match]);
    });

    return () => {
      socket.disconnect();
    };
  }, [userEmail]);

  // Fetch matches from backend
  useEffect(() => {
    async function fetchMatches() {
      if (!userId || !userRole) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`http://localhost:5000/matches/${userRole}/${userId}`);
        const data = await res.json();
        setMatches(data.matches || []);
      } catch (err) {
        console.error("Error fetching matches:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchMatches();
  }, [userId, userRole]);

  // Send request to match (Tutor or Tutee)
  const handleSendRequest = async (matchId: number) => {
    try {
      const res = await fetch(`http://localhost:5000/matches/${matchId}/request`, {
        method: "POST",
      });
      const data = await res.json();
      setStatusMessage(data.message || "Request sent.");
      setMatches((prev) =>
        prev.map((m) =>
          m.match_id === matchId ? { ...m, status: "requested" } : m
        )
      );
    } catch (err) {
      console.error("Error sending request:", err);
    }
  };

  // Accept or Reject
  const handleAction = async (matchId: number, action: "accept" | "reject") => {
    try {
      const res = await fetch(`http://localhost:5000/matches/${matchId}/${action}`, {
        method: "POST",
      });
      const data = await res.json();
      console.log(data.message);
      setStatusMessage(data.message);
      setMatches((prev) =>
        prev.map((m) =>
          m.match_id === matchId
            ? { ...m, status: action === "accept" ? "accepted" : "rejected" }
            : m
        )
      );
    } catch (err) {
      console.error(`Error on ${action}:`, err);
    }
  };

  if (loading) return <div className="matches-container">Loading matches...</div>;

  return (
    <div className="matches-container">
      <h1 className="text-2xl font-bold mb-4 text-blue-700">Your Matches</h1>

      {statusMessage && (
        <div className="status-message">{statusMessage}</div>
      )}

      {matches.length === 0 ? (
        <p>No matches yet. Please wait while we find one for you.</p>
      ) : (
        <div className="match-list">
          {matches.map((match) => (
            <div key={match.match_id} className={`match-card ${match.status}`}>
              <div className="match-info">
                <p><strong>Unit:</strong> {match.unit}</p>
                {userRole === "tutor" ? (
                  <>
                    <p><strong>Tutee:</strong> {match.tutee_name}</p>
                    <p><strong>Email:</strong> {match.tutee_email}</p>
                  </>
                ) : (
                  <>
                    <p><strong>Tutor:</strong> {match.tutor_name}</p>
                    <p><strong>Email:</strong> {match.tutor_email}</p>
                  </>
                )}
                <p><strong>Status:</strong> {match.status}</p>
              </div>

              <div className="match-actions">
                {match.status === "pending" && (
                  <button
                    className="send-btn"
                    onClick={() => handleSendRequest(match.match_id)}
                  >
                    Send Request
                  </button>
                )}

                {match.status === "requested" && (
                  <>
                    <button
                      className="accept-btn"
                      onClick={() => handleAction(match.match_id, "accept")}
                    >
                      Accept
                    </button>
                    <button
                      className="reject-btn"
                      onClick={() => handleAction(match.match_id, "reject")}
                    >
                      Decline
                    </button>
                  </>
                )}

                {match.status === "accepted" && (
                  <p className="accepted-text"> Match Accepted</p>
                )}
                {match.status === "rejected" && (
                  <p className="rejected-text"> Match Declined</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
