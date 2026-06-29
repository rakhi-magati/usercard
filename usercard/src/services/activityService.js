import axios from "axios";

const API = "http://127.0.0.1:8000";
const ACTIVITY_EVENT = "user-activity-changed";

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
  window.dispatchEvent(new Event(ACTIVITY_EVENT));
};

const getActivityKey = (companyId) => `user_activity_${companyId}`;
const getAuditKey = (companyId) => `local_audit_logs_${companyId}`;

const getBrowserInfo = () => {
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

  const platform = navigator.userAgentData?.platform || navigator.platform || "Unknown OS";
  const os = /Win/i.test(platform) ? "Windows" : /Mac/i.test(platform) ? "macOS" : /Linux/i.test(platform) ? "Linux" : platform;
  return `${browser} ${browserMatch?.[1] || ""}`.trim() + ` / ${os}`;
};

const getIpAddress = async () => {
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

const pushAuditLog = (companyId, log) => {
  writeJson(getAuditKey(companyId), [
    {
      id: `audit-${log.action.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`,
      company_id: companyId,
      timestamp: new Date().toISOString(),
      ...log,
    },
    ...readJson(getAuditKey(companyId), []),
  ]);
};

const upsertUserActivity = (companyId, email, updater) => {
  const activities = readJson(getActivityKey(companyId), []);
  const existing = activities.find((activity) => activity.email === email);
  const nextActivity = updater(existing);

  writeJson(getActivityKey(companyId), [
    nextActivity,
    ...activities.filter((activity) => activity.email !== email),
  ]);

  return { previous: existing, current: nextActivity };
};

const postActivity = async (path, payload) => {
  try {
    const response = await axios.post(`${API}${path}`, payload);
    return response.data.data;
  } catch {
    return null;
  }
};

export const fetchBackendActivities = async (companyId = 1, search = "") => {
  const response = await axios.get(`${API}/activities`, {
    params: { company_id: companyId, search: search || undefined },
  });
  return response.data;
};

export const recordLoginActivity = async (user, companyId) => {
  const email = user.email;
  const name = user.name || user.userName || email;
  const timestamp = new Date().toISOString();
  const browser = getBrowserInfo();
  const ipAddress = await getIpAddress();

  const { previous, current } = upsertUserActivity(companyId, email, (existing = {}) => {
    const knownBrowsers = Array.from(new Set([...(existing.known_browsers || []), browser].filter(Boolean)));
    const knownIps = Array.from(new Set([...(existing.known_ips || []), ipAddress].filter(Boolean)));
    const hasPriorLogin = Boolean(existing.last_login);
    const isNewDevice = hasPriorLogin && browser && !(existing.known_browsers || []).includes(browser);
    const isNewIp = hasPriorLogin && ipAddress !== "Unavailable" && !(existing.known_ips || []).includes(ipAddress);

    return {
      ...existing,
      id: existing.id || `activity-${companyId}-${email}`,
      company_id: companyId,
      user_name: name,
      email,
      role: user.role || existing.role || "user",
      status: user.status || existing.status || "active",
      last_login: timestamp,
      last_browser: browser,
      last_ip_address: ipAddress,
      total_logins: (existing.total_logins || 0) + 1,
      total_logouts: existing.total_logouts || 0,
      known_browsers: knownBrowsers,
      known_ips: knownIps,
      new_device_detected: isNewDevice,
      new_ip_detected: isNewIp,
      history: [
        {
          id: `login-${Date.now()}`,
          type: "login",
          timestamp,
          browser,
          ip_address: ipAddress,
          new_device_detected: isNewDevice,
          new_ip_detected: isNewIp,
        },
        ...(existing.history || []),
      ].slice(0, 50),
    };
  });

  const payload = {
    company_id: companyId,
    user_name: name,
    email,
    role: user.role || "user",
    status: user.status || "active",
    timestamp,
    browser,
    ip_address: ipAddress,
  };

  postActivity("/activities/login", payload);

  pushAuditLog(companyId, {
    user_name: name,
    action: "User Login",
    related_employee: email,
    browser,
    ip_address: ipAddress,
  });

  if (current.new_device_detected) {
    pushAuditLog(companyId, { user_name: name, action: "New Device Detected", related_employee: email, browser, ip_address: ipAddress });
  }

  if (current.new_ip_detected) {
    pushAuditLog(companyId, { user_name: name, action: "New IP Address Detected", related_employee: email, browser, ip_address: ipAddress });
  }

  const users = readJson("users", []);
  writeJson(
    "users",
    users.map((savedUser) =>
      savedUser.email === email && String(savedUser.company_id || savedUser.companyId || companyId) === String(companyId)
        ? { ...savedUser, last_login: timestamp, last_browser: browser, last_ip_address: ipAddress }
        : savedUser
    )
  );

  return { previous, current };
};

export const recordLogoutActivity = ({ companyId, email, name }) => {
  if (!companyId || !email) return;

  const timestamp = new Date().toISOString();
  const browser = getBrowserInfo();
  let activityIpAddress = "Unavailable";

  upsertUserActivity(companyId, email, (existing = {}) => {
    activityIpAddress = existing.last_ip_address || "Unavailable";
    return {
      ...existing,
      id: existing.id || `activity-${companyId}-${email}`,
      company_id: companyId,
      user_name: existing.user_name || name || email,
      email,
      last_logout: timestamp,
      total_logins: existing.total_logins || 0,
      total_logouts: (existing.total_logouts || 0) + 1,
      history: [
        {
          id: `logout-${Date.now()}`,
          type: "logout",
          timestamp,
          browser,
          ip_address: activityIpAddress,
        },
        ...(existing.history || []),
      ].slice(0, 50),
    };
  });

  postActivity("/activities/logout", {
    company_id: companyId,
    user_name: name || email,
    email,
    timestamp,
    browser,
  });

  pushAuditLog(companyId, {
    user_name: name || email,
    action: "User Logout",
    related_employee: email,
    browser,
    ip_address: activityIpAddress,
  });

  const users = readJson("users", []);
  writeJson(
    "users",
    users.map((savedUser) =>
      savedUser.email === email && String(savedUser.company_id || savedUser.companyId || companyId) === String(companyId)
        ? { ...savedUser, last_logout: timestamp }
        : savedUser
    )
  );
};

export const recordCurrentUserLogout = () => {
  recordLogoutActivity({
    companyId: localStorage.getItem("company_id") || "1",
    email: localStorage.getItem("email"),
    name: localStorage.getItem("userName") || localStorage.getItem("name"),
  });
};

export const getCompanyUserActivities = (companyId = localStorage.getItem("company_id") || "1") => {
  return readJson(getActivityKey(companyId), []).sort(
    (a, b) => new Date(b.last_login || b.last_logout || 0) - new Date(a.last_login || a.last_logout || 0)
  );
};

export const activityEventName = ACTIVITY_EVENT;
