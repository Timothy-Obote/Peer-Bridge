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
            setFormData(prev => ({ ...prev, selected_courses: [] }));
        } else {
            setAvailableCourses([]);
        }
    }, [formData.program_id]);

    const fetchPrograms = async () => {
        setLoading(prev => ({ ...prev, programs: true }));
        try {
            const data = await tutorService.fetchPrograms();
            if (data && (data.undergraduate || data.graduate)) {
                setPrograms(data);
            } else {
                console.error("Invalid programs data format:", data);
                showStatus("error", "Failed to load programs. Invalid data format.");
            }
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
            
            if (!response.ok) {
                throw new Error(`Failed to fetch courses: ${response.status}`);
            }
            
            const data = await response.json();
            
            console.log("API Response:", data);

            // Ensure data is an array
            if (!Array.isArray(data)) {
                console.error("API response is not an array:", data);
                setAvailableCourses([]);
                showStatus("error", "Invalid courses data received.");
                return;
            }

            // Transform the data to match Course interface
            const transformedCourses: Course[] = data.map(item => {
                // Log each item for debugging
                console.log("Course item:", item);

                return {
                    id: item.id || 0,
                    unit_code: item.code || item.unit_code || item.course_code || "N/A",
                    unit_name: item.name || item.unit_name || item.course_name || "Unknown Course",
                    credits: item.credits || 3
                };
            });

            console.log("Transformed courses:", transformedCourses);
            setAvailableCourses(transformedCourses);

            // Update department field
            if (programs?.undergraduate || programs?.graduate) {
                const allPrograms = [
                    ...(programs.undergraduate || []), 
                    ...(programs.graduate || [])
                ];
                const selectedProgram = allPrograms.find(p => p.id === programId);
                if (selectedProgram) {
                    setFormData(prev => ({ ...prev, department: selectedProgram.program_name }));
                }
            }
        } catch (error) {
            console.error("Error fetching courses:", error);
            showStatus("error", "Could not load courses for this program.");
            setAvailableCourses([]);
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

        // Validation
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

        // Prepare submission data
        const submissionData = {
            email: formData.email,
            password: formData.password,
            name: formData.name,
            id_number: formData.idNumber || "",
            program_level: formData.program_level,
            program_id: formData.program_id,
            selectedCourses: formData.selected_courses,
            term: formData.term,
            department: formData.department || "PACS Department"
        };

        console.log("Submitting:", submissionData);

        setLoading(prev => ({ ...prev, submit: true }));
        showStatus("info", "Processing registration...");

        try {
            await tutorService.registerTutor(submissionData);
            showStatus("success", "Registration successful! Redirecting...");

            // Reset form
            setFormData({
                email: "",
                password: "",
                name: "",
                idNumber: "",
                program_level: "",
                program_id: "",
                selected_courses: [],
                term: "FS",
                department: ""
            });
            setAvailableCourses([]);

            setTimeout(() => navigate("/tutor-dashboard"), 2000);
        } catch (error: any) {
            console.error("Registration error:", error);
            showStatus("error", error.message || "Registration failed");
        } finally {
            setLoading(prev => ({ ...prev, submit: false }));
        }
    };

    const showStatus = (type: string, message: string) => {
        setStatus({ type, message });
        setTimeout(() => setStatus({ type: "", message: "" }), 5000);
    };


    return (
        <div className="tutor-container">
            <div className="tutor-card">
                <div className="tutor-header">
                    <h2 className="tutor-title">Tutor Registration</h2>
                    <p className="tutor-subtitle">PACS Department - Academic Support</p>
                </div>

                <form onSubmit={handleSubmit} className="tutor-form">
                    {/* Personal Information */}
                    <div className="form-section">
                        <h3>Personal Information</h3>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Full Name *</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    required
                                    disabled={loading.submit}
                                />
                            </div>

                            <div className="form-group">
                                <label>Email *</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    required
                                    disabled={loading.submit}
                                />
                            </div>

                            <div className="form-group">
                                <label>Password *</label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    required
                                    minLength={6}
                                    disabled={loading.submit}
                                />
                            </div>

                            <div className="form-group">
                                <label>Student ID *</label>
                                <input
                                    type="text"
                                    name="idNumber"
                                    value={formData.idNumber}
                                    onChange={handleInputChange}
                                    required
                                    disabled={loading.submit}
                                />
                            </div>

                            <div className="form-group">
                                <label>Semester *</label>
                                <select
                                    name="term"
                                    value={formData.term}
                                    onChange={handleInputChange}
                                    required
                                    disabled={loading.submit}
                                >
                                    <option value="FS">Fall Semester</option>
                                    <option value="SS">Summer Semester</option>
                                    <option value="US">Spring Semester</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Academic Program */}
                    <div className="form-section">
                        <h3>Academic Program</h3>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Program Level *</label>
                                <select
                                    name="program_level"
                                    value={formData.program_level}
                                    onChange={handleInputChange}
                                    required
                                    disabled={loading.programs || loading.submit}
                                >
                                    <option value="">Select Program Level</option>
                                    <option value="undergraduate">Undergraduate</option>
                                    <option value="graduate">Graduate</option>
                                </select>
                            </div>

                            {formData.program_level && (
                                <div className="form-group">
                                    <label>Degree Program *</label>
                                    <select
                                        name="program_id"
                                        value={formData.program_id}
                                        onChange={handleInputChange}
                                        required
                                        disabled={loading.programs || loading.submit}
                                    >
                                        <option value="">Select Program</option>
                                        {programs[formData.program_level]?.map(program => (
                                            <option key={program.id} value={program.id}>
                                                {program.program_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Course Selection */}
                    {formData.program_id && (
                        <div className="form-section">
                            <h3>Course Selection ({formData.selected_courses.length}/2)</h3>
                            
                            {loading.courses ? (
                                <div>Loading courses...</div>
                            ) : availableCourses.length === 0 ? (
                                <div>No courses available for this program</div>
                            ) : (
                                <div className="courses-grid">
                                    {availableCourses.map(course => (
                                        <div
                                            key={course.id}
                                            className={`course-card ${formData.selected_courses.includes(course.id) ? 'selected' : ''}`}
                                            onClick={() => handleCourseToggle(course.id)}
                                        >
                                            <div>{course.unit_code}</div>
                                            <div>{course.unit_name}</div>
                                            <div>{course.credits} credits</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading.submit || formData.selected_courses.length === 0}
                        className="submit-button"
                    >
                        {loading.submit ? "Processing..." : "Register as Tutor"}
                    </button>
                </form>

                {/* Status Messages */}
                {status.message && (
                    <div className={`status-message ${status.type}`}>
                        {status.message}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Tutor;