import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./TuteeProfile.css"; // Reuse the same modern styles (or create a shared Profile.css)

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
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
        const profileRes = await fetch(`/api/users/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const profileData = await profileRes.json();
        // Add mock fields if backend doesn't provide them yet
        setProfile({
          ...profileData,
          id_number: profileData.id_number || "S12345678",
          avatar_url: profileData.avatar_url || "https://via.placeholder.com/150",
          is_online: profileData.is_online ?? true,
          last_seen: profileData.last_seen || new Date().toISOString(),
        });

        // Fetch departments
        const deptRes = await fetch(`/api/departments`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDepartments(await deptRes.json());

        // Fetch all courses
        const coursesRes = await fetch(`/api/courses`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAllCourses(await coursesRes.json());

        // Fetch tutor's current courses
        const tutorCoursesRes = await fetch(`/api/tutor/${user.id}/courses`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const tutorCourses = await tutorCoursesRes.json();
        setSelectedCourses(tutorCourses.map((c: Course) => c.id));
      } catch (error) {
        console.error("Error fetching profile data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  const handleSave = async () => {
    setSaving(true);
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const token = localStorage.getItem("token");

    try {
      // Update profile (including id_number)
      await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: profile?.name,
          id_number: profile?.id_number,
          department_id: profile?.department_id,
          term: profile?.term,
        }),
      });

      // Update courses
      await fetch(`/api/tutor/${user.id}/courses`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ courseIds: selectedCourses }),
      });

      alert("Profile updated successfully");
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

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
        {/* Profile Header with Avatar & Basic Info */}
        <div className="profile-header">
          <div className="avatar-section">
            <img src={profile?.avatar_url} alt="Profile" className="avatar" />
            <div className={`online-indicator ${profile?.is_online ? "online" : "offline"}`}>
              {profile?.is_online ? "● Online" : "○ Offline"}
            </div>
          </div>
          <div className="header-info">
            <h1>{profile?.name || "Tutor"}</h1>
            <p className="last-seen">Last seen: {getLastSeenText()}</p>
          </div>
        </div>

        {/* Profile Form */}
        <div className="profile-form">
          <div className="form-row">
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={profile?.email || ""} disabled />
            </div>
            <div className="form-group">
              <label>School ID Number</label>
              <input
                type="text"
                value={profile?.id_number || ""}
                onChange={(e) => setProfile({ ...profile!, id_number: e.target.value })}
                placeholder="e.g. S12345678"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                value={profile?.name || ""}
                onChange={(e) => setProfile({ ...profile!, name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Term</label>
              <input
                type="text"
                value={profile?.term || ""}
                onChange={(e) => setProfile({ ...profile!, term: e.target.value })}
                placeholder="e.g. Spring 2025"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group full-width">
              <label>Department</label>
              <select
                value={profile?.department_id || ""}
                onChange={(e) =>
                  setProfile({ ...profile!, department_id: parseInt(e.target.value) })
                }
              >
                <option value="">Select Department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group full-width">
            <label>Courses I Teach</label>
            <div className="courses-grid">
              {allCourses.map((course) => (
                <label key={course.id} className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={selectedCourses.includes(course.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedCourses([...selectedCourses, course.id]);
                      } else {
                        setSelectedCourses(selectedCourses.filter((id) => id !== course.id));
                      }
                    }}
                  />
                  <span className="course-code">{course.code}</span> – {course.name}
                </label>
              ))}
            </div>
          </div>

          <div className="form-actions">
            <button onClick={handleSave} disabled={saving} className="save-btn">
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorProfile;