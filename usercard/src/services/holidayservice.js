import axios from "axios";

const API = "http://127.0.0.1:8000/holidays";
const getActorEmail = () => localStorage.getItem("email") || "";
const getAdminName  = () => localStorage.getItem("userName") || localStorage.getItem("name") || "Admin";

export const getHolidays = async ({
  companyId = 1,
  month,
  year,
  holidayType,
  search,
  includeDeleted = false,
} = {}) => {
  const response = await axios.get(API, {
    params: {
      company_id: companyId,
      month: month || undefined,
      year: year || undefined,
      holiday_type: holidayType || undefined,
      search: search || undefined,
      include_deleted: includeDeleted || undefined,
      actor_email: getActorEmail() || undefined,
    },
  });
  return response.data.data;
};

export const getUpcomingHolidays = async (companyId = 1, limit = 5) => {
  const response = await axios.get(`${API}/upcoming`, {
    params: { company_id: companyId, limit },
  });
  return response.data.data;
};

export const checkHolidayDate = async (companyId = 1, date) => {
  const response = await axios.get(`${API}/check`, {
    params: { company_id: companyId, date },
  });
  return response.data; // { is_holiday, holiday }
};

export const createHoliday = async (data) => {
  const response = await axios.post(API, {
    ...data,
    actor_email: getActorEmail(),
    admin_name: getAdminName(),
  });
  return response.data.data;
};

export const updateHoliday = async (id, data) => {
  const response = await axios.put(`${API}/${id}`, {
    ...data,
    actor_email: getActorEmail(),
    admin_name: getAdminName(),
  });
  return response.data.data;
};

export const deleteHoliday = async (id, companyId = 1) => {
  const response = await axios.delete(`${API}/${id}`, {
    params: {
      company_id: companyId,
      actor_email: getActorEmail(),
      admin_name: getAdminName(),
    },
  });
  return response.data.data;
};

export const restoreHoliday = async (id, companyId = 1) => {
  const response = await axios.put(`${API}/${id}/restore`, {
    company_id: companyId,
    actor_email: getActorEmail(),
    admin_name: getAdminName(),
  });
  return response.data.data;
};

export const getTodayAttendanceStatus = async (companyId = 1) => {
  const response = await axios.get("http://127.0.0.1:8000/attendance/today-status", {
    params: { company_id: companyId },
  });
  return response.data; // { is_holiday, holiday, date }
};
