import axios from "axios";

const API = "http://127.0.0.1:8000";
const EMP_API = `${API}/employees`;

const getActorEmail = () => localStorage.getItem("email") || "";
const withActor = (payload = {}) => ({ ...payload, actor_email: getActorEmail() });

export const getEmployees = async (companyId = 1) => {
  const response = await axios.get(EMP_API, {
    params: { company_id: companyId, actor_email: getActorEmail() || undefined },
  });
  return response.data.data;
};

export const getEmployeeByEmail = async (email, companyId = 1) => {
  const response = await axios.get(`${EMP_API}/lookup/by-email`, {
    params: { email, company_id: companyId },
  });
  return response.data.data;
};

export const syncLoginEmployee = async (user, companyId = 1) => {
  const response = await axios.post(`${EMP_API}/sync-login`, {
    name: user.name,
    email: user.email,
    role: user.role || "user",
    department: user.department || "General",
    city: user.city || "",
    salary: user.salary || 0,
    join_date: user.join_date,
    company_id: companyId,
  });
  return response.data.data;
};

export const addEmployee = async (employee) => {
  const response = await axios.post(EMP_API, withActor(employee));
  return response.data;
};

export const updateEmployee = async (id, employee) => {
  const response = await axios.put(`${EMP_API}/${id}`, withActor(employee));
  return response.data;
};

export const deleteEmployee = async (id, companyId = 1, adminName = "Admin") => {
  const response = await axios.delete(`${EMP_API}/${id}`, {
    params: { company_id: companyId, admin_name: adminName, actor_email: getActorEmail() },
  });
  return response.data;
};

export const suspendEmployee = async (id, data) => {
  const response = await axios.put(`${EMP_API}/${id}/suspend`, withActor(data));
  return response.data;
};

export const reinstateEmployee = async (id, companyId = 1, adminName = "Admin") => {
  const response = await axios.put(`${EMP_API}/${id}/reinstate`, {
    company_id: companyId,
    admin_name: adminName,
    actor_email: getActorEmail(),
  });
  return response.data;
};

export const transferEmployeeDepartment = async (id, transfer) => {
  const response = await axios.put(`${EMP_API}/${id}/transfer`, withActor(transfer));
  return response.data.data;
};

export const getDepartmentTransferHistory = async (companyId = 1) => {
  const response = await axios.get(`${API}/department-transfers?company_id=${companyId}`);
  return response.data.data;
};

export const deactivateEmployee = async (id, adminName = "Admin", companyId = localStorage.getItem("company_id") || 1) => {
  const response = await axios.put(`${EMP_API}/${id}/deactivate`, {
    admin_name: adminName,
    company_id: companyId,
    actor_email: getActorEmail(),
  });
  return response.data;
};

// Analytics
export const getAnalytics = async (companyId = 1) => {
  const response = await axios.get(`${API}/analytics`, { params: { company_id: companyId, actor_email: getActorEmail() || undefined } });
  return response.data.data;
};

export const getKPI = async (companyId = 1) => {
  const response = await axios.get(`${API}/analytics/kpi`, { params: { company_id: companyId, actor_email: getActorEmail() || undefined } });
  return response.data.data;
};

// Invitations
export const getInvitations = async (companyId = 1) => {
  const response = await axios.get(`${API}/invitations`, { params: { company_id: companyId, actor_email: getActorEmail() || undefined } });
  return response.data.data;
};

export const createInvitation = async (data) => {
  const response = await axios.post(`${API}/invitations`, withActor(data));
  return response.data.data;
};

export const revokeInvitation = async (id, adminName = "Admin") => {
  const response = await axios.put(`${API}/invitations/${id}/revoke`, { admin_name: adminName, company_id: localStorage.getItem("company_id") || 1, actor_email: getActorEmail() });
  return response.data;
};

export const acceptInvitation = async (token, name) => {
  const response = await axios.post(`${API}/invitations/accept`, { token, name });
  return response.data;
};

