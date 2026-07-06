import axios from "axios";

const API = "http://127.0.0.1:8000";
const SESSIONS_API = `${API}/sessions`;

const getActorEmail = () => localStorage.getItem("email") || "";
const getActorName = () => localStorage.getItem("userName") || localStorage.getItem("name") || getActorEmail();
const getCompanyId = () => localStorage.getItem("company_id") || "1";

export const getBrowserInfo = () => {
  const ua = navigator.userAgent || "Unknown browser";
  const browserMatch =
    ua.match(/Edg\/(\d+(?:\.\d+)?)/) ||
    ua.match(/Chrome\/(\d+(?:\.\d+)?)/) ||
    ua.match(/Firefox\/(\d+(?:\.\d+)?)/) ||
    ua.match(/Version\/(\d+(?:\.\d+)?).*Safari/) ||
    ua.match(/OPR\/(\d+(?:\.\d+)?)/);

  const browser = ua.includes("Edg/") ? "Edge" :
    ua.includes("Chrome/") && !ua.includes("Edg/") ? "Chrome" :
    ua.includes("Firefox/") ? "Firefox" :
    ua.includes("Safari/") && !ua.includes("Chrome/") ? "Safari" :
    ua.includes("OPR/") || ua.includes("Opera") ? "Opera" :
    "Unknown Browser";

  return `${browser} ${browserMatch?.[1] || ""}`.trim();
};

export const getOsInfo = () => {
  const platform = navigator.userAgentData?.platform || navigator.platform || "Unknown OS";
  if (/Win/i.test(platform)) return "Windows";
  if (/Mac/i.test(platform)) return "macOS";
  if (/Linux/i.test(platform)) return "Linux";
  if (/Android/i.test(navigator.userAgent)) return "Android";
  if (/iPhone|iPad/i.test(navigator.userAgent)) return "iOS";
  return platform;
};

export const getIpAddress = async () => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1800);

  try {
    const response = await fetch("https://api.ipify.org?format=json", {
      signal: controller.signal,
      cache: "no-store",
    });
    if (!response.ok) throw new Error("IP lookup failed");
    const data = await response.json();
    return data.ip || "Unavailable";
  } catch {
    return "Unavailable";
  } finally {
    clearTimeout(timeout);
  }
};

/**
 * Creates a new device/session record on successful login and stores the
 * session token locally so this browser tab can be identified as the
 * "current device" and so it can log itself out later.
 */
export const startSession = async (user, companyId = getCompanyId()) => {
  const browser = getBrowserInfo();
  const os = getOsInfo();
  const ipAddress = await getIpAddress();

  const payload = {
    company_id: companyId,
    email: user.email,
    user_name: user.name || user.userName || user.email,
    role: user.role || "user",
    browser,
    os,
    ip_address: ipAddress,
    device_name: `${browser} on ${os}`,
    timestamp: new Date().toISOString(),
  };

  const response = await axios.post(SESSIONS_API, payload);
  const session = response.data.data;
  if (session?.session_token) {
    localStorage.setItem("session_token", session.session_token);
  }
  return session;
};

export const touchSession = async () => {
  const sessionToken = localStorage.getItem("session_token");
  if (!sessionToken) return null;
  try {
    const response = await axios.put(`${SESSIONS_API}/activity`, { session_token: sessionToken });
    return response.data.data;
  } catch {
    return null;
  }
};

export const getMyDevices = async (companyId = getCompanyId()) => {
  const response = await axios.get(`${SESSIONS_API}/my`, {
    params: {
      company_id: companyId,
      email: getActorEmail(),
      current_token: localStorage.getItem("session_token") || undefined,
    },
  });
  return response.data.data;
};

export const getCompanySessions = async ({ companyId = getCompanyId(), search, browser, status, date } = {}) => {
  const response = await axios.get(SESSIONS_API, {
    params: {
      company_id: companyId,
      actor_email: getActorEmail(),
      search: search || undefined,
      browser: browser || undefined,
      status: status || undefined,
      date: date || undefined,
    },
  });
  return response.data.data;
};

