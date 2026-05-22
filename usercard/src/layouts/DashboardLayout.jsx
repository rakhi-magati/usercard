import { Outlet } from "react-router-dom";
import Sidebar from "../Components/SiderBar/Sidebar";
import Navbar from "../Components/Navbar/Navbar";
import "./DashboardLayout.css";



function DashboardLayout() {
  return (
    <div className="dashboard-layout">
      <Sidebar />

      <div className="main-section">
        <Navbar />

        <div className="page-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default DashboardLayout;