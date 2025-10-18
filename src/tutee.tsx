import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./tutee.css";

type TermOption = "FS" | "SS" | "US";

interface UnitMap {
  [key: string]: string[];
}

interface Tutor {
  name: string;
  email: string;
  units: string;
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

const Tutee: React.FC = () => {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [term, setTerm] = useState<TermOption>("FS");
  const [department, setDepartment] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("");
  const [status, setStatus] = useState("");
  const [recommendations, setRecommendations] = useState<Tutor[]>([]);
  const navigate = useNavigate();

  // Fetch available tutors for this tutee
  const fetchRecommendations = async (dept: string, unit: string) => {
    if (!dept || !unit) return;

    try {
      const res = await fetch(
        `http://localhost:5000/recommend/tutee/${encodeURIComponent(dept)}/${encodeURIComponent(unit)}`
      );

      if (!res.ok) throw new Error("Failed to fetch tutor recommendations");

      const data = await res.json();
      setRecommendations(data.availableTutors || []);
    } catch (error) {
      console.error("Recommendation fetch error:", error);
    }
  };

  // Handle Tutee Registration Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const tuteeData = { email, name, idNumber, term, department, selectedUnit };

    try {
      setStatus("Submitting...");

      const res = await fetch("http://localhost:5000/tutees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tuteeData),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus(data.message || "Error submitting tutee data.");
        return;
      }

      setStatus("Tutee registered successfully!");
      setEmail("");
      setName("");
      setIdNumber("");
      setTerm("FS");
      setDepartment("");
      setSelectedUnit("");

      // Redirect to Tutee Dashboard
      setTimeout(() => {
        navigate("/tutee-dashboard", {
          state: { user: { name, email, role: "tutee" } },
        });
      }, 1000);

      // Fetch tutor recommendations
      await fetchRecommendations(department, selectedUnit);
    } catch (error: unknown) {
      console.error("Error submitting tutee form:", error);
      setStatus("Server error — check your backend connection.");
    }
  };

  return (
    <div className="tutee-container">
      <h2 className="tutee-title">Tutee Registration</h2>

      <form onSubmit={handleSubmit} className="tutee-form">
        <div>
          <label>Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <label>Full Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div>
          <label>ID Number</label>
          <input
            type="text"
            value={idNumber}
            onChange={(e) => setIdNumber(e.target.value)}
            required
          />
        </div>

        <div>
          <label>Term</label>
          <select
            value={term}
            onChange={(e) => setTerm(e.target.value as TermOption)}
          >
            <option value="FS">Fall Semester (FS)</option>
            <option value="SS">Summer Semester (SS)</option>
            <option value="US">Spring Semester (US)</option>
          </select>
        </div>

        <div>
          <label>Department</label>
          <select
            value={department}
            onChange={(e) => {
              setDepartment(e.target.value);
              setSelectedUnit("");
            }}
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

        {department && (
          <div>
            <label>Select Unit</label>
            <select
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
              required
            >
              <option value="">-- Select Unit --</option>
              {departmentUnits[department].map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="tutee-btn-container">
          <button type="submit" className="submit-btn">
            Submit
          </button>
        </div>

        {status && <p className="status-message">{status}</p>}
      </form>

      {recommendations.length > 0 && (
        <div className="recommendations-container">
          <h3 className="recommendations-title">
            Available Tutors Matching Your Unit
          </h3>
          <ul>
            {recommendations.map((tutor, index) => (
              <li key={index} className="recommendation-item">
                <strong>{tutor.name}</strong> — {tutor.email}
                <br />
                <span>Units: {tutor.units}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Tutee;
