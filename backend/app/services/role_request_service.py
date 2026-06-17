from app.database import SessionLocal
from app.models.role_request_model import RoleRequest
from app.services.audit_service import create_audit_log


def create_role_request(data):
    db = SessionLocal()

    request = RoleRequest(
        user_name=data["user_name"],
        current_role=data["current_role"],
        requested_role=data["requested_role"]
    )

    db.add(request)
    db.commit()
    db.refresh(request)

    create_audit_log(
        user_name=data["user_name"],
        action="Role Change Requested",
        related_employee=data["user_name"],
        company_id=1
    )

    result = request.to_dict()

    db.close()

    return result

def get_role_requests():
    db = SessionLocal()

    requests = db.query(RoleRequest).all()

    result = [
        request.to_dict()
        for request in requests
    ]

    db.close()

    return result


def approve_role_request(request_id):
    db = SessionLocal()

    request = db.query(RoleRequest).filter(
        RoleRequest.id == request_id
    ).first()

    if not request:
        db.close()
        return None

    request.status = "approved"

    db.commit()

    create_audit_log(
        user_name="Admin",
        action="Role Change Approved",
        related_employee=request.user_name,
        company_id=1
    )

    result = request.to_dict()

    db.close()

    return result


def reject_role_request(request_id):
    db = SessionLocal()

    request = db.query(RoleRequest).filter(
        RoleRequest.id == request_id
    ).first()

    if not request:
        db.close()
        return None

    request.status = "rejected"

    db.commit()

    create_audit_log(
        user_name="Admin",
        action="Role Change Rejected",
        related_employee=request.user_name,
        company_id=1
    )

    result = request.to_dict()

    db.close()

    return result
