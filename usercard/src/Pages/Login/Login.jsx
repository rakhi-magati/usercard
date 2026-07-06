import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaUsers, FaEnvelope, FaLock, FaEye, FaBuilding } from "react-icons/fa";
import { COMPANIES, getCompanyName, getUserCompanyId } from "../../constants/companies";
import { recordLoginActivity } from "../../services/activityService";
import { startSession } from "../../services/sessionService";
import { getEmployeeByEmail, syncLoginEmployee } from "../../services/employeeService";
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

  const companyId = getUserCompanyId(user);
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
  const [companyId, setCompanyId] = useState("1");

  const handleLogin = async (e) => {
    e.preventDefault();

    const users = JSON.parse(localStorage.getItem("users")) || [];
    const user = users.find(
      (u) =>
        u.email === email &&
        u.password === password &&
        getUserCompanyId(u) === companyId
    );

    if (user) {
      let loginUser = { ...user };
      try {
        const employee = await syncLoginEmployee(user, companyId);
        loginUser = { ...loginUser, ...employee, employeeId: employee.id };
      } catch {
        try {
          const employee = await getEmployeeByEmail(user.email, companyId);
          loginUser = { ...loginUser, ...employee, employeeId: employee.id };
        } catch {
          alert("Login failed because this account could not be synced with the company records.");
          return;
        }
      }

      const selectedCompanyName = loginUser.company_name || loginUser.companyName || getCompanyName(companyId);
      const status = (loginUser.status || "active").toLowerCase();

      localStorage.setItem("token", `${loginUser.role}-token`);
      localStorage.setItem("role", loginUser.role);
      localStorage.setItem("userName", loginUser.name);
      localStorage.setItem("name", loginUser.name);
      localStorage.setItem("email", loginUser.email);
      localStorage.setItem("status", status === "inactive" ? "deactivated" : status);
      localStorage.setItem("suspension_date", loginUser.suspension_date || "");
      localStorage.setItem("suspension_reason", loginUser.suspension_reason || "");
      localStorage.setItem("suspended_by", loginUser.suspended_by || "");
      localStorage.setItem("company_id", companyId);
      localStorage.setItem("company_name", selectedCompanyName);
      ensureAttendanceAccessRequest({ ...loginUser, company_id: companyId, company_name: selectedCompanyName });
      await recordLoginActivity({ ...loginUser, company_id: companyId, company_name: selectedCompanyName }, companyId);
      try {
        await startSession({ ...loginUser, company_id: companyId }, companyId);
      } catch {
        // best-effort; device/session tracking should not block login
      }
      if (loginUser.employeeId || loginUser.id) localStorage.setItem("employeeId", loginUser.employeeId || loginUser.id);

      if (status === "inactive" || status === "deactivated") {
        navigate("/account-deactivated");
      } else if (status === "suspended") {
        navigate("/account-suspended");
      } else {
        navigate("/dashboard");
      }
    } else {
      alert(`Invalid credentials for ${getCompanyName(companyId)}`);
    }
  };

  return (
    <div className="login-container">
      <div className="login-wrapper">
        {/* <h2 className="login-title">Login Page</h2> */}
        <form className="login-card" onSubmit={handleLogin}>
          <div className="login-icon"><FaUsers /></div>
          <h2>Welcome Back!</h2>
          <p>Login to your company account</p>

          <div className="login-company-options" role="radiogroup" aria-label="Company selection">
            {COMPANIES.map((company) => (
              <button
                type="button"
                key={company.id}
                className={companyId === company.id ? "active" : ""}
                onClick={() => setCompanyId(company.id)}
                role="radio"
                aria-checked={companyId === company.id}
              >
                <FaBuilding />
                {company.name}
              </button>
            ))}
          </div>

          <div className="input-group">
            <label>Company</label>
            <div className="input-box">
              <FaBuilding />
              <select value={companyId} onChange={(e) => setCompanyId(e.target.value)} required>
                {COMPANIES.map((company) => (
                  <option key={company.id} value={company.id}>{company.name}</option>
                ))}
              </select>
            </div>
          </div>

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
                placeholder="Enter password"
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
            Don&apos;t have an account? <Link to="/signup">Signup</Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;

