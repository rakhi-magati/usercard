from sqlalchemy import Column, Integer, String
from app.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)

    user_name = Column(String)

    action = Column(String)

    related_employee = Column(String)

    timestamp = Column(String)

    company_id = Column(Integer)

    # --- Login Device / Session audit fields (nullable, backward compatible) ---
    device_name = Column(String)
    browser = Column(String)
    ip_address = Column(String)
    session_id = Column(String)
    performed_by = Column(String)
    performed_by_email = Column(String)

    def to_dict(self):
        return {
            "id": self.id,
            "user_name": self.user_name,
            "action": self.action,
            "related_employee": self.related_employee,
            "timestamp": self.timestamp,
            "company_id": self.company_id,
            "device_name": self.device_name,
            "browser": self.browser,
            "ip_address": self.ip_address,
            "session_id": self.session_id,
            "performed_by": self.performed_by,
            "performed_by_email": self.performed_by_email,
        }