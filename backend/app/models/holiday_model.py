from sqlalchemy import Column, Integer, String, Boolean
from app.database import Base


class Holiday(Base):
    __tablename__ = "holidays"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, nullable=False)
    name = Column(String, nullable=False)
    date = Column(String, nullable=False)          # ISO date YYYY-MM-DD
    description = Column(String, default="")
    holiday_type = Column(String, default="Public Holiday")  # Public Holiday | Company Holiday | Optional Holiday
    is_recurring = Column(Boolean, default=False)  # repeats every year on same MM-DD
    is_deleted = Column(Boolean, default=False)    # soft-delete so audits still reference it
    created_by = Column(String)
    created_at = Column(String)
    updated_by = Column(String)
    updated_at = Column(String)

    def to_dict(self):
        return {
            "id": self.id,
            "company_id": self.company_id,
            "name": self.name,
            "date": self.date,
            "description": self.description,
            "holiday_type": self.holiday_type,
            "is_recurring": self.is_recurring,
            "is_deleted": self.is_deleted,
            "created_by": self.created_by,
            "created_at": self.created_at,
            "updated_by": self.updated_by,
            "updated_at": self.updated_at,
        }
