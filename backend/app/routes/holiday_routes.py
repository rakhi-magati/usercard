from fastapi import APIRouter, HTTPException
from app.services.holiday_service import (
    create_holiday,
    update_holiday,
    delete_holiday,
    restore_holiday,
    list_holidays,
    get_upcoming_holidays,
    is_holiday,
)
from app.services.employee_service import assert_actor_can_access

router = APIRouter(prefix="/holidays", tags=["Holidays"])


@router.get("/")
def get_holidays(
    company_id: int = 1,
    month: int = None,
    year: int = None,
    holiday_type: str = None,
    search: str = None,
    include_deleted: bool = False,
    actor_email: str = None,
):
    rows = list_holidays(
        company_id=company_id,
        actor_email=actor_email,
        month=month,
        year=year,
        holiday_type=holiday_type,
        search=search,
        include_deleted=include_deleted,
    )
    return {"success": True, "data": rows}


@router.get("/upcoming")
def upcoming_holidays(company_id: int = 1, limit: int = 5):
    return {"success": True, "data": get_upcoming_holidays(company_id, limit)}


@router.get("/check")
def check_holiday(company_id: int = 1, date: str = None):
    if not date:
        raise HTTPException(status_code=400, detail="date query param required (YYYY-MM-DD)")
    result = is_holiday(company_id, date)
    return {"success": True, "is_holiday": result is not None, "holiday": result}


@router.post("/")
def add_holiday(data: dict):
    return {"success": True, "data": create_holiday(data)}


@router.put("/{holiday_id}")
def edit_holiday(holiday_id: int, data: dict):
    return {"success": True, "data": update_holiday(holiday_id, data)}


@router.delete("/{holiday_id}")
def remove_holiday(
    holiday_id: int,
    company_id: int = 1,
    actor_email: str = None,
    admin_name: str = "Admin",
):
    return {"success": True, "data": delete_holiday(holiday_id, company_id, actor_email, admin_name)}


@router.put("/{holiday_id}/restore")
def undelete_holiday(holiday_id: int, data: dict):
    company_id = data.get("company_id", 1)
    actor_email = data.get("actor_email")
    admin_name = data.get("admin_name", "Admin")
    return {"success": True, "data": restore_holiday(holiday_id, company_id, actor_email, admin_name)}
