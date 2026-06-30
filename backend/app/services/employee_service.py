import requests
from datetime import datetime
from fastapi import HTTPException
from app.database import SessionLocal
from app.models.employee_model import Employee
from app.models.department_transfer_model import DepartmentTransferHistory
from app.models.notification_model import Notification
from app.services.audit_service import create_audit_log

ACTIVE = "active"
SUSPENDED = "suspended"
DEACTIVATED = "deactivated"
LEGACY_INACTIVE = "inactive"
VALID_STATUSES = {ACTIVE, SUSPENDED, DEACTIVATED, LEGACY_INACTIVE}


def normalize_status(status):
    value = (status or ACTIVE).lower()
    return DEACTIVATED if value == LEGACY_INACTIVE else value


def assert_valid_status(status):
    value = normalize_status(status)
    if value not in {ACTIVE, SUSPENDED, DEACTIVATED}:
        raise HTTPException(status_code=400, detail="Status must be active, suspended, or deactivated")
    return value


def get_actor(db, company_id, actor_email):
    if not actor_email:
        raise HTTPException(status_code=403, detail="Actor identity is required")

    actor = db.query(Employee).filter(
        Employee.company_id == company_id,
        Employee.email == actor_email,
    ).first()

    if not actor:
        raise HTTPException(status_code=403, detail="Actor not found in this company")

    return actor


def assert_actor_can_access(db, company_id, actor_email):
    actor = get_actor(db, company_id, actor_email)
    status = normalize_status(actor.status)

    if status == SUSPENDED:
        raise HTTPException(status_code=403, detail="Account suspended. Module access is blocked.")

    if status == DEACTIVATED:
        raise HTTPException(status_code=403, detail="Account deactivated. Access is blocked.")

    return actor


def assert_admin(actor):
    if (actor.role or "").lower() != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")


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
            status=ACTIVE,
            company_id=1
        )

        db.add(employee)
        imported_count += 1

    db.commit()
    db.close()

    return {
        "message": f"{imported_count} users imported successfully"
    }


def get_all_employees(company_id, actor_email=None):
    db = SessionLocal()
    if actor_email:
        assert_actor_can_access(db, company_id, actor_email)

    employees = db.query(Employee).filter(
        Employee.company_id == company_id
    ).all()

    result = [employee.to_dict() for employee in employees]
    db.close()
    return result


def get_employee_by_id(employee_id, company_id=1):
    db = SessionLocal()

    query = db.query(Employee).filter(Employee.id == employee_id)
    if company_id is not None:
        query = query.filter(Employee.company_id == company_id)

    employee = query.first()
    result = employee.to_dict() if employee else None

    db.close()
    return result


def get_employee_by_email(email, company_id=1):
    db = SessionLocal()
    employee = db.query(Employee).filter(
        Employee.company_id == company_id,
        Employee.email == email,
    ).first()
    result = employee.to_dict() if employee else None
    db.close()
    return result


def sync_login_employee(data):
    db = SessionLocal()
    company_id = int(data.get("company_id", 1))
    email = (data.get("email") or "").strip()

    if not email:
        db.close()
        raise HTTPException(status_code=400, detail="Email is required")

    employee = db.query(Employee).filter(
        Employee.company_id == company_id,
        Employee.email == email,
    ).first()

    if employee:
        employee.name = data.get("name") or employee.name
        employee.role = data.get("role") or employee.role
        employee.department = data.get("department") or employee.department or "General"
        employee.city = data.get("city", employee.city)
        if data.get("salary") is not None:
            employee.salary = data.get("salary")
        if data.get("join_date") and not employee.join_date:
            employee.join_date = data.get("join_date")
        db.commit()
        db.refresh(employee)
        result = employee.to_dict()
        db.close()
        return result

    employee = Employee(
        name=data.get("name") or email.split("@")[0],
        email=email,
        role=data.get("role") or "user",
        department=data.get("department") or "General",
        salary=data.get("salary") or 0,
        city=data.get("city") or "",
        status=ACTIVE,
        join_date=data.get("join_date") or datetime.now().strftime("%Y-%m-%d"),
        company_id=company_id,
    )

    db.add(employee)
    db.commit()
    db.refresh(employee)

    create_audit_log(
        user_name=employee.name,
        action="User Activated",
        related_employee=employee.name,
        company_id=employee.company_id,
    )

    result = employee.to_dict()
    db.close()
    return result


def add_employee(data):
    db = SessionLocal()
    company_id = data.get("company_id", 1)
    admin_name = data.get("admin_name", "Admin")
    actor = assert_actor_can_access(db, company_id, data.get("actor_email"))
    assert_admin(actor)
    status = assert_valid_status(data.get("status", ACTIVE))

    employee = Employee(
        name=data.get("name"),
        email=data.get("email"),
        role=data.get("role"),
        department=data.get("department"),
        salary=data.get("salary"),
        city=data.get("city"),
        status=status,
        join_date=data.get("join_date"),
        company_id=company_id
    )

    db.add(employee)
    db.commit()
    db.refresh(employee)

    result = employee.to_dict()

    create_audit_log(
        user_name=admin_name,
        action="Employee Created",
        company_id=employee.company_id,
        related_employee=employee.name
    )

    db.close()
    return result


