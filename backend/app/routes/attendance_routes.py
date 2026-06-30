from datetime import date, datetime
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
import csv
import io

from app.database import SessionLocal
from app.models.employee_model import Employee
from app.models.attendance_model import AttendanceRecord
from app.services.employee_service import normalize_status, assert_actor_can_access

router = APIRouter(
    prefix="/attendance",
    tags=["Attendance"]
)


def employee_account_status(employee_status):
    status = normalize_status(employee_status)
    if status == "active":
        return "Active"
    if status == "deactivated":
        return "Deactivated"
    if status == "suspended":
        return "Suspended"
    return status.title()


def attendance_status(record=None, employee_status=None):
    if record and record.check_out:
        return "Checked Out"
    if record and record.check_in:
        return "Checked In"
    status = normalize_status(employee_status)
    if status == "deactivated":
        return "Deactivated"
    if status == "suspended":
        return "Suspended"
    return "Not Checked In"


def calculate_hours(check_in, check_out):
    if not check_in or not check_out:
        return ""
    try:
        start = datetime.fromisoformat(check_in)
        end = datetime.fromisoformat(check_out)
        hours = max((end - start).total_seconds() / 3600, 0)
        return f"{hours:.1f} hrs"
    except ValueError:
        return ""


def format_time(value):
    if not value:
        return ""
    try:
        return datetime.fromisoformat(value).strftime("%I:%M %p")
    except ValueError:
        return value


def build_attendance_row(employee, attendance_date, record=None):
    return {
        "id": record.id if record else employee.id,
        "employee_id": employee.id,
        "name": employee.name,
        "email": employee.email,
        "department": employee.department,
        "date": attendance_date,
        "status": attendance_status(record, employee.status),
        "employeeStatus": employee_account_status(employee.status),
        "checkIn": format_time(record.check_in) if record else "",
        "checkOut": format_time(record.check_out) if record else "",
        "hours": record.hours if record else "",
    }


def get_employee_by_email(db, email, company_id):
    return db.query(Employee).filter(
        Employee.email == email,
        Employee.company_id == company_id,
    ).first()


def ensure_active_employee(employee):
    if normalize_status(employee.status) != "active":
        raise HTTPException(status_code=403, detail="Account is not active")


def get_record(db, employee_id, attendance_date):
    return db.query(AttendanceRecord).filter(
        AttendanceRecord.employee_id == employee_id,
        AttendanceRecord.date == attendance_date,
    ).first()


def get_attendance_rows(company_id=1, attendance_date=None, search=None):
    db = SessionLocal()
    selected_date = attendance_date or date.today().isoformat()
    employees = db.query(Employee).filter(Employee.company_id == company_id).all()

    records = db.query(AttendanceRecord).filter(
        AttendanceRecord.company_id == company_id,
        AttendanceRecord.date == selected_date,
    ).all()
    records_by_employee = {record.employee_id: record for record in records}

    rows = [
        build_attendance_row(employee, selected_date, records_by_employee.get(employee.id))
        for employee in employees
    ]

    if search:
        search_text = search.strip().lower()
        rows = [
            row for row in rows
            if search_text in row["name"].lower()
            or search_text in row["email"].lower()
            or search_text in row["department"].lower()
        ]

    db.close()
    return rows


@router.get("/")
def list_attendance(
    company_id: int = 1,
    attendance_date: str | None = None,
    search: str | None = None,
    actor_email: str | None = None,
    page: int = 1,
    limit: int = 8,
):
    if actor_email:
        db = SessionLocal()
        assert_actor_can_access(db, company_id, actor_email)
        db.close()

    rows = get_attendance_rows(company_id, attendance_date, search)
    total = len(rows)
    start = (page - 1) * limit
    paginated = rows[start:start + limit]

    return {
        "success": True,
        "data": paginated,
        "total": total,
        "page": page,
        "limit": limit,
    }


@router.get("/mine")
def my_attendance(email: str, company_id: int = 1):
    db = SessionLocal()
    employee = get_employee_by_email(db, email, company_id)
    if not employee:
        db.close()
        raise HTTPException(status_code=404, detail="Employee not found")
    try:
        ensure_active_employee(employee)
    except HTTPException:
        db.close()
        raise

    records = db.query(AttendanceRecord).filter(
        AttendanceRecord.employee_id == employee.id,
    ).order_by(AttendanceRecord.date.desc()).all()

    result = [record.to_dict() for record in records]
    db.close()
    return {"success": True, "data": result}


@router.post("/check-in")
def check_in(data: dict):
    company_id = int(data.get("company_id", 1))
    email = data.get("email")
    attendance_date = data.get("date") or date.today().isoformat()

    db = SessionLocal()
    employee = get_employee_by_email(db, email, company_id)
    if not employee:
        db.close()
        raise HTTPException(status_code=404, detail="Employee not found")
    try:
        ensure_active_employee(employee)
    except HTTPException:
        db.close()
        raise

    record = get_record(db, employee.id, attendance_date)
    now = datetime.now().isoformat()

    if record and record.check_in:
        result = record.to_dict()
        db.close()
        return {"success": True, "data": result}

    if not record:
        record = AttendanceRecord(
            employee_id=employee.id,
            company_id=company_id,
            name=employee.name,
            email=employee.email,
            department=employee.department,
            date=attendance_date,
            status="Present",
            check_in=now,
        )
        db.add(record)
    else:
        record.status = "Present"
        record.check_in = now

    db.commit()
    db.refresh(record)
    result = record.to_dict()
    db.close()
    return {"success": True, "data": result}


@router.post("/check-out")
def check_out(data: dict):
    company_id = int(data.get("company_id", 1))
    email = data.get("email")
    attendance_date = data.get("date") or date.today().isoformat()

    db = SessionLocal()
    employee = get_employee_by_email(db, email, company_id)
    if not employee:
        db.close()
        raise HTTPException(status_code=404, detail="Employee not found")
    try:
        ensure_active_employee(employee)
    except HTTPException:
        db.close()
        raise

    record = get_record(db, employee.id, attendance_date)
    if not record or not record.check_in:
        db.close()
        raise HTTPException(status_code=400, detail="Check in is required before check out")

    if not record.check_out:
        record.check_out = datetime.now().isoformat()
        record.hours = calculate_hours(record.check_in, record.check_out)
        db.commit()
        db.refresh(record)

    result = record.to_dict()
    db.close()
    return {"success": True, "data": result}


@router.get("/download")
def download_attendance(
    company_id: int = 1,
    attendance_date: str | None = None,
    search: str | None = None,
    actor_email: str | None = None,
):
    if actor_email:
        db = SessionLocal()
        assert_actor_can_access(db, company_id, actor_email)
        db.close()

    rows = get_attendance_rows(company_id, attendance_date, search)

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "ID",
        "Name",
        "Email",
        "Department",
        "Date",
        "Status",
        "Check In",
        "Check Out",
        "Hours",
    ])

    for row in rows:
        writer.writerow([
            row["employee_id"],
            row["name"],
            row["email"],
            row["department"],
            row["date"],
            row["status"],
            row["checkIn"] or "-",
            row["checkOut"] or "-",
            row["hours"] or "-",
        ])

    output.seek(0)

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition":
            "attachment; filename=attendance_report.csv"
        }
    )

