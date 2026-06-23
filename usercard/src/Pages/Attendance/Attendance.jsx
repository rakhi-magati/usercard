import { useEffect, useMemo, useState } from "react";
import { FaCalendarAlt, FaDownload, FaSignInAlt, FaSignOutAlt } from "react-icons/fa";
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
const getAttendanceKey = (companyId) => `attendance_records_${companyId}`;
const getLeaveKey = (companyId) => `leave_requests_${companyId}`;

const defaultRecords = [
  { id: 1, name: "Rakesh", email: "rakesh@example.com", department: "IT", date: "2026-06-11", status: "Late", checkIn: "2026-06-11 09:38:19", checkOut: "2026-06-11 09:38:23" },
  { id: 2, name: "Rahul", email: "rahul@example.com", department: "HR", date: "2026-06-10", status: "Absent", checkIn: "", checkOut: "" },
  { id: 3, name: "Kiran", email: "kiran@example.com", department: "Finance", date: "2026-06-09", status: "Present", checkIn: "", checkOut: "" },
  { id: 4, name: "Suresh", email: "suresh@example.com", department: "Sales", date: "2026-06-08", status: "Present", checkIn: "", checkOut: "" },
  { id: 5, name: "Mohammad Muzafar", email: "mohammad@example.com", department: "General Department", date: "2026-06-07", status: "Late", checkIn: "", checkOut: "" },
  { id: 6, name: "Mohammad Muzafar", email: "mohammad@example.com", department: "General Department", date: "2026-06-06", status: "Present", checkIn: "", checkOut: "" },
  { id: 7, name: "Mohammad Muzafar", email: "mohammad@example.com", department: "General Department", date: "2026-06-05", status: "Present", checkIn: "", checkOut: "" },
];

const adminRecords = [
  { id: "admin-1", name: "Leanne Graham", email: "Sincere@april.biz", department: "Marketing", date: "2026-06-22", status: "On Leave", checkIn: "", checkOut: "", hours: "" },
  { id: "admin-2", name: "Ervin Howell", email: "Shanna@melissa.tv", department: "Data", date: "2026-06-22", status: "Active", checkIn: "09:25 AM", checkOut: "05:20 PM", hours: "9.0 hrs" },
  { id: "admin-3", name: "Clementine Bauch", email: "Nathan@yesenia.net", department: "Product", date: "2026-06-22", status: "Active", checkIn: "09:03 AM", checkOut: "05:31 PM", hours: "8.5 hrs" },
  { id: "admin-4", name: "Patricia Lebsack", email: "Julianne.OConner@kory.org", department: "Human Resources", date: "2026-06-22", status: "Active", checkIn: "09:59 AM", checkOut: "05:34 PM", hours: "7.5 hrs" },
  { id: "admin-5", name: "Chelsey Dietrich", email: "Lucio_Hettinger@annie.ca", department: "Design", date: "2026-06-22", status: "Remote", checkIn: "", checkOut: "", hours: "" },
  { id: "admin-6", name: "Mrs. Dennis Schulist", email: "Karley.Dach@jasper.info", department: "digital marketing", date: "2026-06-22", status: "Active", checkIn: "10:29 AM", checkOut: "05:31 PM", hours: "8.0 hrs" },
  { id: "admin-7", name: "Kurtis Weissnat", email: "Telly.Hoeger@billy.biz", department: "digital marketing", date: "2026-06-22", status: "Inactive", checkIn: "", checkOut: "", hours: "" },
  { id: "admin-8", name: "Nicholas Runolfsdottir V", email: "Sherwood@rosamond.me", department: "AI analyst", date: "2026-06-22", status: "Active", checkIn: "09:25 AM", checkOut: "06:15 PM", hours: "8.0 hrs" },
  { id: "admin-9", name: "Glenna Reichert", email: "Chaim_McDermott@dana.io", department: "Operations", date: "2026-06-22", status: "On Leave", checkIn: "", checkOut: "", hours: "" },
  { id: "admin-10", name: "Clementina DuBuque", email: "Rey.Padberg@karina.biz", department: "Finance", date: "2026-06-22", status: "Remote", checkIn: "08:54 AM", checkOut: "05:05 PM", hours: "8.0 hrs" },
  { id: "admin-11", name: "Antonette Abernathy", email: "Antonette@april.biz", department: "Sales", date: "2026-06-22", status: "Inactive", checkIn: "", checkOut: "", hours: "" },
  { id: "admin-12", name: "Maxime Nolan", email: "maxime@nolan.example", department: "Engineering", date: "2026-06-22", status: "Active", checkIn: "09:15 AM", checkOut: "05:46 PM", hours: "8.5 hrs" },
];

const normalizeStatus = (status) => status.toLowerCase().replace(/\s+/g, "-");

