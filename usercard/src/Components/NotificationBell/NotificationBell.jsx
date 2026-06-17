import { useState, useEffect, useRef } from "react";
import { FaBell, FaCheck } from "react-icons/fa";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../../services/employeeService";
import "./NotificationBell.css";

function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const companyId = parseInt(localStorage.getItem("company_id") || "1");

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const fetchNotifications = async () => {
    try {
      const data = await getNotifications(companyId);
      setNotifications(Array.isArray(data) ? data : []);
    } catch {
      // silent fail
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
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

  const handleRead = async (id) => {
    await markNotificationRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  };

  const handleReadAll = async () => {
    await markAllNotificationsRead(companyId);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
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
                Mark all read
              </button>
            )}
          </div>

          <div className="notif-list">
            {notifications.length === 0 ? (
              <div className="notif-empty">No notifications</div>
            ) : (
              notifications.slice(0, 10).map((n) => (
                <div
                  key={n.id}
                  className={`notif-item ${!n.is_read ? "unread" : ""}`}
                  onClick={() => !n.is_read && handleRead(n.id)}
                >
                  <div className="notif-msg">{n.message}</div>
                  <div className="notif-time">
                    {n.created_at ? new Date(n.created_at).toLocaleString() : ""}
                  </div>
                  {!n.is_read && <FaCheck className="notif-check" />}
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
