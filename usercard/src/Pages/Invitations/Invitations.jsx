import { useState, useEffect } from "react";
import { FaEnvelope, FaLink, FaTrash, FaPlus, FaUsers } from "react-icons/fa";
import {
  getInvitations,
  createInvitation,
  revokeInvitation,
  getEmployees,
  deactivateEmployee,
} from "../../services/employeeService";
import "./Invitations.css";

function Invitations() {
  const [invitations, setInvitations] = useState([]);
  const [members, setMembers] = useState([]);
  const [activeTab, setActiveTab] = useState("members");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ email: "", role: "user" });
  const [copiedToken, setCopiedToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const companyId = parseInt(localStorage.getItem("company_id") || "1");
  const adminName = localStorage.getItem("userName") || "Admin";

  const fetchData = async () => {
    setLoading(true);
    try {
      const [inv, emp] = await Promise.all([
        getInvitations(companyId),
        getEmployees(companyId),
      ]);
      setInvitations(Array.isArray(inv) ? inv : []);
      setMembers(Array.isArray(emp) ? emp : []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createInvitation({ ...form, company_id: companyId, created_by: adminName });
      setShowForm(false);
      setForm({ email: "", role: "user" });
      fetchData();
    } catch (err) {
      alert("Failed to create invitation");
    }
  };

  const handleRevoke = async (id) => {
    if (!window.confirm("Revoke this invitation?")) return;
    await revokeInvitation(id, adminName);
    fetchData();
  };

  const handleDeactivate = async (empId, empName) => {
    if (!window.confirm(`Deactivate ${empName}? They will lose access.`)) return;
    await deactivateEmployee(empId, adminName);
    fetchData();
  };

  const copyLink = (token) => {
    const link = `${window.location.origin}/accept-invitation?token=${token}`;
    navigator.clipboard.writeText(link);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const pendingInvitations = invitations.filter((i) => i.status === "pending");
  const activeMembers = members.filter((m) => (m.status || "active") === "active");

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="invitations-page">
      <div className="invitations-header">
        <h1>User Invitations & Members</h1>
        <button className="invite-btn" onClick={() => setShowForm(true)}>
          <FaPlus /> Invite User
        </button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="invite-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Send Invitation</h3>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="user@example.com"
                />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="submit-btn">Send Invitation</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="tabs">
        <button className={`tab ${activeTab === "members" ? "active" : ""}`} onClick={() => setActiveTab("members")}>
          <FaUsers /> Active Members ({activeMembers.length})
        </button>
        <button className={`tab ${activeTab === "invitations" ? "active" : ""}`} onClick={() => setActiveTab("invitations")}>
          <FaEnvelope /> Pending Invitations ({pendingInvitations.length})
        </button>
      </div>

      {activeTab === "members" && (
        <div className="members-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Department</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id}>
                  <td>{m.name}</td>
                  <td>{m.email}</td>
                  <td><span className={`badge ${m.role}`}>{m.role}</span></td>
                  <td>{m.department}</td>
                  <td><span className={`badge status-${m.status || "active"}`}>{m.status || "active"}</span></td>
                  <td>
                    {(m.status || "active") === "active" && (
                      <button
                        className="deactivate-btn"
                        onClick={() => handleDeactivate(m.id, m.name)}
                      >
                        Deactivate
                      </button>
                    )}
                    {(m.status || "active") === "inactive" && (
                      <span className="deactivated-label">Deactivated</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "invitations" && (
        <div className="invitations-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Role</th>
                <th>Created By</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invitations.map((inv) => (
                <tr key={inv.id}>
                  <td>{inv.email}</td>
                  <td><span className={`badge ${inv.role}`}>{inv.role}</span></td>
                  <td>{inv.created_by}</td>
                  <td>{inv.created_at ? new Date(inv.created_at).toLocaleDateString() : "-"}</td>
                  <td><span className={`badge status-${inv.status}`}>{inv.status}</span></td>
                  <td style={{ display: "flex", gap: "8px" }}>
                    {inv.status === "pending" && (
                      <>
                        <button
                          className="copy-link-btn"
                          onClick={() => copyLink(inv.token)}
                          title="Copy invitation link"
                        >
                          <FaLink /> {copiedToken === inv.token ? "Copied!" : "Copy Link"}
                        </button>
                        <button
                          className="revoke-btn"
                          onClick={() => handleRevoke(inv.id)}
                          title="Revoke invitation"
                        >
                          <FaTrash />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {invitations.length === 0 && (
                <tr><td colSpan={6} className="empty-row">No invitations yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Invitations;
