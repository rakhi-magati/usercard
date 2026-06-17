import { useState, useEffect } from "react";
import { FaCheck, FaTimes, FaClock } from "react-icons/fa";
import {
  getReactivationRequests,
  reviewReactivationRequest,
} from "../../services/employeeService";
import "./ReactivationRequests.css";

function ReactivationRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const companyId = parseInt(localStorage.getItem("company_id") || "1");
  const adminName = localStorage.getItem("userName") || "Admin";

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const data = await getReactivationRequests(companyId);
      setRequests(Array.isArray(data) ? data : []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleReview = async (id, action) => {
    const label = action === "approved" ? "approve" : "reject";
    if (!window.confirm(`Are you sure you want to ${label} this request?`)) return;
    await reviewReactivationRequest(id, action, adminName);
    fetchRequests();
  };

  const pending = requests.filter((r) => r.status === "pending");
  const reviewed = requests.filter((r) => r.status !== "pending");

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="reactivation-page">
      <div className="page-header">
        <h1>Reactivation Requests</h1>
        <p>Review and manage user reactivation requests</p>
      </div>

      <h3 className="section-title"><FaClock /> Pending ({pending.length})</h3>

      {pending.length === 0 ? (
        <div className="empty-state">No pending requests</div>
      ) : (
        <div className="requests-grid">
          {pending.map((req) => (
            <div key={req.id} className="request-card">
              <div className="req-info">
                <h4>{req.employee_name}</h4>
                <p className="req-reason">{req.reason || "No reason provided"}</p>
                <p className="req-date">
                  Requested: {req.requested_at ? new Date(req.requested_at).toLocaleString() : "-"}
                </p>
              </div>
              <div className="req-actions">
                <button className="approve-btn" onClick={() => handleReview(req.id, "approved")}>
                  <FaCheck /> Approve
                </button>
                <button className="reject-btn" onClick={() => handleReview(req.id, "rejected")}>
                  <FaTimes /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {reviewed.length > 0 && (
        <>
          <h3 className="section-title" style={{ marginTop: 32 }}>Reviewed</h3>
          <div className="requests-grid">
            {reviewed.map((req) => (
              <div key={req.id} className={`request-card reviewed ${req.status}`}>
                <div className="req-info">
                  <h4>{req.employee_name}</h4>
                  <p className="req-reason">{req.reason || "No reason provided"}</p>
                  <p className="req-date">
                    Requested: {req.requested_at ? new Date(req.requested_at).toLocaleString() : "-"}
                  </p>
                  <p className="req-date">
                    Reviewed by: {req.reviewed_by} &bull;{" "}
                    {req.reviewed_at ? new Date(req.reviewed_at).toLocaleDateString() : "-"}
                  </p>
                </div>
                <span className={`badge badge-${req.status}`}>{req.status}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default ReactivationRequests;
