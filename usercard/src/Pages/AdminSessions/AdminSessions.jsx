import { useEffect, useMemo, useState } from "react";
import {
  FaSearch,
  FaCheckSquare,
  FaSquare,
  FaBan,
  FaSignOutAlt,
  FaHistory,
  FaFileExport,
  FaTimes,
  FaEllipsisH,
  FaExclamationCircle,
} from "react-icons/fa";
import { getCompanySessions, forceLogoutDevice, revokeSessions } from "../../services/sessionService";
import { getEmployees } from "../../services/employeeService";
import "./AdminSessions.css";

const PAGE_SIZE = 6;

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

const normalize = (value) => String(value || "").toLowerCase().replace(/\s+/g, "-");

const withinLastDays = (value, days) => {
  if (!value) return false;
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return false;
  return Date.now() - then <= days * 24 * 60 * 60 * 1000;
};

const toCsvValue = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;

function AdminSessions() {
  const companyId = localStorage.getItem("company_id") || "1";

  const [sessions, setSessions] = useState([]);
  const [departmentByEmail, setDepartmentByEmail] = useState({});
  const [loading, setLoading] = useState(false);

  const [activeTab, setActiveTab] = useState("active");
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [browserFilter, setBrowserFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);

  const [selectedIds, setSelectedIds] = useState([]);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [detailsSession, setDetailsSession] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message) => {
    setToast(message);
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast(null), 2600);
  };

  const loadSessions = async () => {
    setLoading(true);
    try {
      const data = await getCompanySessions({ companyId });
      setSessions(data || []);
    } catch {
      showToast("Could not load sessions.");
    } finally {
      setLoading(false);
    }
  };

  const loadDepartments = async () => {
    try {
      const employees = await getEmployees(companyId);
      const map = {};
      (employees || []).forEach((emp) => {
        map[normalize(emp.email)] = emp.department || "General";
      });
      setDepartmentByEmail(map);
    } catch {
      // department is a "nice to have" column - fail silently
    }
  };

  useEffect(() => {
    loadSessions();
    loadDepartments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  const enriched = useMemo(
    () =>
      sessions.map((s) => ({
        ...s,
        department: departmentByEmail[normalize(s.user_email)] || "General",
      })),
    [sessions, departmentByEmail]
  );

  const stats = useMemo(() => {
    const totalActive = enriched.filter((s) => s.status === "Active").length;
    const expired7d = enriched.filter((s) => s.status === "Expired" && withinLastDays(s.last_activity_time || s.login_time, 7)).length;
    const revoked7d = enriched.filter((s) => s.status === "Revoked" && withinLastDays(s.revoke_reviewed_at || s.logout_time || s.login_time, 7)).length;
    const forceLogouts7d = enriched.filter((s) => s.termination_reason === "Force Logout" && withinLastDays(s.logout_time || s.last_activity_time, 7)).length;
    const totalUsers = new Set(enriched.map((s) => normalize(s.user_email))).size;
    return { totalActive, expired7d, revoked7d, forceLogouts7d, totalUsers };
  }, [enriched]);

  const departments = useMemo(
    () => Array.from(new Set(Object.values(departmentByEmail))).sort(),
    [departmentByEmail]
  );

  const tabFiltered = useMemo(() => {
    if (activeTab === "active") return enriched.filter((s) => s.status === "Active");
    if (activeTab === "recent") return enriched.filter((s) => withinLastDays(s.login_time, 30));
    return enriched; // All Sessions History
  }, [enriched, activeTab]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return tabFiltered.filter((s) => {
      if (needle) {
        const haystack = `${s.user_name} ${s.user_email}`.toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      if (departmentFilter && s.department !== departmentFilter) return false;
      if (browserFilter && !(s.browser || "").toLowerCase().includes(browserFilter.toLowerCase())) return false;
      if (statusFilter && s.status !== statusFilter) return false;
      if (dateRange.from && new Date(s.login_time) < new Date(dateRange.from)) return false;
      if (dateRange.to && new Date(s.login_time) > new Date(`${dateRange.to}T23:59:59`)) return false;
      return true;
    });
  }, [tabFiltered, search, departmentFilter, browserFilter, statusFilter, dateRange]);

  useEffect(() => setPage(1), [activeTab, search, departmentFilter, browserFilter, statusFilter, dateRange]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const toggleSelected = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const clearFilters = () => {
    setDepartmentFilter("");
    setBrowserFilter("");
    setStatusFilter("");
    setDateRange({ from: "", to: "" });
    setFiltersOpen(false);
  };

  const handleForceLogoutRow = async (session) => {
    if (!window.confirm(`Force logout ${session.user_name}?`)) return;
    try {
      await forceLogoutDevice(session.id, companyId);
      showToast(`${session.user_name} has been logged out.`);
      loadSessions();
    } catch (err) {
      showToast(err.response?.data?.detail || "Could not force logout session");
    }
  };

  const handleRevokeRow = async (session) => {
    if (!window.confirm(`Revoke the session for ${session.user_name}? The admin team will be notified.`)) return;
    try {
      await revokeSessions([session.id], companyId);
      showToast("Revoke request sent. Admins have been notified.");
      loadSessions();
    } catch (err) {
      showToast(err.response?.data?.detail || "Could not revoke session");
    }
  };

  // "Session Administration" quick actions operate on the current selection.
  const handleQuickForceLogout = async () => {
    const activeSelected = selectedIds
      .map((id) => enriched.find((s) => s.id === id))
      .filter((s) => s && s.status === "Active");

    if (activeSelected.length !== 1) {
      showToast("Select one active session");
      return;
    }
    await handleForceLogoutRow(activeSelected[0]);
    setSelectedIds([]);
  };

  const handleQuickRevoke = async () => {
    const revocable = selectedIds.filter((id) => {
      const s = enriched.find((item) => item.id === id);
      return s && s.status === "Active" && s.revoke_status !== "Pending";
    });

    if (!revocable.length) {
      showToast("Select at least one active session");
      return;
    }
    if (!window.confirm(`Revoke ${revocable.length} session(s)? The admin team will be notified.`)) return;
    try {
      await revokeSessions(revocable, companyId);
      showToast("Revoke request sent. Admins have been notified.");
      setSelectedIds([]);
      loadSessions();
    } catch (err) {
      showToast(err.response?.data?.detail || "Could not revoke selected sessions");
    }
  };

  const handleViewHistory = () => {
    setActiveTab("history");
    setPage(1);
  };

  const handleExportReport = () => {
    const header = ["User Name", "Email", "Department", "Login Time", "Last Activity", "Browser", "IP Address", "Status", "Termination Reason"];
    const rows = filtered.map((s) => [
      s.user_name, s.user_email, s.department, s.login_time, s.last_activity_time, s.browser, s.ip_address, s.status, s.termination_reason || "-",
    ]);
    const csv = [header, ...rows].map((row) => row.map(toCsvValue).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "session-report.csv";
    link.click();
    URL.revokeObjectURL(url);
    showToast("Session report downloaded.");
  };

  return (
    <div className="usm-page">
      {toast && (
        <div className="usm-toast">
          <FaExclamationCircle />
          <span>{toast}</span>
        </div>
      )}

      <div className="usm-header">
        <h1>User Session Monitoring</h1>
        <p>View and manage all active and recent user sessions within your company.</p>
      </div>

      <div className="usm-stats">
        <div className="usm-stat-card">
          <span className="usm-stat-icon usm-icon-blue">T</span>
          <div>
            <strong>{stats.totalActive}</strong>
            <p>Total Active Sessions</p>
            <small>Across {stats.totalUsers} users</small>
          </div>
        </div>
        <div className="usm-stat-card">
          <span className="usm-stat-icon usm-icon-orange">E</span>
          <div>
            <strong>{stats.expired7d}</strong>
            <p>Expired Sessions</p>
            <small>Last 7 days</small>
          </div>
        </div>
        <div className="usm-stat-card">
          <span className="usm-stat-icon usm-icon-red">R</span>
          <div>
            <strong>{stats.revoked7d}</strong>
            <p>Revoked Sessions</p>
            <small>Last 7 days</small>
          </div>
        </div>
        <div className="usm-stat-card">
          <span className="usm-stat-icon usm-icon-purple">F</span>
          <div>
            <strong>{stats.forceLogouts7d}</strong>
            <p>Force Logouts</p>
            <small>Last 7 days</small>
          </div>
        </div>
        <div className="usm-stat-card">
          <span className="usm-stat-icon usm-icon-teal">T</span>
          <div>
            <strong>{stats.totalUsers}</strong>
            <p>Total Users</p>
            <small>In this company</small>
          </div>
        </div>
      </div>

      <div className="usm-body">
        <section className="usm-card">
          <div className="usm-toolbar">
            <label className="usm-search">
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by user name..." />
              <FaSearch />
            </label>

            <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)}>
              <option value="">All Departments</option>
              {departments.map((dep) => (
                <option key={dep} value={dep}>{dep}</option>
              ))}
            </select>

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

            <div className="usm-filters-wrap">
              <button className="usm-btn" onClick={() => setFiltersOpen((v) => !v)}>Filters</button>
              {filtersOpen && (
                <div className="usm-filters-popover">
                  <label>
                    From
                    <input type="date" value={dateRange.from} onChange={(e) => setDateRange((r) => ({ ...r, from: e.target.value }))} />
                  </label>
                  <label>
                    To
                    <input type="date" value={dateRange.to} onChange={(e) => setDateRange((r) => ({ ...r, to: e.target.value }))} />
                  </label>
                  <button className="usm-btn ghost" onClick={clearFilters}>Clear Filters</button>
                </div>
              )}
            </div>
          </div>

          <div className="usm-tabs">
            <button className={activeTab === "active" ? "active" : ""} onClick={() => setActiveTab("active")}>
              Active Sessions ({enriched.filter((s) => s.status === "Active").length})
            </button>
            <button className={activeTab === "recent" ? "active" : ""} onClick={() => setActiveTab("recent")}>
              Recent Sessions
            </button>
            <button className={activeTab === "history" ? "active" : ""} onClick={() => setActiveTab("history")}>
              All Sessions History
            </button>
          </div>

          <div className="usm-table-wrap">
            <table className="usm-table">
              <thead>
                <tr>
                  <th></th>
                  <th>User Name</th>
                  <th>Department</th>
                  <th>Login Time</th>
                  <th>Last Activity</th>
                  <th>Browser / Device</th>
                  <th>IP Address</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.length ? pageRows.map((session) => (
                  <tr key={session.id}>
                    <td>
                      {session.revoke_status === "Pending" || session.status !== "Active" ? (
                        <span className="usm-checkbox-disabled" title={session.revoke_status === "Pending" ? "Revoke pending approval" : ""}>-</span>
                      ) : (
                        <button className="usm-checkbox" onClick={() => toggleSelected(session.id)}>
                          {selectedIds.includes(session.id) ? <FaCheckSquare /> : <FaSquare />}
                        </button>
                      )}
                    </td>
                    <td>
                      <strong>{session.user_name}</strong>
                      <small>{session.user_email}</small>
                    </td>
                    <td>{session.department}</td>
                    <td>{formatDateTime(session.login_time)}</td>
                    <td>{formatDateTime(session.last_activity_time)}</td>
                    <td>
                      <strong>{session.browser || "-"}</strong>
                      <small>{session.os ? `${session.os} Device` : "Unknown Device"}</small>
                    </td>
                    <td>{session.ip_address || "-"}</td>
                    <td>Unknown Location</td>
                    <td>
                      <span className={`usm-badge ${normalize(session.status)}`}>{session.status}</span>
                      {session.revoke_status === "Pending" && (
                        <span className="usm-badge pending" title={`Requested by ${session.revoke_requested_by || "an admin"}`}>
                          Revoke Pending
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="usm-actions">
                        {session.status === "Active" ? (
                          <button className="usm-btn small danger" onClick={() => handleForceLogoutRow(session)}>Force Logout</button>
                        ) : (
                          <button className="usm-btn small" onClick={() => setDetailsSession(session)}>View Details</button>
                        )}
                        <div className="usm-menu-wrap">
                          <button className="usm-icon-btn" onClick={() => setOpenMenuId(openMenuId === session.id ? null : session.id)}>
                            <FaEllipsisH />
                          </button>
                          {openMenuId === session.id && (
                            <div className="usm-menu" onMouseLeave={() => setOpenMenuId(null)}>
                              <button onClick={() => { setDetailsSession(session); setOpenMenuId(null); }}>View Details</button>
                              {session.status === "Active" && session.revoke_status !== "Pending" && (
                                <button onClick={() => { handleRevokeRow(session); setOpenMenuId(null); }}>Revoke Session</button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="10" className="usm-empty-row">{loading ? "Loading sessions..." : "No sessions found."}</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="usm-pagination">
            <span>
              {filtered.length ? (
                <>Showing {(currentPage - 1) * PAGE_SIZE + 1} to {Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length} sessions</>
              ) : (
                "Showing 0 sessions"
              )}
            </span>
            <div className="usm-pagination-buttons">
              <button disabled={currentPage === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                <button key={num} className={num === currentPage ? "active" : ""} onClick={() => setPage(num)}>{num}</button>
              ))}
              <button disabled={currentPage === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</button>
            </div>
          </div>
        </section>

        <aside className="usm-side-panel">
          <h3>Session Administration</h3>

          <button className="usm-admin-item" onClick={handleQuickForceLogout}>
            <span className="usm-admin-icon usm-icon-orange"><FaSignOutAlt /></span>
            <div>
              <strong>Force Logout Session</strong>
              <p>Immediately logout an active user session.</p>
            </div>
          </button>

          <button className="usm-admin-item" onClick={handleQuickRevoke}>
            <span className="usm-admin-icon usm-icon-red"><FaBan /></span>
            <div>
              <strong>Revoke Sessions</strong>
              <p>Revoke one or multiple user sessions.</p>
            </div>
          </button>

          <button className="usm-admin-item" onClick={handleViewHistory}>
            <span className="usm-admin-icon usm-icon-blue"><FaHistory /></span>
            <div>
              <strong>View Session History</strong>
              <p>View all past user sessions.</p>
            </div>
          </button>

          <button className="usm-admin-item" onClick={handleExportReport}>
            <span className="usm-admin-icon usm-icon-teal"><FaFileExport /></span>
            <div>
              <strong>Export Session Report</strong>
              <p>Download sessions report.</p>
            </div>
          </button>
        </aside>
      </div>

      {detailsSession && (
        <div className="usm-modal-overlay" onClick={() => setDetailsSession(null)}>
          <div className="usm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="usm-modal-header">
              <h3>Session Details</h3>
              <button onClick={() => setDetailsSession(null)}><FaTimes /></button>
            </div>
            <div className="usm-modal-body">
              <p><strong>User:</strong> {detailsSession.user_name} ({detailsSession.user_email})</p>
              <p><strong>Browser:</strong> {detailsSession.os || "Unknown OS"} &middot; {detailsSession.browser || "Unknown Browser"}</p>
              <p><strong>IP Address:</strong> {detailsSession.ip_address || "-"}</p>
              <p><strong>Status:</strong> {detailsSession.status}</p>
              {detailsSession.termination_reason && (
                <p><strong>Termination Reason:</strong> {detailsSession.termination_reason}{detailsSession.terminated_by ? ` by ${detailsSession.terminated_by}` : ""}</p>
              )}
              <p><strong>Login Time:</strong> {formatDateTime(detailsSession.login_time)}</p>
              <p><strong>Last Activity:</strong> {formatDateTime(detailsSession.last_activity_time)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminSessions;
