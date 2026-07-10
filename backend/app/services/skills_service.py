import os
import uuid
from datetime import datetime, date

from fastapi import HTTPException

from app.database import SessionLocal
from app.models.employee_model import Employee
from app.models.employee_skill_model import EmployeeSkill
from app.models.employee_certification_model import EmployeeCertification
from app.models.notification_model import Notification
from app.services.audit_service import create_audit_log
from app.services.employee_service import assert_actor_can_access, assert_admin, get_actor

PROFICIENCY_LEVELS = ["Beginner", "Intermediate", "Advanced", "Expert"]

ALLOWED_CERT_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg", ".doc", ".docx"}

EXPIRY_WARNING_DAYS = 30

UPLOAD_ROOT = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "uploads")
CERT_UPLOAD_DIR = os.path.join(UPLOAD_ROOT, "certifications")


def _now():
    return datetime.now().isoformat()


def _parse_date(value):
    if not value:
        return None
    try:
        return datetime.fromisoformat(str(value)[:10]).date()
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid date: {value}")


def _get_owning_employee(db, employee_id, company_id):
    employee = db.query(Employee).filter(
        Employee.id == employee_id,
        Employee.company_id == company_id,
    ).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found in this company")
    return employee


def _assert_self_service(db, employee_id, company_id, actor_email):
    """Employees may only manage their own skills/certifications."""
    actor = assert_actor_can_access(db, company_id, actor_email)
    if actor.id != int(employee_id):
        raise HTTPException(status_code=403, detail="You can only manage your own skills and certifications")
    return actor


def compute_certification_status(expiry_date_str):
    """Returns one of: 'No Expiry', 'Valid', 'Expiring Soon', 'Expired'."""
    expiry = _parse_date(expiry_date_str)
    if expiry is None:
        return "No Expiry"
    today = date.today()
    if expiry < today:
        return "Expired"
    if (expiry - today).days <= EXPIRY_WARNING_DAYS:
        return "Expiring Soon"
    return "Valid"


# Skills


def list_skills(employee_id, company_id, actor_email=None):
    db = SessionLocal()
    if actor_email:
        assert_actor_can_access(db, company_id, actor_email)
    _get_owning_employee(db, employee_id, company_id)

    rows = db.query(EmployeeSkill).filter(
        EmployeeSkill.employee_id == employee_id,
        EmployeeSkill.company_id == company_id,
    ).order_by(EmployeeSkill.is_primary.desc(), EmployeeSkill.skill_name.asc()).all()
    result = [row.to_dict() for row in rows]
    db.close()
    return result


def _validate_skill_payload(data, years_experience):
    skill_name = (data.get("skill_name") or "").strip()
    if not skill_name:
        raise HTTPException(status_code=400, detail="Skill name is required")

    proficiency_level = data.get("proficiency_level") or "Beginner"
    if proficiency_level not in PROFICIENCY_LEVELS:
        raise HTTPException(status_code=400, detail=f"Proficiency level must be one of {PROFICIENCY_LEVELS}")

    if years_experience < 0:
        raise HTTPException(status_code=400, detail="Years of experience cannot be negative")

    return skill_name, proficiency_level


def add_skill(employee_id, company_id, actor_email, data):
    db = SessionLocal()
    actor = _assert_self_service(db, employee_id, company_id, actor_email)
    employee = _get_owning_employee(db, employee_id, company_id)

    try:
        years_experience = int(data.get("years_experience") or 0)
    except (TypeError, ValueError):
        db.close()
        raise HTTPException(status_code=400, detail="Years of experience must be a number")

    skill_name, proficiency_level = _validate_skill_payload(data, years_experience)

    duplicate = db.query(EmployeeSkill).filter(
        EmployeeSkill.employee_id == employee_id,
        EmployeeSkill.company_id == company_id,
        EmployeeSkill.skill_name.ilike(skill_name),
    ).first()
    if duplicate:
        db.close()
        raise HTTPException(status_code=400, detail=f'"{skill_name}" is already on your skill list')

    now = _now()
    skill = EmployeeSkill(
        company_id=company_id,
        employee_id=employee_id,
        skill_name=skill_name,
        proficiency_level=proficiency_level,
        years_experience=years_experience,
        is_primary=bool(data.get("is_primary")),
        created_at=now,
        updated_at=now,
    )
    db.add(skill)
    db.commit()
    db.refresh(skill)

    create_audit_log(
        user_name=actor.name,
        action=f"Skill Added: {skill_name}",
        related_employee=employee.name,
        company_id=company_id,
        performed_by=actor.name,
        performed_by_email=actor.email,
    )

    result = skill.to_dict()
    db.close()
    return result


