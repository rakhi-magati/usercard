import { useState } from "react";
import { FaBan, FaPaperPlane } from "react-icons/fa";
import { submitReactivationRequest } from "../../services/employeeService";
import "./AccountDeactivated.css";

function AccountDeactivated() {
  const [reason, setReason] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const employeeId = parseInt(localStorage.getItem("employeeId") || "0");
  const employeeName = localStorage.getItem("userName") || "User";
  const companyId = parseInt(localStorage.getItem("company_id") || "1");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) return;
    setLoading(true);
    try {
      await submitReactivationRequest({
        employee_id: employeeId,
        employee_name: employeeName,
        company_id: companyId,
        reason,
      });
      setSubmitted(true);
    } catch {
      alert("Failed to submit request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="deactivated-container">
      <div className="deactivated-card">
        <div className="deactivated-icon">
          <FaBan />
        </div>
        <h2>Account Deactivated</h2>
        <p className="deactivated-msg">
          Your account has been deactivated by an administrator. You currently cannot access
          application features.
        </p>

        {!submitted ? (
          <div className="reactivation-form">
            <h3>Request Reactivation</h3>
            <p>Please provide a reason for your reactivation request:</p>
            <form onSubmit={handleSubmit}>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain why your account should be reactivated..."
                rows={4}
                required
              />
              <button type="submit" disabled={loading} className="submit-request-btn">
                <FaPaperPlane /> {loading ? "Submitting..." : "Submit Request"}
              </button>
            </form>
          </div>
        ) : (
          <div className="request-submitted">
            <div className="check-icon">✓</div>
            <h3>Request Submitted</h3>
            <p>Your reactivation request has been sent to the administrator for review.</p>
            <p className="status-note">Status: <strong>Pending Review</strong></p>
          </div>
        )}
      </div>
    </div>
  );
}

export default AccountDeactivated;
