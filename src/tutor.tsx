import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./tutor.css";

type TermOption = "FS" | "SS" | "US";

interface UnitMap {
  [key: string]: string[];
}

interface Tutee {
  name: string;
  email: string;
  unit: string;
}

const departmentUnits: UnitMap = {
  "Applied Computer Technology": [
    "Introduction to Programming",
    "Data Structures",
    "Databases",
    "Computer Networks",
    "Operating Systems",
  ],
  "Business Administration": [
    "Principles of Management",
    "Accounting 101",
    "Marketing Fundamentals",
    "Business Law",
  ],
  "International Relations": [
    "Intro to International Relations",
    "Diplomacy & Foreign Policy",
    "Global Security",
    "International Organizations",
  ],
};

const Tutor: React.FC = () => {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [term, setTerm] = useState<TermOption>("FS");
  const [department, setDepartment] = useState("");
  const [selectedUnits, setSelectedUnits] = useState<string[]>([]);
  const [status, setStatus] = useState("");
  const [recommendations, setRecommendations] = useState<Tutee[]>([]);
  const navigate = useNavigate();

  const handleUnitSelection = (unit: string) => {
    setSelectedUnits((prevUnits) =>
      prevUnits.includes(unit)
        ? prevUnits.filter((u) => u !== unit)
        : [...prevUnits, unit]
    );
  };

  // Fetch recommendations after submission
  const fetchRecommendations = async (dept: string, units: string[]) => {
    if (!dept || units.length === 0) return;

    try {
      const firstUnit = units[0];
      const res = await fetch(
        `http://localhost:5000/recommend/tutor/${encodeURIComponent(
          dept
        )}/${encodeURIComponent(firstUnit)}`
      );

      if (!res.ok) throw new Error("Failed to fetch recommendations");

      const data = await res.json();
      setRecommendations(data.availableTutees || []);
    } catch (error) {
      console.error("Recommendation fetch error:", error);
    }
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const tutorData = { email, name, idNumber, term, department, selectedUnits };

    try {
      setStatus("Submitting...");

      const res = await fetch("http://localhost:5000/tutors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tutorData),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("Server returned error response:", text);
        setStatus("Server error — check your backend connection.");
        return;
      }

      const data = await res.json();

      if (res.ok) {
        setStatus("Tutor registered successfully!");
        setEmail("");
        setName("");
        setIdNumber("");
        setTerm("FS");
        setDepartment("");
        setSelectedUnits([]);

        // Fetch recommendations
        await fetchRecommendations(department, selectedUnits);

        // Redirect to Tutor Dashboard after successful registration
        setTimeout(() => {
          navigate("/tutor-dashboard", {
            state: { user: { name, email, role: "tutor" } },
          });
        }, 1000);
      } else {
        setStatus(data.message || "Error submitting tutor data.");
      }
    } catch (error: unknown) {
      console.error("Error submitting tutor form:", error);
      setStatus("Server error — check your backend connection.");
    }
  };

  // Handle sending match request
  const handleSendMatchRequest = async (tutee: any) => {
    try {
      console.log("Attempting to send match request for:", tutee);

      const response = await fetch("http://localhost:5000/add-match-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tutorEmail: email,
          tuteeEmail: tutee.email,
          unit: tutee.unit,
        }),
      });

      let data;
      try {
        data = await response.json();
      } catch (jsonErr) {
        console.error("Failed to parse JSON:", jsonErr);
        throw new Error(`Invalid JSON response: ${response.statusText}`);
      }

      if (!response.ok) {
        throw new Error(
          `HTTP ${response.status}: ${data.message || "Unknown error"}`
        );
      }

      alert(`Match request sent successfully to ${tutee.name}!`);
    } catch (error: any) {
      console.error("Detailed error sending match request:", error);
      alert(`Error: ${error.message}`);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white shadow-md rounded-2xl">
      <h2 className="text-2xl font-bold mb-4 text-center text-blue-700">
        Tutor Registration
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div>
          <label className="block font-medium mb-1">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded-lg p-2"
            required
          />
        </div>

        {/* Name */}
        <div>
          <label className="block font-medium mb-1">Full Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border rounded-lg p-2"
            required
          />
        </div>

        {/* ID Number */}
        <div>
          <label className="block font-medium mb-1">ID Number</label>
          <input
            type="text"
            value={idNumber}
            onChange={(e) => setIdNumber(e.target.value)}
            className="w-full border rounded-lg p-2"
            required
          />
        </div>

        {/* Term */}
        <div>
          <label className="block font-medium mb-1">Term</label>
          <select
            value={term}
            onChange={(e) => setTerm(e.target.value as TermOption)}
            className="w-full border rounded-lg p-2"
          >
            <option value="FS">Fall Semester (FS)</option>
            <option value="SS">Summer Semester (SS)</option>
            <option value="US">Spring Semester (US)</option>
          </select>
        </div>

        {/* Department */}
        <div>
          <label className="block font-medium mb-1">Department</label>
          <select
            value={department}
            onChange={(e) => {
              setDepartment(e.target.value);
              setSelectedUnits([]);
            }}
            className="w-full border rounded-lg p-2"
            required
          >
            <option value="">-- Select Department --</option>
            {Object.keys(departmentUnits).map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>

        {/* Units */}
        {department && (
          <div>
            <label className="block font-medium mb-1">
              Units for {department}
            </label>
            <div className="space-y-2">
              {departmentUnits[department].map((unit) => (
                <label key={unit} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedUnits.includes(unit)}
                    onChange={() => handleUnitSelection(unit)}
                  />
                  <span>{unit}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Submit + View Matches */}
        <div className="text-center space-y-3">
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700"
          >
            Submit
          </button>

          <div className="header-buttons">
            <button
              type="button"
              onClick={() =>
                navigate("/matches", {
                  state: { user: { email, name, role: "tutor" } },
                })
              }
              className="matches-btn"
            >
              View Matches
            </button>
          </div>

          {status && (
            <p className="text-center text-sm text-gray-700 mt-3">{status}</p>
          )}
        </div>
      </form>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="recommendations-container">
          <h3 className="recommendations-title">
            Available Tutees Matching Your Units
          </h3>
          <ul className="space-y-2">
            {recommendations.map((tutee, index) => (
              <li key={index} className="recommendation-item">
                <div className="recommendation-info">
                  <strong>{tutee.name}</strong> — {tutee.email}
                  <span>Unit: {tutee.unit}</span>
                </div>
                <button
                  onClick={() => handleSendMatchRequest(tutee)}
                  className="send-match-btn"
                >
                  Send Match Request
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Tutor;
