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

    def to_dict(self):
        return {
            "id": self.id,
            "user_name": self.user_name,
            "action": self.action,
            "related_employee": self.related_employee,
            "timestamp": self.timestamp,
            "company_id": self.company_id
        }