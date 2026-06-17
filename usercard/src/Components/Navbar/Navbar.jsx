import {
  FaBars,
  FaBell,
  FaSearch,
  FaChevronDown,
  FaMoon,
  FaSun,
} from "react-icons/fa";

import "./Navbar.css";

function Navbar({ darkMode, setDarkMode }) {
  console.log(darkMode, setDarkMode);
  return (
    <header className="navbar">
      <div className="navbar-left">
        <button className="menu-btn">
          <FaBars />
        </button>

        <h2 className="page-title">
          Employee Management
        </h2>
      </div>

      <div className="navbar-right">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search employees..."
          />
          <FaSearch className="search-icon" />
        </div>

        <button
          onClick={() =>
            setDarkMode(!darkMode)
          }
        >
          {darkMode ? "☀️" : "🌙"}
        </button>

        <div className="notification">
          <FaBell />
          <span className="badge">3</span>
        </div>

        <div className="profile">
          <img
            src="https://i.pravatar.cc/40?img=12"
            alt="profile"
          />

          <div className="profile-info">
            <h4>Admin User</h4>
            <p>Administrator</p>
          </div>

          <FaChevronDown />
        </div>
      </div>
    </header>
  );
}

export default Navbar;