def update_skill(skill_id, company_id, actor_email, data):
    db = SessionLocal()
    skill = db.query(EmployeeSkill).filter(
        EmployeeSkill.id == skill_id,
        EmployeeSkill.company_id == company_id,
    ).first()
    if not skill:
        db.close()
        raise HTTPException(status_code=404, detail="Skill not found")

    actor = _assert_self_service(db, skill.employee_id, company_id, actor_email)
    employee = _get_owning_employee(db, skill.employee_id, company_id)

    try:
        years_experience = int(data.get("years_experience", skill.years_experience) or 0)
    except (TypeError, ValueError):
        db.close()
        raise HTTPException(status_code=400, detail="Years of experience must be a number")

    payload = {
        "skill_name": data.get("skill_name", skill.skill_name),
        "proficiency_level": data.get("proficiency_level", skill.proficiency_level),
    }
    skill_name, proficiency_level = _validate_skill_payload(payload, years_experience)

    duplicate = db.query(EmployeeSkill).filter(
        EmployeeSkill.employee_id == skill.employee_id,
        EmployeeSkill.company_id == company_id,
        EmployeeSkill.skill_name.ilike(skill_name),
        EmployeeSkill.id != skill_id,
    ).first()
    if duplicate:
        db.close()
        raise HTTPException(status_code=400, detail=f'"{skill_name}" is already on your skill list')

    skill.skill_name = skill_name
    skill.proficiency_level = proficiency_level
    skill.years_experience = years_experience
    if "is_primary" in data:
        skill.is_primary = bool(data.get("is_primary"))
    skill.updated_at = _now()

    db.commit()
    db.refresh(skill)

    create_audit_log(
        user_name=actor.name,
        action=f"Skill Updated: {skill_name}",
        related_employee=employee.name,
        company_id=company_id,
        performed_by=actor.name,
        performed_by_email=actor.email,
    )

    result = skill.to_dict()
    db.close()
    return result


def delete_skill(skill_id, company_id, actor_email):
    db = SessionLocal()
    skill = db.query(EmployeeSkill).filter(
        EmployeeSkill.id == skill_id,
        EmployeeSkill.company_id == company_id,
    ).first()
    if not skill:
        db.close()
        raise HTTPException(status_code=404, detail="Skill not found")

    actor = _assert_self_service(db, skill.employee_id, company_id, actor_email)
    employee = _get_owning_employee(db, skill.employee_id, company_id)
    skill_name = skill.skill_name

    db.delete(skill)
    db.commit()

    create_audit_log(
        user_name=actor.name,
        action=f"Skill Deleted: {skill_name}",
        related_employee=employee.name,
        company_id=company_id,
        performed_by=actor.name,
        performed_by_email=actor.email,
    )
    db.close()
    return {"success": True}

# Certifications

def _serialize_certification(cert):
    data = cert.to_dict()
    data["status"] = compute_certification_status(cert.expiry_date)
    return data


def _save_certification_file(company_id, employee_id, upload_file):
    if upload_file is None or not getattr(upload_file, "filename", None):
        return None, None

    ext = os.path.splitext(upload_file.filename)[1].lower()
    if ext not in ALLOWED_CERT_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format. Allowed formats: {', '.join(sorted(ALLOWED_CERT_EXTENSIONS))}",
        )

    target_dir = os.path.join(CERT_UPLOAD_DIR, str(company_id), str(employee_id))
    os.makedirs(target_dir, exist_ok=True)

    stored_name = f"{uuid.uuid4().hex}{ext}"
    target_path = os.path.join(target_dir, stored_name)
    with open(target_path, "wb") as f:
        f.write(upload_file.file.read())

    relative_path = os.path.join("certifications", str(company_id), str(employee_id), stored_name)
    return relative_path.replace("\\", "/"), upload_file.filename


def _delete_certification_file(document_path):
    if not document_path:
        return
    full_path = os.path.join(UPLOAD_ROOT, document_path)
    if os.path.exists(full_path):
        try:
            os.remove(full_path)
        except OSError:
            pass


def list_certifications(employee_id, company_id, actor_email=None):
    db = SessionLocal()
    if actor_email:
        assert_actor_can_access(db, company_id, actor_email)
    employee = _get_owning_employee(db, employee_id, company_id)

    rows = db.query(EmployeeCertification).filter(
        EmployeeCertification.employee_id == employee_id,
        EmployeeCertification.company_id == company_id,
    ).order_by(EmployeeCertification.expiry_date.asc()).all()

    _run_expiry_checks(db, rows, employee)

    result = [_serialize_certification(row) for row in rows]
    db.close()
    return result


