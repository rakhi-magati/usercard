from fastapi import APIRouter

from app.controllers.audit_controller import (
    get_all_logs
)

router = APIRouter()


@router.get("/audit-logs")
def fetch_logs():

    company_id = 1

    return {
        "success": True,
        "data": get_all_logs(company_id)
    }