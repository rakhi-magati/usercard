from app.database import SessionLocal
from app.models.employee_model import Employee
from app.models.role_request_model import RoleRequest


def get_analytics(company_id: int):
    db = SessionLocal()

    employees = db.query(Employee).filter(
        Employee.company_id == company_id
    ).all()

    total = len(employees)
    active = sum(1 for e in employees if (e.status or "active") == "active")

    dept_counts = {}
    role_counts = {}
    status_counts = {}

    for emp in employees:
        dept = emp.department or "Unknown"
        dept_counts[dept] = dept_counts.get(dept, 0) + 1

        role = emp.role or "Unknown"
        role_counts[role] = role_counts.get(role, 0) + 1

        status = emp.status or "active"
        status_counts[status] = status_counts.get(status, 0) + 1

    departments = len(dept_counts)
    db.close()

    return {
        "total_employees": total,
        "active_employees": active,
        "total_departments": departments,
        "department_distribution": [
            {"name": k, "value": v}
            for k, v in dept_counts.items()
        ],
        "role_distribution": [
            {"name": k, "value": v}
            for k, v in role_counts.items()
        ],
        "status_overview": [
            {"name": k, "value": v}
            for k, v in status_counts.items()
        ],
    }


def get_pending_role_requests(company_id: int):
    db = SessionLocal()
    count = db.query(RoleRequest).filter(
        RoleRequest.company_id == company_id,
        RoleRequest.status == "pending"
    ).count()
    db.close()
    return count
