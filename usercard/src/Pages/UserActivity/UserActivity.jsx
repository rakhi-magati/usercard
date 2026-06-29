import { useEffect, useMemo, useState } from "react";
import { FaSearch, FaUsers } from "react-icons/fa";
import {
  activityEventName,
  fetchBackendActivities,
  getCompanyUserActivities,
} from "../../services/activityService";
import { getCompanyName } from "../../constants/companies";
import "./UserActivity.css";

const formatDateTime = (value) => {
  if (!value) return "Never";
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const normalize = (value) => String(value || "").toLowerCase();

const countEvents = (activity, type) =>
  activity[`total_${type}s`] ?? (activity.history || []).filter((event) => event.type === type).length;

function UserActivity() {
  const role = localStorage.getItem("role")?.toLowerCase() || "user";
  const companyId = localStorage.getItem("company_id") || "1";
  const companyName = localStorage.getItem("company_name") || getCompanyName(companyId);
  const [activities, setActivities] = useState(() => getCompanyUserActivities(companyId));
  const [activeTab, setActiveTab] = useState("activity");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const loadActivities = async () => {
    setLoading(true);
    try {
      const response = await fetchBackendActivities(companyId, search);
      if (Array.isArray(response.data)) {
        setActivities(response.data);
        return;
      }
    } catch {
      setActivities(getCompanyUserActivities(companyId));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivities();
  }, [companyId, search]);

  useEffect(() => {
    const refreshFromLocal = () => setActivities(getCompanyUserActivities(companyId));
    window.addEventListener(activityEventName, refreshFromLocal);
    window.addEventListener("storage", refreshFromLocal);

    return () => {
      window.removeEventListener(activityEventName, refreshFromLocal);
      window.removeEventListener("storage", refreshFromLocal);
    };
  }, [companyId]);

  const filteredActivities = useMemo(() => {
    const needle = normalize(search);
    const byTab = activities.filter((activity) => {
      if (activeTab === "logins") return (activity.history || []).some((event) => event.type === "login");
      if (activeTab === "logouts") return (activity.history || []).some((event) => event.type === "logout");
      return true;
    });

    if (!needle) return byTab;
    return byTab.filter((activity) =>
      [activity.user_name, activity.email, activity.last_browser, activity.last_ip_address]
        .some((field) => normalize(field).includes(needle))
    );
  }, [activities, activeTab, search]);

  const summary = useMemo(() => ({
    totalLogins: activities.reduce((sum, activity) => sum + countEvents(activity, "login"), 0),
    totalLogouts: activities.reduce((sum, activity) => sum + countEvents(activity, "logout"), 0),
    newDevices: activities.filter((activity) => activity.new_device_detected).length,
    newIps: activities.filter((activity) => activity.new_ip_detected).length,
  }), [activities]);

  if (role !== "admin") {
    return (
      <div className="tracking-page">
        <div className="tracking-empty-state">Only company admins can view account activity tracking.</div>
      </div>
    );
  }

  return (
    <div className="tracking-page">
      <div className="tracking-header">
        <div className="tracking-title-wrap">
          <div className="tracking-title-icon"><FaUsers /></div>
          <div>
            <h1>Account Activity Tracking</h1>
            <p>Track account logins, logouts, browser information, IP addresses, and activity history for users and admins in {companyName}.</p>
          </div>
        </div>

        <section className="tracking-metrics" aria-label="Activity totals">
          <div><span>Total Logins</span><strong>{summary.totalLogins}</strong></div>
          <div><span>Total Logouts</span><strong>{summary.totalLogouts}</strong></div>
          <div><span>New Devices</span><strong>{summary.newDevices}</strong></div>
          <div><span>New IP Addresses</span><strong>{summary.newIps}</strong></div>
        </section>
      </div>

      <section className="tracking-card">
        <div className="tracking-tabs">
          <button className={activeTab === "activity" ? "active" : ""} onClick={() => setActiveTab("activity")}>User Activity</button>
          <button className={activeTab === "logins" ? "active" : ""} onClick={() => setActiveTab("logins")}>Login History</button>
          <button className={activeTab === "logouts" ? "active" : ""} onClick={() => setActiveTab("logouts")}>Logout History</button>
        </div>

        <div className="tracking-toolbar">
          <label className="tracking-search">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, email, browser, or IP..."
            />
            <FaSearch />
          </label>
          <span className="company-pill">{companyName}</span>
        </div>

        <div className="tracking-table-wrap">
          <table className="tracking-table">
            <thead>
              <tr>
                <th>User Name</th>
                <th>Role</th>
                <th>Email</th>
                <th>Last Login</th>
                <th>Last Logout</th>
                <th>Total Logins</th>
                <th>Total Logouts</th>
                <th>Browser</th>
                <th>IP Address</th>
                <th>Status</th>
                <th>New Device</th>
                <th>New IP</th>
              </tr>
            </thead>
            <tbody>
              {filteredActivities.length ? filteredActivities.map((activity) => {
                const status = normalize(activity.status || "active") === "active" ? "Active" : "Inactive";
                const initial = (activity.user_name || activity.email || "U").charAt(0).toUpperCase();
                return (
                  <tr key={activity.email}>
                    <td>
                      <div className="tracking-user-cell">
                        <span className="tracking-avatar">{initial}</span>
                        <div>
                          <strong>{activity.user_name || "Unknown User"}</strong>
                          <small>{companyName}</small>
                        </div>
                      </div>
                    </td>
                    <td><span className={`role-badge ${normalize(activity.role || "user")}`}>{activity.role || "user"}</span></td>
                    <td>{activity.email}</td>
                    <td>{formatDateTime(activity.last_login)}</td>
                    <td>{formatDateTime(activity.last_logout)}</td>
                    <td>{countEvents(activity, "login")}</td>
                    <td>{countEvents(activity, "logout")}</td>
                    <td>{activity.last_browser || "Unknown"}</td>
                    <td>{activity.last_ip_address || "Unavailable"}</td>
                    <td><span className={`status-badge ${normalize(status)}`}>{status}</span></td>
                    <td><span className={`boolean-badge ${activity.new_device_detected ? "yes" : "no"}`}>{activity.new_device_detected ? "Yes" : "No"}</span></td>
                    <td><span className={`boolean-badge ${activity.new_ip_detected ? "yes" : "no"}`}>{activity.new_ip_detected ? "Yes" : "No"}</span></td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan="12" className="tracking-empty-row">
                    {loading ? "Loading activity..." : "No account activity found."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default UserActivity;

