from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from app.database import Base


class EmployeeSkill(Base):
    __tablename__ = "employee_skills"

    id = Column(Integer, primary_key=True, index=True)

    company_id = Column(Integer, ForeignKey("companies.id"), index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), index=True)

    skill_name = Column(String, nullable=False)
    # Beginner / Intermediate / Advanced / Expert
    proficiency_level = Column(String, default="Beginner")
    years_experience = Column(Integer, default=0)
    is_primary = Column(Boolean, default=False)

    created_at = Column(String)
    updated_at = Column(String)

    def to_dict(self):
        return {
            "id": self.id,
            "company_id": self.company_id,
            "employee_id": self.employee_id,
            "skill_name": self.skill_name,
            "proficiency_level": self.proficiency_level,
            "years_experience": self.years_experience,
            "is_primary": bool(self.is_primary),
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }
