import axios from "axios";

const API = "http://127.0.0.1:8000/audit-logs";

const readJson = (key, fallback) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

export const getAuditLogs = async (companyId = localStorage.getItem("company_id") || "1") => {
  const localLogs = readJson(`local_audit_logs_${companyId}`, []);

  try {
    const response = await axios.get(API, { params: { company_id: companyId, actor_email: localStorage.getItem("email") || undefined } });
    const apiLogs = response.data.data || [];
    return [...localLogs, ...apiLogs].sort(
      (a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0)
    );
  } catch {
    return localLogs;
  }
};

