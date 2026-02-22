import { useEffect, useState } from "react";

interface Tutor {
  id: number;
  name: string;
  email: string;
  department: string;
  term: string;
  units: string;
  created_at: string;
}

interface Tutee {
  id: number;
  name: string;
  email: string;
  department: string;
  term: string;
  units: string;
  created_at: string;
}

const AdminUsers = () => {
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [tutees, setTutees] = useState<Tutee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (loading) return <div className="loading-screen">Loading users...</div>;
  if (error) return <div className="error-message">Error: {error}</div>;

  return (
    <section className="user-section">
      <h2>User Management</h2>
      <p>Manage all registered tutors and tutees below.</p>

      <h3>Registered Tutors</h3>
      <div className="table-container">
        <table className="user-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Department</th>
              <th>Term</th>
              <th>Units</th>
              <th>Created At</th>
            </tr>
          </thead>
          <tbody>
            {tutors.map((t) => (
              <tr key={t.id}>
                <td>{t.id}</td>
                <td>{t.name}</td>
                <td>{t.email}</td>
                <td>{t.department}</td>
                <td>{t.term}</td>
                <td>{t.units}</td>
                <td>{new Date(t.created_at).toLocaleString()}</td>
              </tr>
            ))}
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
              <th>Term</th>
              <th>Units</th>
              <th>Created At</th>
            </tr>
          </thead>
          <tbody>
            {tutees.map((t) => (
              <tr key={t.id}>
                <td>{t.id}</td>
                <td>{t.name}</td>
                <td>{t.email}</td>
                <td>{t.department}</td>
                <td>{t.term}</td>
                <td>{t.units}</td>
                <td>{new Date(t.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default AdminUsers;