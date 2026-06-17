from fastapi import APIRouter
from app.services.notification_service import (
    get_notifications,
    mark_notification_read,
    mark_all_read,
)

router = APIRouter()


@router.get("/notifications")
def list_notifications(company_id: int = 1):
    return {"success": True, "data": get_notifications(company_id)}


@router.put("/notifications/{notification_id}/read")
def read_notification(notification_id: int):
    return mark_notification_read(notification_id)


@router.put("/notifications/read-all")
def read_all(company_id: int = 1):
    return mark_all_read(company_id)