export const renameDevice = async (sessionId, deviceName, companyId = getCompanyId()) => {
  const response = await axios.put(`${SESSIONS_API}/${sessionId}/rename`, {
    company_id: companyId,
    actor_email: getActorEmail(),
    actor_name: getActorName(),
    device_name: deviceName,
  });
  return response.data.data;
};

export const setDeviceTrusted = async (sessionId, trusted, companyId = getCompanyId()) => {
  const response = await axios.put(`${SESSIONS_API}/${sessionId}/trust`, {
    company_id: companyId,
    actor_email: getActorEmail(),
    actor_name: getActorName(),
    trusted,
  });
  return response.data.data;
};

export const removeDevice = async (sessionId, companyId = getCompanyId()) => {
  const response = await axios.post(`${SESSIONS_API}/${sessionId}/remove`, {
    company_id: companyId,
    actor_email: getActorEmail(),
    actor_name: getActorName(),
  });
  return response.data.data;
};

export const logoutDevice = async (sessionId, companyId = getCompanyId()) => {
  const response = await axios.post(`${SESSIONS_API}/${sessionId}/logout`, {
    company_id: companyId,
    actor_email: getActorEmail(),
    actor_name: getActorName(),
  });
  return response.data.data;
};

export const logoutAllOtherDevices = async (companyId = getCompanyId()) => {
  const response = await axios.post(`${SESSIONS_API}/logout-others`, {
    company_id: companyId,
    actor_email: getActorEmail(),
    actor_name: getActorName(),
    current_token: localStorage.getItem("session_token") || undefined,
  });
  return response.data.data;
};

export const logoutCurrentSession = async () => {
  const sessionToken = localStorage.getItem("session_token");
  const companyId = getCompanyId();
  const email = getActorEmail();
  if (!sessionToken || !email) return null;

  try {
    const mine = await getMyDevices(companyId);
    const current = mine.find((device) => device.session_token === sessionToken);
    if (current && current.status === "Active") {
      return await logoutDevice(current.id, companyId);
    }
  } catch {
    return null;
  }
  return null;
};

export const forceLogoutDevice = async (sessionId, companyId = getCompanyId()) => {
  const response = await axios.post(`${SESSIONS_API}/${sessionId}/force-logout`, {
    company_id: companyId,
    actor_email: getActorEmail(),
    actor_name: getActorName(),
  });
  return response.data.data;
};

export const revokeSessions = async (sessionIds, companyId = getCompanyId()) => {
  const response = await axios.post(`${SESSIONS_API}/revoke`, {
    company_id: companyId,
    actor_email: getActorEmail(),
    actor_name: getActorName(),
    session_ids: sessionIds,
  });
  return response.data.data;
};

export const approveRevokeRequest = async (sessionId, companyId = getCompanyId()) => {
  const response = await axios.post(`${SESSIONS_API}/${sessionId}/revoke/approve`, {
    company_id: companyId,
    actor_email: getActorEmail(),
    actor_name: getActorName(),
  });
  return response.data.data;
};

export const rejectRevokeRequest = async (sessionId, companyId = getCompanyId()) => {
  const response = await axios.post(`${SESSIONS_API}/${sessionId}/revoke/reject`, {
    company_id: companyId,
    actor_email: getActorEmail(),
    actor_name: getActorName(),
  });
  return response.data.data;
};

export const getAttendanceAccessStatus = async (email = getActorEmail(), companyId = getCompanyId()) => {
  if (!email) return { blocked: false, status: null };
  try {
    const response = await axios.get(`${SESSIONS_API}/attendance-access-status`, {
      params: { company_id: companyId, email },
    });
    return response.data.data;
  } catch {
    return { blocked: false, status: null };
  }
};
