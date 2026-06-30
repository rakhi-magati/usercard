from datetime import datetime
from fastapi import HTTPException
from app.database import SessionLocal
from app.models.reactivation_model import ReactivationRequest
from app.models.employee_model import Employee
from app.models.notification_model import Notification
from app.services.audit_service import create_audit_log
from app.services.employee_service import (
    ACTIVE,
    SUSPENDED,
    DEACTIVATED,
    assert_actor_can_access,
    assert_admin,
    get_actor,
    normalize_status,
)


def _now():
    return datetime.now().isoformat()


def _employee_recipient(employee):
    return f"employee:{employee.email}" if employee and employee.email else "admin"


def submit_reactivation_request(data: dict):
    db = SessionLocal()
    company_id = data.get("company_id", 1)
    employee_id = data.get("employee_id")
    employee = None

    if employee_id:
        employee = db.query(Employee).filter(
            Employee.id == employee_id,
            Employee.company_id == company_id,
        ).first()

    if not employee and data.get("employee_email"):
        employee = db.query(Employee).filter(
            Employee.email == data.get("employee_email"),
            Employee.company_id == company_id,
        ).first()

    if not employee:
        db.close()
        raise HTTPException(status_code=404, detail="Employee not found")

    if normalize_status(employee.status) != SUSPENDED:
        db.close()
        raise HTTPException(status_code=400, detail="Only suspended users can request reinstatement")

    existing_pending = db.query(ReactivationRequest).filter(
        ReactivationRequest.employee_id == employee.id,
        ReactivationRequest.company_id == company_id,
        ReactivationRequest.status == "pending",
    ).first()
    if existing_pending:
        result = existing_pending.to_dict()
        db.close()
        return result

    requested_at = _now()
    req = ReactivationRequest(
        employee_id=employee.id,
        employee_name=employee.name,
        company_id=company_id,
        reason=data.get("reason", ""),
        status="pending",
        requested_at=requested_at,
    )
    db.add(req)
    db.commit()
    db.refresh(req)
    result = req.to_dict()

    recipients = ["admin"]
    if employee.suspended_by_email:
        recipients.insert(0, f"employee:{employee.suspended_by_email}")

    for recipient in dict.fromkeys(recipients):
        notif = Notification(
            company_id=company_id,
            recipient_role=recipient,
            message=f"Reinstatement request from {req.employee_name}",
            type="reinstatement_request",
            related_id=req.id,
            is_read=False,
            created_at=requested_at,
        )
        db.add(notif)

    db.commit()

    create_audit_log(
        user_name=req.employee_name or "User",
        action="Reinstatement Request Submitted",
        related_employee=req.employee_name,
        company_id=company_id,
    )

    db.close()
    return result


def get_reactivation_requests(company_id: int, actor_email: str = None, employee_id: int = None):
    db = SessionLocal()

    query = db.query(ReactivationRequest).filter(
        ReactivationRequest.company_id == company_id
    )

    if actor_email:
        actor = get_actor(db, company_id, actor_email)
        actor_status = normalize_status(actor.status)
        is_admin = (actor.role or "").lower() == "admin"

        if actor_status == DEACTIVATED:
            db.close()
            raise HTTPException(status_code=403, detail="Account deactivated. Access is blocked.")

        if actor_status == SUSPENDED:
            query = query.filter(ReactivationRequest.employee_id == actor.id)
        elif is_admin:
            pass
        else:
            query = query.filter(ReactivationRequest.employee_id == actor.id)

    if employee_id is not None:
        query = query.filter(ReactivationRequest.employee_id == employee_id)

    reqs = query.order_by(ReactivationRequest.id.desc()).all()
    result = [r.to_dict() for r in reqs]
    db.close()
    return result


def review_reactivation_request(request_id: int, action: str, admin_name: str = "Admin", company_id: int = None, actor_email: str = None):
    db = SessionLocal()
    lookup_company_id = company_id or 1
    actor = assert_actor_can_access(db, lookup_company_id, actor_email)
    assert_admin(actor)

    query = db.query(ReactivationRequest).filter(
        ReactivationRequest.id == request_id
    )
    if company_id is not None:
        query = query.filter(ReactivationRequest.company_id == company_id)

    req = query.first()

    if not req:
        db.close()
        return None

    if req.status != "pending":
        db.close()
        raise HTTPException(status_code=400, detail="Request has already been reviewed")

    employee = db.query(Employee).filter(
        Employee.id == req.employee_id,
        Employee.company_id == req.company_id,
    ).first()

    reviewed_at = _now()
    req.status = action
    req.reviewed_by = admin_name
    req.reviewed_at = reviewed_at

    if action == "approved" and employee:
        employee.status = ACTIVE
        employee.suspension_date = None
        employee.suspension_reason = None
        employee.suspended_by = None
        employee.suspended_by_email = None

    db.commit()

    if action == "approved":
        create_audit_log(
            user_name=admin_name,
            action="Reinstatement Approved",
            related_employee=req.employee_name,
            company_id=req.company_id,
        )
        create_audit_log(
            user_name=admin_name,
            action="User Reinstated",
            related_employee=req.employee_name,
            company_id=req.company_id,
        )
    else:
        create_audit_log(
            user_name=admin_name,
            action="Reinstatement Rejected",
            related_employee=req.employee_name,
            company_id=req.company_id,
        )

    notification = Notification(
        company_id=req.company_id,
        recipient_role=_employee_recipient(employee),
        message=f"Your reinstatement request was {action}.",
        type=f"reinstatement_{action}",
        related_id=req.id,
        is_read=False,
        created_at=reviewed_at,
    )
    db.add(notification)
    db.commit()

    result = req.to_dict()
    db.close()
    return result


def deactivate_user(employee_id: int, admin_name: str = "Admin", company_id: int = None, actor_email: str = None):
    db = SessionLocal()
    lookup_company_id = company_id or 1
    actor = assert_actor_can_access(db, lookup_company_id, actor_email)
    assert_admin(actor)

    query = db.query(Employee).filter(Employee.id == employee_id)
    if company_id is not None:
        query = query.filter(Employee.company_id == company_id)

    employee = query.first()

    if not employee:
        db.close()
        return None

    employee.status = DEACTIVATED
    employee.suspension_date = None
    employee.suspension_reason = None
    employee.suspended_by = None
    employee.suspended_by_email = None
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
