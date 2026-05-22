import {
  FaBars,
  FaBell,
  FaSearch,
  FaChevronDown,
} from "react-icons/fa";

import "./Navbar.css";

function Navbar() {
  return (
    <header className="navbar">
      {/* Left Side */}
      <div className="navbar-left">
        <button className="menu-btn">
          <FaBars />
        </button>
      </div>

      {/* Right Side */}
      <div className="navbar-right">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search here..."
          />
          <FaSearch className="search-icon" />
        </div>

        <div className="notification">
          <FaBell />
          <span className="badge">3</span>
        </div>

        <div className="profile">
          <img
            src="https://i.pravatar.cc/40?img=12"
            alt="profile"
          />

          <span>Admin User</span>

          <FaChevronDown />
        </div>
      </div>
    </header>
  );
}

export default Navbar;