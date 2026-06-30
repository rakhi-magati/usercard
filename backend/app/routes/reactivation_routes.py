from fastapi import APIRouter, HTTPException
from app.services.reactivation_service import (
    submit_reactivation_request,
    get_reactivation_requests,
    review_reactivation_request,
    deactivate_user,
)

router = APIRouter()


@router.get("/reactivation-requests")
def list_requests(company_id: int = 1, actor_email: str = None, employee_id: int = None):
    return {"success": True, "data": get_reactivation_requests(company_id, actor_email, employee_id)}


@router.post("/reactivation-requests")
def submit_request(data: dict):
    result = submit_reactivation_request(data)
    return {"success": True, "data": result}


@router.put("/reactivation-requests/{request_id}/review")
def review_request(request_id: int, data: dict):
    action = data.get("action")
    if action not in ["approved", "rejected"]:
        raise HTTPException(status_code=400, detail="Action must be 'approved' or 'rejected'")
    result = review_reactivation_request(request_id, action, data.get("admin_name", "Admin"), data.get("company_id"), data.get("actor_email"))
    if not result:
        raise HTTPException(status_code=404, detail="Request not found")
    return {"success": True, "data": result}


@router.put("/employees/{employee_id}/deactivate")
def deactivate(employee_id: int, data: dict = {}):
    result = deactivate_user(employee_id, data.get("admin_name", "Admin"), data.get("company_id"), data.get("actor_email"))
    if not result:
        raise HTTPException(status_code=404, detail="Employee not found")
    return {"success": True, "data": result}



