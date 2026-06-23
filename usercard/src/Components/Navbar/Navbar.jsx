import {
  FaBars,
  FaBuilding,
  FaCalendarAlt,
  FaChevronDown,
  FaMoon,
  FaSun,
  FaSignOutAlt,
  FaUsers,
} from "react-icons/fa";
import { NavLink } from "react-router-dom";
import NotificationBell from "../NotificationBell/NotificationBell";
import "./Navbar.css";
import { useState } from "react";

function Navbar({
  darkMode,
  setDarkMode,
  sidebarCollapsed,
  setSidebarCollapsed,
}) {
  const userName = localStorage.getItem("userName") || localStorage.getItem("name") || "Admin User";
  const role = localStorage.getItem("role") || "admin";
  const todayLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <header className="navbar">
      <div className="navbar-left">
        <button
          className="menu-btn"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          aria-label="Toggle sidebar"
        >
          <FaBars />
        </button>
        <div className="welcome-copy">
          <h2 className="page-title">Welcome back, {userName}!</h2>
          <p>{todayLabel}</p>
        </div>
      </div>

      <div className="navbar-right">
        {role.toLowerCase() === "admin" && (
          <nav className="top-nav-pills" aria-label="Quick navigation">
            <NavLink to="/employees"><FaUsers /> Team</NavLink>
            <NavLink to="/attendance"><FaCalendarAlt /> Attendance</NavLink>
            <NavLink to="/departments"><FaBuilding /> Departments</NavLink>
          </nav>
        )}

        <NotificationBell />

        <button
          className="theme-btn"
          onClick={() => setDarkMode && setDarkMode(!darkMode)}
          aria-label="Toggle theme"
        >
          {darkMode ? <FaSun /> : <FaMoon />}
        </button>

        <div className="profile" onClick={() => setShowDropdown(!showDropdown)}>
          <div className="profile-avatar">{userName.charAt(0).toUpperCase()}</div>

          <div className="profile-info">
            <h4>{userName}</h4>
            <p>{role.charAt(0).toUpperCase() + role.slice(1)}</p>
          </div>

          <FaChevronDown className="profile-chevron" />

          {showDropdown && (
            <div className="profile-dropdown">
              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.href = "/";
                }}
              >
                <FaSignOutAlt />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;

