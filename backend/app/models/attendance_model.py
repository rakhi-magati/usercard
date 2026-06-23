from sqlalchemy import Column, Integer, String, ForeignKey
from app.database import Base


class AttendanceRecord(Base):
    __tablename__ = "attendance_records"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"))
    company_id = Column(Integer, nullable=False)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    department = Column(String, nullable=False)
    date = Column(String, nullable=False)
    status = Column(String, default="Present")
    check_in = Column(String)
    check_out = Column(String)
    hours = Column(String)

    def to_dict(self):
        return {
            "id": self.id,
            "employee_id": self.employee_id,
            "company_id": self.company_id,
            "name": self.name,
            "email": self.email,
            "department": self.department,
            "date": self.date,
            "status": self.status,
            "checkIn": self.check_in,
            "checkOut": self.check_out,
            "hours": self.hours,
        }
