import React, { useState } from "react";
import "./tutor.css"; 

type TermOption = "FS" | "SS" | "US";

interface UnitMap {
  [key: string]: string[];
}

// Example department → units mapping
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

  const handleUnitSelection = (unit: string) => {
    if (selectedUnits.includes(unit)) {
      setSelectedUnits(selectedUnits.filter((u) => u !== unit));
    } else {
      setSelectedUnits([...selectedUnits, unit]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tutorData = { email, name, idNumber, term, department, selectedUnits };
    console.log("Tutor Form Data:", tutorData);
    alert("Tutor form submitted! Check console for details.");
  };

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white shadow-md rounded-2xl">
      <h2 className="text-2xl font-bold mb-4 text-center">Tutor Registration</h2>

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
              setSelectedUnits([]); // reset units when department changes
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

        {/* Submit */}
        <div className="text-center">
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Submit
          </button>
        </div>
      </form>
    </div>
  );
};

export default Tutor;
