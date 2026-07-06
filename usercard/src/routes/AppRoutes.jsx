import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "../Pages/Login/Login";
import Signup from "../Pages/Signup/Signup";
import ForgotPassword from "../Pages/ForgotPassword";
import AcceptInvitation from "../Pages/AcceptInvitation/AcceptInvitation";
import AccountDeactivated from "../Pages/AccountDeactivated/AccountDeactivated";
import AccountSuspended from "../Pages/AccountSuspended/AccountSuspended";

import DashboardLayout from "../layouts/DashboardLayout";

import Dashboard from "../Pages/Dashboard/Dashboard";
import Employees from "../Pages/Employees/Employees";
import Departments from "../Pages/Departments/Departments";
import Attendance from "../Pages/Attendance/Attendance";
import Settings from "../Pages/Settings/Settings";
import AddEmployee from "../Pages/AddEmployee/AddEmployee";
import RoleRequests from "../Pages/RoleRequests/RoleRequests";
import AuditLogs from "../Pages/AuditLogs/AuditLogs";
import UserActivity from "../Pages/UserActivity/UserActivity";
import DataExportCenter from "../Pages/DataExportCenter/DataExportCenter";
import Invitations from "../Pages/Invitations/Invitations";
import ReactivationRequests from "../Pages/ReactivationRequests/ReactivationRequests";
import MyProfile from "../Pages/MyProfile/MyProfile";
import ProfileCompletion from "../Pages/ProfileCompletion/ProfileCompletion";
import HolidayCalendar from "../Pages/HolidayCalendar/HolidayCalendar";
import LoginDevices from "../Pages/LoginDevices/LoginDevices";

import ProtectedRoute from "../Components/ProtectedRoute/ProtectedRoute";

function AppRoutes({ darkMode, setDarkMode, sidebarCollapsed, setSidebarCollapsed }) {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/accept-invitation" element={<AcceptInvitation />} />
        <Route path="/account-deactivated" element={<AccountDeactivated />} />
        <Route path="/account-suspended" element={<ProtectedRoute><AccountSuspended /></ProtectedRoute>} />

        <Route
          element={
            <ProtectedRoute allowedRoles={["admin", "user"]}>
              <DashboardLayout
                darkMode={darkMode}
                setDarkMode={setDarkMode}
                sidebarCollapsed={sidebarCollapsed}
                setSidebarCollapsed={setSidebarCollapsed}
              />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/employees" element={<ProtectedRoute allowedRoles={["admin", "user"]}><Employees /></ProtectedRoute>} />
          <Route path="/employees/add" element={<ProtectedRoute allowedRoles={["admin"]}><AddEmployee /></ProtectedRoute>} />
          <Route path="/departments" element={<ProtectedRoute allowedRoles={["admin"]}><Departments /></ProtectedRoute>} />
          <Route path="/attendance" element={<ProtectedRoute allowedRoles={["admin", "user"]}><Attendance /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute allowedRoles={["admin", "user"]}><Settings darkMode={darkMode} setDarkMode={setDarkMode} /></ProtectedRoute>} />
          <Route path="/role-requests" element={<ProtectedRoute allowedRoles={["admin"]}><RoleRequests /></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute allowedRoles={["admin"]}><Invitations /></ProtectedRoute>} />
          <Route path="/invitations" element={<ProtectedRoute allowedRoles={["admin"]}><Invitations /></ProtectedRoute>} />
          <Route path="/reactivation-requests" element={<ProtectedRoute allowedRoles={["admin"]}><ReactivationRequests /></ProtectedRoute>} />
          <Route path="/my-profile" element={<ProtectedRoute allowedRoles={["admin", "user"]}><MyProfile /></ProtectedRoute>} />
          <Route path="/profile-completion" element={<ProtectedRoute allowedRoles={["admin"]}><ProfileCompletion /></ProtectedRoute>} />
          <Route path="/holidays" element={<ProtectedRoute allowedRoles={["admin", "user"]}><HolidayCalendar /></ProtectedRoute>} />
          <Route path="/data-export" element={<ProtectedRoute allowedRoles={["admin"]}><DataExportCenter /></ProtectedRoute>} />
          <Route path="/tracking" element={<ProtectedRoute allowedRoles={["admin"]}><UserActivity /></ProtectedRoute>} />
          <Route path="/activity" element={<ProtectedRoute allowedRoles={["admin"]}><UserActivity /></ProtectedRoute>} />
          <Route path="/audit-logs" element={<ProtectedRoute allowedRoles={["admin"]}><AuditLogs /></ProtectedRoute>} />
          <Route path="/login-devices" element={<ProtectedRoute allowedRoles={["admin", "user"]}><LoginDevices /></ProtectedRoute>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
