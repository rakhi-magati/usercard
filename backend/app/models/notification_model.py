from sqlalchemy import Column, Integer, String, Boolean
from app.database import Base


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, nullable=False)
    recipient_role = Column(String, default="admin")
    message = Column(String, nullable=False)
    type = Column(String)  # reactivation_request, approval, etc.
    related_id = Column(Integer)
    is_read = Column(Boolean, default=False)
    created_at = Column(String)

    def to_dict(self):
        return {
            "id": self.id,
            "company_id": self.company_id,
            "recipient_role": self.recipient_role,
            "message": self.message,
            "type": self.type,
            "related_id": self.related_id,
            "is_read": self.is_read,
            "created_at": self.created_at,
        }