def _validate_certification_payload(data):
    certification_name = (data.get("certification_name") or "").strip()
    issuing_organization = (data.get("issuing_organization") or "").strip()

    if not certification_name:
        raise HTTPException(status_code=400, detail="Certification name is required")
    if not issuing_organization:
        raise HTTPException(status_code=400, detail="Issuing organization is required")

    issue_date = data.get("issue_date") or None
    expiry_date = data.get("expiry_date") or None

    issue_parsed = _parse_date(issue_date)
    expiry_parsed = _parse_date(expiry_date)

    if issue_parsed and expiry_parsed and expiry_parsed < issue_parsed:
        raise HTTPException(status_code=400, detail="Expiry date cannot be earlier than the issue date")

    return certification_name, issuing_organization, issue_date, expiry_date


def add_certification(employee_id, company_id, actor_email, data, upload_file=None):
    db = SessionLocal()
    actor = _assert_self_service(db, employee_id, company_id, actor_email)
    employee = _get_owning_employee(db, employee_id, company_id)

    certification_name, issuing_organization, issue_date, expiry_date = _validate_certification_payload(data)

    duplicate = db.query(EmployeeCertification).filter(
        EmployeeCertification.employee_id == employee_id,
        EmployeeCertification.company_id == company_id,
        EmployeeCertification.certification_name.ilike(certification_name),
        EmployeeCertification.issuing_organization.ilike(issuing_organization),
    ).first()
    if duplicate:
        db.close()
        raise HTTPException(
            status_code=400,
            detail=f'A certification "{certification_name}" from "{issuing_organization}" already exists',
        )

    document_path, document_name = _save_certification_file(company_id, employee_id, upload_file)

    now = _now()
    cert = EmployeeCertification(
        company_id=company_id,
        employee_id=employee_id,
        certification_name=certification_name,
        issuing_organization=issuing_organization,
        issue_date=issue_date,
        expiry_date=expiry_date,
        document_path=document_path,
        document_name=document_name,
        notified_expiring=False,
        notified_expired=False,
        created_at=now,
        updated_at=now,
    )
    db.add(cert)
    db.commit()
    db.refresh(cert)

    create_audit_log(
        user_name=actor.name,
        action=f"Certification Added: {certification_name}",
        related_employee=employee.name,
        company_id=company_id,
        performed_by=actor.name,
        performed_by_email=actor.email,
    )

    result = _serialize_certification(cert)
    db.close()
    return result


def update_certification(cert_id, company_id, actor_email, data, upload_file=None, remove_document=False):
    db = SessionLocal()
    cert = db.query(EmployeeCertification).filter(
        EmployeeCertification.id == cert_id,
        EmployeeCertification.company_id == company_id,
    ).first()
    if not cert:
        db.close()
        raise HTTPException(status_code=404, detail="Certification not found")

    actor = _assert_self_service(db, cert.employee_id, company_id, actor_email)
    employee = _get_owning_employee(db, cert.employee_id, company_id)

    payload = {
        "certification_name": data.get("certification_name", cert.certification_name),
        "issuing_organization": data.get("issuing_organization", cert.issuing_organization),
        "issue_date": data.get("issue_date", cert.issue_date),
        "expiry_date": data.get("expiry_date", cert.expiry_date),
    }
    certification_name, issuing_organization, issue_date, expiry_date = _validate_certification_payload(payload)

    duplicate = db.query(EmployeeCertification).filter(
        EmployeeCertification.employee_id == cert.employee_id,
        EmployeeCertification.company_id == company_id,
        EmployeeCertification.certification_name.ilike(certification_name),
        EmployeeCertification.issuing_organization.ilike(issuing_organization),
        EmployeeCertification.id != cert_id,
    ).first()
    if duplicate:
        db.close()
        raise HTTPException(
            status_code=400,
            detail=f'A certification "{certification_name}" from "{issuing_organization}" already exists',
        )

    cert.certification_name = certification_name
    cert.issuing_organization = issuing_organization
    cert.issue_date = issue_date
    cert.expiry_date = expiry_date

    if upload_file is not None and getattr(upload_file, "filename", None):
        _delete_certification_file(cert.document_path)
        document_path, document_name = _save_certification_file(company_id, cert.employee_id, upload_file)
        cert.document_path = document_path
        cert.document_name = document_name
    elif remove_document:
        _delete_certification_file(cert.document_path)
        cert.document_path = None
        cert.document_name = None

    # Editing the expiry date resets the expiry notification guards so a
    # newly-extended certification can be re-flagged if it lapses again.
    cert.notified_expiring = False
    cert.notified_expired = False
    cert.updated_at = _now()

    db.commit()
    db.refresh(cert)

    create_audit_log(
        user_name=actor.name,
        action=f"Certification Updated: {certification_name}",
        related_employee=employee.name,
        company_id=company_id,
        performed_by=actor.name,
        performed_by_email=actor.email,
    )

    result = _serialize_certification(cert)
    db.close()
    return result


