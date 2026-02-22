import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./TutorProfile.css"; // we'll create this file below

interface Department {
  id: number;
  name: string;
}

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
  avatar_url?: string;
  is_online?: boolean;
  last_seen?: string;
  department_id: number | null;
  department: string | null;
  term: string | null;
}

const TutorProfile = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [, setAllCourses] = useState<Course[]>([]);
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
        // Add mock fields if backend doesn't provide them yet
        setProfile({
          ...profileData,
          id_number: profileData.id_number || "666548",
          avatar_url: profileData.avatar_url || "https://via.placeholder.com/150",
          is_online: profileData.is_online ?? true,
          last_seen: profileData.last_seen || new Date().toISOString(),
        });

        // Fetch departments (for department name)
        const deptRes = await fetch(`${import.meta.env.VITE_API_URL}/api/departments`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDepartments(await deptRes.json());

        // Fetch all courses
        const coursesRes = await fetch(`${import.meta.env.VITE_API_URL}/api/courses`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAllCourses(await coursesRes.json());

        // Fetch tutor's current courses (store full course objects)
        const tutorCoursesRes = await fetch(`${import.meta.env.VITE_API_URL}/api/tutor/${user.id}/courses`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const tutorCourses = await tutorCoursesRes.json();
        setSelectedCourses(tutorCourses);
      } catch (error) {
        console.error("Error fetching profile data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  const getLastSeenText = () => {
    if (!profile?.last_seen) return "Never";
    const last = new Date(profile.last_seen);
    const now = new Date();
    const diffMs = now.getTime() - last.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? "" : "s"} ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  };

  if (loading) return <div className="loading-spinner">Loading profile...</div>;

  return (
    <div className="profile-page">
      <div className="profile-card">
        {/* Avatar & Online Status */}
        <div className="profile-avatar-section">
          <div className="avatar-wrapper">
            <img src={profile?.avatar_url} alt="Profile" className="profile-avatar" />
            <span className={`online-badge ${profile?.is_online ? "online" : "offline"}`}>
              {profile?.is_online ? "● Online" : "○ Offline"}
            </span>
          </div>
        </div>

        {/* Name & Basic Info */}
        <h1 className="profile-name">{profile?.name || "Tutor"}</h1>
        <p className="profile-email">{profile?.email}</p>
        <p className="profile-last-seen">Last seen: {getLastSeenText()}</p>

        {/* Details Grid */}
        <div className="profile-details">
          <div className="detail-item">
            <span className="detail-label">School ID</span>
            <span className="detail-value">{profile?.id_number}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Semester</span>
            <span className="detail-value">{profile?.term || "Not set"}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Department</span>
            <span className="detail-value">
              {departments.find(d => d.id === profile?.department_id)?.name || profile?.department || "Not set"}
            </span>
          </div>
        </div>

        {/* Courses Taught */}
        <div className="courses-section">
          <h3>Courses I Teach</h3>
          {selectedCourses.length > 0 ? (
            <div className="course-chips">
              {selectedCourses.map((course) => (
                <span key={course.id} className="course-chip">
                  {course.code}
                </span>
              ))}
            </div>
          ) : (
            <p className="no-courses">No courses selected yet.</p>
          )}
        </div>

        {/* Optional Edit Button (for future) */}
        {/* <button className="edit-profile-btn">Edit Profile</button> */}
      </div>
    </div>
  );
};

export default TutorProfile;