import { Outlet } from "react-router-dom";
import Navbar from "../Components/Navbar/Navbar";
import Sidebar from "../Components/SideBar/Sidebar";
import "./DashboardLayout.css";

function DashboardLayout({
  darkMode,
  setDarkMode,
}) {
  return (
    <div
      className={`dashboard-layout ${
        darkMode
          ? "dark-mode"
          : "light-mode"
      }`}
    >
      <Sidebar />

      <div className="main-section">
        <Navbar
          darkMode={darkMode}
          setDarkMode={setDarkMode}
        />

        <div className="page-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default DashboardLayout;