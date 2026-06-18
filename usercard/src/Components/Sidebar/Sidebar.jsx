import {
  FaHome, FaUsers, FaBuilding, FaCalendarCheck,
  FaCog, FaSignOutAlt, FaUserShield, FaHistory,
  FaEnvelope, FaCheckCircle,
} from "react-icons/fa";
import { NavLink, useNavigate } from "react-router-dom";
import "./Sidebar.css";

function Sidebar({
  sidebarCollapsed,
}) {
  const navigate = useNavigate();
  const role = localStorage.getItem("role")?.toLowerCase();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("currentUser");
    localStorage.removeItem("userName");
    navigate("/");
  };

  console.log(
  "Sidebar collapsed:",
  sidebarCollapsed
);

  return (
    <div className={`sidebar ${sidebarCollapsed ? "collapsed" : ""}`}>
      <div className="logo-section">
        <h2 className="logo">
          {sidebarCollapsed
            ? "E"
            : "EEMS"}
        </h2>
        <p className="user-role">{role?.toUpperCase()}</p>
      </div>

      <div className="sidebar-nav">
        <NavLink to="/dashboard">
          <FaHome />
          {!sidebarCollapsed && (
            <span>Dashboard</span>
          )}
        </NavLink>
        <NavLink to="/employees">
          <FaUsers />
          {!sidebarCollapsed && (
            <span>Employees</span>
          )}
        </NavLink>

        {role === "user" && (
          <NavLink to="/settings">
            <FaCog />
            {!sidebarCollapsed && (
              <span>Settings</span>
            )}
          </NavLink>
        )}

        {role === "admin" && (
          <>
            <NavLink to="/departments">
              <FaBuilding />
              {!sidebarCollapsed && (
                <span>Departments</span>
              )}
            </NavLink>
            <NavLink to="/attendance">
              <FaCalendarCheck />
              {!sidebarCollapsed && (
                <span>Attendance</span>
              )}
            </NavLink>
            <NavLink to="/role-requests">
              <FaUserShield />
              {!sidebarCollapsed && (
                <span>Role Requests</span>
              )}
            </NavLink>
            <NavLink to="/invitations">
              <FaEnvelope />
              {!sidebarCollapsed && (
                <span>Invitations</span>
              )}
            </NavLink>
            <NavLink to="/reactivation-requests">
              <FaCheckCircle />
              {!sidebarCollapsed && (
                <span>Reactivations</span>
              )}
            </NavLink>
            <NavLink to="/audit-logs">
              <FaHistory />
              {!sidebarCollapsed && (
                <span>Audit Logs</span>
              )}
            </NavLink>
          </>
        )}

        <button className="logout-btn" onClick={handleLogout}>
          <FaSignOutAlt /><span>Logout</span>
        </button>
      </div>
    </div>
  );
}

export default Sidebar;
