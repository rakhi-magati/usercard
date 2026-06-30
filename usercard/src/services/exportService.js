import { getAuditLogs } from "./auditService";
import {
  getAnalytics,
  getAttendance,
  getEmployees,
  getNotifications,
} from "./employeeService";

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
  window.dispatchEvent(new Event("data-export-changed"));
};

const today = () => new Date().toISOString().split("T")[0];
const getHistoryKey = (companyId) => `data_export_history_${companyId}`;
const getAuditKey = (companyId) => `local_audit_logs_${companyId}`;

const normalizeValue = (value) => {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

const toTitle = (value) =>
  value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const getColumns = (rows) => {
  const keys = new Set();
  rows.forEach((row) => Object.keys(row || {}).forEach((key) => keys.add(key)));
  return Array.from(keys);
};

const toCsv = (rows) => {
  if (!rows.length) return "No data\n";
  const columns = getColumns(rows);
  const escapeCell = (value) => `"${normalizeValue(value).replace(/"/g, '""')}"`;
  return [
    columns.map(toTitle).map(escapeCell).join(","),
    ...rows.map((row) => columns.map((column) => escapeCell(row[column])).join(",")),
  ].join("\n");
};

const toHtmlTable = (rows, title) => {
  const columns = getColumns(rows);
  const tableRows = rows.length ? rows : [{ message: "No data available" }];
  const tableColumns = rows.length ? columns : ["message"];

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>
    body { font-family: Arial, sans-serif; color: #0f172a; padding: 24px; }
    h1 { font-size: 22px; margin: 0 0 6px; }
    p { color: #64748b; margin: 0 0 18px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { border: 1px solid #dbe3ec; padding: 8px; text-align: left; vertical-align: top; }
    th { background: #eff6ff; color: #1d4ed8; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <p>Generated ${new Date().toLocaleString()}</p>
  <table>
    <thead><tr>${tableColumns.map((column) => `<th>${toTitle(column)}</th>`).join("")}</tr></thead>
    <tbody>
      ${tableRows.map((row) => `<tr>${tableColumns.map((column) => `<td>${normalizeValue(row[column])}</td>`).join("")}</tr>`).join("")}
    </tbody>
  </table>
</body>
</html>`;
};

const downloadBlob = (content, filename, type) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const openPdfPrint = (rows, title) => {
  const printWindow = window.open("", "_blank");

  if (!printWindow) return false;

  printWindow.document.open();
  printWindow.document.write(toHtmlTable(rows, title));
  printWindow.document.close();

  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
  };

  return true;
};

const flattenAnalytics = (analytics = {}) => {
  const summaryRows = Object.entries(analytics)
    .filter(([, value]) => !Array.isArray(value) && typeof value !== "object")
    .map(([metric, value]) => ({ section: "Summary", metric: toTitle(metric), value }));

  const distributionRows = Object.entries(analytics)
    .filter(([, value]) => Array.isArray(value))
    .flatMap(([section, values]) =>
      values.map((item) => ({
        section: toTitle(section),
        name: item.name,
        value: item.value,
      }))
    );

  return [...summaryRows, ...distributionRows];
};

const companyMatches = (item, companyId) =>
  String(item?.company_id || item?.companyId || companyId) === String(companyId);

const localUsersForCompany = (companyId) =>
  readJson("users", []).filter((user) => companyMatches(user, companyId));

const localEmployeesForCompany = (companyId) => {
  const cached = readJson(`employees_cache_${companyId}`, []);
  if (cached.length) return cached;
  return localUsersForCompany(companyId).map((user, index) => ({
    id: user.employeeId || user.id || `local-${index + 1}`,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department || "Unassigned",
    status: user.status || "active",
    company_id: companyId,
  }));
};

export const exportDatasets = [
  { id: "employees", label: "Employees", description: "Employee roster and profile fields" },
  { id: "attendance", label: "Attendance", description: "Daily attendance records" },
  { id: "leaveRequests", label: "Leave Requests", description: "Company leave request queue" },
  { id: "auditLogs", label: "Audit Logs", description: "Security and admin audit trail" },
  { id: "notifications", label: "Notifications", description: "Company notification records" },
  { id: "analytics", label: "Analytics", description: "Dashboard analytics metrics" },
];

export const exportFormats = [
  { id: "csv", label: "CSV" },
  { id: "excel", label: "Excel" },
  { id: "pdf", label: "PDF" },
];

export const getExportHistory = (companyId = localStorage.getItem("company_id") || "1") =>
  readJson(getHistoryKey(companyId), []);

export const collectExportRows = async (datasetId, companyId) => {
  if (datasetId === "employees") {
    try {
      const data = await getEmployees(companyId);
      return Array.isArray(data) ? data : [];
    } catch {
      return localEmployeesForCompany(companyId);
    }
  }

  if (datasetId === "attendance") {
    try {
      const response = await getAttendance({ companyId, attendanceDate: today(), page: 1, limit: 500 });
      return Array.isArray(response.data) ? response.data : [];
    } catch {
      return readJson(`attendance_records_${companyId}`, []);
    }
  }

  if (datasetId === "leaveRequests") {
    return readJson(`leave_requests_${companyId}`, []).filter((request) => companyMatches(request, companyId));
  }

  if (datasetId === "auditLogs") {
    try {
      return await getAuditLogs(companyId);
    } catch {
      return readJson(getAuditKey(companyId), []);
    }
  }

  if (datasetId === "notifications") {
    const localNotifications = readJson(`local_notifications_${companyId}`, []);
    try {
      const apiNotifications = await getNotifications(companyId);
      return [...localNotifications, ...(Array.isArray(apiNotifications) ? apiNotifications : [])];
    } catch {
      return localNotifications;
    }
  }

  if (datasetId === "analytics") {
    try {
      return flattenAnalytics(await getAnalytics(companyId));
    } catch {
      const employees = localEmployeesForCompany(companyId);
      const activeEmployees = employees.filter((employee) => employee.status !== "inactive");
      return [
        { section: "Summary", metric: "Total Employees", value: employees.length },
        { section: "Summary", metric: "Active Employees", value: activeEmployees.length },
        { section: "Summary", metric: "Total Departments", value: new Set(employees.map((employee) => employee.department).filter(Boolean)).size },
        { section: "Summary", metric: "Pending Leave Requests", value: readJson(`leave_requests_${companyId}`, []).filter((request) => request.status === "pending").length },
      ];
    }
  }

  return [];
};

export const runDataExport = async ({ datasetId, formatId, companyId, exportedBy }) => {
  const status = (localStorage.getItem("status") || "active").toLowerCase();
  if (status === "suspended" || status === "deactivated" || status === "inactive") {
    throw new Error("Account access is blocked. Data export is unavailable.");
  }
  const dataset = exportDatasets.find((item) => item.id === datasetId);
  const format = exportFormats.find((item) => item.id === formatId);
  const rows = await collectExportRows(datasetId, companyId);
  const timestamp = new Date().toISOString();
  const safeName = `${datasetId}-${companyId}-${timestamp.slice(0, 10)}`;
  const title = `${dataset?.label || datasetId} Export`;

  if (formatId === "csv") {
    downloadBlob(toCsv(rows), `${safeName}.csv`, "text/csv;charset=utf-8");
  }

  if (formatId === "excel") {
    downloadBlob(toHtmlTable(rows, title), `${safeName}.xls`, "application/vnd.ms-excel;charset=utf-8");
  }

  if (formatId === "pdf") {
    const opened = openPdfPrint(rows, title);
    if (!opened) throw new Error("Popup blocked. Allow popups to print PDF exports.");
  }

  const historyItem = {
    id: `export-${datasetId}-${formatId}-${Date.now()}`,
    company_id: companyId,
    exported_by: exportedBy,
    exported_at: timestamp,
    data_type: dataset?.label || datasetId,
    format: format?.label || formatId.toUpperCase(),
    row_count: rows.length,
  };

  writeJson(getHistoryKey(companyId), [historyItem, ...getExportHistory(companyId)]);
  writeJson(getAuditKey(companyId), [
    {
      id: `audit-export-${Date.now()}`,
      user_name: exportedBy,
      action: `Data Export: ${historyItem.data_type} (${historyItem.format})`,
      related_employee: "Export Center",
      company_id: companyId,
      timestamp,
    },
    ...readJson(getAuditKey(companyId), []),
  ]);

  return historyItem;
};


