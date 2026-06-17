import axios from "axios";

const API = "http://127.0.0.1:8000";
const EMP_API = `${API}/employees`;

export const getEmployees = async (companyId = 1) => {
  const response = await axios.get(`${EMP_API}?company_id=${companyId}`);
  return response.data.data;
};

export const addEmployee = async (employee) => {
  const response = await axios.post(EMP_API, employee);
  return response.data;
};

export const updateEmployee = async (id, employee) => {
  const response = await axios.put(`${EMP_API}/${id}`, employee);
  return response.data;
};

export const deleteEmployee = async (id) => {
  const response = await axios.delete(`${EMP_API}/${id}`);
  return response.data;
};

export const deactivateEmployee = async (id, adminName = "Admin") => {
  const response = await axios.put(`${EMP_API}/${id}/deactivate`, { admin_name: adminName });
  return response.data;
};

// Analytics
export const getAnalytics = async (companyId = 1) => {
  const response = await axios.get(`${API}/analytics?company_id=${companyId}`);
  return response.data.data;
};

export const getKPI = async (companyId = 1) => {
  const response = await axios.get(`${API}/analytics/kpi?company_id=${companyId}`);
  return response.data.data;
};

// Invitations
export const getInvitations = async (companyId = 1) => {
  const response = await axios.get(`${API}/invitations?company_id=${companyId}`);
  return response.data.data;
};

export const createInvitation = async (data) => {
  const response = await axios.post(`${API}/invitations`, data);
  return response.data.data;
};

export const revokeInvitation = async (id, adminName = "Admin") => {
  const response = await axios.put(`${API}/invitations/${id}/revoke`, { admin_name: adminName });
  return response.data;
};

export const acceptInvitation = async (token, name) => {
  const response = await axios.post(`${API}/invitations/accept`, { token, name });
  return response.data;
};

// Reactivation
export const submitReactivationRequest = async (data) => {
  const response = await axios.post(`${API}/reactivation-requests`, data);
  return response.data;
};

export const getReactivationRequests = async (companyId = 1) => {
  const response = await axios.get(`${API}/reactivation-requests?company_id=${companyId}`);
  return response.data.data;
};

export const reviewReactivationRequest = async (id, action, adminName = "Admin") => {
  const response = await axios.put(`${API}/reactivation-requests/${id}/review`, {
    action,
    admin_name: adminName,
  });
  return response.data;
};

// Notifications
export const getNotifications = async (companyId = 1) => {
  const response = await axios.get(`${API}/notifications?company_id=${companyId}`);
  return response.data.data;
};

export const markNotificationRead = async (id) => {
  const response = await axios.put(`${API}/notifications/${id}/read`);
  return response.data;
};

export const markAllNotificationsRead = async (companyId = 1) => {
  const response = await axios.put(`${API}/notifications/read-all?company_id=${companyId}`);
  return response.data;
};
