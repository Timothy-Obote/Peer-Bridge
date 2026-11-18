import { useEffect, useState } from "react";

// Extended interfaces to include new fields
interface UserAccount {
  id: number;
  name: string;
  email: string;
  role: "tutor" | "tutee";
  department: string;
  term: string;
  term_year?: string;
  gender?: string;
  year_of_study?: string;
  gpa?: string;
  whatsapp?: string;
  units: string;
  created_at: string;
  is_paused: boolean;
  is_flagged: boolean;
}

const AdminUsers = () => {
  const [tutors, setTutors] = useState<UserAccount[]>([]);
  const [tutees, setTutees] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [updatingUserId, setUpdatingUserId] = useState<number | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/overview`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch users");
        const data = await res.json();
        setTutors(data.tutors || []);
        setTutees(data.tutees || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  // Helper to format full semester (e.g., "Fall 2026")
  const formatSemester = (term?: string, term_year?: string) => {
    if (!term && !term_year) return "—";
    const termMap: Record<string, string> = {
      FS: "Fall",
      SS: "Summer",
      US: "Spring",
    };
    const termName = term ? (termMap[term] || term) : "";
    return `${termName} ${term_year || ""}`.trim() || "—";
  };

  const updateAccess = async (account: UserAccount, action: "pause" | "flag" | "resume") => {
    setActionError(null);
    setUpdatingUserId(account.id);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/admin/users/${account.id}/access`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ action }),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || data.error || "Unable to update account access.");
      }

      const updateAccount = (user: UserAccount): UserAccount =>
        user.id === account.id
          ? { ...user, is_paused: data.is_paused, is_flagged: data.is_flagged }
          : user;
      if (account.role === "tutor") setTutors((current) => current.map(updateAccount));
      else setTutees((current) => current.map(updateAccount));
    } catch (requestError) {
      setActionError(
        requestError instanceof Error ? requestError.message : "Unable to update account access."
      );
    } finally {
      setUpdatingUserId(null);
    }
  };

  const renderUsers = (users: UserAccount[]) =>
    users.map((user) => {
      const isBlocked = user.is_paused || user.is_flagged;
      const status = user.is_paused && user.is_flagged
        ? "Paused and flagged"
        : user.is_paused
          ? "Paused"
          : user.is_flagged
            ? "Flagged"
            : "Active";
      const statusClass = isBlocked ? "blocked" : "active";

      return (
        <tr key={user.id}>
          <td>{user.id}</td>
          <td>{user.name}</td>
          <td>{user.email}</td>
          <td>{user.department || "—"}</td>
          <td>{formatSemester(user.term, user.term_year)}</td>
          <td>{user.gender || "—"}</td>
          <td>{user.year_of_study || "—"}</td>
          <td>{user.gpa || "—"}</td>
          <td>{user.whatsapp || "—"}</td>
          <td>{user.units}</td>
          <td>{new Date(user.created_at).toLocaleString()}</td>
          <td><span className={`account-status ${statusClass}`}>{status}</span></td>
          <td className="account-actions">
            {isBlocked ? (
              <button
                type="button"
                className="account-action resume"
                onClick={() => updateAccess(user, "resume")}
                disabled={updatingUserId === user.id}
              >
                {updatingUserId === user.id ? "Updating..." : "Resume"}
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className="account-action pause"
                  onClick={() => updateAccess(user, "pause")}
                  disabled={updatingUserId === user.id}
                >
                  {updatingUserId === user.id ? "Updating..." : "Pause"}
                </button>
                <button
                  type="button"
                  className="account-action flag"
                  onClick={() => updateAccess(user, "flag")}
                  disabled={updatingUserId === user.id}
                >
                  Flag
                </button>
              </>
            )}
          </td>
        </tr>
      );
    });

  if (loading) return <div className="loading-screen">Loading users...</div>;
  if (error) return <div className="error-message">Error: {error}</div>;

  return (
    <section className="user-section">
      <h2>User Management</h2>
      <p>Manage all registered tutors and tutees below.</p>
      {actionError && <div className="error-message" role="alert">{actionError}</div>}

      <h3>Registered Tutors</h3>
      <div className="table-container">
        <table className="user-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Department</th>
              <th>Semester</th>
              <th>Gender</th>
              <th>Year</th>
              <th>GPA</th>
              <th>WhatsApp</th>
              <th>Selected Courses</th>
              <th>Created At</th>
              <th>Account Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {renderUsers(tutors)}
          </tbody>
        </table>
      </div>

      <h3>Registered Tutees</h3>
      <div className="table-container">
        <table className="user-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Department</th>
              <th>Semester</th>
              <th>Gender</th>
              <th>Year</th>
              <th>GPA</th>
              <th>WhatsApp</th>
              <th>Selected Courses</th>
              <th>Created At</th>
              <th>Account Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {renderUsers(tutees)}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default AdminUsers;

