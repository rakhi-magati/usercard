from fastapi import APIRouter, HTTPException

from app.services import session_service

router = APIRouter()


@router.post("/sessions")
def create_session(data: dict):
    return {"success": True, "data": session_service.create_session(data)}


@router.put("/sessions/activity")
def touch_session(data: dict):
    result = session_service.touch_session(data.get("session_token"))
    if not result:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"success": True, "data": result}


@router.get("/sessions/my")
def fetch_my_sessions(company_id: int = 1, email: str = None, current_token: str = None):
    if not email:
        raise HTTPException(status_code=400, detail="email is required")
    return {"success": True, "data": session_service.list_my_sessions(company_id, email, current_token)}


@router.get("/sessions")
def fetch_company_sessions(
    company_id: int = 1,
    actor_email: str = None,
    search: str = None,
    browser: str = None,
    status: str = None,
    date: str = None,
):
    return {
        "success": True,
        "data": session_service.list_company_sessions(
            company_id, actor_email=actor_email, search=search, browser=browser, status=status, date=date
        ),
    }


@router.put("/sessions/{session_id}/rename")
def rename_device(session_id: int, data: dict):
    result = session_service.rename_device(
        session_id,
        int(data.get("company_id") or 1),
        data.get("actor_email"),
        data.get("actor_name"),
        data.get("device_name"),
    )
    return {"success": True, "data": result}


@router.put("/sessions/{session_id}/trust")
def set_trusted(session_id: int, data: dict):
    result = session_service.set_trusted(
        session_id,
        int(data.get("company_id") or 1),
        data.get("actor_email"),
        data.get("actor_name"),
        bool(data.get("trusted", True)),
    )
    return {"success": True, "data": result}


@router.post("/sessions/{session_id}/remove")
def remove_device(session_id: int, data: dict):
    result = session_service.remove_device(
        session_id,
        int(data.get("company_id") or 1),
        data.get("actor_email"),
        data.get("actor_name"),
    )
    return {"success": True, "data": result}


@router.post("/sessions/{session_id}/logout")
def logout_session(session_id: int, data: dict):
    result = session_service.logout_session(
        session_id,
        int(data.get("company_id") or 1),
        data.get("actor_email"),
        data.get("actor_name"),
    )
    return {"success": True, "data": result}


@router.post("/sessions/logout-others")
def logout_all_others(data: dict):
    result = session_service.logout_all_others(
        int(data.get("company_id") or 1),
        data.get("actor_email"),
        data.get("actor_name"),
        data.get("current_token"),
    )
    return {"success": True, "data": result}


@router.post("/sessions/{session_id}/force-logout")
def force_logout(session_id: int, data: dict):
    result = session_service.force_logout(
        session_id,
        int(data.get("company_id") or 1),
        data.get("actor_email"),
        data.get("actor_name"),
    )
    return {"success": True, "data": result}


@router.post("/sessions/revoke")
def revoke_sessions(data: dict):
    session_ids = data.get("session_ids") or []
    if not session_ids:
        raise HTTPException(status_code=400, detail="session_ids is required")

    result = session_service.request_revoke_sessions(
        session_ids,
        int(data.get("company_id") or 1),
        data.get("actor_email"),
        data.get("actor_name"),
    )
    return {"success": True, "data": result}


@router.post("/sessions/{session_id}/revoke/approve")
def approve_revoke(session_id: int, data: dict):
    result = session_service.review_revoke_request(
        session_id,
        "approved",
        int(data.get("company_id") or 1),
        data.get("actor_email"),
        data.get("actor_name"),
    )
    return {"success": True, "data": result}


@router.post("/sessions/{session_id}/revoke/reject")
def reject_revoke(session_id: int, data: dict):
    result = session_service.review_revoke_request(
        session_id,
        "rejected",
        int(data.get("company_id") or 1),
        data.get("actor_email"),
        data.get("actor_name"),
    )
    return {"success": True, "data": result}


@router.get("/sessions/attendance-access-status")
def attendance_access_status(company_id: int = 1, email: str = None):
    if not email:
        raise HTTPException(status_code=400, detail="email is required")
    return {"success": True, "data": session_service.is_attendance_access_blocked(company_id, email)}
