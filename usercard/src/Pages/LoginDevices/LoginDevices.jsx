import { useEffect, useMemo, useState } from "react";
import {
  FaLaptop,
  FaMobileAlt,
  FaDesktop,
  FaSearch,
  FaShieldAlt,
  FaSignOutAlt,
  FaEdit,
  FaTrash,
  FaCheckSquare,
  FaSquare,
  FaBan,
} from "react-icons/fa";
import { getCompanyName } from "../../constants/companies";
import {
  getMyDevices,
  getCompanySessions,
  renameDevice,
  setDeviceTrusted,
  removeDevice,
  logoutDevice,
  logoutAllOtherDevices,
  forceLogoutDevice,
  revokeSessions,
} from "../../services/sessionService";
import "./LoginDevices.css";

const formatDateTime = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const normalize = (value) => String(value || "").toLowerCase();

const deviceIcon = (browser = "", os = "") => {
  const value = normalize(`${browser} ${os}`);
  if (value.includes("android") || value.includes("ios") || value.includes("iphone")) return <FaMobileAlt />;
  if (value.includes("mac") || value.includes("windows") || value.includes("linux")) return <FaLaptop />;
  return <FaDesktop />;
};

function LoginDevices() {
  const role = localStorage.getItem("role")?.toLowerCase() || "user";
  const companyId = localStorage.getItem("company_id") || "1";
  const companyName = localStorage.getItem("company_name") || getCompanyName(companyId);
  const isAdmin = role === "admin";

  const [activeTab, setActiveTab] = useState("my-devices");
  const [myDevices, setMyDevices] = useState([]);
  const [loadingMy, setLoadingMy] = useState(false);
  const [error, setError] = useState("");

  const [companySessions, setCompanySessions] = useState([]);
  const [loadingCompany, setLoadingCompany] = useState(false);
  const [search, setSearch] = useState("");
  const [browserFilter, setBrowserFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);

  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState("");

  const loadMyDevices = async () => {
    setLoadingMy(true);
    setError("");
    try {
      const data = await getMyDevices(companyId);
      setMyDevices(data);
    } catch {
      setError("Could not load your devices. Please try again.");
    } finally {
      setLoadingMy(false);
    }
  };

  const loadCompanySessions = async () => {
    setLoadingCompany(true);
    setError("");
    try {
      const data = await getCompanySessions({
        companyId,
        search,
        browser: browserFilter,
        status: statusFilter,
        date: dateFilter,
      });
      setCompanySessions(data);
    } catch {
      setError("Could not load company sessions.");
    } finally {
      setLoadingCompany(false);
    }
  };

  useEffect(() => {
    loadMyDevices();
  }, [companyId]);

  useEffect(() => {
    if (isAdmin && activeTab === "company-sessions") {
      loadCompanySessions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, activeTab, search, browserFilter, statusFilter, dateFilter]);

  const summary = useMemo(() => {
    const active = myDevices.filter((d) => d.status === "Active").length;
    const trusted = myDevices.filter((d) => d.is_trusted).length;
    return { total: myDevices.length, active, trusted };
  }, [myDevices]);

  const handleRenameSubmit = async (device) => {
    if (!renameValue.trim()) return;
    try {
      await renameDevice(device.id, renameValue.trim(), companyId);
      setRenamingId(null);
      setRenameValue("");
      loadMyDevices();
    } catch (err) {
      alert(err.response?.data?.detail || "Could not rename device");
    }
  };

  const handleToggleTrust = async (device) => {
    try {
      await setDeviceTrusted(device.id, !device.is_trusted, companyId);
      loadMyDevices();
    } catch (err) {
      alert(err.response?.data?.detail || "Could not update trusted status");
    }
  };

  const handleRemove = async (device) => {
    if (!window.confirm(`Remove "${device.device_name}" from your devices?`)) return;
    try {
      await removeDevice(device.id, companyId);
      loadMyDevices();
    } catch (err) {
      alert(err.response?.data?.detail || "Could not remove device");
    }
  };

  const handleLogoutDevice = async (device) => {
    if (!window.confirm(`Log out from "${device.device_name}"?`)) return;
    try {
      await logoutDevice(device.id, companyId);
      loadMyDevices();
    } catch (err) {
      alert(err.response?.data?.detail || "Could not log out device");
    }
  };

  const handleLogoutAllOthers = async () => {
    if (!window.confirm("Log out from all other devices except this one?")) return;
    try {
      await logoutAllOtherDevices(companyId);
      loadMyDevices();
    } catch (err) {
      alert(err.response?.data?.detail || "Could not log out other devices");
    }
  };

  const toggleSelected = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const handleForceLogout = async (session) => {
    if (!window.confirm(`Force logout ${session.user_name} from "${session.device_name}"?`)) return;
    try {
      await forceLogoutDevice(session.id, companyId);
      loadCompanySessions();
    } catch (err) {
      alert(err.response?.data?.detail || "Could not force logout session");
    }
  };

  const handleRevokeSelected = async () => {
    if (!selectedIds.length) return;
    if (!window.confirm(`Revoke ${selectedIds.length} selected session(s)?`)) return;
    try {
      const result = await revokeSessions(selectedIds, companyId);
      if (result.skipped?.length) {
        alert(`${result.skipped.length} session(s) could not be revoked (already revoked or expired).`);
      }
      setSelectedIds([]);
      loadCompanySessions();
    } catch (err) {
      alert(err.response?.data?.detail || "Could not revoke sessions");
    }
  };

  return (
    <div className="devices-page">
      <div className="devices-header">
        <div className="devices-title-wrap">
          <div className="devices-title-icon"><FaShieldAlt /></div>
          <div>
            <h1>Login Devices & Sessions</h1>
            <p>Manage devices logged into your account{isAdmin ? `, and monitor sessions across ${companyName}.` : "."}</p>
          </div>
        </div>

        {!isAdmin && (
          <section className="devices-metrics" aria-label="Device totals">
            <div><span>Total Devices</span><strong>{summary.total}</strong></div>
            <div><span>Active Sessions</span><strong>{summary.active}</strong></div>
            <div><span>Trusted Devices</span><strong>{summary.trusted}</strong></div>
          </section>
        )}
      </div>

      {isAdmin && (
        <div className="devices-tabs">
          <button className={activeTab === "my-devices" ? "active" : ""} onClick={() => setActiveTab("my-devices")}>My Devices</button>
          <button className={activeTab === "company-sessions" ? "active" : ""} onClick={() => setActiveTab("company-sessions")}>Company Sessions</button>
        </div>
      )}

      {error && <div className="devices-error">{error}</div>}

      {activeTab === "my-devices" && (
        <section className="devices-card">
          <div className="devices-toolbar">
            <span className="company-pill">{companyName}</span>
            <button className="devices-btn danger" onClick={handleLogoutAllOthers}>
              <FaSignOutAlt /> Logout All Other Devices
            </button>
          </div>

          <div className="devices-table-wrap">
            <table className="devices-table">
              <thead>
                <tr>
                  <th>Device</th>
                  <th>Browser</th>
                  <th>IP Address</th>
                  <th>Login Time</th>
                  <th>Last Activity</th>
                  <th>Status</th>
                  <th>Trusted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {myDevices.length ? myDevices.map((device) => (
                  <tr key={device.id} className={device.is_current ? "current-row" : ""}>
                    <td>
                      <div className="device-cell">
                        <span className="device-icon">{deviceIcon(device.browser, device.os)}</span>
                        <div>
                          {renamingId === device.id ? (
                            <div className="rename-box">
                              <input
                                value={renameValue}
                                onChange={(e) => setRenameValue(e.target.value)}
                                autoFocus
                              />
                              <button onClick={() => handleRenameSubmit(device)}>Save</button>
                              <button onClick={() => setRenamingId(null)}>Cancel</button>
                            </div>
                          ) : (
                            <>
                              <strong>{device.device_name}</strong>
                              {device.is_current && <span className="current-badge">This Device</span>}
                              <small>{device.os}</small>
                            </>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>{device.browser}</td>
                    <td>{device.ip_address}</td>
                    <td>{formatDateTime(device.login_time)}</td>
                    <td>{formatDateTime(device.last_activity_time)}</td>
                    <td><span className={`status-badge ${normalize(device.status).replace(" ", "-")}`}>{device.status}</span></td>
                    <td>
                      <button className="trust-toggle" onClick={() => handleToggleTrust(device)} title="Toggle trusted device">
                        {device.is_trusted ? <FaCheckSquare /> : <FaSquare />}
                      </button>
                    </td>
                    <td>
                      <div className="devices-actions">
                        <button title="Rename device" onClick={() => { setRenamingId(device.id); setRenameValue(device.device_name); }}>
                          <FaEdit />
                        </button>
                        {device.status === "Active" && !device.is_current && (
                          <button title="Logout this device" onClick={() => handleLogoutDevice(device)}>
                            <FaSignOutAlt />
                          </button>
                        )}
                        {device.status !== "Active" && (
                          <button title="Remove device" onClick={() => handleRemove(device)}>
                            <FaTrash />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="8" className="devices-empty-row">{loadingMy ? "Loading devices..." : "No devices found."}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {isAdmin && activeTab === "company-sessions" && (
        <section className="devices-card">
          <div className="devices-toolbar">
            <label className="devices-search">
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by user, device, browser, or IP..." />
              <FaSearch />
            </label>

            <select value={browserFilter} onChange={(e) => setBrowserFilter(e.target.value)}>
              <option value="">All Browsers</option>
              <option value="Chrome">Chrome</option>
              <option value="Firefox">Firefox</option>
              <option value="Safari">Safari</option>
              <option value="Edge">Edge</option>
              <option value="Opera">Opera</option>
            </select>

            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Logged Out">Logged Out</option>
              <option value="Revoked">Revoked</option>
              <option value="Expired">Expired</option>
            </select>

            <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />

            <button
              className="devices-btn danger"
              disabled={!selectedIds.length}
              onClick={handleRevokeSelected}
            >
              <FaBan /> Revoke Selected ({selectedIds.length})
            </button>
          </div>

          <div className="devices-table-wrap">
            <table className="devices-table">
              <thead>
                <tr>
                  <th></th>
                  <th>User</th>
                  <th>Device</th>
                  <th>Browser</th>
                  <th>IP Address</th>
                  <th>Login Time</th>
                  <th>Last Activity</th>
                  <th>Status</th>
                  <th>Reason</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {companySessions.length ? companySessions.map((session) => (
                  <tr key={session.id}>
                    <td>
                      <button className="trust-toggle" onClick={() => toggleSelected(session.id)}>
                        {selectedIds.includes(session.id) ? <FaCheckSquare /> : <FaSquare />}
                      </button>
                    </td>
                    <td>
                      <div className="device-cell">
                        <span className="tracking-avatar">{(session.user_name || "U").charAt(0).toUpperCase()}</span>
                        <div>
                          <strong>{session.user_name}</strong>
                          <small>{session.user_email}</small>
                        </div>
                      </div>
                    </td>
                    <td>{session.device_name}</td>
                    <td>{session.browser}</td>
                    <td>{session.ip_address}</td>
                    <td>{formatDateTime(session.login_time)}</td>
                    <td>{formatDateTime(session.last_activity_time)}</td>
                    <td><span className={`status-badge ${normalize(session.status).replace(" ", "-")}`}>{session.status}</span></td>
                    <td>{session.termination_reason || "-"}</td>
                    <td>
                      <div className="devices-actions">
                        {session.status === "Active" && (
                          <button title="Force logout" onClick={() => handleForceLogout(session)}>
                            <FaSignOutAlt />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="10" className="devices-empty-row">{loadingCompany ? "Loading sessions..." : "No sessions found."}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

export default LoginDevices;
