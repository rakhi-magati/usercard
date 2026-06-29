import { useEffect, useMemo, useState } from "react";
import { FaCopy, FaEnvelope, FaPauseCircle, FaPowerOff, FaUndo } from "react-icons/fa";
import {
  createInvitation,
  deactivateEmployee,
  getEmployees,
  getInvitations,
  getReactivationRequests,
  revokeInvitation,
  updateEmployee,
} from "../../services/employeeService";
import "./Invitations.css";

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
  window.dispatchEvent(new Event("users-management-changed"));
};

const getCompanyId = () => localStorage.getItem("company_id") || "1";
const getCompanyName = () => localStorage.getItem("company_name") || `Company ${getCompanyId()}`;

const makeToken = () => {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `invite-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const normalizeStatus = (status) => String(status || "active").toLowerCase();

const companyMatches = (item, companyId) =>
  String(item?.company_id || item?.companyId || companyId) === String(companyId);

const audit = (companyId, action, relatedEmployee, adminName) => {
  const key = `local_audit_logs_${companyId}`;
  writeJson(key, [
    {
      id: `audit-users-${Date.now()}`,
      user_name: adminName,
      action,
      related_employee: relatedEmployee,
      company_id: companyId,
      timestamp: new Date().toISOString(),
    },
    ...readJson(key, []),
  ]);
};

const getLocalMembers = (companyId) => {
  const cached = readJson(`employees_cache_${companyId}`, []);
  if (cached.length) return cached;

  return readJson("users", [])
    .filter((user) => companyMatches(user, companyId))
    .map((user, index) => ({
      id: user.employeeId || user.id || `user-${index}`,
      name: user.name,
      email: user.email,
      role: user.role || "user",
      status: user.status || "active",
      suspension_reason: user.suspension_reason || "",
      company_id: companyId,
    }));
};

const syncLocalMember = (companyId, member, patch) => {
  const updateByEmail = (item) =>
    item.email === member.email && companyMatches(item, companyId)
      ? { ...item, ...patch, company_id: companyId }
      : item;

  writeJson(
    "users",
    readJson("users", []).map(updateByEmail)
  );

  writeJson(
    `employees_cache_${companyId}`,
    readJson(`employees_cache_${companyId}`, []).map((employee) =>
      employee.id === member.id || employee.email === member.email
        ? { ...employee, ...patch, company_id: companyId }
        : employee
    )
  );
};

function Invitations() {
  const companyId = getCompanyId();
  const companyName = getCompanyName();
  const adminName = localStorage.getItem("userName") || localStorage.getItem("name") || "Admin";
  const [invitations, setInvitations] = useState(() => readJson(`local_invitations_${companyId}`, []));
  const [members, setMembers] = useState(() => getLocalMembers(companyId));
  const [reactivationRequests, setReactivationRequests] = useState(() => readJson(`reactivation_requests_${companyId}`, []));
  const [form, setForm] = useState({ email: "", role: "user", expiresDays: "7" });
  const [reasons, setReasons] = useState({});
  const [copiedToken, setCopiedToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [remoteInvitations, remoteMembers, remoteRequests] = await Promise.allSettled([
        getInvitations(companyId),
        getEmployees(companyId),
        getReactivationRequests(companyId),
      ]);

      if (remoteInvitations.status === "fulfilled" && Array.isArray(remoteInvitations.value)) {
        const mergedInvitations = [
          ...readJson(`local_invitations_${companyId}`, []),
          ...remoteInvitations.value,
        ];
        const byId = new Map(mergedInvitations.map((invite) => [invite.id || invite.token, invite]));
        setInvitations(Array.from(byId.values()));
      }

      if (remoteMembers.status === "fulfilled" && Array.isArray(remoteMembers.value)) {
        setMembers(remoteMembers.value);
        writeJson(`employees_cache_${companyId}`, remoteMembers.value);
      } else {
        setMembers(getLocalMembers(companyId));
      }

      if (remoteRequests.status === "fulfilled" && Array.isArray(remoteRequests.value)) {
        setReactivationRequests(remoteRequests.value);
        writeJson(`reactivation_requests_${companyId}`, remoteRequests.value);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const pendingInvitations = invitations.filter((invite) => normalizeStatus(invite.status) === "pending");

  const stats = useMemo(() => {
    const active = members.filter((member) => normalizeStatus(member.status) === "active").length;
    const suspended = members.filter((member) => normalizeStatus(member.status) === "suspended").length;
    const deactivated = members.filter((member) => normalizeStatus(member.status) === "inactive").length;
    const reinstatement = reactivationRequests.filter((request) => normalizeStatus(request.status) === "pending").length;

    return { active, suspended, deactivated, reinstatement };
  }, [members, reactivationRequests]);

  const copyLink = async (token) => {
    const link = `${window.location.origin}/accept-invitation?token=${token}`;
    await navigator.clipboard.writeText(link);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    const token = makeToken();
    const createdAt = new Date().toISOString();
    let invitation = {
      id: `local-invite-${Date.now()}`,
      email: form.email,
      role: form.role,
      token,
      status: "pending",
      company_id: companyId,
      created_by: adminName,
      created_at: createdAt,
      expires_at: new Date(Date.now() + Number(form.expiresDays || 7) * 86400000).toISOString(),
      expires_days: Number(form.expiresDays || 7),
    };

    try {
      const remoteInvitation = await createInvitation({
        email: form.email,
        role: form.role,
        company_id: companyId,
        created_by: adminName,
        expires_days: Number(form.expiresDays || 7),
      });
      invitation = { ...invitation, ...remoteInvitation, token: remoteInvitation?.token || invitation.token };
    } catch {
      setNotice("API unavailable. Created a local invite link instead.");
    }

    const nextInvitations = [invitation, ...invitations];
    setInvitations(nextInvitations);
    writeJson(`local_invitations_${companyId}`, nextInvitations.filter((invite) => String(invite.id).startsWith("local-") || invite.company_id));
    audit(companyId, `Invitation Created: ${form.role}`, form.email, adminName);
    await copyLink(invitation.token);
    setForm({ email: "", role: "user", expiresDays: "7" });
  };

  const handleRevoke = async (invitation) => {
    if (!window.confirm(`Revoke invite for ${invitation.email}?`)) return;

    try {
      if (invitation.id && !String(invitation.id).startsWith("local-")) {
        await revokeInvitation(invitation.id, adminName);
      }
    } catch {
      setNotice("API unavailable. Invite was revoked locally.");
    }

    const nextInvitations = invitations.map((item) =>
      (item.id || item.token) === (invitation.id || invitation.token)
        ? { ...item, status: "revoked", revoked_by: adminName, revoked_at: new Date().toISOString() }
        : item
    );
    setInvitations(nextInvitations);
    writeJson(`local_invitations_${companyId}`, nextInvitations);
    audit(companyId, "Invitation Revoked", invitation.email, adminName);
  };

  const updateMemberStatus = async (member, status) => {
    const reason = reasons[member.id] || member.suspension_reason || "Administrative action";
    const patch = {
      status,
      suspension_reason: status === "suspended" ? reason : "",
      status_updated_by: adminName,
      status_updated_at: new Date().toISOString(),
    };

    try {
      if (status === "inactive") {
        await deactivateEmployee(member.id, adminName);
      } else if (!String(member.id).startsWith("user-")) {
        await updateEmployee(member.id, { ...member, ...patch, company_id: companyId, admin_name: adminName });
      }
    } catch {
      setNotice("API unavailable. Member status was updated locally.");
    }

    setMembers((current) => current.map((item) => (item.id === member.id ? { ...item, ...patch } : item)));
    syncLocalMember(companyId, member, patch);
    audit(companyId, `User ${status === "active" ? "Reactivated" : status === "inactive" ? "Deactivated" : "Suspended"}`, member.email, adminName);
  };

  if (loading) return <div className="users-loading">Loading users...</div>;

  return (
    <div className="users-management-page">
      <div className="users-page-header">
        <div>
          <h1>Suspension Management</h1>
          <p>Manage members, suspend company users or admins, and review reinstatement requests for {companyName}.</p>
        </div>
      </div>

      {notice && <div className="users-notice">{notice}</div>}

      <section className="users-stats-grid">
        <div className="users-stat-card active"><span>Active Users</span><strong>{stats.active}</strong><small>{stats.active} active accounts</small></div>
        <div className="users-stat-card suspended"><span>Suspended Users</span><strong>{stats.suspended}</strong><small>{stats.suspended ? "Access paused" : "No suspensions"}</small></div>
        <div className="users-stat-card deactivated"><span>Deactivated Users</span><strong>{stats.deactivated}</strong><small>Login blocked</small></div>
        <div className="users-stat-card requests"><span>Reinstatement Requests</span><strong>{stats.reinstatement}</strong><small>{stats.reinstatement ? "Needs review" : "No pending review"}</small></div>
      </section>

      <div className="users-panel-grid">
        <section className="users-card invite-card">
          <h2>Create Invite</h2>
          <form className="invite-inline-form" onSubmit={handleCreate}>
            <label>
              Email
              <input
                type="email"
                placeholder="user@company.com"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                required
              />
            </label>
            <label>
              Role
              <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </label>
            <label>
              Expires (days)
              <input
                type="number"
                min="1"
                max="30"
                value={form.expiresDays}
                onChange={(event) => setForm({ ...form, expiresDays: event.target.value })}
              />
            </label>
            <button type="submit"><FaEnvelope /> Create & Copy Link</button>
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
              {pendingInvitations.length ? pendingInvitations.map((invite) => (
                <tr key={invite.id || invite.token}>
                  <td>{invite.email}</td>
                  <td>{invite.role}</td>
                  <td>{invite.status}</td>
                  <td>{invite.expires_at ? new Date(invite.expires_at).toLocaleDateString() : `${invite.expires_days || 7} days`}</td>
                  <td className="invite-actions">
                    <button onClick={() => copyLink(invite.token)} title="Copy link"><FaCopy /> {copiedToken === invite.token ? "Copied" : "Copy"}</button>
                    <button className="danger" onClick={() => handleRevoke(invite)}>Revoke</button>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="5" className="empty-cell">No pending invitations</td></tr>
              )}
            </tbody>
          </table>
        </section>
      </div>

      <section className="users-card members-card">
        <h2>Members</h2>
        <div className="users-table-wrap">
          <table className="users-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Suspension Reason</th>
                <th>Action</th>
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
                    <td><span className={`member-status ${status}`}>{status === "inactive" ? "Deactivated" : status}</span></td>
                    <td>
                      <input
                        className="reason-input"
                        placeholder="Reason for suspension"
                        value={reasons[member.id] ?? member.suspension_reason ?? ""}
                        onChange={(event) => setReasons({ ...reasons, [member.id]: event.target.value })}
                      />
                    </td>
                    <td>
                      <div className="member-actions">
                        {status !== "suspended" && status !== "inactive" && (
                          <button className="suspend-btn" onClick={() => updateMemberStatus(member, "suspended")}><FaPauseCircle /> Suspend</button>
                        )}
                        {status !== "inactive" && (
                          <button className="deactivate-btn" onClick={() => updateMemberStatus(member, "inactive")}><FaPowerOff /> Deactivate</button>
                        )}
                        {status !== "active" && (
                          <button className="restore-btn" onClick={() => updateMemberStatus(member, "active")}><FaUndo /> Restore</button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!members.length && <tr><td colSpan="6" className="empty-cell">No members found for this company.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default Invitations;

