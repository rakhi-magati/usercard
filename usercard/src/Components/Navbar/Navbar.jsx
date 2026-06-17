import { FaBars, FaSearch, FaChevronDown } from "react-icons/fa";
import NotificationBell from "../NotificationBell/NotificationBell";
import "./Navbar.css";

function Navbar({ darkMode, setDarkMode }) {
  const userName = localStorage.getItem("userName") || "Admin User";
  const role = localStorage.getItem("role") || "admin";

  return (
    <header className="navbar">
      <div className="navbar-left">
        <button className="menu-btn"><FaBars /></button>
        <h2 className="page-title">Employee Management</h2>
      </div>

      <div className="navbar-right">
        <div className="search-box">
          <input type="text" placeholder="Search employees..." />
          <FaSearch className="search-icon" />
        </div>

        <button onClick={() => setDarkMode && setDarkMode(!darkMode)}>
          {darkMode ? "☀️" : "🌙"}
        </button>

        <NotificationBell />
        <div className="profile">
          <img src="https://i.pravatar.cc/40?img=12" alt="profile" />
          <div className="profile-info">
            <h4>{userName}</h4>
            <p>{role.charAt(0).toUpperCase() + role.slice(1)}</p>
          </div>
          <FaChevronDown />
        </div>
      </div>
    </header>
  );
}

export default Navbar;
