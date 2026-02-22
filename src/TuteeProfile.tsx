import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

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
  department_id: number | null;
  department: string | null;
  term: string | null;
}

const TuteeProfile = () => {
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
        setProfile(profileData);

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

        // Fetch tutee's current needed courses
        const tuteeCoursesRes = await fetch(`/api/tutee/${user.id}/courses`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const tuteeCourses = await tuteeCoursesRes.json();
        setSelectedCourses(tuteeCourses.map((c: Course) => c.id));
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
      // Update profile
      await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: profile?.name,
          department_id: profile?.department_id,
          term: profile?.term,
        }),
      });

      // Update needed courses
      await fetch(`/api/tutee/${user.id}/courses`, {
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

  if (loading) return <div className="loading">Loading profile...</div>;

  return (
    <div className="page-container">
      <h1>My Profile</h1>
      <div className="profile-form">
        <div className="form-group">
          <label>Email</label>
          <input type="email" value={profile?.email || ""} disabled />
        </div>
        <div className="form-group">
          <label>Full Name</label>
          <input
            type="text"
            value={profile?.name || ""}
            onChange={(e) => setProfile({ ...profile!, name: e.target.value })}
          />
        </div>
        <div className="form-group">
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
        <div className="form-group">
          <label>Term</label>
          <input
            type="text"
            value={profile?.term || ""}
            onChange={(e) => setProfile({ ...profile!, term: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Courses I Need</label>
          <div className="courses-checkbox-grid">
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
                {course.code} – {course.name}
              </label>
            ))}
          </div>
        </div>

        <button onClick={handleSave} disabled={saving} className="save-btn">
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
};

export default TuteeProfile;