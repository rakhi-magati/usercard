from sqlalchemy import Column, Integer, String
from app.database import Base


class RoleRequest(Base):
    __tablename__ = "role_requests"

    id = Column(Integer, primary_key=True)

    user_name = Column(String)

    current_role = Column(String)

    requested_role = Column(String)

    status = Column(
        String,
        default="pending"
    )

    def to_dict(self):
        return {
            "id": self.id,
            "user_name": self.user_name,
            "current_role": self.current_role,
            "requested_role": self.requested_role,
            "status": self.status
        }