def update_employee(employee_id, data):
    db = SessionLocal()
    company_id = data.get("company_id", 1)
    actor = assert_actor_can_access(db, company_id, data.get("actor_email"))
    assert_admin(actor)

    query = db.query(Employee).filter(Employee.id == employee_id)
    if company_id is not None:
        query = query.filter(Employee.company_id == company_id)

    employee = query.first()
    if not employee:
        db.close()
        return None

    next_status = assert_valid_status(data.get("status", employee.status))

    employee.name = data.get("name", employee.name)
    employee.email = data.get("email", employee.email)
    employee.role = data.get("role", employee.role)
    employee.department = data.get("department", employee.department)
    employee.salary = data.get("salary", employee.salary)
    employee.city = data.get("city", employee.city)
    employee.status = next_status
    employee.join_date = data.get("join_date", employee.join_date)

    if next_status == ACTIVE:
        employee.suspension_date = None
        employee.suspension_reason = None
        employee.suspended_by = None
        employee.suspended_by_email = None

    db.commit()
    db.refresh(employee)

    create_audit_log(
        user_name=data.get("admin_name", "Admin"),
        action="Employee Updated",
        related_employee=employee.name,
        company_id=employee.company_id
    )

    result = employee.to_dict()
    db.close()
    return result


def delete_employee(employee_id, company_id=1, admin_name="Admin", actor_email=None):
    db = SessionLocal()
    actor = assert_actor_can_access(db, company_id, actor_email)
    assert_admin(actor)

    query = db.query(Employee).filter(Employee.id == employee_id)
    if company_id is not None:
        query = query.filter(Employee.company_id == company_id)

    employee = query.first()
    if not employee:
        db.close()
        return False

    create_audit_log(
        user_name=admin_name,
        action="Employee Deleted",
        related_employee=employee.name,
        company_id=employee.company_id
    )

    db.delete(employee)
    db.commit()
    db.close()
    return True


def suspend_employee(employee_id, data):
    db = SessionLocal()
    company_id = data.get("company_id", 1)
    actor = assert_actor_can_access(db, company_id, data.get("actor_email"))
    assert_admin(actor)

    employee = db.query(Employee).filter(
        Employee.id == employee_id,
        Employee.company_id == company_id,
    ).first()

    if not employee:
        db.close()
        return None

    if normalize_status(employee.status) == DEACTIVATED:
        db.close()
        raise HTTPException(status_code=400, detail="Deactivated accounts cannot be suspended")

    now = datetime.now().isoformat()
    admin_name = data.get("admin_name", actor.name)
    reason = data.get("reason", "Policy or access review")

    employee.status = SUSPENDED
    employee.suspension_date = now
    employee.suspension_reason = reason
    employee.suspended_by = admin_name
    employee.suspended_by_email = actor.email

    notification = Notification(
        company_id=company_id,
        recipient_role=f"employee:{employee.email}",
        message=f"Your account was suspended by {admin_name}.",
        type="account_suspended",
        related_id=employee.id,
        is_read=False,
        created_at=now,
    )
    db.add(notification)
    db.commit()
    db.refresh(employee)

    create_audit_log(
        user_name=admin_name,
        action="Admin Suspended" if (employee.role or "").lower() == "admin" else "User Suspended",
        related_employee=employee.name,
        company_id=employee.company_id,
    )

    result = employee.to_dict()
    db.close()
    return result


def reinstate_employee(employee_id, company_id, admin_name="Admin", actor_email=None):
    db = SessionLocal()
    actor = assert_actor_can_access(db, company_id, actor_email)
    assert_admin(actor)

    employee = db.query(Employee).filter(
        Employee.id == employee_id,
        Employee.company_id == company_id,
    ).first()

    if not employee:
        db.close()
        return None

    employee.status = ACTIVE
    employee.suspension_date = None
    employee.suspension_reason = None
    employee.suspended_by = None
    employee.suspended_by_email = None
    db.commit()
    db.refresh(employee)

    create_audit_log(
        user_name=admin_name,
        action="User Reinstated",
        related_employee=employee.name,
        company_id=employee.company_id,
    )

    result = employee.to_dict()
    db.close()
    return result


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
    company_id = data.get("company_id", 1)
    actor = assert_actor_can_access(db, company_id, data.get("actor_email"))
    assert_admin(actor)

    query = db.query(Employee).filter(Employee.id == employee_id)
    if company_id is not None:
        query = query.filter(Employee.company_id == company_id)

    employee = query.first()
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

