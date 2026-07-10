import {
  FaHome,
  FaUsers,
  FaBuilding,
  FaCalendarCheck,
  FaCog,
  FaSignOutAlt,
  FaUserShield,
  FaHistory,
  FaChartLine,
  FaFileExport,
  FaEnvelope,
  FaCube,
  FaUserCircle,
  FaChartBar,
  FaCalendarAlt,
  FaShieldAlt,
  FaDesktop,
  FaGraduationCap,
} from "react-icons/fa";
import { NavLink, useNavigate } from "react-router-dom";
import { recordCurrentUserLogout } from "../../services/activityService";
import { logoutCurrentSession } from "../../services/sessionService";
import "./sidebar.css";

function Sidebar({ sidebarCollapsed }) {
  const navigate = useNavigate();
  const role = localStorage.getItem("role")?.toLowerCase();
  const userName = localStorage.getItem("userName") || localStorage.getItem("name") || "User";

  const handleLogout = async () => {
    recordCurrentUserLogout();
    try {
      await logoutCurrentSession();
    } catch {
      // best-effort; do not block logout on session service errors
    }
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("currentUser");
    localStorage.removeItem("userName");
    localStorage.removeItem("name");
    localStorage.removeItem("email");
    localStorage.removeItem("status");
    localStorage.removeItem("employeeId");
    localStorage.removeItem("suspension_date");
    localStorage.removeItem("suspension_reason");
    localStorage.removeItem("suspended_by");
    localStorage.removeItem("session_token");
    navigate("/");
  };

  return (
    <aside className={`sidebar ${sidebarCollapsed ? "collapsed" : ""}`}>
      <div className="sidebar-brand">
        <div className="brand-icon"><FaCube /></div>
        {!sidebarCollapsed && (
          <div>
            <h2>EEMS</h2>
            <p>Enterprise System</p>
          </div>
        )}
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/dashboard"><FaHome />{!sidebarCollapsed && <span>Dashboard</span>}</NavLink>
        <NavLink to="/employees"><FaUsers />{!sidebarCollapsed && <span>Employees</span>}</NavLink>

        {role === "user" && (
          <>
            <NavLink to="/attendance"><FaCalendarCheck />{!sidebarCollapsed && <span>Attendance</span>}</NavLink>
            {/* <NavLink to="/holidays"><FaCalendarAlt />{!sidebarCollapsed && <span>Holiday Calendar</span>}</NavLink> */}
            <NavLink to="/my-profile"><FaUserCircle />{!sidebarCollapsed && <span>My Profile</span>}</NavLink>
            <NavLink to="/skills-certifications"><FaGraduationCap />{!sidebarCollapsed && <span>Skills & Certifications</span>}</NavLink>
            <NavLink to="/login-devices"><FaShieldAlt />{!sidebarCollapsed && <span>Login Devices</span>}</NavLink>
            <NavLink to="/settings"><FaCog />{!sidebarCollapsed && <span>Settings</span>}</NavLink>
          </>
        )}

        {role === "admin" && (
          <>
            <NavLink to="/departments"><FaBuilding />{!sidebarCollapsed && <span>Departments</span>}</NavLink>
            <NavLink to="/attendance"><FaCalendarCheck />{!sidebarCollapsed && <span>Attendance</span>}</NavLink>
            <NavLink to="/holidays"><FaCalendarAlt />{!sidebarCollapsed && <span>Holiday Calendar</span>}</NavLink>
            <NavLink to="/my-profile"><FaUserCircle />{!sidebarCollapsed && <span>My Profile</span>}</NavLink>
            <NavLink to="/skills-certifications"><FaGraduationCap />{!sidebarCollapsed && <span>Skills & Certifications</span>}</NavLink>
            <NavLink to="/profile-completion"><FaChartBar />{!sidebarCollapsed && <span>Profile Completion</span>}</NavLink>
            {/* <NavLink to="/role-requests"><FaBuilding />{!sidebarCollapsed && <span>Role Request</span>}</NavLink> */}
            <NavLink to="/login-devices"><FaShieldAlt />{!sidebarCollapsed && <span>Login Devices</span>}</NavLink>
            <NavLink to="/session-monitor"><FaDesktop />{!sidebarCollapsed && <span> Session Monitor</span>}</NavLink>
            <NavLink to="/audit-logs"><FaHistory />{!sidebarCollapsed && <span>Audit Logs</span>}</NavLink>
            <NavLink to="/tracking"><FaChartLine />{!sidebarCollapsed && <span>Tracking</span>}</NavLink>
            <NavLink to="/data-export"><FaFileExport />{!sidebarCollapsed && <span>Data Export Center</span>}</NavLink>
            <NavLink to="/users"><FaUserShield />{!sidebarCollapsed && <span>Users</span>}</NavLink>
            <NavLink to="/reactivation-requests"><FaEnvelope />{!sidebarCollapsed && <span>Reactivations</span>}</NavLink>
            <NavLink to="/settings"><FaCog />{!sidebarCollapsed && <span>Settings</span>}</NavLink>
          </>
        )}
      </nav>

      <button className="logout-btn" onClick={handleLogout}>
        <FaSignOutAlt />{!sidebarCollapsed && <span>Logout</span>}
      </button>

      <div className="sidebar-user">
        <div className="sidebar-avatar">{userName.charAt(0).toUpperCase()}</div>
        {!sidebarCollapsed && (
          <div>
            <strong>{userName}</strong>
            <small>{role === "admin" ? "Administrator" : "Employee"}</small>
          </div>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;