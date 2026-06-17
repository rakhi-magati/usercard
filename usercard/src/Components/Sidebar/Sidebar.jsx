import {
  FaHome, FaUsers, FaBuilding, FaCalendarCheck,
  FaCog, FaSignOutAlt, FaUserShield, FaHistory,
  FaEnvelope, FaCheckCircle,
} from "react-icons/fa";
import { NavLink, useNavigate } from "react-router-dom";
import "./Sidebar.css";

function Sidebar() {
  const navigate = useNavigate();
  const role = localStorage.getItem("role")?.toLowerCase();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("currentUser");
    localStorage.removeItem("userName");
    navigate("/");
  };

  return (
    <div className="sidebar">
      <div className="logo-section">
        <h2 className="logo">EEMS</h2>
        <p className="user-role">{role?.toUpperCase()}</p>
      </div>

      <div className="sidebar-nav">
        <NavLink to="/dashboard"><FaHome /><span>Dashboard</span></NavLink>
        <NavLink to="/employees"><FaUsers /><span>Employees</span></NavLink>

        {role === "user" && (
          <NavLink to="/settings"><FaCog /><span>Settings</span></NavLink>
        )}

        {role === "admin" && (
          <>
            <NavLink to="/departments"><FaBuilding /><span>Departments</span></NavLink>
            <NavLink to="/attendance"><FaCalendarCheck /><span>Attendance</span></NavLink>
            <NavLink to="/role-requests"><FaUserShield /><span>Role Requests</span></NavLink>
            <NavLink to="/invitations"><FaEnvelope /><span>Invitations</span></NavLink>
            <NavLink to="/reactivation-requests"><FaCheckCircle /><span>Reactivations</span></NavLink>
            <NavLink to="/audit-logs"><FaHistory /><span>Audit Logs</span></NavLink>
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
