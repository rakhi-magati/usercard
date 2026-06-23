from sqlalchemy import Column, Integer, String
from app.database import Base


class DepartmentTransferHistory(Base):
    __tablename__ = "department_transfer_history"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, nullable=False)
    employee_name = Column(String, nullable=False)
    employee_email = Column(String, nullable=False)
    company_id = Column(Integer, nullable=False)
    from_department = Column(String, nullable=False)
    to_department = Column(String, nullable=False)
    reason = Column(String)
    transferred_by = Column(String)
    transferred_at = Column(String)
    permissions_updated = Column(String, default="false")

    def to_dict(self):
        return {
            "id": self.id,
            "employee_id": self.employee_id,
            "employee_name": self.employee_name,
            "employee_email": self.employee_email,
            "company_id": self.company_id,
            "from_department": self.from_department,
            "to_department": self.to_department,
            "reason": self.reason,
            "transferred_by": self.transferred_by,
            "transferred_at": self.transferred_at,
            "permissions_updated": self.permissions_updated == "true",
        }
