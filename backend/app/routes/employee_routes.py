from fastapi import APIRouter, HTTPException
from app.services.audit_service import get_audit_logs

from app.controllers.employee_controller import (
    fetch_all_employees,
    fetch_employee_by_id,
    create_employee,
    edit_employee,
    remove_employee,
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
def fetch_role_requests(company_id: int = 1, status: str = None):
    return {
        "success": True,
        "data": get_role_requests(company_id, status)
    }


@router.put("/role-requests/{request_id}/approve")
def approve_request(request_id: int, data: dict = {}):
    updated = approve_role_request(
        request_id,
        data.get("company_id"),
        data.get("admin_name", "Admin")
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Role request not found")
    return {"success": True, "data": updated}


@router.put("/role-requests/{request_id}/reject")
def reject_request(request_id: int, data: dict = {}):
    updated = reject_role_request(
        request_id,
        data.get("company_id"),
        data.get("admin_name", "Admin")
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Role request not found")
    return {"success": True, "data": updated}


@router.get("/audit-logs")
def fetch_logs(company_id: int = 1):
    return {
        "success": True,
        "data": get_audit_logs(company_id),
    }


@router.post("/employees/import")
def import_employee_data():
    return import_users()


@router.get("/employees")
def fetch_employees(company_id: int = 1, search: str = None, role: str = None, department: str = None, page: int = 1, limit: int = 50):
    employees = fetch_all_employees(company_id)

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


@router.delete("/employees/{employee_id}")
def delete_employee_route(employee_id: int, company_id: int = 1, admin_name: str = "Admin"):
    deleted = remove_employee(employee_id, company_id, admin_name)
    if not deleted:
        raise HTTPException(status_code=404, detail="Employee not found")
    return {"success": True, "message": "Employee deleted"}

