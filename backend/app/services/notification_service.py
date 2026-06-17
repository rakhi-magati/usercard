from app.database import SessionLocal
from app.models.notification_model import Notification


def get_notifications(company_id: int):
    db = SessionLocal()
    notifications = db.query(Notification).filter(
        Notification.company_id == company_id
    ).order_by(Notification.id.desc()).all()
    result = [n.to_dict() for n in notifications]
    db.close()
    return result


def mark_notification_read(notification_id: int):
    db = SessionLocal()
    notif = db.query(Notification).filter(
        Notification.id == notification_id
    ).first()
    if notif:
        notif.is_read = True
        db.commit()
    db.close()
    return {"success": True}


def mark_all_read(company_id: int):
    db = SessionLocal()
    db.query(Notification).filter(
        Notification.company_id == company_id
    ).update({"is_read": True})
    db.commit()
    db.close()
    return {"success": True}
