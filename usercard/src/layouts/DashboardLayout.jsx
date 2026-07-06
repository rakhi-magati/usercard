import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../Components/Navbar/Navbar";
import Sidebar from "../Components/Sidebar/Sidebar";
import { touchSession } from "../services/sessionService";
import "./DashboardLayout.css";

function DashboardLayout({
  darkMode,
  setDarkMode,
  sidebarCollapsed,
  setSidebarCollapsed,
}) {

  useEffect(() => {
    touchSession();
    const interval = setInterval(() => {
      touchSession();
    }, 60000);
    return () => clearInterval(interval);
  }, []);

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

      <div className={`main-section ${sidebarCollapsed ? "collapsed" : ""}`}>
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