function Attendance() {
  const role = localStorage.getItem("role")?.toLowerCase() || "user";
  const companyId = localStorage.getItem("company_id") || "1";
  const userName = localStorage.getItem("userName") || localStorage.getItem("name") || "User";
  const userEmail = localStorage.getItem("email") || `${userName.toLowerCase().replace(/\s+/g, ".")}@local.test`;
  const userDepartment = localStorage.getItem("department") || "General Department";

  const [accessRequests, setAccessRequests] = useState(() => readJson(getRequestKey(companyId), []));
  const [records, setRecords] = useState(() => readJson(getAttendanceKey(companyId), defaultRecords));
  const [leaveRequests, setLeaveRequests] = useState(() => readJson(getLeaveKey(companyId), []));
  const [leaveForm, setLeaveForm] = useState({ type: "Vacation", startDate: "", endDate: "", reason: "" });
  const [adminSearch, setAdminSearch] = useState("");
  const [adminDate, setAdminDate] = useState("2026-06-22");
  const [adminPage, setAdminPage] = useState(1);

  const myAccessRequest = accessRequests.find((request) => request.email === userEmail);
  const accessStatus = myAccessRequest?.status || "pending";
  const today = formatDate();
  const myRecords = records.filter((record) => record.email === userEmail || record.name === userName);
  const todayRecord = myRecords.find((record) => record.date === today);
  const hasCheckedIn = Boolean(todayRecord?.checkIn);
  const hasCheckedOut = Boolean(todayRecord?.checkOut);
  const rowsPerPage = 8;

  useEffect(() => {
    writeJson(getRequestKey(companyId), accessRequests);
  }, [accessRequests, companyId]);

  useEffect(() => {
    writeJson(getAttendanceKey(companyId), records);
  }, [records, companyId]);

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

  const adminRows = useMemo(() => {
    const localRows = records
      .filter((record) => record.date === adminDate)
      .map((record) => ({
        ...record,
        status: record.status === "Present" ? "Active" : record.status,
        hours: record.checkIn && record.checkOut ? "8.0 hrs" : "",
      }));
    const merged = [...adminRecords, ...localRows];
    const seen = new Set();
    return merged
      .filter((record) => {
        const key = `${record.email}-${record.date}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .filter((record) => record.date === adminDate)
      .filter((record) => {
        const query = adminSearch.trim().toLowerCase();
        if (!query) return true;
        return (
          record.name.toLowerCase().includes(query) ||
          record.department.toLowerCase().includes(query) ||
          record.email.toLowerCase().includes(query)
        );
      });
  }, [adminDate, adminSearch, records]);

  const adminTotalPages = Math.max(1, Math.ceil(adminRows.length / rowsPerPage));
  const adminPageRows = adminRows.slice((adminPage - 1) * rowsPerPage, adminPage * rowsPerPage);
  const adminCounts = adminRows.reduce(
    (counts, record) => ({ ...counts, [record.status]: (counts[record.status] || 0) + 1 }),
    {}
  );

  useEffect(() => {
    setAdminPage(1);
  }, [adminDate, adminSearch]);

  const markAttendance = (action) => {
    if (action === "checkIn" && hasCheckedIn) return;
    if (action === "checkOut" && (!hasCheckedIn || hasCheckedOut)) return;

    const now = new Date();
    const stamp = now.toLocaleString();
    const status = action === "checkIn" ? "Present" : todayRecord?.status || "Present";

    if (todayRecord) {
      setRecords((prev) =>
        prev.map((record) =>
          record.id === todayRecord.id
            ? {
                ...record,
                status,
                checkIn: action === "checkIn" ? stamp : record.checkIn,
                checkOut: action === "checkOut" ? stamp : record.checkOut,
              }
            : record
        )
      );
      return;
    }

    setRecords((prev) => [
      {
        id: Date.now(),
        name: userName,
        email: userEmail,
        department: userDepartment,
        date: today,
        status: "Present",
        checkIn: action === "checkIn" ? stamp : "",
        checkOut: action === "checkOut" ? stamp : "",
      },
      ...prev,
    ]);
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

  const downloadCSV = () => {
    const headers = ["Employee", "Email", "Department", "Date", "Status", "Check In", "Check Out", "Hours"];
    const rows = adminRows.map((record) => [
      record.name,
      record.email,
      record.department,
      record.date,
      record.status,
      record.checkIn || "-",
      record.checkOut || "-",
      record.hours || "-",
    ]);
    const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `attendance-report-${adminDate}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
                {adminPageRows.map((record) => (
                  <tr key={record.id}>
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
                    <td>{renderStatus(record.status)}</td>
                    <td>{record.checkIn || "-"}</td>
                    <td>{record.checkOut || "-"}</td>
                    <td>{record.hours || "-"}</td>
                  </tr>
                ))}
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
            <span><i className="dot active" /> Present: {adminCounts.Active || 0}</span>
            <span><i className="dot leave" /> On Leave: {adminCounts["On Leave"] || 0}</span>
            <span><i className="dot remote" /> Remote: {adminCounts.Remote || 0}</span>
            <span><i className="dot inactive" /> Inactive: {adminCounts.Inactive || 0}</span>
          </div>
          <p>Last updated: 1:37:11 pm · Total employees: {adminRows.length}</p>
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
          <p className="muted-line">{userName} · {userDepartment}</p>
          <div className="wide-status">{renderStatus(todayRecord?.status || "Present")}</div>
          <p className="muted-line">{todayRecord?.checkIn ? `Checked in ${todayRecord.checkIn}` : "Not checked in"}</p>
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
              <tr><th>Date</th><th>Status</th><th>Check In</th><th>Check Out</th></tr>
            </thead>
            <tbody>
              {myRecords.map((record) => (
                <tr key={record.id}><td>{record.date}</td><td>{renderStatus(record.status)}</td><td>{record.checkIn || "-"}</td><td>{record.checkOut || "-"}</td></tr>
              ))}
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



