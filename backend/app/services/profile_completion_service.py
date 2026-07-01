from datetime import datetime

from fastapi import HTTPException

from app.database import SessionLocal
from app.models.employee_model import Employee
from app.models.notification_model import Notification
from app.models.profile_completion_settings_model import ProfileCompletionSettings
from app.services.audit_service import create_audit_log
from app.services.employee_service import assert_actor_can_access, assert_admin

DEFAULT_THRESHOLD = 60

# Each entry: (field attribute on Employee model, human-readable label).
# All fields contribute equally toward the completion score, per spec.
REQUIRED_FIELDS = [
    ("first_name", "First Name"),
    ("last_name", "Last Name"),
    ("email", "Email"),
    ("phone_number", "Phone Number"),
    ("department", "Department"),
    ("designation", "Designation"),
    ("profile_picture", "Profile Picture"),
    ("address", "Address"),
    ("join_date", "Date of Joining"),
    ("employee_code", "Employee ID"),
]

TOTAL_FIELDS = len(REQUIRED_FIELDS)


def _is_filled(value):
    if value is None:
        return False
    if isinstance(value, str) and not value.strip():
        return False
    return True


def calculate_completion(employee):
    """Returns (percentage:int, missing_fields:list[str]) for an Employee row."""
    missing = []
    filled_count = 0

    for attr, label in REQUIRED_FIELDS:
        value = getattr(employee, attr, None)
        if _is_filled(value):
            filled_count += 1
        else:
            missing.append(label)

    percentage = round((filled_count / TOTAL_FIELDS) * 100)
    return percentage, missing


def get_recommendation(percentage):
    if percentage == 100:
        return "Your profile is fully complete. Great job keeping your information up to date."
    if percentage >= 80:
        return "Almost there! Complete your profile to improve account readiness."
    if percentage >= 50:
        return "Complete your profile to improve account readiness."
    return "Your profile is missing several key details. Complete it to unlock full account readiness."


def get_threshold(db, company_id):
    setting = db.query(ProfileCompletionSettings).filter(
        ProfileCompletionSettings.company_id == company_id
    ).first()
    return setting.threshold if setting else DEFAULT_THRESHOLD


def set_threshold(company_id, threshold, admin_name="Admin", actor_email=None):
    db = SessionLocal()
    actor = assert_actor_can_access(db, company_id, actor_email)
    assert_admin(actor)

    if threshold is None or not (0 <= int(threshold) <= 100):
        db.close()
        raise HTTPException(status_code=400, detail="Threshold must be between 0 and 100")

    setting = db.query(ProfileCompletionSettings).filter(
        ProfileCompletionSettings.company_id == company_id
    ).first()

    if setting:
        setting.threshold = int(threshold)
    else:
        setting = ProfileCompletionSettings(company_id=company_id, threshold=int(threshold))
        db.add(setting)

    db.commit()
    db.refresh(setting)
    result = setting.to_dict()
    db.close()
    return result


def _notify(db, employee, message, notif_type, now):
    notification = Notification(
        company_id=employee.company_id,
        recipient_role=f"employee:{employee.email}",
        message=message,
        type=notif_type,
        related_id=employee.id,
        is_read=False,
        created_at=now,
    )
    db.add(notification)

    admin_notification = Notification(
        company_id=employee.company_id,
        recipient_role="admin",
        message=f"{employee.name}: {message}",
        type=notif_type,
        related_id=employee.id,
        is_read=False,
        created_at=now,
    )
    db.add(admin_notification)


def recalculate_and_persist(db, employee, actor_name="System"):
    """
    Recomputes the completion score for an employee row already attached to `db`,
    persists the score, fires notifications on threshold breach / 100% completion,
    and writes audit log entries. Commits as a self-contained unit.
    """
    previous_score = employee.profile_completion_score or 0
    new_score, missing_fields = calculate_completion(employee)
    now = datetime.now().isoformat()
    threshold = get_threshold(db, employee.company_id)

    score_changed = previous_score != new_score
    employee.profile_completion_score = new_score

    just_completed = new_score == 100 and employee.profile_completed_at is None
    if just_completed:
        employee.profile_completed_at = now
    elif new_score < 100:
        employee.profile_completed_at = None

    if score_changed:
        create_audit_log(
            user_name=actor_name,
            action=f"Profile Completion Score Changed: {previous_score}% to {new_score}%",
            related_employee=employee.name,
            company_id=employee.company_id,
        )

    if new_score < threshold and (previous_score >= threshold or previous_score == 0):
        _notify(
            db,
            employee,
            f"Profile completion is at {new_score}%, below the {threshold}% threshold.",
            "profile_completion_low",
            now,
        )

    if just_completed:
        _notify(
            db,
            employee,
            "Profile reached 100% completion.",
            "profile_completion_complete",
            now,
        )
        create_audit_log(
            user_name=actor_name,
            action="Profile Reached 100% Completion",
            related_employee=employee.name,
            company_id=employee.company_id,
        )

    db.commit()
    db.refresh(employee)

    return new_score, missing_fields


