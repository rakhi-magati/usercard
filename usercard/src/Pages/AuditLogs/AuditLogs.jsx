import { useEffect, useState } from "react";
import { getAuditLogs } from "../../services/auditService";

import "./AuditLog.css";

function AuditLogs() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const data = await getAuditLogs();
        setLogs(data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchLogs();
  }, []);

  return (
    <div className="audit-container">
      <h2>Audit Logs</h2>

      <div className="table-card">
        <table className="audit-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Action</th>
              <th>Employee</th>
              <th>Browser</th>
              <th>IP Address</th>
              <th>Timestamp</th>
            </tr>
          </thead>

          <tbody>
            {logs.length > 0 ? (
              logs.map((log) => (
                <tr key={log.id}>
                  <td>{log.user_name}</td>
                  <td>{log.action}</td>
                  <td>{log.related_employee}</td>
                  <td>{log.browser || "-"}</td>
                  <td>{log.ip_address || "-"}</td>
                  <td>{new Date(log.timestamp).toLocaleString()}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6">No Audit Logs Found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AuditLogs;
