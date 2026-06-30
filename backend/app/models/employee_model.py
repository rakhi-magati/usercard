from sqlalchemy import Column, Integer, String
from app.database import Base
from sqlalchemy import ForeignKey


class Employee(Base):
    __tablename__ = "employees"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    company_id = Column(
        Integer,
        ForeignKey("companies.id")
    )

    name = Column(
        String,
        nullable=False
    )

    email = Column(
        String,
        unique=True,
        nullable=False
    )

    role = Column(
        String,
        nullable=False
    )

    department = Column(
        String,
        nullable=False
    )

    salary = Column(Integer)

    city = Column(String)

    status = Column(String, default="active")
    join_date = Column(String)
    suspension_date = Column(String)
    suspension_reason = Column(String)
    suspended_by = Column(String)
    suspended_by_email = Column(String)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "role": self.role,
            "department": self.department,
            "salary": self.salary,
            "city": self.city,
            "status": self.status,
            "join_date": self.join_date,
            "company_id": self.company_id,
            "suspension_date": self.suspension_date,
            "suspension_reason": self.suspension_reason,
            "suspended_by": self.suspended_by,
            "suspended_by_email": self.suspended_by_email,
        }
