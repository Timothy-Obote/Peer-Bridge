import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./TutorProfile.css";

interface Course {
  id: number;
  code: string;
  name: string;
}

interface UserProfile {
  id: number;
  email: string;
  name: string;
  id_number?: string;
  whatsapp?: string;
  department?: string | null;
  term?: string | null;
  term_year?: string | null;
  avatar_url?: string;          // kept for future use
  is_online?: boolean;
  last_seen?: string;
}

const TutorProfile = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [selectedCourses, setSelectedCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const token = localStorage.getItem("token");

    if (!user.id) {
      navigate("/");
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch profile
        const profileRes = await fetch(`${import.meta.env.VITE_API_URL}/api/users/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const profileData = await profileRes.json();
        setProfile(profileData);

        // Fetch tutor's courses
        const coursesRes = await fetch(`${import.meta.env.VITE_API_URL}/api/tutor/${user.id}/courses`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const courses = await coursesRes.json();
        setSelectedCourses(courses);
      } catch (error) {
        console.error("Error fetching profile data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  // Generate initials from name
  const getInitials = () => {
    if (!profile?.name) return "?";
    const names = profile.name.trim().split(" ");
    if (names.length === 0) return "?";
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  // Format full semester (e.g., "Fall 2026")
  const getFullSemester = () => {
    if (!profile?.term || !profile?.term_year) return "Not set";
    const termMap: Record<string, string> = {
      FS: "Fall",
      SS: "Summer",
      US: "Spring",
    };
    return `${termMap[profile.term] || profile.term} ${profile.term_year}`;
  };

  if (loading) return <div className="loading-spinner">Loading profile...</div>;

  return (
    <div className="profile-page">
      <div className="profile-card">
        {/* Avatar Section - Using first letter */}
        <div className="profile-avatar-section">
          <div className="avatar-wrapper">
            <div className="initials-avatar">{getInitials()}</div>
            {profile?.is_online !== undefined && (
              <span className={`online-badge ${profile.is_online ? "online" : "offline"}`}>
                {profile.is_online ? "● Online" : "○ Offline"}
              </span>
            )}
          </div>
        </div>

        {/* Name */}
        <h1 className="profile-name">{profile?.name || "Tutor"}</h1>

        {/* Contact Information */}
        <div className="contact-info">
          <p className="profile-email">{profile?.email}</p>
          <p className="profile-phone">{profile?.whatsapp || "Phone not provided"}</p>
        </div>

        {/* Last seen (optional) */}
        {profile?.last_seen && (
          <p className="profile-last-seen">
            Last seen: {new Date(profile.last_seen).toLocaleString()}
          </p>
        )}

        {/* Details Grid */}
        <div className="profile-details">
          <div className="detail-item">
            <span className="detail-label">School ID</span>
            <span className="detail-value">{profile?.id_number || "—"}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Semester</span>
            <span className="detail-value">{getFullSemester()}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Department</span>
            <span className="detail-value">{profile?.department || "Not set"}</span>
          </div>
        </div>

        {/* Courses Taught */}
        <div className="courses-section">
          <h3>Courses I Teach</h3>
          {selectedCourses.length > 0 ? (
            <div className="course-chips">
              {selectedCourses.map((course) => (
                <span key={course.id} className="course-chip">
                  {course.code} – {course.name}
                </span>
              ))}
            </div>
          ) : (
            <p className="no-courses">No courses assigned yet.</p>
          )}
        </div>

        {/* Edit button placeholder */}
        <button className="edit-profile-btn" onClick={() => navigate("/tutor/profile/edit")}>
          Edit Profile
        </button>
      </div>
    </div>
  );
};

export default TutorProfile;