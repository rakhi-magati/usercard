import json
from datetime import datetime
from app.database import SessionLocal
from app.models.employee_model import Employee
from app.models.user_activity_model import UserActivity
from app.services.audit_service import create_audit_log


def _json(value):
    return json.dumps(value or [])


def _load(value):
    try:
        return json.loads(value or "[]")
    except Exception:
        return []


def _activity_query(db, company_id, email):
    return db.query(UserActivity).filter(
        UserActivity.company_id == company_id,
        UserActivity.email == email,
    )


def list_user_activities(company_id=1, search=None):
    db = SessionLocal()
    query = db.query(UserActivity).filter(UserActivity.company_id == company_id)
    activities = query.order_by(UserActivity.last_login.desc()).all()
    result = [activity.to_dict() for activity in activities]

    if search:
        needle = search.lower()
        result = [
            item for item in result
            if needle in (item.get("user_name") or "").lower()
            or needle in (item.get("email") or "").lower()
            or needle in (item.get("last_browser") or "").lower()
            or needle in (item.get("last_ip_address") or "").lower()
        ]

    db.close()
    return result


def activity_summary(company_id=1):
    activities = list_user_activities(company_id)
    return {
        "total_logins": sum(item.get("total_logins", 0) for item in activities),
        "total_logouts": sum(item.get("total_logouts", 0) for item in activities),
        "new_devices": sum(1 for item in activities if item.get("new_device_detected")),
        "new_ip_addresses": sum(1 for item in activities if item.get("new_ip_detected")),
    }


def record_login(data):
    db = SessionLocal()
    company_id = int(data.get("company_id") or 1)
    email = data.get("email")
    if not email:
        db.close()
        return None

    timestamp = data.get("timestamp") or datetime.now().isoformat()
    browser = data.get("browser") or "Unknown browser"
    ip_address = data.get("ip_address") or "Unavailable"
    user_name = data.get("user_name") or data.get("name") or email
    role = data.get("role") or "user"
    status = data.get("status") or "active"

    activity = _activity_query(db, company_id, email).first()
    if not activity:
        activity = UserActivity(
            company_id=company_id,
            email=email,
            user_name=user_name,
            role=role,
            status=status,
            known_browsers="[]",
            known_ips="[]",
            history="[]",
        )
        db.add(activity)

    known_browsers = _load(activity.known_browsers)
    known_ips = _load(activity.known_ips)
    had_prior_login = bool(activity.last_login)
    is_new_device = had_prior_login and browser not in known_browsers
    is_new_ip = had_prior_login and ip_address != "Unavailable" and ip_address not in known_ips

    if browser and browser not in known_browsers:
        known_browsers.append(browser)
    if ip_address and ip_address not in known_ips:
        known_ips.append(ip_address)

    history = [{
        "id": f"login-{datetime.now().timestamp()}",
        "type": "login",
        "timestamp": timestamp,
        "browser": browser,
        "ip_address": ip_address,
        "new_device_detected": is_new_device,
        "new_ip_detected": is_new_ip,
    }] + _load(activity.history)

    activity.user_name = user_name
    activity.role = role
    activity.status = status
    activity.last_login = timestamp
    activity.last_browser = browser
    activity.last_ip_address = ip_address
    activity.known_browsers = _json(known_browsers)
    activity.known_ips = _json(known_ips)
    activity.new_device_detected = is_new_device
    activity.new_ip_detected = is_new_ip
    activity.total_logins = (activity.total_logins or 0) + 1
    activity.history = _json(history[:50])

    employee = db.query(Employee).filter(Employee.company_id == company_id, Employee.email == email).first()
    if employee:
        activity.status = employee.status or activity.status
        activity.role = employee.role or activity.role

    db.commit()
    db.refresh(activity)
    result = activity.to_dict()
    db.close()

    create_audit_log(user_name, "User Login", email, company_id)
    if is_new_device:
        create_audit_log(user_name, "New Device Detected", email, company_id)
    if is_new_ip:
        create_audit_log(user_name, "New IP Address Detected", email, company_id)

    return result


def record_logout(data):
    db = SessionLocal()
    company_id = int(data.get("company_id") or 1)
    email = data.get("email")
    if not email:
        db.close()
        return None

    timestamp = data.get("timestamp") or datetime.now().isoformat()
    browser = data.get("browser") or "Unknown browser"
    user_name = data.get("user_name") or data.get("name") or email

    activity = _activity_query(db, company_id, email).first()
    if not activity:
        activity = UserActivity(company_id=company_id, email=email, user_name=user_name, known_browsers="[]", known_ips="[]", history="[]")
        db.add(activity)

    history = [{
        "id": f"logout-{datetime.now().timestamp()}",
        "type": "logout",
        "timestamp": timestamp,
        "browser": browser,
        "ip_address": activity.last_ip_address or "Unavailable",
    }] + _load(activity.history)

    activity.user_name = activity.user_name or user_name
    activity.last_logout = timestamp
    activity.total_logouts = (activity.total_logouts or 0) + 1
    activity.history = _json(history[:50])

    db.commit()
    db.refresh(activity)
    result = activity.to_dict()
    db.close()

    create_audit_log(user_name, "User Logout", email, company_id)
    return result
