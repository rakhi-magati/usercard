import { useEffect, useMemo, useState } from "react";
import {
  FaCopy, FaEnvelope, FaPauseCircle, FaPowerOff, FaUndo,
  FaCheck, FaTimes, FaClock, FaHistory, FaUserCheck, FaBan,
} from "react-icons/fa";
import {
  createInvitation,
  deactivateEmployee,
  getEmployees,
  getInvitations,
  getReactivationRequests,
  reviewReactivationRequest,
  revokeInvitation,
  updateEmployee,
} from "../../services/employeeService";
import "./Invitations.css";

/* ── helpers ── */
const readJson = (key, fallback) => {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
};
const writeJson = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new Event("users-management-changed"));
};

const getCompanyId   = () => localStorage.getItem("company_id")   || "1";
const getCompanyName = () => localStorage.getItem("company_name") || `Company ${getCompanyId()}`;
const makeToken = () =>
  window.crypto?.randomUUID?.() || `invite-${Date.now()}-${Math.random().toString(16).slice(2)}`;
const normalizeStatus  = (s) => String(s || "active").toLowerCase();
const companyMatches   = (item, cid) =>
  String(item?.company_id || item?.companyId || cid) === String(cid);

const audit = (companyId, action, relatedEmployee, adminName) => {
  const key = `local_audit_logs_${companyId}`;
  writeJson(key, [
    { id: `audit-users-${Date.now()}`, user_name: adminName, action,
      related_employee: relatedEmployee, company_id: companyId,
      timestamp: new Date().toISOString() },
    ...readJson(key, []),
  ]);
};

const getLocalMembers = (companyId) => {
  const cached = readJson(`employees_cache_${companyId}`, []);
  if (cached.length) return cached;
  return readJson("users", [])
    .filter((u) => companyMatches(u, companyId))
    .map((u, i) => ({
      id: u.employeeId || u.id || `user-${i}`,
      name: u.name, email: u.email,
      role: u.role || "user", status: u.status || "active",
      suspension_reason: u.suspension_reason || "", company_id: companyId,
    }));
};

const syncLocalMember = (companyId, member, patch) => {
  const upd = (item) =>
    item.email === member.email && companyMatches(item, companyId)
      ? { ...item, ...patch, company_id: companyId } : item;
  writeJson("users", readJson("users", []).map(upd));
  writeJson(`employees_cache_${companyId}`,
    readJson(`employees_cache_${companyId}`, []).map((e) =>
      e.id === member.id || e.email === member.email
        ? { ...e, ...patch, company_id: companyId } : e));
};

