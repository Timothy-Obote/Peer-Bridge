import "./App.css";
import SignIn from "./SignInForm";               // new page component
import LoggedIn from "./LoggedIn";
import Tutor from "./tutor";
import Tutee from "./tutee";
import TutorDashboard from "./TutorDashboard";
import TuteeDashboard from "./TuteeDashboard";
import AdminDashboard from "./Admin";

import { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,          // ← added missing import
} from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

// ---------------- HOME COMPONENT ----------------
function Home() {
  const [hovered, setHovered] = useState<string | null>(null);
  const navigate = useNavigate();               // ← added

  const previews: Record<string, string> = {
    Learn: "Access tutorials, study resources, and tips shared by top-performing peers.",
    "How it Works":
      "PeerBridge connects students needing academic help with volunteer tutors from their university.",
    Community:
      "Join study groups, mentorship programs, and peer-driven Q&A forums to grow together.",
  };

  // Navigate to sign-up page (role selection)
  const handleSignUpClick = () => {
    navigate("/dashboard");
  };

  // Navigate to sign-in page (instead of opening modal)
  const handleSignInClick = () => {
    navigate("/signin");
  };

  // Check if user is already logged in (auto-redirect)
  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      try {
        const userData = JSON.parse(user);
        const role = userData?.role;
        if (role === 'admin') window.location.href = '/admin-dashboard';
        else if (role === 'tutor') window.location.href = '/tutor-dashboard';
        else if (role === 'tutee') window.location.href = '/tutee-dashboard';
        else window.location.href = '/dashboard';
      } catch (e) {
        localStorage.removeItem('user');
      }
    }
  }, []);

  return (
    <div className="app-container">
      {/* Header */}
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

      {/* Modal removed – sign-in is now a separate page */}
    </div>
  );
}

// ---------------- PROTECTED ROUTE COMPONENT ----------------
interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const user = localStorage.getItem('user');
  
  if (!user) {
    return <Navigate to="/signin" replace />;   // redirect to signin, not home
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
        <Route path="/signin" element={<SignIn />} />          {/* new sign-in page */}
        <Route path="/dashboard" element={<LoggedIn />} />

        {/* Registration forms – public (no protection) */}
        <Route path="/tutor" element={<Tutor />} />
        <Route path="/tutee" element={<Tutee />} />

        {/* Dashboards – protected */}
        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tutor-dashboard"
          element={
            <ProtectedRoute allowedRoles={['tutor', 'admin']}>
              <TutorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tutee-dashboard"
          element={
            <ProtectedRoute allowedRoles={['tutee', 'admin']}>
              <TuteeDashboard />
            </ProtectedRoute>
          }
        />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}