import {
  FaHome,
  FaUsers,
  FaBuilding,
  FaCalendarCheck,
  FaCog,
  FaSignOutAlt,
  FaUserShield,
  FaHistory,
  FaEnvelope,
  FaCube,
} from "react-icons/fa";
import { NavLink, useNavigate } from "react-router-dom";
import "./sidebar.css";

function Sidebar({ sidebarCollapsed }) {
  const navigate = useNavigate();
  const role = localStorage.getItem("role")?.toLowerCase();
  const userName = localStorage.getItem("userName") || localStorage.getItem("name") || "User";

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("currentUser");
    localStorage.removeItem("userName");
    localStorage.removeItem("name");
    localStorage.removeItem("email");
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
            <NavLink to="/settings"><FaCog />{!sidebarCollapsed && <span>Settings</span>}</NavLink>
          </>
        )}

        {role === "admin" && (
          <>
            <NavLink to="/departments"><FaBuilding />{!sidebarCollapsed && <span>Departments</span>}</NavLink>
            <NavLink to="/attendance"><FaCalendarCheck />{!sidebarCollapsed && <span>Attendance</span>}</NavLink>
            <NavLink to="/role-requests"><FaBuilding />{!sidebarCollapsed && <span>Role Request</span>}</NavLink>
            <NavLink to="/audit-logs"><FaHistory />{!sidebarCollapsed && <span>Audit Logs</span>}</NavLink>
            <NavLink to="/invitations"><FaUserShield />{!sidebarCollapsed && <span>Users</span>}</NavLink>
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

