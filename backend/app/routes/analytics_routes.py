from fastapi import APIRouter
from app.database import SessionLocal
from app.services.analytics_service import get_analytics, get_pending_role_requests
from app.services.employee_service import assert_actor_can_access

router = APIRouter()


@router.get("/analytics")
def fetch_analytics(company_id: int = 1, actor_email: str = None):
    if actor_email:
        db = SessionLocal()
        assert_actor_can_access(db, company_id, actor_email)
        db.close()

    data = get_analytics(company_id)
    pending = get_pending_role_requests(company_id)
    data["pending_requests"] = pending
    return {"success": True, "data": data}


@router.get("/analytics/kpi")
def fetch_kpi(company_id: int = 1, actor_email: str = None):
    if actor_email:
        db = SessionLocal()
        assert_actor_can_access(db, company_id, actor_email)
        db.close()

    data = get_analytics(company_id)
    pending = get_pending_role_requests(company_id)
    return {
        "success": True,
        "data": {
            "total_employees": data["total_employees"],
            "active_employees": data["active_employees"],
            "total_departments": data["total_departments"],
            "pending_requests": pending,
        }
    }

