import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "../Pages/Login/Login";
import Signup from "../Pages/Signup/Signup";
import ForgotPassword from "../Pages/ForgotPassword";
import AcceptInvitation from "../Pages/AcceptInvitation/AcceptInvitation";
import AccountDeactivated from "../Pages/AccountDeactivated/AccountDeactivated";

import DashboardLayout from "../layouts/DashboardLayout";

import Dashboard from "../Pages/Dashboard/Dashboard";
import Employees from "../Pages/Employees/Employees";
import Departments from "../Pages/Departments/Departments";
import Attendance from "../Pages/Attendance/Attendance";
import Settings from "../Pages/Settings/Settings";
import AddEmployee from "../Pages/AddEmployee/AddEmployee";
import RoleRequests from "../Pages/RoleRequests/RoleRequests";
import AuditLogs from "../Pages/AuditLogs/AuditLogs";
import Invitations from "../Pages/Invitations/Invitations";
import ReactivationRequests from "../Pages/ReactivationRequests/ReactivationRequests";

import ProtectedRoute from "../Components/ProtectedRoute/ProtectedRoute";

function AppRoutes({ darkMode, setDarkMode, sidebarCollapsed, setSidebarCollapsed }) {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/accept-invitation" element={<AcceptInvitation />} />
        <Route path="/account-deactivated" element={<AccountDeactivated />} />

        {/* Protected Routes */}
        <Route
          element={
            <ProtectedRoute allowedRoles={["admin", "user"]}>
              <DashboardLayout
                darkMode={darkMode}
                setDarkMode={setDarkMode}
                sidebarCollapsed={sidebarCollapsed}
                setSidebarCollapsed={setSidebarCollapsed}
              />            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />

          <Route
            path="/employees"
            element={
              <ProtectedRoute allowedRoles={["admin", "user"]}>
                <Employees />
              </ProtectedRoute>
            }
          />

          <Route
            path="/employees/add"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AddEmployee />
              </ProtectedRoute>
            }
          />

          <Route
            path="/departments"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Departments />
              </ProtectedRoute>
            }
          />

          <Route
            path="/attendance"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Attendance />
              </ProtectedRoute>
            }
          />

          <Route
            path="/settings"
            element={
              <ProtectedRoute allowedRoles={["user"]}>
                <Settings />
              </ProtectedRoute>
            }
          />

          <Route
            path="/role-requests"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <RoleRequests />
              </ProtectedRoute>
            }
          />

          <Route
            path="/invitations"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Invitations />
              </ProtectedRoute>
            }
          />

          <Route
            path="/reactivation-requests"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <ReactivationRequests />
              </ProtectedRoute>
            }
          />

          <Route path="/audit-logs" element={<AuditLogs />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
