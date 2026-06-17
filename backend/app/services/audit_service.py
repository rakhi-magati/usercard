from app.database import SessionLocal
from app.models.audit_log_model import AuditLog


def create_audit_log(
    user_name,
    action,
    related_employee,
    company_id  
):
    db = SessionLocal()

    log = AuditLog(
        user_name=user_name,
        action=action,
        related_employee=related_employee,
        company_id=company_id
    )

    db.add(log)
    db.commit()

    db.close()

def get_audit_logs():
    db = SessionLocal()

    logs = db.query(AuditLog).all()

    result = [
        log.to_dict()
        for log in logs
    ]

    db.close()

    return result
    