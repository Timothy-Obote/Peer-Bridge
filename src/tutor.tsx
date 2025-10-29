import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./tutor.css";

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

const Tutor: React.FC = () => {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [term, setTerm] = useState<TermOption>("FS");
  const [department, setDepartment] = useState("");
  const [selectedUnits, setSelectedUnits] = useState<string[]>([]);
  const [status, setStatus] = useState("");
  const navigate = useNavigate();

  const handleUnitSelection = (unit: string) => {
    setSelectedUnits((prevUnits) =>
      prevUnits.includes(unit)
        ? prevUnits.filter((u) => u !== unit)
        : [...prevUnits, unit]
    );
  };

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
        console.error("Server returned error:", text);
        setStatus("Error — could not register tutor.");
        return;
      }

      setStatus("Tutor registered successfully!");
      // Clear form
      setEmail("");
      setName("");
      setIdNumber("");
      setTerm("FS");
      setDepartment("");
      setSelectedUnits([]);

      // Redirect to Tutor Dashboard
      navigate("/tutor-dashboard");
    } catch (error: unknown) {
      console.error("Error submitting tutor form:", error);
      setStatus("Server error — check your backend connection.");
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

        {/* Full Name */}
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
              Select Units for {department}
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

        {/* Submit Button */}
        <div className="text-center">
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700"
          >
            Submit
          </button>

          {status && (
            <p className="text-center text-sm text-gray-700 mt-3">{status}</p>
          )}
        </div>
      </form>
    </div>
  );
};

export default Tutor;
