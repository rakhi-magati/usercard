from sqlalchemy import Column, Integer, String
from app.database import Base


class ReactivationRequest(Base):
    __tablename__ = "reactivation_requests"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, nullable=False)
    employee_name = Column(String)
    company_id = Column(Integer, nullable=False)
    reason = Column(String)
    status = Column(String, default="pending")  # pending, approved, rejected
    requested_at = Column(String)
    reviewed_by = Column(String)
    reviewed_at = Column(String)

    def to_dict(self):
        return {
            "id": self.id,
            "employee_id": self.employee_id,
            "employee_name": self.employee_name,
            "company_id": self.company_id,
            "reason": self.reason,
            "status": self.status,
            "requested_at": self.requested_at,
            "reviewed_by": self.reviewed_by,
            "reviewed_at": self.reviewed_at,
        }
