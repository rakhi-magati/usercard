from fastapi import APIRouter, HTTPException
from app.services.invitation_service import (
    create_invitation,
    get_invitations,
    revoke_invitation,
    accept_invitation,
)

router = APIRouter()


@router.get("/invitations")
def list_invitations(company_id: int = 1):
    return {"success": True, "data": get_invitations(company_id)}


@router.post("/invitations")
def send_invitation(data: dict):
    result = create_invitation(data)
    return {"success": True, "data": result}


@router.put("/invitations/{invitation_id}/revoke")
def revoke(invitation_id: int, data: dict = {}):
    result = revoke_invitation(invitation_id, data.get("admin_name", "Admin"))
    if not result:
        raise HTTPException(status_code=404, detail="Invitation not found")
    return {"success": True, "data": result}


@router.post("/invitations/accept")
def accept(data: dict):
    result = accept_invitation(data.get("token"), data.get("name"))
    if not result:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    return {"success": True, "data": result}
