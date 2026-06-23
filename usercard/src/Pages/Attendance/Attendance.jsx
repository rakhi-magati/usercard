import { useEffect, useState } from "react";
import { FaCalendarAlt, FaDownload, FaSignInAlt, FaSignOutAlt } from "react-icons/fa";
import {
  checkInAttendance,
  checkOutAttendance,
  downloadAttendanceReport,
  getAttendance,
  getMyAttendance,
} from "../../services/employeeService";
import "./Attendance.css";

const formatDate = (date = new Date()) => date.toISOString().split("T")[0];

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
  window.dispatchEvent(new Event("attendance-storage-changed"));
};

const notify = (companyId, notification) => {
  const key = `local_notifications_${companyId}`;
  const notifications = readJson(key, []);
  writeJson(key, [
    {
      id: notification.id || `local-${Date.now()}`,
      created_at: new Date().toISOString(),
      is_read: false,
      ...notification,
    },
    ...notifications,
  ]);
};

const getRequestKey = (companyId) => `attendance_access_requests_${companyId}`;
const getLeaveKey = (companyId) => `leave_requests_${companyId}`;
const rowsPerPage = 8;

const normalizeStatus = (status = "") => status.toLowerCase().replace(/\s+/g, "-");

const getValue = (record, keys, fallback = "") => {
  for (const key of keys) {
    if (record?.[key] !== undefined && record[key] !== null && record[key] !== "") {
      return record[key];
    }
  }
  return fallback;
};

const formatTimeValue = (value) => {
  if (!value) return "-";
  if (typeof value !== "string") return value;

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime()) && value.includes("T")) {
    return parsed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  return value;
};

const getCheckIn = (record) => getValue(record, ["checkIn", "check_in", "checkin", "check_in_time"]);
const getCheckOut = (record) => getValue(record, ["checkOut", "check_out", "checkout", "check_out_time"]);
const getHours = (record) => getValue(record, ["hours", "totalHours", "total_hours"]);

const getAttendanceStatus = (record) => {
  const status = getValue(record, ["attendanceStatus", "attendance_status", "status"]);
  const checkIn = getCheckIn(record);
  const checkOut = getCheckOut(record);

  if (checkOut) return "Checked Out";
  if (checkIn) return "Checked In";
  if (status && status.toLowerCase() !== "active") return status;
  return "Not Checked In";
};

