import { useEffect, useMemo, useState } from "react";
import { FaBan, FaCheckCircle, FaClock, FaPaperPlane, FaSignOutAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import {
  getEmployeeByEmail,
  getReactivationRequests,
  submitReactivationRequest,
} from "../../services/employeeService";
import "./AccountSuspended.css";

const normalizeStatus = (status) => {
  const value = (status || "active").toLowerCase();
  return value === "inactive" ? "deactivated" : value;
};

function AccountSuspended() {
  const navigate = useNavigate();
  const [reason, setReason] = useState("");
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const employeeId = parseInt(localStorage.getItem("employeeId") || "0");
  const employeeName = localStorage.getItem("userName") || "User";
  const employeeEmail = localStorage.getItem("email") || "";
  const companyId = parseInt(localStorage.getItem("company_id") || "1");
  const suspensionDate = localStorage.getItem("suspension_date") || "";
  const suspensionReason = localStorage.getItem("suspension_reason") || "Not provided";
  const suspendedBy = localStorage.getItem("suspended_by") || "Company administrator";

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const data = await getReactivationRequests(companyId);
        setRequests(Array.isArray(data) ? data.filter((item) => item.employee_id === employeeId) : []);
      } catch {
        setRequests([]);
      }
    };

    fetchRequests();
  }, [companyId, employeeId, submitted]);

  const latestRequest = useMemo(() => requests[0], [requests]);

  const restoreAccessIfApproved = async () => {
    if (restoring || latestRequest?.status !== "approved") return;

    setRestoring(true);
    try {
      const employee = await getEmployeeByEmail(employeeEmail, companyId);
      if (normalizeStatus(employee.status) === "active") {
        localStorage.setItem("status", "active");
        localStorage.setItem("role", employee.role || localStorage.getItem("role") || "user");
        localStorage.setItem("userName", employee.name || employeeName);
        localStorage.setItem("name", employee.name || employeeName);
        localStorage.setItem("employeeId", employee.id || employeeId);
        localStorage.setItem("suspension_date", "");
        localStorage.setItem("suspension_reason", "");
        localStorage.setItem("suspended_by", "");
        navigate("/dashboard", { replace: true });
      }
    } catch {
      setRestoring(false);
    }
  };

  useEffect(() => {
    restoreAccessIfApproved();
  }, [latestRequest?.status]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!reason.trim()) return;

    setLoading(true);
    try {
      await submitReactivationRequest({
        employee_id: employeeId,
        employee_name: employeeName,
        employee_email: employeeEmail,
        company_id: companyId,
        reason,
      });
      setReason("");
      setSubmitted((value) => !value);
    } catch (error) {
      alert(error?.response?.data?.detail || "Failed to submit request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    [
      "token",
      "role",
      "currentUser",
      "userName",
      "name",
      "email",
      "status",
      "employeeId",
      "suspension_date",
      "suspension_reason",
      "suspended_by",
    ].forEach((key) => {
      localStorage.removeItem(key);
    });
    navigate("/");
  };

  return (
    <div className="suspended-container">
      <main className="suspended-shell">
        <section className="suspended-panel">
          <div className="suspended-icon"><FaBan /></div>
          <p className="suspended-eyebrow">Account Suspended</p>
          <h1>Your access is temporarily blocked</h1>
          <p className="suspended-copy">
            Login is still allowed, but dashboards, records, exports, requests, and business modules are unavailable until an administrator reinstates this account.
          </p>

          <div className="suspension-details">
            <div>
              <span>Suspension Status</span>
              <strong>Suspended</strong>
            </div>
            <div>
              <span>Suspension Date</span>
              <strong>{suspensionDate ? new Date(suspensionDate).toLocaleString() : "Not recorded"}</strong>
            </div>
            <div>
              <span>Suspension Reason</span>
              <strong>{suspensionReason}</strong>
            </div>
            <div>
              <span>Suspended By</span>
              <strong>{suspendedBy}</strong>
            </div>
          </div>

          <button className="suspended-logout" type="button" onClick={handleLogout}>
            <FaSignOutAlt /> Logout
          </button>
        </section>

        <section className="reinstatement-panel">
          <div className={`request-status-card ${latestRequest?.status || "idle"}`}>
            {latestRequest?.status === "approved" ? <FaCheckCircle /> : <FaClock />}
            <div>
              <span>Latest Request</span>
              <strong>{latestRequest?.status || "Not submitted"}</strong>
              {latestRequest?.reviewed_by && <p>Reviewed by {latestRequest.reviewed_by}</p>}
              {latestRequest?.status === "approved" && <p>{restoring ? "Restoring access..." : "Access approved. Redirecting..."}</p>}
            </div>
          </div>

          <form className="reinstatement-form" onSubmit={handleSubmit}>
            <h2>Request Reinstatement</h2>
            <p>Share a short explanation for the admin review.</p>
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Explain why your account should be reinstated..."
              rows={5}
              required
              disabled={latestRequest?.status === "pending" || loading}
            />
            <button type="submit" disabled={loading || !reason.trim() || latestRequest?.status === "pending"}>
              <FaPaperPlane /> {loading ? "Submitting..." : latestRequest?.status === "pending" ? "Request Pending" : "Submit Request"}
            </button>
          </form>

          <div className="request-history">
            <h3>Request Status</h3>
            {requests.length === 0 ? (
              <p>No reinstatement requests yet.</p>
            ) : (
              requests.map((request) => (
                <div key={request.id} className="request-history-row">
                  <div>
                    <strong>{request.status}</strong>
                    <span>{request.reason || "No comment provided"}</span>
                  </div>
                  <time>{request.requested_at ? new Date(request.requested_at).toLocaleDateString() : "-"}</time>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default AccountSuspended;