def delete_certification(cert_id, company_id, actor_email):
    db = SessionLocal()
    cert = db.query(EmployeeCertification).filter(
        EmployeeCertification.id == cert_id,
        EmployeeCertification.company_id == company_id,
    ).first()
    if not cert:
        db.close()
        raise HTTPException(status_code=404, detail="Certification not found")

    actor = _assert_self_service(db, cert.employee_id, company_id, actor_email)
    employee = _get_owning_employee(db, cert.employee_id, company_id)
    certification_name = cert.certification_name

    _delete_certification_file(cert.document_path)
    db.delete(cert)
    db.commit()

    create_audit_log(
        user_name=actor.name,
        action=f"Certification Deleted: {certification_name}",
        related_employee=employee.name,
        company_id=company_id,
        performed_by=actor.name,
        performed_by_email=actor.email,
    )
    db.close()
    return {"success": True}


def get_certification_file_path(cert_id, company_id, actor_email):
    db = SessionLocal()
    cert = db.query(EmployeeCertification).filter(
        EmployeeCertification.id == cert_id,
        EmployeeCertification.company_id == company_id,
    ).first()
    if not cert:
        db.close()
        raise HTTPException(status_code=404, detail="Certification not found")

    actor = assert_actor_can_access(db, company_id, actor_email)
    is_owner = actor.id == cert.employee_id
    is_admin = (actor.role or "").lower() == "admin"
    if not (is_owner or is_admin):
        db.close()
        raise HTTPException(status_code=403, detail="You do not have access to this document")

    if not cert.document_path:
        db.close()
        raise HTTPException(status_code=404, detail="No document uploaded for this certification")

    full_path = os.path.join(UPLOAD_ROOT, cert.document_path)
    document_name = cert.document_name
    db.close()

    if not os.path.exists(full_path):
        raise HTTPException(status_code=404, detail="Document file is missing on the server")

    return full_path, document_name

# Expiry checks + notifications

def _run_expiry_checks(db, certifications, employee):
    """Idempotently notifies + audit-logs expiring/expired certifications.
    Called opportunistically whenever certifications are listed."""
    now = _now()
    changed = False

    for cert in certifications:
        status = compute_certification_status(cert.expiry_date)

        if status == "Expiring Soon" and not cert.notified_expiring:
            message = f'Your certification "{cert.certification_name}" expires on {cert.expiry_date}.'
            db.add(Notification(
                company_id=cert.company_id,
                recipient_role=f"employee:{employee.email}",
                message=message,
                type="certification_expiring",
                related_id=cert.id,
                is_read=False,
                created_at=now,
            ))
            cert.notified_expiring = True
            changed = True

        if status == "Expired" and not cert.notified_expired:
            message = f'Your certification "{cert.certification_name}" has expired.'
            db.add(Notification(
                company_id=cert.company_id,
                recipient_role=f"employee:{employee.email}",
                message=message,
                type="certification_expired",
                related_id=cert.id,
                is_read=False,
                created_at=now,
            ))
            cert.notified_expired = True
            changed = True
            create_audit_log(
                user_name="System",
                action=f"Certification Expired: {cert.certification_name}",
                related_employee=employee.name,
                company_id=cert.company_id,
                performed_by="System",
            )

    if changed:
        db.commit()


def check_expiring_certifications(company_id, actor_email=None):
    """Admin-triggerable (or periodically pollable) sweep across the whole
    company, in case an employee hasn't opened their certifications list in a
    while for the lazy per-employee check above to have run."""
    db = SessionLocal()
    if actor_email:
        actor = assert_actor_can_access(db, company_id, actor_email)
        assert_admin(actor)

    employees = {e.id: e for e in db.query(Employee).filter(Employee.company_id == company_id).all()}
    certs = db.query(EmployeeCertification).filter(EmployeeCertification.company_id == company_id).all()

    by_employee = {}
    for cert in certs:
        by_employee.setdefault(cert.employee_id, []).append(cert)

    for employee_id, employee_certs in by_employee.items():
        employee = employees.get(employee_id)
        if employee:
            _run_expiry_checks(db, employee_certs, employee)

    db.close()
    return {"success": True}

