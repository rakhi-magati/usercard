import { Navigate, useLocation } from "react-router-dom";

const normalizeStatus = (status) => {
  const value = (status || "active").toLowerCase();
  return value === "inactive" ? "deactivated" : value;
};

function ProtectedRoute({
  children,
  allowedRoles,
}) {
  const location = useLocation();
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role")?.toLowerCase();
  const status = normalizeStatus(localStorage.getItem("status"));

  if (!token) {
    return <Navigate to="/" />;
  }

  if (status === "suspended" && location.pathname !== "/account-suspended") {
    return <Navigate to="/account-suspended" replace />;
  }

  if (status === "deactivated" && location.pathname !== "/account-deactivated") {
    return <Navigate to="/account-deactivated" replace />;
  }

  if (
    allowedRoles &&
    !allowedRoles.includes(role)
  ) {
    return (
      <Navigate
        to="/dashboard"
      />
    );
  }

  return children;
}

export default ProtectedRoute;
