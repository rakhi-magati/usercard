import axios from "axios";

const API = "http://127.0.0.1:8000/audit-logs";

export const getAuditLogs = async () => {
  const response = await axios.get(API);
  return response.data.data;
};