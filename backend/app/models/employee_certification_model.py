from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from app.database import Base


class EmployeeCertification(Base):
    __tablename__ = "employee_certifications"

    id = Column(Integer, primary_key=True, index=True)

    company_id = Column(Integer, ForeignKey("companies.id"), index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), index=True)

    certification_name = Column(String, nullable=False)
    issuing_organization = Column(String, nullable=False)
    issue_date = Column(String)
    expiry_date = Column(String)  # nullable - some certifications never expire

    document_path = Column(String)      # relative path on disk, under uploads/
    document_name = Column(String)      # original uploaded file name

    # Guards so expiry notifications/audit entries fire only once each.
    notified_expiring = Column(Boolean, default=False)
    notified_expired = Column(Boolean, default=False)

    created_at = Column(String)
    updated_at = Column(String)

    def to_dict(self):
        return {
            "id": self.id,
            "company_id": self.company_id,
            "employee_id": self.employee_id,
            "certification_name": self.certification_name,
            "issuing_organization": self.issuing_organization,
            "issue_date": self.issue_date,
            "expiry_date": self.expiry_date,
            "document_path": self.document_path,
            "document_name": self.document_name,
            "notified_expiring": bool(self.notified_expiring),
            "notified_expired": bool(self.notified_expired),
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }
