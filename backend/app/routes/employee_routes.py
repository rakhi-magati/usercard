from fastapi import APIRouter, HTTPException
from app.database import SessionLocal
from app.services.audit_service import get_audit_logs
from app.services.employee_service import assert_actor_can_access, assert_admin

from app.controllers.employee_controller import (
    fetch_all_employees,
    fetch_employee_by_id,
    fetch_employee_by_email,
    sync_employee_for_login,
    create_employee,
    edit_employee,
    remove_employee,
    suspend_user,
    reinstate_user,
    transfer_department,
    fetch_department_transfer_history,
    import_users
)

from app.services.role_request_service import (
    create_role_request,
    get_role_requests,
    approve_role_request,
    reject_role_request
)


router = APIRouter()


@router.post("/role-requests")
def submit_role_request(data: dict):
    return {
        "success": True,
        "data": create_role_request(data)
    }


@router.get("/role-requests")
def fetch_role_requests(company_id: int = 1, status: str = None, actor_email: str = None):
    return {
        "success": True,
        "data": get_role_requests(company_id, status, actor_email)
    }


@router.put("/role-requests/{request_id}/approve")
def approve_request(request_id: int, data: dict = {}):
    updated = approve_role_request(
        request_id,
        data.get("company_id"),
        data.get("admin_name", "Admin"),
        data.get("actor_email"),
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Role request not found")
    return {"success": True, "data": updated}


@router.put("/role-requests/{request_id}/reject")
def reject_request(request_id: int, data: dict = {}):
    updated = reject_role_request(
        request_id,
        data.get("company_id"),
        data.get("admin_name", "Admin"),
        data.get("actor_email"),
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Role request not found")
    return {"success": True, "data": updated}


@router.get("/audit-logs")
def fetch_logs(company_id: int = 1, actor_email: str = None):
    if actor_email:
        db = SessionLocal()
        actor = assert_actor_can_access(db, company_id, actor_email)
        assert_admin(actor)
        db.close()

    return {
        "success": True,
        "data": get_audit_logs(company_id),
    }


@router.post("/employees/import")
def import_employee_data():
    return import_users()


@router.get("/employees")
def fetch_employees(
    company_id: int = 1,
    search: str = None,
    role: str = None,
    department: str = None,
    page: int = 1,
    limit: int = 50,
    actor_email: str = None,
):
    employees = fetch_all_employees(company_id, actor_email)

    if search:
        employees = [e for e in employees if search.lower() in e["name"].lower()]
    if role:
        employees = [e for e in employees if e["role"] == role]
    if department:
        employees = [e for e in employees if e["department"] == department]

    total = len(employees)
    start = (page - 1) * limit
    paginated = employees[start: start + limit]

    return {
        "success": True,
        "data": paginated,
        "total": total,
        "page": page,
        "limit": limit,
    }


@router.get("/employees/lookup/by-email")
def fetch_employee_lookup(email: str, company_id: int = 1):
    employee = fetch_employee_by_email(email, company_id)
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    return {"success": True, "data": employee}


@router.post("/employees/sync-login")
def sync_login_employee_route(data: dict):
    return {"success": True, "data": sync_employee_for_login(data)}


@router.put("/employees/{employee_id}/transfer")
def transfer_employee_route(employee_id: int, transfer: dict):
    updated = transfer_department(employee_id, transfer)
    if not updated:
        raise HTTPException(status_code=404, detail="Employee not found or department missing")
    return {"success": True, "data": updated}


@router.get("/department-transfers")
def fetch_department_transfers(company_id: int = None, employee_id: int = None):
    return {
        "success": True,
        "data": fetch_department_transfer_history(company_id, employee_id),
    }


@router.get("/employees/{employee_id}")
def fetch_employee(employee_id: int, company_id: int = 1):
    employee = fetch_employee_by_id(employee_id, company_id)
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    return {"success": True, "data": employee}


@router.post("/employees")
def add_employee_route(employee: dict):
    return {"success": True, "data": create_employee(employee)}


@router.put("/employees/{employee_id}")
def update_employee_route(employee_id: int, employee: dict):
    updated = edit_employee(employee_id, employee)
    if not updated:
        raise HTTPException(status_code=404, detail="Employee not found")
    return {"success": True, "data": updated}


@router.put("/employees/{employee_id}/suspend")
def suspend_employee_route(employee_id: int, data: dict):
    updated = suspend_user(employee_id, data)
    if not updated:
        raise HTTPException(status_code=404, detail="Employee not found")
    return {"success": True, "data": updated}


@router.put("/employees/{employee_id}/reinstate")
def reinstate_employee_route(employee_id: int, data: dict):
    updated = reinstate_user(
        employee_id,
        data.get("company_id", 1),
        data.get("admin_name", "Admin"),
        data.get("actor_email"),
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Employee not found")
    return {"success": True, "data": updated}


@router.delete("/employees/{employee_id}")
def delete_employee_route(employee_id: int, company_id: int = 1, admin_name: str = "Admin", actor_email: str = None):
    deleted = remove_employee(employee_id, company_id, admin_name, actor_email)
    if not deleted:
        raise HTTPException(status_code=404, detail="Employee not found")
    return {"success": True, "message": "Employee deleted"}





