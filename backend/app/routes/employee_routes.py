from fastapi import APIRouter, HTTPException

from app.controllers.employee_controller import (
    get_all_employees,
    get_employee_by_id,
)

router = APIRouter()


@router.get("/employees")
def fetch_employees():
    return {
        "success": True,
        "data": get_all_employees(),
    }


@router.get("/employees/{employee_id}")
def fetch_employee(employee_id: int):

    employee = get_employee_by_id(
        employee_id
    )

    if not employee:
        raise HTTPException(
            status_code=404,
            detail="Employee not found",
        )

    return {
        "success": True,
        "data": employee,
    }