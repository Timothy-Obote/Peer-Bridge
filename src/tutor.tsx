import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { tutorService } from "./services/tutorService";
import type { Program, Course, TutorRegistrationData } from "./types/course.types";
import "./tutor.css";

const Tutor: React.FC = () => {
    const navigate = useNavigate();

    // Form state
    const [formData, setFormData] = useState<TutorRegistrationData>({
        email: "",
        password: "",
        name: "",
        idNumber: "",
        term: "FS",
        program_level: "",
        program_id: "",
        selected_courses: [],
        department: ""
    });

    // UI state
    const [programs, setPrograms] = useState<{
        undergraduate: Program[];
        graduate: Program[];
    }>({ undergraduate: [], graduate: [] });

    const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState({
        programs: false,
        courses: false,
        submit: false
    });
    const [status, setStatus] = useState({ type: "", message: "" });

    // Fetch programs on mount
    useEffect(() => {
        fetchPrograms();
    }, []);

    // Fetch courses when program is selected
    useEffect(() => {
        if (formData.program_id) {
            fetchProgramCourses(Number(formData.program_id));
        } else {
            setAvailableCourses([]);
        }
    }, [formData.program_id]);

    const fetchPrograms = async () => {
        setLoading(prev => ({ ...prev, programs: true }));
        try {
            const data = await tutorService.fetchPrograms();
            setPrograms(data);
        } catch (error) {
            showStatus("error", "Failed to load programs. Please refresh.");
            console.error("Error fetching programs:", error);
        } finally {
            setLoading(prev => ({ ...prev, programs: false }));
        }
    };

    const fetchProgramCourses = async (programId: number) => {
        setLoading(prev => ({ ...prev, courses: true }));
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/programs/${programId}/courses`);
            if (!response.ok) throw new Error("Failed to fetch courses");
            const data = await response.json();

            // Map to the expected Course format (unit_code, unit_name)
            const mapped: Course[] = data.map((c: any) => ({
                id: c.id,
                unit_code: c.code,
                unit_name: c.name,
                credits: 3 // default
            }));

            setAvailableCourses(mapped);

            // Update department field with selected program's name
            const allPrograms = [...programs.undergraduate, ...programs.graduate];
            const selectedProgram = allPrograms.find(p => p.id === programId);
            if (selectedProgram) {
                setFormData(prev => ({ ...prev, department: selectedProgram.program_name }));
            }
        } catch (error) {
            console.error("Error fetching courses:", error);
            showStatus("error", "Could not load courses for this program.");
        } finally {
            setLoading(prev => ({ ...prev, courses: false }));
        }
    };

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        
        if (name === "program_level") {
            setFormData(prev => ({ 
                ...prev, 
                program_id: "",
                selected_courses: [],
                department: ""
            }));
            setAvailableCourses([]);
        }
        
        if (name === "program_id" && !value) {
            setFormData(prev => ({ 
                ...prev, 
                department: ""
            }));
        }
    };

    const handleCourseToggle = (courseId: number) => {
        setFormData(prev => {
            const current = [...prev.selected_courses];
            const index = current.indexOf(courseId);
            
            if (index === -1) {
                if (current.length < 2) {
                    current.push(courseId);
                } else {
                    showStatus("warning", "Maximum 2 courses allowed per tutor");
                    return prev;
                }
            } else {
                current.splice(index, 1);
            }
            
            return { ...prev, selected_courses: current };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.program_level) {
            showStatus("error", "Please select a program level");
            return;
        }

        if (!formData.program_id) {
            showStatus("error", "Please select a program");
            return;
        }

        if (formData.selected_courses.length === 0) {
            showStatus("error", "Please select at least one course");
            return;
        }

        console.log("Submitting tutor registration with department:", formData.department);

        setLoading(prev => ({ ...prev, submit: true }));
        showStatus("info", "Processing registration...");

        try {
            await tutorService.registerTutor(formData);
            showStatus("success", "Registration successful! Redirecting...");
            
            setFormData({
                email: "",
                password: "",
                name: "",
                idNumber: "",
                term: "FS",
                program_level: "",
                program_id: "",
                selected_courses: [],
                department: ""
            });
            setAvailableCourses([]);

            setTimeout(() => navigate("/tutor-dashboard"), 2000);
        } catch (error: any) {
            showStatus("error", error.message || "Registration failed");
            console.error("Registration error:", error);
        } finally {
            setLoading(prev => ({ ...prev, submit: false }));
        }
    };

    const showStatus = (type: string, message: string) => {
        setStatus({ type, message });
        setTimeout(() => setStatus({ type: "", message: "" }), 5000);
    };

    const getSelectedProgramName = () => {
        if (!formData.program_id) return "";
        const allPrograms = [...programs.undergraduate, ...programs.graduate];
        const program = allPrograms.find(p => p.id === formData.program_id);
        return program?.program_name || "";
    };

    return (
        <div className="tutor-container">
            <div className="tutor-card">
                <div className="tutor-header">
                    <h2 className="tutor-title">Tutor Registration</h2>
                    <p className="tutor-subtitle">PACS Department - Academic Support</p>
                </div>

                <form onSubmit={handleSubmit} className="tutor-form">
                    {/* SECTION 1: PERSONAL INFORMATION */}
                    <div className="form-section">
                        <div className="section-title">
                            <span className="section-number">01</span>
                            <h3>Personal Information</h3>
                        </div>
                        
                        <div className="form-grid">
                            <div className="form-group full-width">
                                <label>Full Name <span className="required">*</span></label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="As appears on official documents"
                                    required
                                    disabled={loading.submit}
                                />
                            </div>

                            <div className="form-group">
                                <label>Email Address <span className="required">*</span></label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    placeholder="tutor@usiu.co.ke"
                                    required
                                    disabled={loading.submit}
                                />
                            </div>

                            <div className="form-group">
                                <label>Password <span className="required">*</span></label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    placeholder="Create secure password"
                                    required
                                    disabled={loading.submit}
                                    minLength={6}
                                />
                                <span className="field-hint">Minimum 6 characters</span>
                            </div>

                            <div className="form-group">
                                <label>Student ID <span className="required">*</span></label>
                                <input
                                    type="text"
                                    name="idNumber"
                                    value={formData.idNumber}
                                    onChange={handleInputChange}
                                    placeholder="ID number"
                                    required
                                    disabled={loading.submit}
                                />
                            </div>

                            <div className="form-group">
                                <label>Academic Semester <span className="required">*</span></label>
                                <select
                                    name="term"
                                    value={formData.term}
                                    onChange={handleInputChange}
                                    required
                                    disabled={loading.submit}
                                >
                                    <option value="FS">Fall Semester (FS)</option>
                                    <option value="SS">Summer Semester (SS)</option>
                                    <option value="US">Spring Semester (US)</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 2: ACADEMIC PROGRAM */}
                    <div className="form-section">
                        <div className="section-title">
                            <span className="section-number">02</span>
                            <h3>Academic Program</h3>
                            <div className="credit-badge">
                                <span className="credit-text">Tutor Application</span>
                            </div>
                        </div>

                        <div className="form-grid">
                            <div className="form-group">
                                <label>Program Level <span className="required">*</span></label>
                                <select
                                    name="program_level"
                                    value={formData.program_level}
                                    onChange={handleInputChange}
                                    required
                                    disabled={loading.programs || loading.submit}
                                    className={loading.programs ? "loading" : ""}
                                >
                                    <option value="">-- Select Program Level --</option>
                                    <option value="undergraduate">Undergraduate (Bachelor's Degree)</option>
                                    <option value="graduate">Graduate (Master's/Doctoral)</option>
                                </select>
                                {loading.programs && (
                                    <span className="field-hint loading-hint">Loading programs...</span>
                                )}
                            </div>

                            {formData.program_level && (
                                <div className="form-group">
                                    <label>Degree Program <span className="required">*</span></label>
                                    <select
                                        name="program_id"
                                        value={formData.program_id}
                                        onChange={handleInputChange}
                                        required
                                        disabled={loading.programs || !programs[formData.program_level].length || loading.submit}
                                    >
                                        <option value="">-- Select Your Degree Program --</option>
                                        {programs[formData.program_level].map((program) => (
                                            <option key={program.id} value={program.id}>
                                                {program.program_name}
                                            </option>
                                        ))}
                                    </select>
                                    {programs[formData.program_level].length === 0 && (
                                        <span className="field-error">
                                            No programs available for this level
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* SECTION 3: COURSE SELECTION */}
                    {formData.program_id && (
                        <div className="form-section">
                            <div className="section-title">
                                <span className="section-number">03</span>
                                <h3>Course Selection</h3>
                                <div className="credit-badge">
                                    <span className="credit-text">{formData.selected_courses.length} / 2 Courses Selected</span>
                                </div>
                            </div>

                            <div className="program-info-panel">
                                <div className="program-info-row">
                                    <span className="info-label">Program of Study:</span>
                                    <span className="info-value">{getSelectedProgramName()}</span>
                                </div>
                                <div className="program-info-row">
                                    <span className="info-label">Registration Term:</span>
                                    <span className="info-value">
                                        {formData.term === 'FS' ? 'Fall Semester' : 
                                         formData.term === 'SS' ? 'Summer Semester' : 'Spring Semester'}
                                    </span>
                                </div>
                                <div className="program-info-row">
                                    <span className="info-label">Department:</span>
                                    <span className="info-value">{formData.department || getSelectedProgramName()}</span>
                                </div>
                                <div className="program-info-row highlight">
                                    <span className="info-label">Course Load:</span>
                                    <span className="info-value">
                                        {formData.selected_courses.length} Course(s) Selected
                                        {formData.selected_courses.length === 2 && ' (Maximum)'}
                                    </span>
                                </div>
                            </div>

                            {loading.courses ? (
                                <div className="academic-loading">
                                    <div className="academic-spinner"></div>
                                    <p>Loading course catalog...</p>
                                </div>
                            ) : (
                                <>
                                    {availableCourses.length === 0 ? (
                                        <div className="empty-state">
                                            <div className="empty-icon"></div>
                                            <h4>No Courses Available</h4>
                                            <p>This program currently has no available courses for tutor application.</p>
                                            <small>Please contact the Academic Registry for assistance.</small>
                                        </div>
                                    ) : (
                                        <div className="courses-table-wrapper">
                                            <table className="courses-table">
                                                <thead>
                                                    <tr>
                                                        <th style={{ width: "5%" }}></th>
                                                        <th style={{ width: "20%" }}>Course Code</th>
                                                        <th style={{ width: "65%" }}>Course Title</th>
                                                        <th style={{ width: "10%" }}>Credits</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {availableCourses.map((course) => {
                                                        const isSelected = formData.selected_courses.includes(course.id);
                                                        const isDisabled = formData.selected_courses.length >= 2 && !isSelected;
                                                        
                                                        return (
                                                            <tr 
                                                                key={course.id}
                                                                onClick={() => !loading.submit && !isDisabled && handleCourseToggle(course.id)}
                                                                className={`
                                                                    ${isSelected ? 'selected-row' : ''}
                                                                    ${isDisabled ? 'disabled-row' : ''}
                                                                    ${!isDisabled && !isSelected ? 'selectable-row' : ''}
                                                                `}
                                                            >
                                                                <td className="checkbox-cell">
                                                                    <div className={`custom-checkbox ${isSelected ? 'checked' : ''}`}>
                                                                        {isSelected && '✓'}
                                                                    </div>
                                                                </td>
                                                                <td className="code-cell">
                                                                    <span className="course-code-badge">{course.unit_code}</span>
                                                                </td>
                                                                <td className="title-cell">
                                                                    <span className="course-title">{course.unit_name}</span>
                                                                </td>
                                                                <td className="credits-cell">
                                                                    <span className="credit-badge">{course.credits || 3}</span>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                            <div className="table-footer">
                                                <span className="footer-note">
                                                    Maximum 2 courses per tutor. Click on a row to select/deselect.
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {/* SUBMIT SECTION */}
                    <div className="form-footer">
                        <button
                            type="submit"
                            disabled={
                                loading.submit ||
                                formData.selected_courses.length === 0 ||
                                !formData.program_id ||
                                loading.courses
                            }
                            className={`submit-button ${loading.submit ? 'submitting' : ''}`}
                            style={{ backgroundColor: '#FFC800', color: '#000000' }}
                        >
                            {loading.submit ? (
                                <>
                                    <span className="button-spinner"></span>
                                    Processing Registration...
                                </>
                            ) : (
                                <>
                                    Submit Tutor Application
                                </>
                            )}
                        </button>
                        <p className="form-notice">
                            By submitting this form, you confirm that you are qualified to tutor the selected courses
                            and agree to the university's tutor code of conduct.
                        </p>
                    </div>
                </form>

                {/* STATUS NOTIFICATIONS */}
                {status.message && (
                    <div className={`notification-panel ${status.type}`}>
                        <div className="notification-icon">
                            {status.type === 'success' && '✓'}
                            {status.type === 'error' && '✗'}
                            {status.type === 'warning' && '⚠'}
                            {status.type === 'info' && 'ℹ'}
                        </div>
                        <div className="notification-content">
                            <span className="notification-title">
                                {status.type === 'success' && 'Success'}
                                {status.type === 'error' && 'Error'}
                                {status.type === 'warning' && 'Warning'}
                                {status.type === 'info' && 'Notice'}
                            </span>
                            <span className="notification-message">{status.message}</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Tutor;