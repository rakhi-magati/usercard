from datetime import datetime
from app.database import SessionLocal
from app.models.reactivation_model import ReactivationRequest
from app.models.employee_model import Employee
from app.models.notification_model import Notification
from app.services.audit_service import create_audit_log


def submit_reactivation_request(data: dict):
    db = SessionLocal()

    req = ReactivationRequest(
        employee_id=data.get("employee_id"),
        employee_name=data.get("employee_name"),
        company_id=data.get("company_id", 1),
        reason=data.get("reason", ""),
        status="pending",
        requested_at=datetime.now().isoformat(),
    )
    db.add(req)
    db.commit()
    db.refresh(req)
    result = req.to_dict()

    # Notify admin
    notif = Notification(
        company_id=data.get("company_id", 1),
        recipient_role="admin",
        message=f"Reactivation request from {data.get('employee_name')}",
        type="reactivation_request",
        related_id=req.id,
        is_read=False,
        created_at=datetime.now().isoformat(),
    )
    db.add(notif)
    db.commit()

    create_audit_log(
        user_name=data.get("employee_name", "User"),
        action="Reactivation Request Submitted",
        related_employee=data.get("employee_name"),
        company_id=data.get("company_id", 1),
    )

    db.close()
    return result


def get_reactivation_requests(company_id: int):
    db = SessionLocal()
    reqs = db.query(ReactivationRequest).filter(
        ReactivationRequest.company_id == company_id
    ).all()
    result = [r.to_dict() for r in reqs]
    db.close()
    return result


def review_reactivation_request(request_id: int, action: str, admin_name: str = "Admin"):
    db = SessionLocal()
    req = db.query(ReactivationRequest).filter(
        ReactivationRequest.id == request_id
    ).first()

    if not req:
        db.close()
        return None

    req.status = action  # "approved" or "rejected"
    req.reviewed_by = admin_name
    req.reviewed_at = datetime.now().isoformat()
    db.commit()

    if action == "approved":
        employee = db.query(Employee).filter(
            Employee.id == req.employee_id
        ).first()
        if employee:
            employee.status = "active"
            db.commit()

        create_audit_log(
            user_name=admin_name,
            action="Reactivation Approved",
            related_employee=req.employee_name,
            company_id=req.company_id,
        )
    else:
        create_audit_log(
            user_name=admin_name,
            action="Reactivation Rejected",
            related_employee=req.employee_name,
            company_id=req.company_id,
        )

    result = req.to_dict()
    db.close()
    return result


def deactivate_user(employee_id: int, admin_name: str = "Admin"):
    db = SessionLocal()
    employee = db.query(Employee).filter(
        Employee.id == employee_id
    ).first()

    if not employee:
        db.close()
        return None

    employee.status = "inactive"
    db.commit()

    create_audit_log(
        user_name=admin_name,
        action="User Deactivated",
        related_employee=employee.name,
        company_id=employee.company_id,
    )

    result = employee.to_dict()
    db.close()
    return result
