import { useEffect, useState } from "react";
import {
  approveRoleRequest,
  getRoleRequests,
  rejectRoleRequest,
} from "../../services/employeeService";
import "./RoleRequests.css";

const readJson = (key, fallback) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const normalizeStatus = (status) => String(status || "pending").toLowerCase();

function RoleRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const companyId = localStorage.getItem("company_id") || "1";
  const adminName = localStorage.getItem("userName") || localStorage.getItem("name") || "Admin";

  const loadRequests = async () => {
    try {
      setLoading(true);
      const data = await getRoleRequests(companyId);
      setRequests(Array.isArray(data) ? data : []);
      setError("");
    } catch {
      const localRequests = readJson("roleRequests", []).filter(
        (request) => String(request.company_id || request.companyId || companyId) === String(companyId)
      );
      setRequests(localRequests);
      setError("Showing local role requests because the API is unavailable.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [companyId]);

  const syncLocalRequest = (requestId, status) => {
    const localRequests = readJson("roleRequests", []);
    const nextRequests = localRequests.map((request) =>
      request.id === requestId ? { ...request, status } : request
    );
    localStorage.setItem("roleRequests", JSON.stringify(nextRequests));
    setRequests((current) =>
      current.map((request) => (request.id === requestId ? { ...request, status } : request))
    );
  };

  const handleApprove = async (requestId) => {
    try {
      const updated = await approveRoleRequest(requestId, companyId, adminName);
      setRequests((current) =>
        current.map((request) => (request.id === requestId ? updated : request))
      );
    } catch {
      syncLocalRequest(requestId, "Approved");
    }
  };

  const handleReject = async (requestId) => {
    try {
      const updated = await rejectRoleRequest(requestId, companyId, adminName);
      setRequests((current) =>
        current.map((request) => (request.id === requestId ? updated : request))
      );
    } catch {
      syncLocalRequest(requestId, "Rejected");
    }
  };

  return (
    <div className="role-requests-page dark-mode">
      <h2>Role Change Requests</h2>
      {error && <p>{error}</p>}

      <table className="requests-table">
        <thead>
          <tr>
            <th>User</th>
            <th>Current Role</th>
            <th>Requested Role</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {loading ? (
            <tr><td colSpan="5">Loading requests...</td></tr>
          ) : requests.length === 0 ? (
            <tr><td colSpan="5">No role change requests found.</td></tr>
          ) : (
            requests.map((request) => (
              <tr key={request.id}>
                <td>{request.user_name || request.userEmail}</td>
                <td>{request.current_role || request.currentRole || "user"}</td>
                <td>{request.requested_role || request.requestedRole || "admin"}</td>
                <td>{request.status}</td>
                <td>
                  {normalizeStatus(request.status) === "pending" && (
                    <>
                      <button onClick={() => handleApprove(request.id)}>Approve</button>
                      <button onClick={() => handleReject(request.id)}>Reject</button>
                    </>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default RoleRequests;
