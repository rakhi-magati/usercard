import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Navbar from "../Components/Navbar/Navbar";
import Sidebar from "../Components/Sidebar/Sidebar";
import { touchSession } from "../services/sessionService";
import "./DashboardLayout.css";

const SESSION_LOCAL_KEYS = [
  "token",
  "role",
  "currentUser",
  "userName",
  "name",
  "email",
  "status",
  "employeeId",
  "suspension_date",
  "suspension_reason",
  "suspended_by",
  "session_token",
];

function DashboardLayout({
  darkMode,
  setDarkMode,
  sidebarCollapsed,
  setSidebarCollapsed,
}) {
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    const checkSession = async () => {
      const result = await touchSession();
      if (cancelled || !result) return;

      // The backend only reports a status other than "Active" once the
      // session has actually been logged out, expired, or revoked (e.g. by
      // an admin via Force Logout / Revoke). Treat that as an immediate
      // signal to kick the user out of the app on this device.
      if (result.status && result.status !== "Active") {
        SESSION_LOCAL_KEYS.forEach((key) => localStorage.removeItem(key));
        navigate("/", {
          replace: true,
          state: {
            sessionEnded: true,
            reason: result.termination_reason || result.status,
          },
        });
      }
    };

    checkSession();
    const interval = setInterval(checkSession, 60000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [navigate]);

  return (
    <div
      className={`dashboard-layout ${darkMode
          ? "dark-mode"
          : "light-mode"
        }`}
    >
      <Sidebar
         sidebarCollapsed={sidebarCollapsed}
      
      />

      <div className={`main-section ${sidebarCollapsed ? "collapsed" : ""}`}>
        <Navbar
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          sidebarCollapsed={sidebarCollapsed}
          setSidebarCollapsed={setSidebarCollapsed}
        />

        <div className="page-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default DashboardLayout;

