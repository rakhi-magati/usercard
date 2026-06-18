import { Outlet } from "react-router-dom";
import Navbar from "../Components/Navbar/Navbar";
import Sidebar from "../Components/SideBar/Sidebar";
import "./DashboardLayout.css";

function DashboardLayout({
  darkMode,
  setDarkMode,
  sidebarCollapsed,
  setSidebarCollapsed,
}) {

  return (
    <div
      className={`dashboard-layout ${darkMode
          ? "dark-mode"
          : "light-mode"
        }`}
    >
      <Sidebar
         sidebarCollapsed={sidebarCollapsed}
      
      />

      <div className="main-section">
        <Navbar
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          sidebarCollapsed={sidebarCollapsed}
          setSidebarCollapsed={setSidebarCollapsed}
        />

        <div className="page-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default DashboardLayout;