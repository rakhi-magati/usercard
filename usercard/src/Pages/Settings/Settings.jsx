import {
  FaBell,
  FaMoon,
  FaShieldAlt,
  FaUser,
  FaLaptop,
} from "react-icons/fa";

import "./Settings.css";

function Settings({
  darkMode,
  setDarkMode,
}) {

  const name =
    localStorage.getItem("name") ||
    localStorage.getItem("username") ||
    "User";

  const email =
    localStorage.getItem("email") ||
    "No email found";

  const role =
    localStorage.getItem("role") ||
    "user";

  const roleRequests =
    JSON.parse(
      localStorage.getItem(
        "roleRequests"
      )
    ) || [];

  const myRequests =
    roleRequests.filter(
      (request) =>
        request.userEmail === email
    );

  return (
    <div className="settings-page">

      <div className="settings-header">
        <h1>Settings</h1>

        <p>
          Manage appearance,
          notifications,
          account preferences,
          and role access.
        </p>
      </div>

      <div className="settings-grid">

        {/* Appearance */}
        <div className="settings-card">

          <div className="card-title">
            <FaLaptop />

            <h3>Appearance</h3>
          </div>

          <p>
            Switch between light
            and dark themes across
            the application.
          </p>

          <div className="setting-footer">

            <span>
              Current theme:
              {" "}
              {darkMode
                ? "dark"
                : "light"}
            </span>

            <button
              className="theme-btn"
              onClick={() =>
                setDarkMode(
                  !darkMode
                )
              }
            >
              <FaMoon />
            </button>

          </div>

        </div>

        {/* Notifications */}
        <div className="settings-card">

          <div className="card-title">
            <FaBell />

            <h3>Notifications</h3>
          </div>

          <p>
            Control in-app alerts
            for employee and
            attendance activity.
          </p>

          <label className="checkbox">

            <input
              type="checkbox"
              defaultChecked
            />

            Notify when employees
            are added or updated

          </label>

        </div>

        {/* Account */}
        <div className="settings-card">

          <div className="card-title">
            <FaUser />

            <h3>Account</h3>
          </div>

          <div className="account-info">

            <div className="avatar">
              {name
                ?.charAt(0)
                .toUpperCase()}
            </div>

            <div>

              <h4>{name}</h4>

              <p>{email}</p>

              <span
                className={`role-badge ${role}`}
              >
                {role}
              </span>

            </div>

          </div>

        </div>

      </div>

      <div className="request-card">

        <div className="card-title">

          <FaShieldAlt />

          <h3>
            Pending Role Requests
          </h3>

        </div>

        {myRequests.length > 0 ? (

          myRequests.map(
            (request) => (

              <div
                key={request.id}
                className="request-item"
              >

                <p>
                  Request sent to:
                  {" "}
                  {request.adminEmail}
                </p>

                <span
                  className={`status ${request.status.toLowerCase()}`}
                >
                  {request.status}
                </span>

              </div>

            )
          )

        ) : (

          <p>
            No pending role
            change requests for
            {" "}
            {email}.
          </p>

        )}

      </div>

    </div>
  );
}

export default Settings;