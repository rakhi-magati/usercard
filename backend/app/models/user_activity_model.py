from sqlalchemy import Boolean, Column, Integer, String, Text
from app.database import Base


class UserActivity(Base):
    __tablename__ = "user_activities"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, index=True)
    user_name = Column(String)
    email = Column(String, index=True)
    role = Column(String, default="user")
    status = Column(String, default="active")
    last_login = Column(String)
    last_logout = Column(String)
    total_logins = Column(Integer, default=0)
    total_logouts = Column(Integer, default=0)
    last_browser = Column(String)
    last_ip_address = Column(String)
    known_browsers = Column(Text, default="[]")
    known_ips = Column(Text, default="[]")
    new_device_detected = Column(Boolean, default=False)
    new_ip_detected = Column(Boolean, default=False)
    history = Column(Text, default="[]")

    def to_dict(self):
        import json

        def load_json(value, fallback):
            try:
                return json.loads(value or "")
            except Exception:
                return fallback

        return {
            "id": self.id,
            "company_id": self.company_id,
            "user_name": self.user_name,
            "email": self.email,
            "role": self.role,
            "status": self.status,
            "last_login": self.last_login,
            "last_logout": self.last_logout,
            "total_logins": self.total_logins or 0,
            "total_logouts": self.total_logouts or 0,
            "last_browser": self.last_browser,
            "last_ip_address": self.last_ip_address,
            "known_browsers": load_json(self.known_browsers, []),
            "known_ips": load_json(self.known_ips, []),
            "new_device_detected": bool(self.new_device_detected),
            "new_ip_detected": bool(self.new_ip_detected),
            "history": load_json(self.history, []),
        }
