from fastapi import APIRouter, Form, UploadFile, File
from fastapi.responses import FileResponse

from app.services.skills_service import (
    list_skills,
    add_skill,
    update_skill,
    delete_skill,
    list_certifications,
    add_certification,
    update_certification,
    delete_certification,
    get_certification_file_path,
    get_competency_summary,
    admin_list_employee_competencies,
    check_expiring_certifications,
    PROFICIENCY_LEVELS,
)

router = APIRouter(prefix="/skills", tags=["Skills & Certifications"])


@router.get("/levels")
def get_proficiency_levels():
    return {"success": True, "data": PROFICIENCY_LEVELS}


# --- Skills 

@router.get("/")
def get_skills(employee_id: int, company_id: int = 1, actor_email: str = None):
    return {"success": True, "data": list_skills(employee_id, company_id, actor_email)}


@router.post("/")
def create_skill(data: dict):
    employee_id = data.get("employee_id")
    company_id = data.get("company_id", 1)
    actor_email = data.get("actor_email")
    return {"success": True, "data": add_skill(employee_id, company_id, actor_email, data)}


@router.put("/{skill_id}")
def edit_skill(skill_id: int, data: dict):
    company_id = data.get("company_id", 1)
    actor_email = data.get("actor_email")
    return {"success": True, "data": update_skill(skill_id, company_id, actor_email, data)}


@router.delete("/{skill_id}")
def remove_skill(skill_id: int, company_id: int = 1, actor_email: str = None):
    return {"success": True, "data": delete_skill(skill_id, company_id, actor_email)}


# --- Certifications 

@router.get("/certifications")
def get_certifications(employee_id: int, company_id: int = 1, actor_email: str = None):
    return {"success": True, "data": list_certifications(employee_id, company_id, actor_email)}


@router.post("/certifications")
def create_certification(
    employee_id: int = Form(...),
    company_id: int = Form(1),
    actor_email: str = Form(None),
    certification_name: str = Form(...),
    issuing_organization: str = Form(...),
    issue_date: str = Form(None),
    expiry_date: str = Form(None),
    document: UploadFile = File(None),
):
    data = {
        "certification_name": certification_name,
        "issuing_organization": issuing_organization,
        "issue_date": issue_date,
        "expiry_date": expiry_date,
    }
    return {
        "success": True,
        "data": add_certification(employee_id, company_id, actor_email, data, document),
    }


@router.put("/certifications/{cert_id}")
def edit_certification(
    cert_id: int,
    company_id: int = Form(1),
    actor_email: str = Form(None),
    certification_name: str = Form(None),
    issuing_organization: str = Form(None),
    issue_date: str = Form(None),
    expiry_date: str = Form(None),
    remove_document: bool = Form(False),
    document: UploadFile = File(None),
):
    data = {
        "certification_name": certification_name,
        "issuing_organization": issuing_organization,
        "issue_date": issue_date,
        "expiry_date": expiry_date,
    }
    data = {k: v for k, v in data.items() if v is not None}
    return {
        "success": True,
        "data": update_certification(cert_id, company_id, actor_email, data, document, remove_document),
    }


@router.delete("/certifications/{cert_id}")
def remove_certification(cert_id: int, company_id: int = 1, actor_email: str = None):
    return {"success": True, "data": delete_certification(cert_id, company_id, actor_email)}


@router.get("/certifications/{cert_id}/document")
def download_certification_document(cert_id: int, company_id: int = 1, actor_email: str = None):
    full_path, document_name = get_certification_file_path(cert_id, company_id, actor_email)
    return FileResponse(full_path, filename=document_name or "certification")


@router.post("/certifications/check-expiry")
def run_expiry_check(company_id: int = 1, actor_email: str = None):
    return check_expiring_certifications(company_id, actor_email)


# --- Dashboard / Admin 

@router.get("/summary")
def get_summary(employee_id: int, company_id: int = 1, actor_email: str = None):
    return {"success": True, "data": get_competency_summary(employee_id, company_id, actor_email)}


@router.get("/admin/directory")
def get_admin_directory(
    company_id: int = 1,
    actor_email: str = None,
    skill: str = None,
    skill_level: str = None,
    min_years_experience: int = None,
    certification_name: str = None,
    certification_status: str = None,
):
    data = admin_list_employee_competencies(
        company_id=company_id,
        actor_email=actor_email,
        skill=skill,
        skill_level=skill_level,
        min_years_experience=min_years_experience,
        certification_name=certification_name,
        certification_status=certification_status,
    )
    return {"success": True, "data": data}