# Competency summary (per-employee dashboard widget)

def get_competency_summary(employee_id, company_id, actor_email=None):
    db = SessionLocal()
    if actor_email:
        assert_actor_can_access(db, company_id, actor_email)
    _get_owning_employee(db, employee_id, company_id)

    skills = db.query(EmployeeSkill).filter(
        EmployeeSkill.employee_id == employee_id,
        EmployeeSkill.company_id == company_id,
    ).all()
    certs = db.query(EmployeeCertification).filter(
        EmployeeCertification.employee_id == employee_id,
        EmployeeCertification.company_id == company_id,
    ).all()

    total_skills = len(skills)
    primary_skills = len([s for s in skills if s.is_primary])

    statuses = [compute_certification_status(c.expiry_date) for c in certs]
    active_certifications = len([s for s in statuses if s in ("Valid", "Expiring Soon", "No Expiry")])
    expired_certifications = len([s for s in statuses if s == "Expired"])

    # Lightweight, additive "nice to have" contribution toward overall
    # profile completion - deliberately kept separate from the core
    # profile_completion_score so existing scoring logic is untouched.
    contribution = (5 if total_skills > 0 else 0) + (5 if active_certifications > 0 else 0)

    db.close()
    return {
        "employee_id": employee_id,
        "total_skills": total_skills,
        "primary_skills": primary_skills,
        "active_certifications": active_certifications,
        "expired_certifications": expired_certifications,
        "profile_completion_contribution": contribution,
    }

# Admin directory: search + filter employees by competency

def admin_list_employee_competencies(
    company_id,
    actor_email,
    skill=None,
    skill_level=None,
    min_years_experience=None,
    certification_name=None,
    certification_status=None,
):
    db = SessionLocal()
    actor = assert_actor_can_access(db, company_id, actor_email)
    assert_admin(actor)

    employees = db.query(Employee).filter(Employee.company_id == company_id).all()
    all_skills = db.query(EmployeeSkill).filter(EmployeeSkill.company_id == company_id).all()
    all_certs = db.query(EmployeeCertification).filter(EmployeeCertification.company_id == company_id).all()
    db.close()

    skills_by_employee = {}
    for s in all_skills:
        skills_by_employee.setdefault(s.employee_id, []).append(s)

    certs_by_employee = {}
    for c in all_certs:
        certs_by_employee.setdefault(c.employee_id, []).append(c)

    needle_skill = (skill or "").strip().lower()
    needle_cert = (certification_name or "").strip().lower()
    try:
        min_years = int(min_years_experience) if min_years_experience not in (None, "") else None
    except (TypeError, ValueError):
        min_years = None

    result = []
    for employee in employees:
        emp_skills = skills_by_employee.get(employee.id, [])
        emp_certs = certs_by_employee.get(employee.id, [])

        matching_skills = emp_skills
        if needle_skill:
            matching_skills = [s for s in matching_skills if needle_skill in s.skill_name.lower()]
        if skill_level:
            matching_skills = [s for s in matching_skills if s.proficiency_level == skill_level]
        if min_years is not None:
            matching_skills = [s for s in matching_skills if (s.years_experience or 0) >= min_years]

        matching_certs = emp_certs
        if needle_cert:
            matching_certs = [c for c in matching_certs if needle_cert in c.certification_name.lower()]
        if certification_status:
            matching_certs = [c for c in matching_certs if compute_certification_status(c.expiry_date) == certification_status]

        has_skill_filter = bool(needle_skill or skill_level or min_years is not None)
        has_cert_filter = bool(needle_cert or certification_status)

        if has_skill_filter and not matching_skills:
            continue
        if has_cert_filter and not matching_certs:
            continue

        result.append({
            "employee_id": employee.id,
            "employee_name": employee.name,
            "employee_email": employee.email,
            "department": employee.department,
            "skills": [s.to_dict() for s in emp_skills],
            "certifications": [_serialize_certification(c) for c in emp_certs],
            "matched_skills": [s.to_dict() for s in matching_skills] if has_skill_filter else None,
            "matched_certifications": [_serialize_certification(c) for c in matching_certs] if has_cert_filter else None,
        })

    return result
