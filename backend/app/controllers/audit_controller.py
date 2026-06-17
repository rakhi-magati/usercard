from datetime import datetime

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
        timestamp=datetime.now().strftime(
            "%Y-%m-%d %H:%M:%S"
        ),
        company_id=company_id   
    )

    db.add(log)

    db.commit()

    db.close()


def get_all_logs(company_id):

    db = SessionLocal()

    logs = db.query(AuditLog).filter(
        AuditLog.company_id == company_id
    ).all()

    result = [
        log.to_dict()
        for log in logs
    ]

    db.close()

    return result