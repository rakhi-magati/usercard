from fastapi import APIRouter, HTTPException
from app.services.user_activity_service import activity_summary, list_user_activities, record_login, record_logout

router = APIRouter()


@router.get("/activities")
def fetch_activities(company_id: int = 1, search: str = None):
    return {
        "success": True,
        "data": list_user_activities(company_id, search),
        "summary": activity_summary(company_id),
    }


@router.post("/activities/login")
def login_activity(data: dict):
    activity = record_login(data)
    if not activity:
        raise HTTPException(status_code=400, detail="email is required")
    return {"success": True, "data": activity}


@router.post("/activities/logout")
def logout_activity(data: dict):
    activity = record_logout(data)
    if not activity:
        raise HTTPException(status_code=400, detail="email is required")
    return {"success": True, "data": activity}
