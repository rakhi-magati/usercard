import { useMemo, useState } from "react";
import {
  FaCheck,
  FaMoon,
  FaShieldAlt,
  FaUserClock,
  FaGraduationCap,
} from "react-icons/fa";
import { COMPANIES, getCompanyName } from "../../constants/companies";
import LoginDevices from "../LoginDevices/LoginDevices";
import AdminSessions from "../AdminSessions/AdminSessions";
import SkillsCertifications from "../SkillsCertifications/SkillsCertifications";
import "./Settings.css";

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
  window.dispatchEvent(new Event("attendance-storage-changed"));
};

const normalizeStatus = (status) => String(status || "pending").toLowerCase();

function Settings({ darkMode, setDarkMode }) {
  const name = localStorage.getItem("name") || localStorage.getItem("userName") || "User";
  const email = localStorage.getItem("email") || "No email found";
  const role = localStorage.getItem("role")?.toLowerCase() || "user";
  const companyId = localStorage.getItem("company_id") || "1";
  const companyName = localStorage.getItem("company_name") || getCompanyName(companyId);
  const isAdmin = role === "admin";

  const [activeTab, setActiveTab] = useState("profile");
  const [roleRequests, setRoleRequests] = useState(() => readJson("roleRequests", []));
  const [leaveRequests, setLeaveRequests] = useState(() => readJson(`leave_requests_${companyId}`, []));
  const [reactivationRequests, setReactivationRequests] = useState(() =>
    readJson(`reactivation_requests_${companyId}`, readJson("reactivationRequests", []))
  );
  const [notificationEnabled, setNotificationEnabled] = useState(
    () => readJson(`settings_notifications_${email}`, true)
  );

  const myRoleRequests = useMemo(
    () => roleRequests.filter((request) => request.userEmail === email),
    [email, roleRequests]
  );

  const pendingRoleRequests = roleRequests.filter(
    (request) => normalizeStatus(request.status) === "pending"
  );
  const pendingLeaveRequests = leaveRequests.filter(
    (request) => normalizeStatus(request.status) === "pending"
  );
  const pendingReactivationRequests = reactivationRequests.filter(
    (request) => normalizeStatus(request.status) === "pending"
  );

  const reviewRoleRequest = (requestId, status) => {
    const nextRequests = roleRequests.map((request) =>
      request.id === requestId ? { ...request, status } : request
    );

    if (status === "Approved") {
      const request = roleRequests.find((item) => item.id === requestId);
      const users = readJson("users", []);
      const nextUsers = users.map((user) =>
        user.email === request?.userEmail ? { ...user, role: "admin" } : user
      );
      writeJson("users", nextUsers);
    }

    setRoleRequests(nextRequests);
    writeJson("roleRequests", nextRequests);
  };

  const reviewLeaveRequest = (requestId, status) => {
    const nextRequests = leaveRequests.map((request) =>
      request.id === requestId ? { ...request, status } : request
    );
    setLeaveRequests(nextRequests);
    writeJson(`leave_requests_${companyId}`, nextRequests);
  };

  const reviewReactivationRequest = (requestId, status) => {
    const reviewedAt = new Date().toISOString();

    // Update request
    const nextRequests = reactivationRequests.map((request) =>
      request.id === requestId
        ? {
          ...request,
          status,
          reviewed_by: name,
          reviewed_at: reviewedAt,
        }
        : request
    );

    setReactivationRequests(nextRequests);
    writeJson(`reactivation_requests_${companyId}`, nextRequests);
    writeJson("reactivationRequests", nextRequests);

    // If approved, restore employee
    if (status === "approved") {
      const approvedRequest = nextRequests.find(
        (request) => request.id === requestId
      );

      const users = readJson("users", []);

      const updatedUsers = users.map((user) => {
        if (user.email === approvedRequest.email) {
          return {
            ...user,
            status: "Active",
            suspended_at: null,
            suspended_by: null,
            suspension_reason: null,
          };
        }
        return user;
      });

      writeJson("users", updatedUsers);

      // If employees are stored separately
      const employees = readJson(`employees_cache_${companyId}`, []);

      if (employees.length) {
        const updatedEmployees = employees.map((employee) =>
          employee.email === approvedRequest.email
            ? {
              ...employee,
              status: "Active",
              suspended_at: null,
              suspended_by: null,
              suspension_reason: null,
            }
            : employee
        );

        writeJson(`employees_cache_${companyId}`, updatedEmployees);
      }

      alert("Employee reinstated successfully.");
    }

    if (status === "rejected") {
      alert("Reinstatement request rejected.");
    }
  };
  const toggleNotifications = () => {
    const next = !notificationEnabled;
    setNotificationEnabled(next);
    writeJson(`settings_notifications_${email}`, next);
  };

  const renderEmpty = (message) => <p className="settings-empty-state">{message}</p>;

  const renderApprovals = () => (
    <div className="settings-content-section">
      <section className="approval-section">
        <h2>Pending Role Requests</h2>
        <p>Manage pending role upgrade requests.</p>
        {pendingRoleRequests.length === 0
          ? renderEmpty(`No pending role change requests for ${email}.`)
          : pendingRoleRequests.map((request) => (
            <div className="approval-item" key={request.id}>
              <div>
                <strong>{request.userEmail}</strong>
                <span>Requested admin access from {request.adminEmail || email}</span>
              </div>
              <div className="approval-actions">
                <button onClick={() => reviewRoleRequest(request.id, "Approved")}>Approve</button>
                <button className="reject" onClick={() => reviewRoleRequest(request.id, "Rejected")}>Reject</button>
              </div>
            </div>
          ))}
      </section>

      <section className="approval-section">
        <h2>Pending Reactivation Requests</h2>
        {pendingReactivationRequests.length === 0
          ? renderEmpty(`No pending reactivation requests for ${email}.`)
          : pendingReactivationRequests.map((request) => (
            <div className="approval-item" key={request.id}>
              <div>
                <div>
                  <strong>{request.employee_name || request.name}</strong>

                  <p>Email : {request.email}</p>

                  <p>
                    <strong>Status :</strong>{" "}
                    <span className="pending-status">
                      Reinstatement Pending
                    </span>
                  </p>

                  <p>
                    <strong>Reason :</strong>{" "}
                    {request.reason || "No reason provided"}
                  </p>

                  <small>
                    Requested :
                    {new Date(request.created_at).toLocaleString()}
                  </small>
                </div>
              </div>
              <div className="approval-actions">
                <button onClick={() => reviewReactivationRequest(request.id, "approved")}>Approve</button>
                <button className="reject" onClick={() => reviewReactivationRequest(request.id, "rejected")}>Reject</button>
              </div>
            </div>
          ))}
      </section>

      <section className="approval-section">
        <h2>Pending Leave Requests</h2>
        <p>Approve or reject submitted vacation and medical leave requests.</p>
        {pendingLeaveRequests.length === 0
          ? renderEmpty(`No pending leave requests for ${email}.`)
          : pendingLeaveRequests.map((request) => (
            <div className="approval-item" key={request.id}>
              <div>
                <strong>{request.name}</strong>
                <span>{request.type} leave · {request.startDate} to {request.endDate}</span>
                <small>{request.reason}</small>
              </div>
              <div className="approval-actions">
                <button onClick={() => reviewLeaveRequest(request.id, "approved")}>Approve</button>
                <button className="reject" onClick={() => reviewLeaveRequest(request.id, "rejected")}>Reject</button>
              </div>
            </div>
          ))}
      </section>
    </div>
  );

  const renderProfile = () => (
    <div className="settings-content-section profile-settings-section">
      <h2>Profile</h2>
      <p>Update the admin account details shown across your workspace for {companyName}.</p>

      <form className="settings-profile-form">
        <label>
          Display Name
          <input value={name} readOnly />
        </label>
        <label>
          Email
          <input value={email} readOnly />
        </label>
        <label>
          Company
          <select value={companyId} disabled>
            {COMPANIES.map((company) => (
              <option key={company.id} value={company.id}>{company.name}</option>
            ))}
          </select>
        </label>
      </form>
    </div>
  );

  const renderSecurity = () => (
    <div className="settings-content-section compact-settings-section">
      <h2>Security</h2>
      <p>Your account is protected with local login credentials.</p>
      <div className="security-note">Last checked just now</div>
    </div>
  );

  const renderAppearance = () => (
    <div className="settings-content-section compact-settings-section">
      <h2>Appearance</h2>
      <p>Switch between light and dark themes across the application.</p>
      <div className="setting-footer admin-setting-footer">
        <span>Current theme: {darkMode ? "dark" : "light"}</span>
        <button className="theme-btn" onClick={() => setDarkMode?.(!darkMode)}>
          <FaMoon />
        </button>
      </div>
    </div>
  );

  const renderNotifications = () => (
    <div className="settings-content-section compact-settings-section">
      <h2>Notifications</h2>
      <p>Control in-app alerts for employee and attendance activity.</p>
      <label className="checkbox">
        <input type="checkbox" checked={notificationEnabled} onChange={toggleNotifications} />
        Notify when approval requests are submitted
      </label>
    </div>
  );

  const renderLoginDevices = () => (
    <div className="settings-content-section embedded-tab-section">
      <LoginDevices />
    </div>
  );

  const renderSkills = () => (
    <div className="settings-content-section embedded-tab-section">
      <SkillsCertifications />
    </div>
  );

  const renderUserSessions = () => (
    <div className="settings-content-section embedded-tab-section">
      <AdminSessions />
    </div>
  );

  const renderTabContent = () => {
    if (activeTab === "profile") return renderProfile();
    if (activeTab === "security") return renderSecurity();
    if (activeTab === "appearance") return renderAppearance();
    if (activeTab === "notifications") return renderNotifications();
    if (activeTab === "login-devices") return renderLoginDevices();
    if (activeTab === "skills") return renderSkills();
    if (activeTab === "sessions") return renderUserSessions();
    return renderApprovals();
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: "P" },
    { id: "security", label: "Security", icon: "S" },
    { id: "appearance", label: "Appearance", icon: "A" },
    { id: "notifications", label: "Notifications", icon: "N" },
    { id: "login-devices", label: "Login Devices", icon: <FaShieldAlt /> },
    { id: "skills", label: "Skills & Certifications", icon: <FaGraduationCap /> },
    ...(isAdmin
      ? [
          { id: "sessions", label: "User Sessions", icon: <FaUserClock /> },
          { id: "approvals", label: "Approvals", icon: <FaCheck /> },
        ]
      : []),
  ];

  return (
    <div className="settings-page admin-settings-page">
      <div className="admin-settings-header">
        <h1>Settings</h1>
        <p>Manage your account preferences and system configuration.</p>
      </div>

      <div className="admin-settings-shell">
        <aside className="settings-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={activeTab === tab.id ? "active" : ""}
              onClick={() => setActiveTab(tab.id)}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </aside>
        <main className="settings-main-panel">{renderTabContent()}</main>
      </div>
    </div>
  );
}

export default Settings;





