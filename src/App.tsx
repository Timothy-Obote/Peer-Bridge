import "./App.css";
import SignIn from "./SignInForm";
import LoggedIn from "./LoggedIn";
import Tutor from "./tutor";
import Tutee from "./tutee";
import TutorDashboard from "./TutorDashboard";
import TutorSessions from "./TutorSessions";
import TutorMatches from "./TutorMatches";
import TutorPerformance from "./TutorPerformance";
import TutorProfile from "./TutorProfile";
import TuteeDashboard from "./TuteeDashboard";
import TuteeSessions from "./TuteeSessions";
import TuteeFeedback from "./TuteeFeedback";
import TuteeMatches from "./TuteeMatches";
import TuteeProfile from "./TuteeProfile";
import AdminDashboard from "./Admin";
import AdminOverview from "./AdminOverview";
import AdminUsers from "./AdminUsers";
import AdminReports from "./AdminReports";
import AdminSettings from "./AdminSettings";

import { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

// ---------------- HOME COMPONENT (unchanged) ----------------
function Home() {
  const [hovered, setHovered] = useState<string | null>(null);
  const navigate = useNavigate();

  const previews: Record<string, string> = {
    Learn: "Access tutorials, study resources, and tips shared by top-performing peers.",
    "How it Works":
      "PeerBridge connects students needing academic help with volunteer tutors from their university.",
    Community:
      "Join study groups, mentorship programs, and peer-driven Q&A forums to grow together.",
  };

  const handleSignUpClick = () => {
    navigate("/dashboard");
  };

  const handleSignInClick = () => {
    navigate("/signin");
  };

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      try {
        const userData = JSON.parse(user);
        const role = userData?.role;
        if (role === 'admin') {
          navigate('/admin-dashboard', { replace: true });
        } else if (role === 'tutor') {
          navigate('/tutor-dashboard', { replace: true });
        } else if (role === 'tutee') {
          navigate('/tutee-dashboard', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      } catch (e) {
        localStorage.removeItem('user');
      }
    }
  }, [navigate]);

  return (
    <div className="app-container">
      {/* Header & rest of Home component (unchanged) */}
      <header className="header relative">
        <div className="logo">PeerBridge</div>
        <nav className="main-nav">
          {Object.keys(previews).map((item) => (
            <a
              key={item}
              href={`#${item.replace(/\s+/g, "")}`}
              onMouseEnter={() => setHovered(item)}
              onMouseLeave={() => setHovered(null)}
            >
              {item}
            </a>
          ))}
        </nav>
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="hover-box"
            >
              <h3>{hovered}</h3>
              <p>{previews[hovered]}</p>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="auth-buttons">
          <button className="sign-in" onClick={handleSignInClick}>
            Sign In
          </button>
          <button className="sign-up" onClick={handleSignUpClick}>
            Sign Up
          </button>
        </div>
      </header>

      <main className="main-bg">
        <div className="main-content">
          <h1>Placement And Career Services</h1>
          <p>
            Struggling in a Unit? Worry no more... <br />
            Get Help from Your Peers and raise your GPA.
          </p>
        </div>
        <div className="main-image"></div>
      </main>

      <motion.section
        id="Learn"
        className="section learn-section"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        <h2>Learn</h2>
        <p>
          Access tutorials, shared notes, and study materials from top-performing students at USIU.
        </p>
      </motion.section>

      <motion.section
        id="HowitWorks"
        className="section how-section"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        <h2>How It Works</h2>
        <p>
          PeerBridge connects students who need academic help with tutors from their own university.
          Simply sign up, choose your role, and start learning or tutoring.
        </p>
      </motion.section>

      <motion.section
        id="Community"
        className="section community-section"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        <h2>Community</h2>
        <p>
          Join a thriving peer-learning community. Engage in discussions, join study groups,
          and support others while sharpening your own skills.
        </p>
      </motion.section>

      <footer className="footer">
        <p>© {new Date().getFullYear()} PeerBridge · Connecting Students at USIU Africa</p>
      </footer>
    </div>
  );
}

// ---------------- PROTECTED ROUTE COMPONENT (unchanged) ----------------
interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const user = localStorage.getItem('user');
  
  if (!user) {
    return <Navigate to="/signin" replace />;
  }
  
  try {
    const userData = JSON.parse(user);
    
    if (allowedRoles && !allowedRoles.includes(userData.role)) {
      if (userData.role === 'admin') return <Navigate to="/admin-dashboard" replace />;
      if (userData.role === 'tutor') return <Navigate to="/tutor-dashboard" replace />;
      if (userData.role === 'tutee') return <Navigate to="/tutee-dashboard" replace />;
      return <Navigate to="/dashboard" replace />;
    }
    
    return <>{children}</>;
  } catch (e) {
    localStorage.removeItem('user');
    return <Navigate to="/signin" replace />;
  }
}

// ---------------- APP COMPONENT ----------------
export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/dashboard" element={<LoggedIn />} />

        {/* Registration forms – public */}
        <Route path="/tutor" element={<Tutor />} />
        <Route path="/tutee" element={<Tutee />} />

        {/* Admin Dashboard with nested routes */}
        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminOverview />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        {/* Tutor Dashboard – no nested routes here, but sub-routes are separate */}
        <Route
          path="/tutor-dashboard"
          element={
            <ProtectedRoute allowedRoles={['tutor', 'admin']}>
              <TutorDashboard />
            </ProtectedRoute>
          }
        />

        {/* Tutee Dashboard – separate */}
        <Route
          path="/tutee-dashboard"
          element={
            <ProtectedRoute allowedRoles={['tutee', 'admin']}>
              <TuteeDashboard />
            </ProtectedRoute>
          }
        />

        {/* Tutor sub‑routes */}
        <Route
          path="/tutor/sessions"
          element={
            <ProtectedRoute allowedRoles={['tutor', 'admin']}>
              <TutorSessions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tutor/matches"
          element={
            <ProtectedRoute allowedRoles={['tutor', 'admin']}>
              <TutorMatches />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tutor/performance"
          element={
            <ProtectedRoute allowedRoles={['tutor', 'admin']}>
              <TutorPerformance />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tutor/profile"
          element={
            <ProtectedRoute allowedRoles={['tutor', 'admin']}>
              <TutorProfile />
            </ProtectedRoute>
          }
        />

        {/* Tutee sub‑routes */}
        <Route
          path="/tutee/sessions"
          element={
            <ProtectedRoute allowedRoles={['tutee', 'admin']}>
              <TuteeSessions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tutee/feedback"
          element={
            <ProtectedRoute allowedRoles={['tutee', 'admin']}>
              <TuteeFeedback />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tutee/matches"
          element={
            <ProtectedRoute allowedRoles={['tutee', 'admin']}>
              <TuteeMatches />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tutee/profile"
          element={
            <ProtectedRoute allowedRoles={['tutee', 'admin']}>
              <TuteeProfile />
            </ProtectedRoute>
          }
        />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}