function Attendance() {
  const role = localStorage.getItem("role")?.toLowerCase() || "user";
  const companyId = localStorage.getItem("company_id") || "1";
  const userName = localStorage.getItem("userName") || localStorage.getItem("name") || "User";
  const userEmail = localStorage.getItem("email") || `${userName.toLowerCase().replace(/\s+/g, ".")}@local.test`;
  const userDepartment = localStorage.getItem("department") || "General Department";

  const [accessRequests, setAccessRequests] = useState(() => readJson(getRequestKey(companyId), []));
  const [records, setRecords] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState(() => readJson(getLeaveKey(companyId), []));
  const [leaveForm, setLeaveForm] = useState({ type: "Vacation", startDate: "", endDate: "", reason: "" });
  const [adminSearch, setAdminSearch] = useState("");
  const [adminDate, setAdminDate] = useState(formatDate());
  const [adminPage, setAdminPage] = useState(1);
  const [adminRows, setAdminRows] = useState([]);
  const [adminTotal, setAdminTotal] = useState(0);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState("");
  const [userError, setUserError] = useState("");

  const myAccessRequest = accessRequests.find((request) => request.email === userEmail);
  const accessStatus = myAccessRequest?.status || "pending";
  const today = formatDate();
  const myRecords = records.filter((record) => record.email === userEmail || record.name === userName);
  const todayRecord = myRecords.find((record) => record.date === today);
  const todayCheckIn = getCheckIn(todayRecord);
  const todayCheckOut = getCheckOut(todayRecord);
  const hasCheckedIn = Boolean(todayCheckIn);
  const hasCheckedOut = Boolean(todayCheckOut);

  useEffect(() => {
    writeJson(getRequestKey(companyId), accessRequests);
  }, [accessRequests, companyId]);

  useEffect(() => {
    writeJson(getLeaveKey(companyId), leaveRequests);
  }, [leaveRequests, companyId]);

  useEffect(() => {
    if (role !== "user" || myAccessRequest) return;

    const request = {
      id: `attendance-access-${companyId}-${userEmail}`,
      type: "attendance_access",
      name: userName,
      email: userEmail,
      company_id: companyId,
      status: "pending",
      created_at: new Date().toISOString(),
    };

    setAccessRequests((prev) => [request, ...prev]);
    notify(companyId, {
      id: request.id,
      type: "attendance_access",
      request_id: request.id,
      title: "Attendance Access Pending",
      message: `${userName} requested attendance access.`,
    });
  }, [companyId, myAccessRequest, role, userEmail, userName]);

  useEffect(() => {
    if (role === "admin") return;

    const fetchMyAttendance = async () => {
      setUserError("");
      try {
        const data = await getMyAttendance({ companyId, email: userEmail });
        setRecords(Array.isArray(data) ? data : []);
      } catch {
        setRecords([]);
      }
    };

    fetchMyAttendance();
  }, [companyId, role, userEmail]);

  useEffect(() => {
    if (role !== "admin") return;

    const fetchAdminAttendance = async () => {
      setAdminLoading(true);
      setAdminError("");
      try {
        const response = await getAttendance({
          companyId,
          attendanceDate: adminDate,
          search: adminSearch,
          page: adminPage,
          limit: rowsPerPage,
        });
        setAdminRows(Array.isArray(response.data) ? response.data : []);
        setAdminTotal(response.total || 0);
      } catch {
        setAdminRows([]);
        setAdminTotal(0);
        setAdminError("Failed to load attendance from API.");
      } finally {
        setAdminLoading(false);
      }
    };

    fetchAdminAttendance();
  }, [adminDate, adminPage, adminSearch, companyId, role]);

  const adminTotalPages = Math.max(1, Math.ceil(adminTotal / rowsPerPage));
  const adminCounts = adminRows.reduce((counts, record) => {
    const status = getAttendanceStatus(record);
    return { ...counts, [status]: (counts[status] || 0) + 1 };
  }, {});

  useEffect(() => {
    setAdminPage(1);
  }, [adminDate, adminSearch]);

  const markAttendance = async (action) => {
    if (action === "checkIn" && hasCheckedIn) return;
    if (action === "checkOut" && (!hasCheckedIn || hasCheckedOut)) return;

    setUserError("");
    try {
      const updated = action === "checkIn"
        ? await checkInAttendance({ companyId, email: userEmail, date: today })
        : await checkOutAttendance({ companyId, email: userEmail, date: today });

      setRecords((prev) => {
        const exists = prev.some((record) => record.date === updated.date && record.email === updated.email);
        if (exists) {
          return prev.map((record) =>
            record.date === updated.date && record.email === updated.email ? updated : record
          );
        }
        return [updated, ...prev];
      });
    } catch {
      setUserError("Attendance API failed. Please confirm this user exists as an employee.");
    }
  };

  const submitLeave = (event) => {
    event.preventDefault();
    if (!leaveForm.startDate || !leaveForm.endDate) return;

    const request = {
      id: Date.now(),
      name: userName,
      email: userEmail,
      type: leaveForm.type,
      startDate: leaveForm.startDate,
      endDate: leaveForm.endDate,
      reason: leaveForm.reason || "-",
      status: "pending",
      created_at: new Date().toISOString(),
    };

    setLeaveRequests((prev) => [request, ...prev]);
    notify(companyId, {
      type: "leave_request",
      title: "Leave Request Pending",
      message: `${userName} requested ${leaveForm.type} leave.`,
    });
    setLeaveForm({ type: "Vacation", startDate: "", endDate: "", reason: "" });
  };

  const downloadCSV = async () => {
    try {
      const blob = await downloadAttendanceReport({ companyId, attendanceDate: adminDate, search: adminSearch });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `attendance-report-${adminDate}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch {
      setAdminError("Failed to download attendance report from API.");
    }
  };

  const renderStatus = (status) => (
    <span className={`attendance-pill ${normalizeStatus(status)}`}>{status}</span>
  );

  if (role === "admin") {
    return (
      <div className="attendance-page admin-attendance-page">
        <div className="admin-attendance-header">
          <h1>Attendance</h1>
          <p>Track daily attendance records by employee.</p>
        </div>

        <div className="admin-attendance-toolbar">
          <input
            type="search"
            placeholder="Search by employee name or department..."
            value={adminSearch}
            onChange={(event) => setAdminSearch(event.target.value)}
          />
          <div className="admin-date-control">
            <label htmlFor="attendance-date">Date:</label>
            <input
              id="attendance-date"
              type="date"
              value={adminDate}
              onChange={(event) => setAdminDate(event.target.value)}
            />
            <button className="admin-download-btn" onClick={downloadCSV}>
              <FaDownload /> Download Report
            </button>
          </div>
        </div>

        {adminError && <div className="attendance-api-error">{adminError}</div>}

        <section className="admin-attendance-card">
          <div className="attendance-table-wrap">
            <table className="admin-attendance-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Hours</th>
                </tr>
              </thead>
              <tbody>
                {adminLoading ? (
                  <tr><td colSpan="7">Loading attendance...</td></tr>
                ) : adminRows.length > 0 ? (
                  adminRows.map((record) => (
                    <tr key={`${record.employee_id}-${record.date}`}>
                      <td>
                        <div className="admin-employee-cell">
                          <span className="admin-avatar">{record.name.charAt(0)}</span>
                          <span>
                            <strong>{record.name}</strong>
                            <small>{record.email}</small>
                          </span>
                        </div>
                      </td>
                      <td>{record.department}</td>
                      <td>{record.date}</td>
                      <td>{renderStatus(getAttendanceStatus(record))}</td>
                      <td>{formatTimeValue(getCheckIn(record))}</td>
                      <td>{formatTimeValue(getCheckOut(record))}</td>
                      <td>{getHours(record) || "-"}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="7">No attendance records found from API.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <div className="admin-pagination">
          <button disabled={adminPage === 1} onClick={() => setAdminPage((page) => page - 1)}>Prev</button>
          {Array.from({ length: adminTotalPages }, (_, index) => index + 1).map((page) => (
            <button
              key={page}
              className={page === adminPage ? "active" : ""}
              onClick={() => setAdminPage(page)}
            >
              {page}
            </button>
          ))}
          <button disabled={adminPage === adminTotalPages} onClick={() => setAdminPage((page) => page + 1)}>Next</button>
        </div>

        <div className="admin-attendance-footer">
          <div className="admin-attendance-legend">
            <span><i className="dot active" /> Checked In: {adminCounts["Checked In"] || 0}</span>
            <span><i className="dot active" /> Checked Out: {adminCounts["Checked Out"] || 0}</span>
            <span><i className="dot inactive" /> Not Checked In: {adminCounts["Not Checked In"] || 0}</span>
            <span><i className="dot inactive" /> Inactive: {adminCounts.Inactive || 0}</span>
          </div>
          <p>Loaded from API - Total employees: {adminTotal}</p>
        </div>
      </div>
    );
  }

  if (accessStatus !== "approved") {
    return (
      <div className="attendance-page">
        <div className="attendance-title-row">
          <div>
            <h1>Attendance</h1>
            <p>Check in/out for today and submit leave requests for admin approval.</p>
          </div>
        </div>

        <section className="attendance-panel attendance-access-panel">
          <h3>Attendance Access {accessStatus === "rejected" ? "Rejected" : "Pending"}</h3>
          <p>
            {accessStatus === "rejected"
              ? "Your attendance access request was rejected by the company admin."
              : "Your account is not linked to an employee profile yet. A request has been sent to your company admin for approval."}
          </p>
          <span>Submitted on {myAccessRequest ? new Date(myAccessRequest.created_at).toLocaleString() : new Date().toLocaleString()}</span>
        </section>
      </div>
    );
  }

  return (
    <div className="attendance-page">
      <div className="attendance-title-row">
        <div>
          <h1>Attendance</h1>
          <p>Check in/out for today and submit leave requests for admin approval.</p>
        </div>
      </div>

      <div className="attendance-grid two-columns">
        <section className="attendance-panel">
          <h3><FaCalendarAlt /> Today's Attendance</h3>
          <p className="muted-line">{userName} - {userDepartment}</p>
          <div className="wide-status">{renderStatus(todayRecord ? getAttendanceStatus(todayRecord) : "Not Checked In")}</div>
          <p className="muted-line">{todayCheckIn ? `Checked in ${formatTimeValue(todayCheckIn)}` : "Not checked in"}</p>
          {todayCheckOut && <p className="muted-line">Checked out {formatTimeValue(todayCheckOut)}</p>}
          {userError && <div className="attendance-api-error">{userError}</div>}
          <div className="attendance-button-row">
            <button className="attendance-primary" onClick={() => markAttendance("checkIn")} disabled={hasCheckedIn}>
              <FaSignInAlt /> Check In
            </button>
            <button className="attendance-secondary" onClick={() => markAttendance("checkOut")} disabled={!hasCheckedIn || hasCheckedOut}>
              <FaSignOutAlt /> Check Out
            </button>
          </div>
        </section>

        <section className="attendance-panel">
          <h3>Request Leave</h3>
          <form className="leave-form" onSubmit={submitLeave}>
            <label>
              Leave type
              <select value={leaveForm.type} onChange={(e) => setLeaveForm({ ...leaveForm, type: e.target.value })}>
                <option>Vacation</option>
                <option>Medical</option>
                <option>Personal</option>
                <option>Casual</option>
              </select>
            </label>
            <label>
              Start date
              <input type="date" value={leaveForm.startDate} onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })} required />
            </label>
            <label>
              End date
              <input type="date" value={leaveForm.endDate} onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })} required />
            </label>
            <label className="full-field">
              Reason (optional)
              <textarea placeholder="Brief reason for your leave request" value={leaveForm.reason} onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })} />
            </label>
            <button className="attendance-primary" type="submit">Submit Leave Request</button>
          </form>
        </section>
      </div>

      <section className="attendance-panel">
        <h3>My Attendance History</h3>
        <div className="attendance-table-wrap">
          <table className="attendance-table">
            <thead>
              <tr><th>Date</th><th>Status</th><th>Check In</th><th>Check Out</th><th>Hours</th></tr>
            </thead>
            <tbody>
              {myRecords.map((record) => (
                <tr key={record.id}><td>{record.date}</td><td>{renderStatus(getAttendanceStatus(record))}</td><td>{formatTimeValue(getCheckIn(record))}</td><td>{formatTimeValue(getCheckOut(record))}</td><td>{getHours(record) || "-"}</td></tr>
              ))}
              {myRecords.length === 0 && <tr><td colSpan="5">No attendance history found.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section className="attendance-panel">
        <h3>My Leave Requests</h3>
        <div className="attendance-table-wrap">
          <table className="attendance-table">
            <thead>
              <tr><th>Type</th><th>Dates</th><th>Status</th><th>Reason</th></tr>
            </thead>
            <tbody>
              {leaveRequests.filter((request) => request.email === userEmail).map((request) => (
                <tr key={request.id}><td>{request.type}</td><td>{request.startDate} to {request.endDate}</td><td>{request.status}</td><td>{request.reason}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default Attendance;
