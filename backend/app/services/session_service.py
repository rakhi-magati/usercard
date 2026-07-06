import uuid
from datetime import datetime, timedelta

from fastapi import HTTPException
from datetime import datetime
from app.database import SessionLocal
from app.models.login_session_model import LoginSession
from app.models.notification_model import Notification
from app.services.audit_service import create_audit_log
from app.services.employee_service import assert_actor_can_access, assert_admin

INACTIVITY_TIMEOUT_MINUTES = 30

ACTIVE = "Active"
LOGGED_OUT = "Logged Out"
REVOKED = "Revoked"
EXPIRED = "Expired"

REASON_USER_LOGOUT = "User Logout"
REASON_FORCE_LOGOUT = "Force Logout"
REASON_SESSION_EXPIRED = "Session Expired"
REASON_REVOKED = "Revoked"

REVOKE_PENDING = "Pending"
REVOKE_APPROVED = "Approved"
REVOKE_REJECTED = "Rejected"


def _now():
    return datetime.now().isoformat()


def _parse(value, fallback=None):
    try:
        return datetime.fromisoformat(value)
    except Exception:
        return fallback


def _log(session, action, company_id, performed_by=None, performed_by_email=None):
    create_audit_log(
        user_name=session.user_name,
        action=action,
        related_employee=session.user_email,
        company_id=company_id,
        device_name=session.device_name,
        browser=session.browser,
        ip_address=session.ip_address,
        session_id=session.session_token,
        performed_by=performed_by or session.user_name,
        performed_by_email=performed_by_email or session.user_email,
    )


def _auto_expire(db, company_id):
    """Lazily expire sessions that have been inactive beyond the timeout policy."""
    cutoff = datetime.now() - timedelta(minutes=INACTIVITY_TIMEOUT_MINUTES)

    query = db.query(LoginSession).filter(
        LoginSession.company_id == company_id,
        LoginSession.status == ACTIVE,
    )

    expired_any = False

    for session in query.all():
        last_seen = _parse(session.last_activity_time) or _parse(session.login_time)

        if not last_seen:
            continue

        # Handle timezone-aware vs timezone-naive datetimes
        if isinstance(last_seen, datetime):
            if last_seen.tzinfo is not None:
                last_seen = last_seen.replace(tzinfo=None)

            compare_cutoff = cutoff
            if compare_cutoff.tzinfo is not None:
                compare_cutoff = compare_cutoff.replace(tzinfo=None)

            if last_seen < compare_cutoff:
                session.status = EXPIRED
                session.termination_reason = REASON_SESSION_EXPIRED
                session.logout_time = _now()
                session.terminated_by = "System"
                session.terminated_by_email = None

                expired_any = True

                _log(
                    session,
                    "Session Expired",
                    company_id,
                    performed_by="System",
                    performed_by_email=None,
                )

    if expired_any:
        db.commit()

def _get_owned_session(db, session_id, company_id, actor_email):
    session = db.query(LoginSession).filter(
        LoginSession.id == session_id,
        LoginSession.company_id == company_id,
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="Device session not found")

    if session.user_email != actor_email:
        raise HTTPException(status_code=403, detail="You can only manage your own devices")

    return session


