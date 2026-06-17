from fastapi import APIRouter, HTTPException
from app.services.audit_service import get_audit_logs

from app.controllers.employee_controller import (
    fetch_all_employees,
    fetch_employee_by_id,
    create_employee,
    edit_employee,
    remove_employee,
    import_users
)

router = APIRouter()


@router.get("/audit-logs")
def fetch_logs():
    return {
        "success": True,
        "data": get_audit_logs()
    }


@router.post("/employees/import")
def import_employee_data():
    return import_users()


@router.get("/employees")
def fetch_employees(
    company_id: int = 1
):
    return {
        "success": True,
        "data": fetch_all_employees(
            company_id
        )
    }

@router.get("/employees/{employee_id}")
def fetch_employee(employee_id: int):

    employee = fetch_employee_by_id(employee_id)

    if not employee:
        raise HTTPException(
            status_code=404,
            detail="Employee not found"
        )

    return {
        "success": True,
        "data": employee
    }


@router.post("/employees")
def add_employee_route(
    employee: dict
):
    print("Received Employee:", employee)

    return {
        "success": True,
        "data": create_employee(employee)
    }

@router.put("/employees/{employee_id}")
def update_employee_route(
    employee_id: int,
    employee: dict
):

    updated = edit_employee(
        employee_id,
        employee
    )

    if not updated:
        raise HTTPException(
            status_code=404,
            detail="Employee not found"
        )

    return {
        "success": True,
        "data": updated
    }


@router.delete("/employees/{employee_id}")
def delete_employee_route(
    employee_id: int
):

    deleted = remove_employee(employee_id)

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Employee not found"
        )

    return {
        "success": True,
        "message": "Employee deleted"
    }