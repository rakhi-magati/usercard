from datetime import datetime, date as date_type
from fastapi import HTTPException

from app.database import SessionLocal
from app.models.holiday_model import Holiday
from app.services.audit_service import create_audit_log
from app.services.employee_service import assert_actor_can_access, assert_admin

VALID_TYPES = {"Public Holiday", "Company Holiday", "Optional Holiday"}


def _now():
    return datetime.now().isoformat()


def _assert_admin_actor(db, company_id, actor_email):
    actor = assert_actor_can_access(db, company_id, actor_email)
    assert_admin(actor)
    return actor


def _resolve_effective_date(holiday, target_year: int) -> str:
    """For a recurring holiday, shift its date to target_year."""
    mm_dd = holiday.date[5:]          # "MM-DD"
    return f"{target_year}-{mm_dd}"


def _expand_recurring(holidays, year: int):
    """
    Given a list of Holiday ORM objects return to_dict() rows,
    expanding recurring holidays into the requested year if their
    stored date falls in a different year.
    """
    rows = []
    for h in holidays:
        base = h.to_dict()
        if h.is_recurring:
            stored_year = int(h.date[:4])
            if stored_year != year:
                base = {**base, "date": _resolve_effective_date(h, year), "is_expanded": True}
        rows.append(base)
    return rows


# ── public helpers used by attendance ────────────────────────────────────────

def is_holiday(company_id: int, check_date: str) -> dict | None:
    """
    Return the holiday dict if check_date (YYYY-MM-DD) is a holiday for
    the company (including recurring expansions), else None.
    """
    db = SessionLocal()
    target = date_type.fromisoformat(check_date)
    target_year = target.year
    mm_dd = check_date[5:]   # "MM-DD"

    holidays = db.query(Holiday).filter(
        Holiday.company_id == company_id,
        Holiday.is_deleted == False,
    ).all()

    result = None
    for h in holidays:
        stored_mm_dd = h.date[5:]
        stored_year = int(h.date[:4])
        if h.is_recurring and stored_mm_dd == mm_dd:
            result = {**h.to_dict(), "date": check_date}
            break
        if not h.is_recurring and h.date == check_date:
            result = h.to_dict()
            break

    db.close()
    return result


# ── CRUD ─────────────────────────────────────────────────────────────────────

def create_holiday(data: dict):
    company_id = data.get("company_id", 1)
    actor_email = data.get("actor_email")
    admin_name = data.get("admin_name", "Admin")

    db = SessionLocal()
    _assert_admin_actor(db, company_id, actor_email)

    name = (data.get("name") or "").strip()
    h_date = (data.get("date") or "").strip()
    if not name:
        db.close()
        raise HTTPException(status_code=400, detail="Holiday name is required")
    if not h_date:
        db.close()
        raise HTTPException(status_code=400, detail="Holiday date is required")

    h_type = data.get("holiday_type", "Public Holiday")
    if h_type not in VALID_TYPES:
        db.close()
        raise HTTPException(status_code=400, detail=f"holiday_type must be one of {sorted(VALID_TYPES)}")

    is_recurring = bool(data.get("is_recurring", False))

    # Duplicate check: same company + same date (non-deleted)
    existing = db.query(Holiday).filter(
        Holiday.company_id == company_id,
        Holiday.date == h_date,
        Holiday.is_deleted == False,
    ).first()
    if existing:
        db.close()
        raise HTTPException(status_code=409, detail=f"A holiday already exists on {h_date} for this company")

    now = _now()
    holiday = Holiday(
        company_id=company_id,
        name=name,
        date=h_date,
        description=data.get("description", ""),
        holiday_type=h_type,
        is_recurring=is_recurring,
        is_deleted=False,
        created_by=admin_name,
        created_at=now,
    )
    db.add(holiday)
    db.commit()
    db.refresh(holiday)
    result = holiday.to_dict()

    create_audit_log(
        user_name=admin_name,
        action=f"Holiday Created | {name} | {h_date}",
        related_employee="",
        company_id=company_id,
    )

    db.close()
    return result


