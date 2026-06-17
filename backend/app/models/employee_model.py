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

    # ✅ ADD THESE FIELDS
    status = Column(String, default="active")
    join_date = Column(String)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "role": self.role,
            "department": self.department,
            "salary": self.salary,
            "city": self.city,
            "status": self.status,          # ✅ ADD
            "join_date": self.join_date,    # ✅ ADD
            "company_id": self.company_id   # ✅ ADD
        }