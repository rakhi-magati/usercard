import {
  FaHome,
  FaUsers,
  FaBuilding,
  FaCalendarCheck,
  FaCog,
} from "react-icons/fa";

import { NavLink } from "react-router-dom";

import "./Sidebar.css";

function Sidebar() {
  return (
    <div>
      <div className="sidebar">
        <h2>EEMS</h2>

        <NavLink to="/dashboard">
          <FaHome /> Dashboard
        </NavLink>

        <NavLink to="/employees">
          <FaUsers /> Employees
        </NavLink>

        <NavLink to="/departments">
          <FaBuilding /> Departments
        </NavLink>

        <NavLink to="/attendance">
          <FaCalendarCheck /> Attendance
        </NavLink>

        <NavLink to="/settings">
          <FaCog /> Settings
        </NavLink>

      </div>
      
    </div>
  );
}

export default Sidebar;