import React, { useState } from "react";
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
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [term, setTerm] = useState<TermOption>("FS");
  const [department, setDepartment] = useState("");
  const [selectedUnit, setSelectedUnit] = useState<string>("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tuteeData = { email, name, idNumber, term, department, selectedUnit };
    console.log("Tutee Form Data:", tuteeData);
    alert("Tutee form submitted! Check console for details.");
  };

  return (
    <div className="tutee-bg">
      <div className="max-w-xl mx-auto mt-10 p-6 bg-white shadow-md rounded-2xl tutee-content">
        <h2 className="text-2xl font-bold mb-4 text-center">Tutee Registration</h2>

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
                setSelectedUnit(""); // reset unit when department changes
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
                Unit for {department}
              </label>
              <select
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
                className="w-full border rounded-lg p-2"
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

          {/* Submit */}
          <div className="text-center">
            <button
              type="submit"
              className="bg-yellow-500 text-blue-900 px-4 py-2 rounded-lg hover:bg-yellow-400"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Tutee;