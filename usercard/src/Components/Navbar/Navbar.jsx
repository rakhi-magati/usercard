import {
  FaBars,
  FaSearch,
  FaChevronDown,
  FaMoon,
  FaSun,
  FaUserCircle,
  FaSignOutAlt,
} from "react-icons/fa";
import NotificationBell from "../NotificationBell/NotificationBell";
import "./Navbar.css";
import { useState } from "react";

function Navbar({ darkMode,
  setDarkMode,
  sidebarCollapsed,
  setSidebarCollapsed, }) {
  const userName = localStorage.getItem("userName") || "Admin User";
  const role = localStorage.getItem("role") || "admin";

  const [showDropdown, setShowDropdown] =
    useState(false);
  console.log(setSidebarCollapsed);

  return (
    <header className="navbar">
      <div className="navbar-left">
        <button
          className="menu-btn"
          onClick={() =>
            setSidebarCollapsed(
              !sidebarCollapsed
            )
          }
        >
          <FaBars />
        </button>
        <h2 className="page-title">Employee Management</h2>
      </div>

      <div className="navbar-right">
        <div className="search-box">
          <input type="text" placeholder="Search employees..." />
          <FaSearch className="search-icon" />
        </div>

        <button
          className="theme-btn"
          onClick={() =>
            setDarkMode &&
            setDarkMode(!darkMode)
          }
        >
          {darkMode ? (
            <FaSun />
          ) : (
            <FaMoon />
          )}
        </button>

        <NotificationBell />
        <div
          className="profile"
          onClick={() =>
            setShowDropdown(
              !showDropdown
            )
          }
        >
          <FaUserCircle className="profile-icon" />

          <div className="profile-info">
            <h4>{userName}</h4>

            <p>
              {role.charAt(0).toUpperCase() +
                role.slice(1)}
            </p>
          </div>

          <FaChevronDown />

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
