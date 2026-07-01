from sqlalchemy import Column, Integer
from app.database import Base


class ProfileCompletionSettings(Base):
    """Per-company configurable threshold for low-profile-completion alerts."""

    __tablename__ = "profile_completion_settings"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, unique=True, nullable=False)
    threshold = Column(Integer, default=60)  # percentage below which a notification fires

    def to_dict(self):
        return {
            "id": self.id,
            "company_id": self.company_id,
            "threshold": self.threshold,
        }
