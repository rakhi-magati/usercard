from fastapi import APIRouter
from app.database import SessionLocal
from app.controllers.audit_controller import get_all_logs
from app.services.employee_service import assert_actor_can_access, assert_admin

router = APIRouter()


@router.get("/audit-logs")
def fetch_logs(company_id: int = 1, actor_email: str = None):
    if actor_email:
        db = SessionLocal()
        actor = assert_actor_can_access(db, company_id, actor_email)
        assert_admin(actor)
        db.close()

    return {
        "success": True,
        "data": get_all_logs(company_id)
    }