// Reactivation / Reinstatement
export const submitReactivationRequest = async (data) => {
  const response = await axios.post(`${API}/reactivation-requests`, data);
  return response.data;
};

export const getReactivationRequests = async (companyId = 1) => {
  const response = await axios.get(`${API}/reactivation-requests`, { params: { company_id: companyId, actor_email: getActorEmail() || undefined } });
  return response.data.data;
};

export const reviewReactivationRequest = async (id, action, adminName = "Admin", companyId = localStorage.getItem("company_id") || 1) => {
  const response = await axios.put(`${API}/reactivation-requests/${id}/review`, {
    action,
    admin_name: adminName,
    company_id: companyId,
    actor_email: getActorEmail(),
  });
  return response.data;
};

// Notifications
export const getNotifications = async (companyId = 1) => {
  const response = await axios.get(`${API}/notifications`, { params: { company_id: companyId, actor_email: getActorEmail() || undefined } });
  return response.data.data;
};

export const markNotificationRead = async (id) => {
  const response = await axios.put(`${API}/notifications/${id}/read`, { company_id: localStorage.getItem("company_id") || 1, actor_email: getActorEmail() });
  return response.data;
};

export const markAllNotificationsRead = async (companyId = 1) => {
  const response = await axios.put(`${API}/notifications/read-all`, null, { params: { company_id: companyId, actor_email: getActorEmail() || undefined } });
  return response.data;
};

// Attendance
export const getAttendance = async ({ companyId = 1, attendanceDate, search = "", page = 1, limit = 8 }) => {
  const response = await axios.get(`${API}/attendance/`, {
    params: {
      company_id: companyId,
      attendance_date: attendanceDate,
      search,
      actor_email: getActorEmail() || undefined,
      page,
      limit,
    },
  });
  return response.data;
};

export const downloadAttendanceReport = async ({ companyId = 1, attendanceDate, search = "" }) => {
  const response = await axios.get(`${API}/attendance/download`, {
    params: {
      company_id: companyId,
      attendance_date: attendanceDate,
      search,
      actor_email: getActorEmail() || undefined,
    },
    responseType: "blob",
  });
  return response.data;
};

export const getMyAttendance = async ({ companyId = 1, email }) => {
  const response = await axios.get(`${API}/attendance/mine`, {
    params: {
      company_id: companyId,
      email,
    },
  });
  return response.data.data;
};

export const checkInAttendance = async ({ companyId = 1, email, date }) => {
  const response = await axios.post(`${API}/attendance/check-in`, {
    company_id: companyId,
    email,
    date,
  });
  return response.data.data;
};

export const checkOutAttendance = async ({ companyId = 1, email, date }) => {
  const response = await axios.post(`${API}/attendance/check-out`, {
    company_id: companyId,
    email,
    date,
  });
  return response.data.data;
};

// Role Requests
export const getRoleRequests = async (companyId = 1, status = "") => {
  const response = await axios.get(`${API}/role-requests`, {
    params: { company_id: companyId, status: status || undefined, actor_email: getActorEmail() || undefined },
  });
  return response.data.data;
};

export const createRoleRequest = async (data) => {
  const response = await axios.post(`${API}/role-requests`, withActor(data));
  return response.data.data;
};

export const approveRoleRequest = async (id, companyId = 1, adminName = "Admin") => {
  const response = await axios.put(`${API}/role-requests/${id}/approve`, {
    company_id: companyId,
    admin_name: adminName,
    actor_email: getActorEmail(),
  });
  return response.data.data;
};

export const rejectRoleRequest = async (id, companyId = 1, adminName = "Admin") => {
  const response = await axios.put(`${API}/role-requests/${id}/reject`, {
    company_id: companyId,
    admin_name: adminName,
    actor_email: getActorEmail(),
  });
  return response.data.data;
};