def get_my_profile_completion(employee_id, company_id):
    db = SessionLocal()
    employee = db.query(Employee).filter(
        Employee.id == employee_id,
        Employee.company_id == company_id,
    ).first()

    if not employee:
        db.close()
        return None

    percentage, missing = calculate_completion(employee)
    result = {
        "employee_id": employee.id,
        "completion_percentage": percentage,
        "missing_fields": missing,
        "recommendation": get_recommendation(percentage),
        "profile_completed_at": employee.profile_completed_at,
    }
    db.close()
    return result


def update_my_profile(employee_id, data):
    """
    Self-service profile update. Any authenticated employee may update their own
    profile fields; admin-only fields (role, status, department, salary) are not
    editable through this endpoint to preserve existing role-based access controls.
    """
    db = SessionLocal()
    company_id = data.get("company_id", 1)
    actor_email = data.get("actor_email")
    actor = assert_actor_can_access(db, company_id, actor_email)

    if actor.id != employee_id:
        db.close()
        raise HTTPException(status_code=403, detail="You can only update your own profile")

    employee = db.query(Employee).filter(
        Employee.id == employee_id,
        Employee.company_id == company_id,
    ).first()

    if not employee:
        db.close()
        return None

    editable_fields = [
        "first_name", "last_name", "phone_number", "designation",
        "profile_picture", "address", "employee_code",
    ]
    for field in editable_fields:
        if field in data:
            setattr(employee, field, data.get(field))

    # Keep legacy combined `name` field in sync if first/last provided.
    if "first_name" in data or "last_name" in data:
        combined = " ".join(
            part for part in [employee.first_name, employee.last_name] if part
        ).strip()
        if combined:
            employee.name = combined

    db.commit()
    db.refresh(employee)

    create_audit_log(
        user_name=employee.name,
        action="Profile Updated",
        related_employee=employee.name,
        company_id=employee.company_id,
    )

    new_score, missing_fields = recalculate_and_persist(db, employee, actor_name=employee.name)

    result = employee.to_dict()
    result["missing_fields"] = missing_fields
    result["recommendation"] = get_recommendation(new_score)

    db.close()
    return result


def get_company_profile_completion_overview(company_id, actor_email=None, below_threshold_only=False, custom_threshold=None):
    db = SessionLocal()
    if actor_email:
        actor = assert_actor_can_access(db, company_id, actor_email)
        assert_admin(actor)

    employees = db.query(Employee).filter(
        Employee.company_id == company_id
    ).all()

    threshold = custom_threshold if custom_threshold is not None else get_threshold(db, company_id)

    rows = []
    total_score = 0
    below_count = 0
    complete_count = 0

    for employee in employees:
        percentage, missing = calculate_completion(employee)
        total_score += percentage
        is_below = percentage < threshold
        if is_below:
            below_count += 1
        if percentage == 100:
            complete_count += 1

        row = {
            "id": employee.id,
            "name": employee.name,
            "email": employee.email,
            "department": employee.department,
            "designation": employee.designation,
            "completion_percentage": percentage,
            "missing_fields": missing,
            "below_threshold": is_below,
        }

        if not below_threshold_only or is_below:
            rows.append(row)

    average = round(total_score / len(employees)) if employees else 0

    db.close()

    return {
        "threshold": threshold,
        "average_completion": average,
        "total_employees": len(employees),
        "below_threshold_count": below_count,
        "fully_completed_count": complete_count,
        "employees": rows,
    }


def recalculate_employee_completion(employee_id, company_id, actor_name="System"):
    """Public helper other services (e.g. employee CRUD) can call after writes."""
    db = SessionLocal()
    employee = db.query(Employee).filter(
        Employee.id == employee_id,
        Employee.company_id == company_id,
    ).first()

    if not employee:
        db.close()
        return None

    new_score, missing_fields = recalculate_and_persist(db, employee, actor_name=actor_name)
    db.close()
    return new_score, missing_fields
