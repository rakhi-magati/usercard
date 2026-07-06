import { useState, useEffect, useRef } from "react";
import { FaBell, FaCheck } from "react-icons/fa";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../../services/employeeService";
import { approveRevokeRequest, rejectRevokeRequest } from "../../services/sessionService";
import "./NotificationBell.css";

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

function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const companyId = localStorage.getItem("company_id") || "1";
  const role = localStorage.getItem("role")?.toLowerCase();
  const userEmail = localStorage.getItem("email");
  const requestKey = `attendance_access_requests_${companyId}`;
  const notificationKey = `local_notifications_${companyId}`;

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const canSeeLocalNotification = (item) => {
    if (!item.recipient_email) return true;
    return item.recipient_email === userEmail || role === "admin";
  };

  const canSeeApiNotification = (item) => {
    if (!item.recipient_role?.startsWith("employee:")) return true;
    return item.recipient_role === `employee:${userEmail}` || role === "admin";
  };

  const getLocalNotifications = () => {
    const localItems = readJson(notificationKey, []).filter(canSeeLocalNotification);
    const pendingAccess = readJson(requestKey, [])
      .filter((request) => request.status === "pending")
      .map((request) => ({
        id: request.id,
        type: "attendance_access",
        request_id: request.id,
        title: "Attendance Access Pending",
        message: `${request.name} requested attendance access.`,
        created_at: request.created_at,
        is_read: false,
      }));

    const byId = new Map();
    [...pendingAccess, ...localItems].forEach((item) => byId.set(item.id, item));
    return Array.from(byId.values());
  };

  const fetchNotifications = async () => {
    const localNotifications = getLocalNotifications();

    try {
      const data = await getNotifications(companyId);
      const apiNotifications = Array.isArray(data) ? data.filter(canSeeApiNotification) : [];
      setNotifications(
        [...localNotifications, ...apiNotifications].sort(
          (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
        )
      );
    } catch {
      setNotifications(
        localNotifications.sort(
          (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
        )
      );
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    window.addEventListener("attendance-storage-changed", fetchNotifications);
    window.addEventListener("storage", fetchNotifications);
    return () => {
      clearInterval(interval);
      window.removeEventListener("attendance-storage-changed", fetchNotifications);
      window.removeEventListener("storage", fetchNotifications);
    };
  }, []);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleRead = async (notification) => {
    if (notification.type === "attendance_access" || notification.type === "session_revoke_request") return;

    if (String(notification.id).startsWith("local-") || String(notification.id).startsWith("department-transfer-")) {
      const localItems = readJson(notificationKey, []);
      writeJson(
        notificationKey,
        localItems.map((item) => (item.id === notification.id ? { ...item, is_read: true } : item))
      );
      setNotifications((prev) =>
        prev.map((item) => (item.id === notification.id ? { ...item, is_read: true } : item))
      );
      return;
    }

    await markNotificationRead(notification.id);
    setNotifications((prev) =>
      prev.map((item) => (item.id === notification.id ? { ...item, is_read: true } : item))
    );
  };

  const handleReadAll = async () => {
    const visibleIds = new Set(
      getLocalNotifications()
        .filter((item) => item.type !== "attendance_access")
        .map((item) => item.id)
    );
    const localItems = readJson(notificationKey, []);
    writeJson(
      notificationKey,
      localItems.map((item) => (visibleIds.has(item.id) ? { ...item, is_read: true } : item))
    );

    try {
      await markAllNotificationsRead(companyId);
    } catch {
      // local notifications still get marked read
    }

    setNotifications((prev) =>
      prev.map((item) => (item.type === "attendance_access" ? item : { ...item, is_read: true }))
    );
  };

  const reviewAttendanceAccess = (requestId, status) => {
    const requests = readJson(requestKey, []);
    const reviewedRequest = requests.find((request) => request.id === requestId);
    writeJson(
      requestKey,
      requests.map((request) =>
        request.id === requestId
          ? { ...request, status, reviewed_at: new Date().toISOString() }
          : request
      )
    );

    if (reviewedRequest) {
      const localItems = readJson(notificationKey, []);
      writeJson(
        notificationKey,
        localItems.filter((item) => item.id !== requestId)
      );
    }

    fetchNotifications();
  };

  const reviewSessionRevoke = async (notification, action) => {
    try {
      if (action === "approved") {
        await approveRevokeRequest(notification.related_id);
      } else {
        await rejectRevokeRequest(notification.related_id);
      }
      await markNotificationRead(notification.id);
    } catch (err) {
      alert(err.response?.data?.detail || `Could not ${action === "approved" ? "approve" : "reject"} the revoke request`);
    }
    fetchNotifications();
  };

  return (
    <div className="notif-wrapper" ref={ref}>
      <button className="notif-bell" onClick={() => setOpen(!open)}>
        <FaBell />
        {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
      </button>

      {open && (
        <div className="notif-dropdown">
          <div className="notif-header">
            <h4>Notifications</h4>
            {unreadCount > 0 && (
              <button className="mark-all-btn" onClick={handleReadAll}>
                Clear All
              </button>
            )}
          </div>

          <div className="notif-list">
            {notifications.length === 0 ? (
              <div className="notif-empty">No notifications</div>
            ) : (
              notifications.slice(0, 10).map((notification) => (
                <div
                  key={notification.id}
                  className={`notif-item ${!notification.is_read ? "unread" : ""}`}
                  onClick={() => !notification.is_read && handleRead(notification)}
                >
                  <div className="notif-title">{notification.title || "Notification"}</div>
                  <div className="notif-msg">{notification.message}</div>
                  <div className="notif-time">
                    {notification.created_at ? new Date(notification.created_at).toLocaleString() : ""}
                  </div>
                  {role === "admin" && notification.type === "attendance_access" && (
                    <div className="notif-actions" onClick={(event) => event.stopPropagation()}>
                      <button onClick={() => reviewAttendanceAccess(notification.request_id, "approved")}>Approve</button>
                      <button className="danger" onClick={() => reviewAttendanceAccess(notification.request_id, "rejected")}>Reject</button>
                    </div>
                  )}
                  {role === "admin" && notification.type === "session_revoke_request" && (
                    <div className="notif-actions" onClick={(event) => event.stopPropagation()}>
                      <button onClick={() => reviewSessionRevoke(notification, "approved")}>Approve</button>
                      <button className="danger" onClick={() => reviewSessionRevoke(notification, "rejected")}>Reject</button>
                    </div>
                  )}
                  {!notification.is_read && notification.type !== "attendance_access" && notification.type !== "session_revoke_request" && <FaCheck className="notif-check" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
