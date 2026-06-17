import uuid
from datetime import datetime
from app.database import SessionLocal
from app.models.invitation_model import Invitation
from app.services.audit_service import create_audit_log


def create_invitation(data: dict):
    db = SessionLocal()

    token = str(uuid.uuid4())
    invitation = Invitation(
        company_id=data.get("company_id", 1),
        email=data.get("email"),
        role=data.get("role", "user"),
        token=token,
        status="pending",
        created_by=data.get("created_by", "Admin"),
        created_at=datetime.now().isoformat(),
    )

    db.add(invitation)
    db.commit()
    db.refresh(invitation)
    result = invitation.to_dict()

    create_audit_log(
        user_name=data.get("created_by", "Admin"),
        action="Invitation Created",
        related_employee=data.get("email"),
        company_id=data.get("company_id", 1),
    )

    db.close()
    return result


def get_invitations(company_id: int):
    db = SessionLocal()
    invitations = db.query(Invitation).filter(
        Invitation.company_id == company_id
    ).all()
    result = [i.to_dict() for i in invitations]
    db.close()
    return result


def revoke_invitation(invitation_id: int, admin_name: str = "Admin"):
    db = SessionLocal()
    invitation = db.query(Invitation).filter(
        Invitation.id == invitation_id
    ).first()

    if not invitation:
        db.close()
        return None

    invitation.status = "revoked"
    db.commit()
    db.refresh(invitation)
    result = invitation.to_dict()

    create_audit_log(
        user_name=admin_name,
        action="Invitation Revoked",
        related_employee=invitation.email,
        company_id=invitation.company_id,
    )

    db.close()
    return result


def accept_invitation(token: str, name: str):
    db = SessionLocal()
    invitation = db.query(Invitation).filter(
        Invitation.token == token,
        Invitation.status == "pending"
    ).first()

    if not invitation:
        db.close()
        return None

    invitation.status = "accepted"
    db.commit()

    from app.models.employee_model import Employee
    employee = Employee(
        name=name,
        email=invitation.email,
        role=invitation.role,
        department="General",
        salary=0,
        city="",
        status="active",
        join_date=datetime.now().strftime("%Y-%m-%d"),
        company_id=invitation.company_id,
    )
    db.add(employee)
    db.commit()
    db.refresh(employee)

    create_audit_log(
        user_name=name,
        action="User Activated",
        related_employee=name,
        company_id=invitation.company_id,
    )

    result = employee.to_dict()
    db.close()
    return result
