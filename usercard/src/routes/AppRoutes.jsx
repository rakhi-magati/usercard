import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import Login from "../Pages/Login/Login";
import Signup from "../Pages/Signup/Signup";
import ForgotPassword from "../Pages/ForgotPassword";

import DashboardLayout from "../Layouts/DashboardLayout";

import Dashboard from "../Pages/Dashboard/Dashboard";
import Employees from "../Pages/Employees/Employees";
import Departments from "../Pages/Departments/Departments";
import Attendance from "../Pages/Attendance/Attendance";
import Settings from "../Pages/Settings/Settings";
import AddEmployee from "../Pages/AddEmployee/AddEmployee";
import RoleRequests from "../Pages/RoleRequests/RoleRequests";

import ProtectedRoute from "../Components/ProtectedRoute/ProtectedRoute";
import AuditLogs from "../Pages/AuditLogs/AuditLogs";

function AppRoutes({
  darkMode,
  setDarkMode,
}) {
  return (
    <BrowserRouter>
      <Routes>

        {/* Public Routes */}
        <Route
          path="/"
          element={<Login />}
        />

        <Route
          path="/signup"
          element={<Signup />}
        />

        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />

        {/* Protected Routes */}
        <Route
          element={
            <ProtectedRoute
              allowedRoles={[
                "admin",
                "user",
              ]}
            >
              <DashboardLayout
                darkMode={darkMode}
                setDarkMode={setDarkMode}
              />
            </ProtectedRoute>
          }
        >
          <Route
            path="/dashboard"
            element={<Dashboard />}
          />

          <Route
            path="/employees"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "admin",
                  "user",
                ]}
              >
                <Employees />
              </ProtectedRoute>
            }
          />

          <Route
            path="/employees/add"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "admin",
                ]}
              >
                <AddEmployee />
              </ProtectedRoute>
            }
          />

          <Route
            path="/departments"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "admin",
                ]}
              >
                <Departments />
              </ProtectedRoute>
            }
          />

          <Route
            path="/attendance"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "admin",
                ]}
              >
                <Attendance />
              </ProtectedRoute>
            }
          />

          {/* USER ONLY */}
          <Route
            path="/settings"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "user",
                ]}
              >
                <Settings />
              </ProtectedRoute>
            }
          />

          {/* ADMIN ONLY */}
          <Route
            path="/role-requests"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "admin",
                ]}
              >
                <RoleRequests />
              </ProtectedRoute>
            }
          />

          {/* Audit Logs Route */}

          <Route
            path="/audit-logs"
            element={<AuditLogs />}
          />

        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;