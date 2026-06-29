from app.database import SessionLocal
from app.models.role_request_model import RoleRequest
from app.services.audit_service import create_audit_log


def create_role_request(data):
    db = SessionLocal()
    company_id = data.get("company_id", 1)
    user_name = data["user_name"]

    request = RoleRequest(
        company_id=company_id,
        user_name=user_name,
        current_role=data["current_role"],
        requested_role=data["requested_role"]
    )

    db.add(request)
    db.commit()
    db.refresh(request)

    create_audit_log(
        user_name=user_name,
        action="Role Change Requested",
        related_employee=user_name,
        company_id=company_id
    )

    result = request.to_dict()
    db.close()
    return result


def get_role_requests(company_id=None, status=None):
    db = SessionLocal()

    query = db.query(RoleRequest)
    if company_id is not None:
        query = query.filter(RoleRequest.company_id == company_id)
    if status:
        query = query.filter(RoleRequest.status == status)

    requests = query.order_by(RoleRequest.id.desc()).all()
    result = [request.to_dict() for request in requests]

    db.close()
    return result


def approve_role_request(request_id, company_id=None, admin_name="Admin"):
    db = SessionLocal()

    query = db.query(RoleRequest).filter(RoleRequest.id == request_id)
    if company_id is not None:
        query = query.filter(RoleRequest.company_id == company_id)

    request = query.first()
    if not request:
        db.close()
        return None

    request.status = "approved"
    db.commit()

    create_audit_log(
        user_name=admin_name,
        action="Role Change Approved",
        related_employee=request.user_name,
        company_id=request.company_id
    )

    result = request.to_dict()
    db.close()
    return result


def reject_role_request(request_id, company_id=None, admin_name="Admin"):
    db = SessionLocal()

    query = db.query(RoleRequest).filter(RoleRequest.id == request_id)
    if company_id is not None:
        query = query.filter(RoleRequest.company_id == company_id)

    request = query.first()
    if not request:
        db.close()
        return None

    request.status = "rejected"
    db.commit()

    create_audit_log(
        user_name=admin_name,
        action="Role Change Rejected",
        related_employee=request.user_name,
        company_id=request.company_id
    )

    result = request.to_dict()
    db.close()
    return result
