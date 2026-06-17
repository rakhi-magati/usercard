from sqlalchemy import Column, Integer, String
from app.database import Base


class Invitation(Base):
    __tablename__ = "invitations"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, nullable=False)
    email = Column(String, nullable=False)
    role = Column(String, default="user")
    token = Column(String, unique=True, nullable=False)
    status = Column(String, default="pending")  # pending, accepted, revoked
    created_by = Column(String)
    created_at = Column(String)

    def to_dict(self):
        return {
            "id": self.id,
            "company_id": self.company_id,
            "email": self.email,
            "role": self.role,
            "token": self.token,
            "status": self.status,
            "created_by": self.created_by,
            "created_at": self.created_at,
        }