def create_session(data):
    company_id = int(data.get("company_id") or 1)
    email = (data.get("email") or "").strip()
    if not email:
        raise HTTPException(status_code=400, detail="email is required")

    user_name = data.get("user_name") or data.get("name") or email
    role = data.get("role") or "user"
    browser = data.get("browser") or "Unknown Browser"
    os_name = data.get("os") or "Unknown OS"
    ip_address = data.get("ip_address") or "Unavailable"
    device_name = data.get("device_name") or f"{browser} on {os_name}"
    timestamp = data.get("timestamp") or _now()

    db = SessionLocal()
    session = LoginSession(
        company_id=company_id,
        user_email=email,
        user_name=user_name,
        role=role,
        session_token=uuid.uuid4().hex,
        device_name=device_name,
        browser=browser,
        os=os_name,
        ip_address=ip_address,
        login_time=timestamp,
        last_activity_time=timestamp,
        status=ACTIVE,
        is_trusted=False,
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    _log(session, "User Login", company_id)

    result = session.to_dict()
    db.close()
    return result


def touch_session(session_token):
    if not session_token:
        return None

    db = SessionLocal()
    session = db.query(LoginSession).filter(LoginSession.session_token == session_token).first()
    if not session:
        db.close()
        return None

    if session.status == ACTIVE:
        session.last_activity_time = _now()
        db.commit()
        db.refresh(session)

    result = session.to_dict()
    db.close()
    return result


def list_my_sessions(company_id, email, current_token=None):
    db = SessionLocal()
    _auto_expire(db, company_id)

    sessions = db.query(LoginSession).filter(
        LoginSession.company_id == company_id,
        LoginSession.user_email == email,
    ).order_by(LoginSession.login_time.desc()).all()

    result = []
    for session in sessions:
        item = session.to_dict()
        item["is_current"] = bool(current_token) and session.session_token == current_token
        result.append(item)

    db.close()
    return result


def list_company_sessions(company_id, actor_email=None, search=None, browser=None, status=None, date=None):
    db = SessionLocal()

    if actor_email:
        actor = assert_actor_can_access(db, company_id, actor_email)
        assert_admin(actor)

    _auto_expire(db, company_id)

    query = db.query(LoginSession).filter(LoginSession.company_id == company_id)

    if browser:
        query = query.filter(LoginSession.browser.ilike(f"%{browser}%"))

    if status:
        query = query.filter(LoginSession.status == status)

    if date:
        query = query.filter(LoginSession.login_time.like(f"{date}%"))

    sessions = query.order_by(LoginSession.login_time.desc()).all()
    result = [session.to_dict() for session in sessions]

    if search:
        needle = search.lower()
        result = [
            item for item in result
            if needle in (item.get("user_name") or "").lower()
            or needle in (item.get("user_email") or "").lower()
            or needle in (item.get("device_name") or "").lower()
            or needle in (item.get("browser") or "").lower()
            or needle in (item.get("ip_address") or "").lower()
        ]

    db.close()
    return result


def rename_device(session_id, company_id, actor_email, actor_name, new_name):
    if not new_name or not new_name.strip():
        raise HTTPException(status_code=400, detail="Device name is required")

    db = SessionLocal()
    session = _get_owned_session(db, session_id, company_id, actor_email)

    session.device_name = new_name.strip()
    db.commit()
    db.refresh(session)

    _log(session, "Trusted Device Renamed", company_id, performed_by=actor_name, performed_by_email=actor_email)

    result = session.to_dict()
    db.close()
    return result


def set_trusted(session_id, company_id, actor_email, actor_name, trusted):
    db = SessionLocal()
    session = _get_owned_session(db, session_id, company_id, actor_email)

    if trusted:
        duplicate = db.query(LoginSession).filter(
            LoginSession.company_id == company_id,
            LoginSession.user_email == actor_email,
            LoginSession.is_trusted == True,  # noqa: E712
            LoginSession.device_name == session.device_name,
            LoginSession.browser == session.browser,
            LoginSession.id != session.id,
        ).first()
        if duplicate:
            db.close()
            raise HTTPException(status_code=400, detail="This device is already saved as a trusted device")

    session.is_trusted = trusted
    db.commit()
    db.refresh(session)

    _log(
        session,
        "Trusted Device Added" if trusted else "Trusted Device Removed",
        company_id,
        performed_by=actor_name,
        performed_by_email=actor_email,
    )

    result = session.to_dict()
    db.close()
    return result


def remove_device(session_id, company_id, actor_email, actor_name):
    db = SessionLocal()
    session = _get_owned_session(db, session_id, company_id, actor_email)

    if session.status == ACTIVE:
        db.close()
        raise HTTPException(status_code=400, detail="Log out from this device before removing it")

    _log(session, "Trusted Device Removed", company_id, performed_by=actor_name, performed_by_email=actor_email)

    db.delete(session)
    db.commit()
    db.close()
    return {"id": session_id, "removed": True}


def logout_session(session_id, company_id, actor_email, actor_name):
    db = SessionLocal()
    session = _get_owned_session(db, session_id, company_id, actor_email)

    if session.status != ACTIVE:
        db.close()
        raise HTTPException(status_code=400, detail="This session is already inactive")

    session.status = LOGGED_OUT
    session.termination_reason = REASON_USER_LOGOUT
    session.terminated_by = actor_name
    session.terminated_by_email = actor_email
    session.logout_time = _now()
    db.commit()
    db.refresh(session)

    _log(session, "User Logout", company_id, performed_by=actor_name, performed_by_email=actor_email)

    result = session.to_dict()
    db.close()
    return result


def logout_all_others(company_id, actor_email, actor_name, current_token):
    db = SessionLocal()

    sessions = db.query(LoginSession).filter(
        LoginSession.company_id == company_id,
        LoginSession.user_email == actor_email,
        LoginSession.status == ACTIVE,
        LoginSession.session_token != current_token,
    ).all()

    for session in sessions:
        session.status = LOGGED_OUT
        session.termination_reason = REASON_USER_LOGOUT
        session.terminated_by = actor_name
        session.terminated_by_email = actor_email
        session.logout_time = _now()
        _log(session, "User Logout", company_id, performed_by=actor_name, performed_by_email=actor_email)

    db.commit()
    count = len(sessions)
    db.close()
    return {"logged_out": count}


def force_logout(session_id, company_id, admin_email, admin_name=None):
    db = SessionLocal()
    actor = assert_actor_can_access(db, company_id, admin_email)
    assert_admin(actor)

    session = db.query(LoginSession).filter(
        LoginSession.id == session_id,
        LoginSession.company_id == company_id,
    ).first()

    if not session:
        db.close()
        raise HTTPException(status_code=404, detail="Device session not found")

    if session.status != ACTIVE:
        db.close()
        raise HTTPException(status_code=400, detail="Session is not active")

    performed_by = admin_name or actor.name

    session.status = LOGGED_OUT
    session.termination_reason = REASON_FORCE_LOGOUT
    session.terminated_by = performed_by
    session.terminated_by_email = admin_email
    session.logout_time = _now()
    db.commit()
    db.refresh(session)

    _log(session, "Force Logout Initiated", company_id, performed_by=performed_by, performed_by_email=admin_email)

    result = session.to_dict()
    db.close()
    return result


def request_revoke_sessions(session_ids, company_id, admin_email, admin_name=None):
    """Admin-initiated revoke now requires another admin's approval to finalize.

    The targeted user loses attendance access immediately (see
    is_attendance_access_blocked), but the session itself stays Active until
    the request is approved or rejected.
    """
    db = SessionLocal()
    actor = assert_actor_can_access(db, company_id, admin_email)
    assert_admin(actor)

    performed_by = admin_name or actor.name
    requested_at = _now()

    requested = []
    skipped = []

    for session_id in session_ids:
        session = db.query(LoginSession).filter(
            LoginSession.id == session_id,
            LoginSession.company_id == company_id,
        ).first()

        if not session:
            skipped.append({"id": session_id, "reason": "Not found"})
            continue

        if session.status in (REVOKED, EXPIRED):
            skipped.append({"id": session_id, "reason": f"Already {session.status.lower()}"})
            continue

        if session.revoke_status == REVOKE_PENDING:
            skipped.append({"id": session_id, "reason": "Revoke already pending approval"})
            continue

        session.revoke_status = REVOKE_PENDING
        session.revoke_requested_by = performed_by
        session.revoke_requested_by_email = admin_email
        session.revoke_requested_at = requested_at

        _log(session, "Session Revoke Requested", company_id, performed_by=performed_by, performed_by_email=admin_email)

        notif = Notification(
            company_id=company_id,
            recipient_role="admin",
            message=f"{performed_by} requested to revoke {session.user_name}'s session on {session.device_name}.",
            type="session_revoke_request",
            related_id=session.id,
            is_read=False,
            created_at=requested_at,
        )
        db.add(notif)

        requested.append(session.id)

    db.commit()
    db.close()
    return {"requested": requested, "skipped": skipped}


def review_revoke_request(session_id, action, company_id, admin_email, admin_name=None):
    """action is 'approved' or 'rejected'."""
    db = SessionLocal()
    actor = assert_actor_can_access(db, company_id, admin_email)
    assert_admin(actor)

    session = db.query(LoginSession).filter(
        LoginSession.id == session_id,
        LoginSession.company_id == company_id,
    ).first()

    if not session:
        db.close()
        raise HTTPException(status_code=404, detail="Device session not found")

    if session.revoke_status != REVOKE_PENDING:
        db.close()
        raise HTTPException(status_code=400, detail="This revoke request has already been reviewed")

    performed_by = admin_name or actor.name
    reviewed_at = _now()

    session.revoke_reviewed_by = performed_by
    session.revoke_reviewed_by_email = admin_email
    session.revoke_reviewed_at = reviewed_at

    if action == "approved":
        session.revoke_status = REVOKE_APPROVED
        session.status = REVOKED
        session.termination_reason = REASON_REVOKED
        session.terminated_by = performed_by
        session.terminated_by_email = admin_email
        session.logout_time = reviewed_at
        _log(session, "Session Revoked", company_id, performed_by=performed_by, performed_by_email=admin_email)
        message = f"{performed_by} approved revoking {session.user_name}'s session on {session.device_name}."
    else:
        session.revoke_status = REVOKE_REJECTED
        _log(session, "Session Revoke Rejected", company_id, performed_by=performed_by, performed_by_email=admin_email)
        message = f"{performed_by} rejected the request to revoke {session.user_name}'s session on {session.device_name}. Access has been restored."

    notif = Notification(
        company_id=company_id,
        recipient_role="admin",
        message=message,
        type=f"session_revoke_{action}",
        related_id=session.id,
        is_read=False,
        created_at=reviewed_at,
    )
    db.add(notif)

    db.commit()
    db.refresh(session)

    result = session.to_dict()
    db.close()
    return result


def is_attendance_access_blocked(company_id, email):
    """A user loses attendance access as soon as a revoke is requested for
    any of their sessions, and stays blocked once it's approved. A rejected
    request restores access."""
    db = SessionLocal()
    blocking_session = db.query(LoginSession).filter(
        LoginSession.company_id == company_id,
        LoginSession.user_email == email,
        LoginSession.revoke_status.in_([REVOKE_PENDING, REVOKE_APPROVED]),
    ).order_by(LoginSession.revoke_requested_at.desc()).first()

    result = {
        "blocked": bool(blocking_session),
        "status": blocking_session.revoke_status if blocking_session else None,
    }
    db.close()
    return result
