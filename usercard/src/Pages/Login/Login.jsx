import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaUsers, FaEnvelope, FaLock, FaEye } from "react-icons/fa";
import "./Login.css";

const readJson = (key, fallback) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const writeJson = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const ensureAttendanceAccessRequest = (user) => {
  if (user.role?.toLowerCase() !== "user") return;

  const companyId = String(user.company_id || "1");
  const requestKey = `attendance_access_requests_${companyId}`;
  const notificationKey = `local_notifications_${companyId}`;
  const requests = readJson(requestKey, []);
  const existing = requests.find((request) => request.email === user.email);

  if (existing) return;

  const request = {
    id: `attendance-access-${companyId}-${user.email}`,
    type: "attendance_access",
    name: user.name,
    email: user.email,
    company_id: companyId,
    status: "pending",
    created_at: new Date().toISOString(),
  };

  writeJson(requestKey, [request, ...requests]);

  const notifications = readJson(notificationKey, []);
  writeJson(notificationKey, [
    {
      id: request.id,
      type: "attendance_access",
      request_id: request.id,
      title: "Attendance Access Pending",
      message: `${user.name} requested attendance access.`,
      created_at: request.created_at,
      is_read: false,
    },
    ...notifications.filter((item) => item.id !== request.id),
  ]);
};

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();

    const users = JSON.parse(localStorage.getItem("users")) || [];
    const user = users.find((u) => u.email === email && u.password === password);

    if (user) {
      localStorage.setItem("token", `${user.role}-token`);
      localStorage.setItem("role", user.role);
      localStorage.setItem("userName", user.name);
      localStorage.setItem("name", user.name);
      localStorage.setItem("email", user.email);
      localStorage.setItem("company_id", user.company_id || "1");
      ensureAttendanceAccessRequest(user);
      if (user.employeeId) localStorage.setItem("employeeId", user.employeeId);

      // Check deactivated status
      if (user.status === "inactive") {
        navigate("/account-deactivated");
      } else {
        navigate("/dashboard");
      }
    } else {
      alert("Invalid Credentials");
    }
  };

  return (
    <div className="login-container">
      <div className="login-wrapper">
        <h2 className="login-title">Login Page</h2>
        <form className="login-card" onSubmit={handleLogin}>
          <div className="login-icon"><FaUsers /></div>
          <h2>Welcome Back!</h2>
          <p>Login to your account</p>

          <div className="input-group">
            <label>Email</label>
            <div className="input-box">
              <FaEnvelope />
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label>Password</label>
            <div className="input-box">
              <FaLock />
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <FaEye className="eye-icon" />
            </div>
          </div>

          <div className="login-options">
            <label><input type="checkbox" /> Remember me</label>
            <Link to="/forgot-password">Forgot Password?</Link>
          </div>

          <button type="submit" className="login-btn">Login</button>

          <div className="login-footer">
            Don't have an account? <Link to="/signup">Signup</Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;


