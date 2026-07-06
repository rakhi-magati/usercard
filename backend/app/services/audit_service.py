from datetime import datetime

from app.database import SessionLocal
from app.models.audit_log_model import AuditLog


def create_audit_log(
    user_name,
    action,
    related_employee=None,
    company_id=None,
    device_name=None,
    browser=None,
    ip_address=None,
    session_identifier=None,
    session_id=None,          # optional
    performed_by=None,
    performed_by_email=None,
):
    db = SessionLocal()

    log = AuditLog(
        user_name=user_name,
        action=action,
        related_employee=related_employee,
        company_id=company_id,
        timestamp=datetime.now().isoformat(),
    )

    db.add(log)
    db.commit()
    db.close()


def get_audit_logs(company_id=None):
    db = SessionLocal()

    query = db.query(AuditLog)

    if company_id is not None:
        query = query.filter(AuditLog.company_id == company_id)

    logs = query.order_by(AuditLog.id.desc()).all()

    result = [log.to_dict() for log in logs]

    db.close()

    return result