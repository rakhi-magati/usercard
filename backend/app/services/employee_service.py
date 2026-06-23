import requests
from datetime import datetime
from app.database import SessionLocal
from app.models.employee_model import Employee
from app.models.department_transfer_model import DepartmentTransferHistory
from app.models.notification_model import Notification
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

def get_department_transfer_history(company_id=None, employee_id=None):
    db = SessionLocal()

    query = db.query(DepartmentTransferHistory)
    if company_id is not None:
        query = query.filter(DepartmentTransferHistory.company_id == company_id)
    if employee_id is not None:
        query = query.filter(DepartmentTransferHistory.employee_id == employee_id)

    transfers = query.order_by(DepartmentTransferHistory.id.desc()).all()
    result = [transfer.to_dict() for transfer in transfers]

    db.close()
    return result


def transfer_employee_department(employee_id, data):
    db = SessionLocal()

    employee = db.query(Employee).filter(
        Employee.id == employee_id
    ).first()

    if not employee:
        db.close()
        return None

    old_department = employee.department or "Unassigned"
    new_department = (data.get("department") or "").strip()
    admin_name = data.get("admin_name", "Admin")
    reason = data.get("reason", "Department transfer")

    if not new_department or old_department == new_department:
        db.close()
        return None

    transferred_at = datetime.now().isoformat()
    employee.department = new_department

    transfer = DepartmentTransferHistory(
        employee_id=employee.id,
        employee_name=employee.name,
        employee_email=employee.email,
        company_id=employee.company_id,
        from_department=old_department,
        to_department=new_department,
        reason=reason,
        transferred_by=admin_name,
        transferred_at=transferred_at,
        permissions_updated="true",
    )
    db.add(transfer)

    notification = Notification(
        company_id=employee.company_id,
        recipient_role=f"employee:{employee.email}",
        message=f"Your department changed from {old_department} to {new_department}.",
        type="department_transfer",
        related_id=employee.id,
        is_read=False,
        created_at=transferred_at,
    )
    db.add(notification)

    db.commit()
    db.refresh(employee)
    db.refresh(transfer)

    create_audit_log(
        user_name=admin_name,
        action=f"Department Transfer: {old_department} to {new_department}",
        related_employee=employee.name,
        company_id=employee.company_id
    )

    create_audit_log(
        user_name=admin_name,
        action=f"Department Access Updated: {new_department}",
        related_employee=employee.name,
        company_id=employee.company_id
    )

    result = employee.to_dict()
    result["transfer"] = transfer.to_dict()
    result["permission_update"] = {
        "employee_id": employee.id,
        "department_based_access": True,
        "allowed_departments": [new_department],
        "updated_at": transferred_at,
    }

    db.close()
    return result



