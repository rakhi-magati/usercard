from fastapi import APIRouter
from app.database import SessionLocal
from app.services.notification_service import (
    get_notifications,
    mark_notification_read,
    mark_all_read,
)
from app.services.employee_service import assert_actor_can_access

router = APIRouter()


@router.get("/notifications")
def list_notifications(company_id: int = 1, actor_email: str = None):
    if actor_email:
        db = SessionLocal()
        assert_actor_can_access(db, company_id, actor_email)
        db.close()

    return {"success": True, "data": get_notifications(company_id)}


@router.put("/notifications/{notification_id}/read")
def read_notification(notification_id: int, data: dict = {}):
    company_id = data.get("company_id")
    actor_email = data.get("actor_email")
    if company_id and actor_email:
        db = SessionLocal()
        assert_actor_can_access(db, company_id, actor_email)
        db.close()

    return mark_notification_read(notification_id)


@router.put("/notifications/read-all")
def read_all(company_id: int = 1, actor_email: str = None):
    if actor_email:
        db = SessionLocal()
        assert_actor_can_access(db, company_id, actor_email)
        db.close()

    return mark_all_read(company_id)

