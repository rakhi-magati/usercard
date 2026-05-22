import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "../Pages/Login/Login";
import DashboardLayout from "../layouts/DashboardLayout";
import Dashboard from "../Pages/Dashboard/Dashboard";
import Employees from "../Pages/Employees/Employees";
import Departments from "../Pages/Departments/Departments";
import Attendance from "../Pages/Attendance/Attendance";
import Settings from "../Pages/Settings/Settings";


function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/employees" element={<Employees />} />
          <Route path="/departments" element={<Departments />} />
          <Route path="/attendance" element={<Attendance/>} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;