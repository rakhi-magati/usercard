from fastapi import APIRouter, HTTPException

from app.controllers.profile_completion_controller import (
    fetch_my_profile_completion,
    patch_my_profile,
    fetch_company_profile_completion,
    update_completion_threshold,
)

router = APIRouter()


@router.get("/employees/{employee_id}/profile-completion")
def get_profile_completion(employee_id: int, company_id: int = 1):
    result = fetch_my_profile_completion(employee_id, company_id)
    if not result:
        raise HTTPException(status_code=404, detail="Employee not found")
    return {"success": True, "data": result}


@router.put("/employees/{employee_id}/profile")
def update_profile(employee_id: int, data: dict):
    updated = patch_my_profile(employee_id, data)
    if not updated:
        raise HTTPException(status_code=404, detail="Employee not found")
    return {"success": True, "data": updated}


@router.get("/profile-completion/overview")
def get_overview(
    company_id: int = 1,
    actor_email: str = None,
    below_threshold_only: bool = False,
    threshold: int = None,
):
    data = fetch_company_profile_completion(
        company_id,
        actor_email,
        below_threshold_only,
        threshold,
    )
    return {"success": True, "data": data}


@router.put("/profile-completion/threshold")
def set_completion_threshold(data: dict):
    company_id = data.get("company_id", 1)
    threshold = data.get("threshold")
    admin_name = data.get("admin_name", "Admin")
    actor_email = data.get("actor_email")

    result = update_completion_threshold(company_id, threshold, admin_name, actor_email)
    return {"success": True, "data": result}
