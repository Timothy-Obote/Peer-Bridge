import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./tutee.css";

type TermOption = "FS" | "SS" | "US";

interface UnitMap {
  [key: string]: string[];
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
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [term, setTerm] = useState<TermOption>("FS");
  const [department, setDepartment] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("");
  const [status, setStatus] = useState("");

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

      // Redirect to Tutee Dashboard after registration
      setTimeout(() => navigate("/tutee-dashboard"), 1000);
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
    </div>
  );
};

export default Tutee;
