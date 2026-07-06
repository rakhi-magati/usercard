from sqlalchemy import Boolean, Column, Integer, String
from app.database import Base


class LoginSession(Base):
    __tablename__ = "login_sessions"

    id = Column(Integer, primary_key=True, index=True)

    company_id = Column(Integer, index=True)

    user_email = Column(String, index=True)
    user_name = Column(String)
    role = Column(String, default="user")

    session_token = Column(String, unique=True, index=True)

    device_name = Column(String)
    browser = Column(String)
    os = Column(String)
    ip_address = Column(String)

    login_time = Column(String)
    last_activity_time = Column(String)
    logout_time = Column(String)

    # Active / Logged Out / Revoked / Expired
    status = Column(String, default="Active")

    is_trusted = Column(Boolean, default=False)

    # User Logout / Force Logout / Session Expired / Revoked
    termination_reason = Column(String)
    terminated_by = Column(String)
    terminated_by_email = Column(String)

    def to_dict(self):
        return {
            "id": self.id,
            "company_id": self.company_id,
            "user_email": self.user_email,
            "user_name": self.user_name,
            "role": self.role,
            "session_token": self.session_token,
            "device_name": self.device_name,
            "browser": self.browser,
            "os": self.os,
            "ip_address": self.ip_address,
            "login_time": self.login_time,
            "last_activity_time": self.last_activity_time,
            "logout_time": self.logout_time,
            "status": self.status,
            "is_trusted": bool(self.is_trusted),
            "termination_reason": self.termination_reason,
            "terminated_by": self.terminated_by,
            "terminated_by_email": self.terminated_by_email,
        }