def update_holiday(holiday_id: int, data: dict):
    company_id = data.get("company_id", 1)
    actor_email = data.get("actor_email")
    admin_name = data.get("admin_name", "Admin")

    db = SessionLocal()
    _assert_admin_actor(db, company_id, actor_email)

    holiday = db.query(Holiday).filter(
        Holiday.id == holiday_id,
        Holiday.company_id == company_id,
        Holiday.is_deleted == False,
    ).first()
    if not holiday:
        db.close()
        raise HTTPException(status_code=404, detail="Holiday not found")

    new_date = data.get("date", holiday.date)
    new_name = (data.get("name") or holiday.name).strip()
    if not new_name:
        db.close()
        raise HTTPException(status_code=400, detail="Holiday name is required")

    h_type = data.get("holiday_type", holiday.holiday_type)
    if h_type not in VALID_TYPES:
        db.close()
        raise HTTPException(status_code=400, detail=f"holiday_type must be one of {sorted(VALID_TYPES)}")

    # Duplicate check (exclude self)
    if new_date != holiday.date:
        dup = db.query(Holiday).filter(
            Holiday.company_id == company_id,
            Holiday.date == new_date,
            Holiday.is_deleted == False,
            Holiday.id != holiday_id,
        ).first()
        if dup:
            db.close()
            raise HTTPException(status_code=409, detail=f"A holiday already exists on {new_date} for this company")

    holiday.name = new_name
    holiday.date = new_date
    holiday.description = data.get("description", holiday.description)
    holiday.holiday_type = h_type
    holiday.is_recurring = bool(data.get("is_recurring", holiday.is_recurring))
    holiday.updated_by = admin_name
    holiday.updated_at = _now()

    db.commit()
    db.refresh(holiday)
    result = holiday.to_dict()

    create_audit_log(
        user_name=admin_name,
        action=f"Holiday Updated | {holiday.name} | {holiday.date}",
        related_employee="",
        company_id=company_id,
    )

    db.close()
    return result


def delete_holiday(holiday_id: int, company_id: int, actor_email: str = None, admin_name: str = "Admin"):
    db = SessionLocal()
    _assert_admin_actor(db, company_id, actor_email)

    holiday = db.query(Holiday).filter(
        Holiday.id == holiday_id,
        Holiday.company_id == company_id,
        Holiday.is_deleted == False,
    ).first()
    if not holiday:
        db.close()
        raise HTTPException(status_code=404, detail="Holiday not found")

    name, h_date = holiday.name, holiday.date
    holiday.is_deleted = True
    holiday.updated_by = admin_name
    holiday.updated_at = _now()
    db.commit()

    create_audit_log(
        user_name=admin_name,
        action=f"Holiday Deleted | {name} | {h_date}",
        related_employee="",
        company_id=company_id,
    )

    db.close()
    return {"deleted": True}


def restore_holiday(holiday_id: int, company_id: int, actor_email: str = None, admin_name: str = "Admin"):
    db = SessionLocal()
    _assert_admin_actor(db, company_id, actor_email)

    holiday = db.query(Holiday).filter(
        Holiday.id == holiday_id,
        Holiday.company_id == company_id,
        Holiday.is_deleted == True,
    ).first()
    if not holiday:
        db.close()
        raise HTTPException(status_code=404, detail="Deleted holiday not found")

    # Duplicate check before restoring
    dup = db.query(Holiday).filter(
        Holiday.company_id == company_id,
        Holiday.date == holiday.date,
        Holiday.is_deleted == False,
        Holiday.id != holiday_id,
    ).first()
    if dup:
        db.close()
        raise HTTPException(status_code=409, detail=f"Another holiday already exists on {holiday.date}")

    holiday.is_deleted = False
    holiday.updated_by = admin_name
    holiday.updated_at = _now()
    db.commit()
    db.refresh(holiday)
    result = holiday.to_dict()

    create_audit_log(
        user_name=admin_name,
        action=f"Holiday Restored | {holiday.name} | {holiday.date}",
        related_employee="",
        company_id=company_id,
    )

    db.close()
    return result


def list_holidays(
    company_id: int,
    actor_email: str = None,
    month: int = None,
    year: int = None,
    holiday_type: str = None,
    search: str = None,
    include_deleted: bool = False,
):
    db = SessionLocal()
    query = db.query(Holiday).filter(Holiday.company_id == company_id)

    if not include_deleted:
        query = query.filter(Holiday.is_deleted == False)

    holidays = query.order_by(Holiday.date).all()

    target_year = year or date_type.today().year
    rows = _expand_recurring(holidays, target_year)

    # Filter by year
    if year:
        rows = [r for r in rows if r["date"].startswith(str(year))]

    # Filter by month
    if month:
        mm = f"{month:02d}"
        rows = [r for r in rows if r["date"][5:7] == mm]

    # Filter by type
    if holiday_type:
        rows = [r for r in rows if r["holiday_type"] == holiday_type]

    # Search by name
    if search:
        q = search.strip().lower()
        rows = [r for r in rows if q in r["name"].lower()]

    db.close()
    return rows


def get_upcoming_holidays(company_id: int, limit: int = 5):
    today = date_type.today().isoformat()
    rows = list_holidays(company_id, year=date_type.today().year)
    upcoming = [r for r in rows if r["date"] >= today]
    return upcoming[:limit]
