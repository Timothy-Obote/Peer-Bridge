import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import "./DashboardLayout.css";

type DashboardRole = "tutor" | "tutee";

interface DashboardLayoutProps {
  role: DashboardRole;
}

const navigationByRole: Record<DashboardRole, { label: string; path: string }[]> = {
  tutor: [
    { label: "Dashboard", path: "/tutor-dashboard" },
    { label: "My Sessions", path: "/tutor/sessions" },
    { label: "Performance Reports", path: "/tutor/performance" },
    { label: "View Matches", path: "/tutor/matches" },
    { label: "Profile", path: "/tutor/profile" },
  ],
  tutee: [
    { label: "Dashboard", path: "/tutee-dashboard" },
    { label: "My Sessions", path: "/tutee/sessions" },
    { label: "Feedback", path: "/tutee/feedback" },
    { label: "View Matches", path: "/tutee/matches" },
    { label: "Profile", path: "/tutee/profile" },
  ],
};

const DashboardLayout = ({ role }: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.classList.toggle("dashboard-menu-open", sidebarOpen);
    return () => document.body.classList.remove("dashboard-menu-open");
  }, [sidebarOpen]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/signin", { replace: true });
  };

  return (
    <div className="peer-dashboard" data-role={role}>
      <button
        type="button"
        className="peer-dashboard__menu-toggle"
        onClick={() => setSidebarOpen((open) => !open)}
        aria-label={sidebarOpen ? "Close menu" : "Open menu"}
        aria-expanded={sidebarOpen}
        aria-controls="peer-dashboard-navigation"
      >
        <span />
        <span />
        <span />
      </button>

      {sidebarOpen && (
        <button
          type="button"
          className="peer-dashboard__backdrop"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close navigation menu"
        />
      )}

      <aside
        id="peer-dashboard-navigation"
        className={`peer-dashboard__sidebar${sidebarOpen ? " is-open" : ""}`}
      >
        <div>
          <div className="peer-dashboard__brand">PeerBridge</div>
          <p className="peer-dashboard__section-label">{role} panel</p>
          <nav className="peer-dashboard__navigation" aria-label={`${role} navigation`}>
            {navigationByRole[role].map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end
                className={({ isActive }) =>
                  `peer-dashboard__nav-link${isActive ? " is-active" : ""}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <button type="button" className="peer-dashboard__logout" onClick={handleLogout}>
          Log out
        </button>
      </aside>

      <main className="peer-dashboard__main">
        <div className="peer-dashboard__content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
