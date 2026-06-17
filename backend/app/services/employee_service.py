import requests
from app.database import SessionLocal
from app.models.employee_model import Employee
# from app.models.audit_log_model import AuditLog
# from datetime import datetime
from app.services.audit_service import create_audit_log


def import_jsonplaceholder_users():
    db = SessionLocal()

    response = requests.get(
        "https://jsonplaceholder.typicode.com/users"
    )

    users = response.json()
    imported_count = 0

    for user in users:

        existing_user = db.query(Employee).filter(
            Employee.email == user["email"]
        ).first()

        if existing_user:
            continue

        employee = Employee(
            name=user["name"],
            email=user["email"],
            role="user",
            department="IT",
            salary=50000,
            city=user["address"]["city"],
            company_id=1
        )

        db.add(employee)
        imported_count += 1

    db.commit()
    db.close()

    return {
        "message": f"{imported_count} users imported successfully"
    }


def get_all_employees(
    company_id
):
    db = SessionLocal()

    employees = db.query(Employee).filter(
        Employee.company_id == company_id

    ).all()

    result = [
        employee.to_dict()
        for employee in employees

    ]

    db.close()

    return result

def get_employee_by_id(employee_id):
    db = SessionLocal()

    employee = db.query(Employee).filter(
        Employee.id == employee_id
    ).first()

    result = employee.to_dict() if employee else None

    db.close()
    return result


#  FIXED ADD EMPLOYEE
def add_employee(data):
    print("Received Data:", data)

    db = SessionLocal()

    employee = Employee(
        name=data.get("name"),
        email=data.get("email"),
        role=data.get("role"),
        department=data.get("department"),
        salary=data.get("salary"),
        city=data.get("city"),
        status=data.get("status"),
        join_date=data.get("join_date"),

        company_id=data.get("company_id", 1)

    )

    db.add(employee)
    db.commit()
    db.refresh(employee)

    result = employee.to_dict()

    create_audit_log(
      user_name="Admin",
     action="Employee Created",
     company_id=employee.company_id,
     related_employee=employee.name
    )

    db.close()
    return result


#  FIXED UPDATE EMPLOYEE
def update_employee(employee_id, data):
    db = SessionLocal()

    employee = db.query(Employee).filter(
        Employee.id == employee_id
    ).first()

    if not employee:
        db.close()
        return None

    employee.name = data.get("name", employee.name)
    employee.email = data.get("email", employee.email)
    employee.role = data.get("role", employee.role)
    employee.department = data.get("department", employee.department)
    employee.salary = data.get("salary", employee.salary)
    employee.city = data.get("city", employee.city)


    #  ADD THESE
    employee.status = data.get("status", employee.status)
    employee.join_date = data.get("join_date", employee.join_date)
    employee.company_id = data.get("company_id", employee.company_id)

    db.commit()

    create_audit_log(
    user_name="Admin",
    action="Employee Updated",
    related_employee=employee.name,
    company_id=employee.company_id
)

    db.refresh(employee)

    result = employee.to_dict()
    
    db.close()
    return result


def delete_employee(employee_id):
    db = SessionLocal()

    employee = db.query(Employee).filter(
        Employee.id == employee_id
    ).first()

    if not employee:
        db.close()
        return False

    create_audit_log(
        user_name="Admin",
        action="Employee Deleted",
        related_employee=employee.name,
        company_id=employee.company_id
    )

    db.delete(employee)
    db.commit()
    db.close()

    return True