/* ─── Component ─── */
function Invitations() {
  const companyId  = getCompanyId();
  const companyName = getCompanyName();
  const adminName  = localStorage.getItem("userName") || localStorage.getItem("name") || "Admin";

  const [invitations,          setInvitations]          = useState(() => readJson(`local_invitations_${companyId}`, []));
  const [members,              setMembers]               = useState(() => getLocalMembers(companyId));
  const [reactivationRequests, setReactivationRequests] = useState(() => readJson(`reactivation_requests_${companyId}`, []));
  const [form,        setForm]        = useState({ email: "", role: "user", expiresDays: "7" });
  const [reasons,     setReasons]     = useState({});
  const [copiedToken, setCopiedToken] = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [notice,      setNotice]      = useState("");
  const [reviewingId, setReviewingId] = useState(null);
  const [historyTab,  setHistoryTab]  = useState("approved"); // "approved" | "rejected"

  /* ── fetch ── */
  const fetchData = async () => {
    setLoading(true);
    try {
      const [remInvites, remMembers, remReqs] = await Promise.allSettled([
        getInvitations(companyId),
        getEmployees(companyId),
        getReactivationRequests(companyId),
      ]);

      if (remInvites.status === "fulfilled" && Array.isArray(remInvites.value)) {
        const merged = [...readJson(`local_invitations_${companyId}`, []), ...remInvites.value];
        const byId   = new Map(merged.map((inv) => [inv.id || inv.token, inv]));
        setInvitations(Array.from(byId.values()));
      }
      if (remMembers.status === "fulfilled" && Array.isArray(remMembers.value)) {
        setMembers(remMembers.value);
        writeJson(`employees_cache_${companyId}`, remMembers.value);
      } else {
        setMembers(getLocalMembers(companyId));
      }
      if (remReqs.status === "fulfilled" && Array.isArray(remReqs.value)) {
        setReactivationRequests(remReqs.value);
        writeJson(`reactivation_requests_${companyId}`, remReqs.value);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const pendingInvitations = invitations.filter((inv) => normalizeStatus(inv.status) === "pending");

  const stats = useMemo(() => {
    const active      = members.filter((m) => normalizeStatus(m.status) === "active").length;
    const suspended   = members.filter((m) => normalizeStatus(m.status) === "suspended").length;
    const deactivated = members.filter((m) => normalizeStatus(m.status) === "inactive").length;
    const reinstate   = reactivationRequests.filter((r) => normalizeStatus(r.status) === "pending").length;
    return { active, suspended, deactivated, reinstate };
  }, [members, reactivationRequests]);

  /* pending / approved / rejected split */
  const pendingRequests   = reactivationRequests.filter((r) => r.status === "pending");
  const approvedRequests  = reactivationRequests.filter((r) => r.status === "approved");
  const rejectedRequests  = reactivationRequests.filter((r) => r.status === "rejected");

  /* ── invitation actions ── */
  const copyLink = async (token) => {
    const link = `${window.location.origin}/accept-invitation?token=${token}`;
    await navigator.clipboard.writeText(link);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const token = makeToken();
    const createdAt = new Date().toISOString();
    let invitation = {
      id: `local-invite-${Date.now()}`, email: form.email, role: form.role,
      token, status: "pending", company_id: companyId,
      created_by: adminName, created_at: createdAt,
      expires_at: new Date(Date.now() + Number(form.expiresDays || 7) * 86400000).toISOString(),
      expires_days: Number(form.expiresDays || 7),
    };
    try {
      const remote = await createInvitation({
        email: form.email, role: form.role, company_id: companyId,
        created_by: adminName, expires_days: Number(form.expiresDays || 7),
      });
      invitation = { ...invitation, ...remote, token: remote?.token || invitation.token };
    } catch { setNotice("API unavailable. Created a local invite link instead."); }

    const next = [invitation, ...invitations];
    setInvitations(next);
    writeJson(`local_invitations_${companyId}`,
      next.filter((inv) => String(inv.id).startsWith("local-") || inv.company_id));
    audit(companyId, `Invitation Created: ${form.role}`, form.email, adminName);
    await copyLink(invitation.token);
    setForm({ email: "", role: "user", expiresDays: "7" });
  };

  const handleRevoke = async (invitation) => {
    if (!window.confirm(`Revoke invite for ${invitation.email}?`)) return;
    try {
      if (invitation.id && !String(invitation.id).startsWith("local-"))
        await revokeInvitation(invitation.id, adminName);
    } catch { setNotice("API unavailable. Invite was revoked locally."); }
    const next = invitations.map((item) =>
      (item.id || item.token) === (invitation.id || invitation.token)
        ? { ...item, status: "revoked", revoked_by: adminName, revoked_at: new Date().toISOString() }
        : item);
    setInvitations(next);
    writeJson(`local_invitations_${companyId}`, next);
    audit(companyId, "Invitation Revoked", invitation.email, adminName);
  };

  /* ── member status actions ── */
  const updateMemberStatus = async (member, status) => {
    const reason = reasons[member.id] || member.suspension_reason || "Administrative action";
    const patch  = {
      status, suspension_reason: status === "suspended" ? reason : "",
      status_updated_by: adminName, status_updated_at: new Date().toISOString(),
    };
    try {
      if (status === "inactive") {
        await deactivateEmployee(member.id, adminName);
      } else if (!String(member.id).startsWith("user-")) {
        await updateEmployee(member.id, { ...member, ...patch, company_id: companyId, admin_name: adminName });
      }
    } catch { setNotice("API unavailable. Member status was updated locally."); }
    setMembers((cur) => cur.map((m) => m.id === member.id ? { ...m, ...patch } : m));
    syncLocalMember(companyId, member, patch);
    audit(companyId,
      `User ${status === "active" ? "Reactivated" : status === "inactive" ? "Deactivated" : "Suspended"}`,
      member.email, adminName);
  };

  /* ── reinstatement review ── */
  const handleReview = async (id, action) => {
    const label = action === "approved" ? "approve" : "reject";
    if (!window.confirm(`Are you sure you want to ${label} this reinstatement request?`)) return;
    setReviewingId(id);
    try {
      await reviewReactivationRequest(id, action, adminName, parseInt(companyId));
      const updated = reactivationRequests.map((r) =>
        r.id === id
          ? { ...r, status: action, reviewed_by: adminName, reviewed_at: new Date().toISOString() }
          : r);
      setReactivationRequests(updated);
      writeJson(`reactivation_requests_${companyId}`, updated);
      audit(companyId, `Reinstatement ${action === "approved" ? "Approved" : "Rejected"}`,
        reactivationRequests.find((r) => r.id === id)?.employee_name || "", adminName);
    } catch { setNotice("API unavailable. Could not update reinstatement request."); }
    finally { setReviewingId(null); }
  };

  if (loading) return <div className="users-loading">Loading users...</div>;

  const historyList = historyTab === "approved" ? approvedRequests : rejectedRequests;

  return (
    <div className="users-management-page">
      <div className="users-page-header">
        <div>
          <h1>Suspension &amp; Reinstatement Management</h1>
          <p>
            Manage members, suspend or deactivate accounts, send invites, and review
            reinstatement requests for {companyName}.
          </p>
        </div>
      </div>

      {notice && <div className="users-notice">{notice}</div>}

      {/* ── stats ── */}
      <section className="users-stats-grid">
        <div className="users-stat-card active">
          <span>Active Users</span>
          <strong>{stats.active}</strong>
          <small>{stats.active} active accounts</small>
        </div>
        <div className="users-stat-card suspended">
          <span>Suspended Users</span>
          <strong>{stats.suspended}</strong>
          <small>{stats.suspended ? "Access paused" : "No suspensions"}</small>
        </div>
        <div className="users-stat-card deactivated">
          <span>Deactivated Users</span>
          <strong>{stats.deactivated}</strong>
          <small>Login blocked</small>
        </div>
        <div className="users-stat-card requests">
          <span>Reinstatement Requests</span>
          <strong>{stats.reinstate}</strong>
          <small>{stats.reinstate ? "Needs review" : "All clear"}</small>
        </div>
      </section>

      {/* ── invite + pending invites ── */}
      <div className="users-panel-grid">
        <section className="users-card invite-card">
          <h2>Create Invite</h2>
          <form className="invite-inline-form" onSubmit={handleCreate}>
            <label>
              Email
              <input type="email" placeholder="user@company.com" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </label>
            <label>
              Role
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </label>
            <label>
              Expires (days)
              <input type="number" min="1" max="30" value={form.expiresDays}
                onChange={(e) => setForm({ ...form, expiresDays: e.target.value })} />
            </label>
            <button type="submit"><FaEnvelope /> Create &amp; Copy Link</button>
          </form>
          <p>Invite links open signup with the company and role locked to the invite.</p>
        </section>

        <section className="users-card pending-card">
          <h2>Pending Invites</h2>
          <table className="users-table compact">
            <thead>
              <tr><th>Email</th><th>Role</th><th>Status</th><th>Expires</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {pendingInvitations.length ? pendingInvitations.map((inv) => (
                <tr key={inv.id || inv.token}>
                  <td>{inv.email}</td>
                  <td>{inv.role}</td>
                  <td>{inv.status}</td>
                  <td>{inv.expires_at ? new Date(inv.expires_at).toLocaleDateString() : `${inv.expires_days || 7}d`}</td>
                  <td className="invite-actions">
                    <button onClick={() => copyLink(inv.token)} title="Copy link">
                      <FaCopy /> {copiedToken === inv.token ? "Copied" : "Copy"}
                    </button>
                    <button className="danger" onClick={() => handleRevoke(inv)}>Revoke</button>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="5" className="empty-cell">No pending invitations</td></tr>
              )}
            </tbody>
          </table>
        </section>
      </div>

      {/* ══════════════════════════════════════════════
          REINSTATEMENT REQUESTS SECTION
      ══════════════════════════════════════════════ */}
      <section className="users-card reinstate-section">
        <div className="reinstate-header">
          <h2><FaUndo /> Reinstatement Requests</h2>
          <p>Review requests from suspended employees asking to have their access restored.</p>
        </div>

        {/* ── Pending requests ── */}
        <div className="reinstate-block">
          <h3 className="reinstate-sub-title">
            <FaClock className="icon-pending" />
            Pending
            {pendingRequests.length > 0 && (
              <span className="reinstate-count pending">{pendingRequests.length}</span>
            )}
          </h3>

          {pendingRequests.length === 0 ? (
            <div className="reinstate-empty">No pending reinstatement requests</div>
          ) : (
            <div className="reinstate-cards-grid">
              {pendingRequests.map((req) => (
                <div key={req.id} className="reinstate-card">
                  <div className="reinstate-card-avatar">
                    {(req.employee_name || "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="reinstate-card-body">
                    <div className="reinstate-card-name">{req.employee_name || "—"}</div>
                    <div className="reinstate-card-reason">
                      {req.reason || "No reason provided"}
                    </div>
                    <div className="reinstate-card-date">
                      Requested:{" "}
                      {req.requested_at
                        ? new Date(req.requested_at).toLocaleString()
                        : "—"}
                    </div>
                  </div>
                  <div className="reinstate-card-actions">
                    <button
                      className="reinstate-approve-btn"
                      disabled={reviewingId === req.id}
                      onClick={() => handleReview(req.id, "approved")}
                    >
                      <FaCheck />
                      {reviewingId === req.id ? "…" : "Approve"}
                    </button>
                    <button
                      className="reinstate-reject-btn"
                      disabled={reviewingId === req.id}
                      onClick={() => handleReview(req.id, "rejected")}
                    >
                      <FaTimes />
                      {reviewingId === req.id ? "…" : "Reject"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── History (approved / rejected) ── */}
        {(approvedRequests.length > 0 || rejectedRequests.length > 0) && (
          <div className="reinstate-block reinstate-history-block">
            <h3 className="reinstate-sub-title">
              <FaHistory className="icon-history" /> History
            </h3>

            {/* tab pills */}
            <div className="reinstate-tabs">
              <button
                className={`reinstate-tab ${historyTab === "approved" ? "active" : ""}`}
                onClick={() => setHistoryTab("approved")}
              >
                <FaUserCheck /> Approved
                {approvedRequests.length > 0 && (
                  <span className="reinstate-count approved">{approvedRequests.length}</span>
                )}
              </button>
              <button
                className={`reinstate-tab ${historyTab === "rejected" ? "active" : ""}`}
                onClick={() => setHistoryTab("rejected")}
              >
                <FaBan /> Rejected
                {rejectedRequests.length > 0 && (
                  <span className="reinstate-count rejected">{rejectedRequests.length}</span>
                )}
              </button>
            </div>

            {historyList.length === 0 ? (
              <div className="reinstate-empty">No {historyTab} requests yet.</div>
            ) : (
              <table className="users-table reinstate-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Reason</th>
                    <th>Requested</th>
                    <th>Reviewed by</th>
                    <th>Reviewed at</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {historyList.map((req) => (
                    <tr key={req.id}>
                      <td className="reinstate-name-cell">{req.employee_name || "—"}</td>
                      <td className="reinstate-reason-cell">{req.reason || "—"}</td>
                      <td>
                        {req.requested_at
                          ? new Date(req.requested_at).toLocaleDateString()
                          : "—"}
                      </td>
                      <td>{req.reviewed_by || "—"}</td>
                      <td>
                        {req.reviewed_at
                          ? new Date(req.reviewed_at).toLocaleString()
                          : "—"}
                      </td>
                      <td>
                        <span className={`reinstate-badge ${req.status}`}>
                          {req.status === "approved" ? <FaCheck /> : <FaTimes />}
                          {" "}{req.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </section>

      {/* ── Members table ── */}
      <section className="users-card members-card" style={{ marginTop: 14 }}>
        <h2>Members</h2>
        <div className="users-table-wrap">
          <table className="users-table">
            <thead>
              <tr>
                <th>Name</th><th>Email</th><th>Role</th>
                <th>Status</th><th>Suspension Reason</th><th>Action</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => {
                const status = normalizeStatus(member.status);
                return (
                  <tr key={member.id || member.email}>
                    <td>{member.name}</td>
                    <td>{member.email}</td>
                    <td>{member.role || "user"}</td>
                    <td>
                      <span className={`member-status ${status}`}>
                        {status === "inactive" ? "Deactivated" : status}
                      </span>
                    </td>
                    <td>
                      <input
                        className="reason-input"
                        placeholder="Reason for suspension"
                        value={reasons[member.id] ?? member.suspension_reason ?? ""}
                        onChange={(e) => setReasons({ ...reasons, [member.id]: e.target.value })}
                      />
                    </td>
                    <td>
                      <div className="member-actions">
                        {status !== "suspended" && status !== "inactive" && (
                          <button className="suspend-btn" onClick={() => updateMemberStatus(member, "suspended")}>
                            <FaPauseCircle /> Suspend
                          </button>
                        )}
                        {status !== "inactive" && (
                          <button className="deactivate-btn" onClick={() => updateMemberStatus(member, "inactive")}>
                            <FaPowerOff /> Deactivate
                          </button>
                        )}
                        {status !== "active" && (
                          <button className="restore-btn" onClick={() => updateMemberStatus(member, "active")}>
                            <FaUndo /> Restore
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!members.length && (
                <tr><td colSpan="6" className="empty-cell">No members found for this company.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default Invitations;
