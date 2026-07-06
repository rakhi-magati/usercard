from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text

from app.database import Base, engine

# Import all models before create_all
from app.models.company_model import Company
from app.models.employee_model import Employee
from app.models.audit_log_model import AuditLog
from app.models.invitation_model import Invitation
from app.models.reactivation_model import ReactivationRequest
from app.models.notification_model import Notification
from app.models.department_transfer_model import DepartmentTransferHistory
from app.models.attendance_model import AttendanceRecord
from app.models.role_request_model import RoleRequest
from app.models.user_activity_model import UserActivity
from app.models.profile_completion_settings_model import ProfileCompletionSettings
from app.models.holiday_model import Holiday
from app.models.login_session_model import LoginSession

# Import all routers
from app.routes.employee_routes import router as employee_router
from app.routes.audit_routes import router as audit_router
from app.routes.analytics_routes import router as analytics_router
from app.routes.invitation_routes import router as invitation_router
from app.routes.reactivation_routes import router as reactivation_router
from app.routes.notification_routes import router as notification_router
from app.routes.attendance_routes import router as attendance_router
from app.routes.user_activity_routes import router as user_activity_router
from app.routes.profile_completion_routes import router as profile_completion_router
from app.routes.holiday_routes import router as holiday_router
from app.routes.session_routes import router as session_router


app = FastAPI()

# Create all tables
Base.metadata.create_all(bind=engine)


def ensure_existing_sqlite_schema():
    inspector = inspect(engine)
    table_names = inspector.get_table_names()

    if "role_requests" in table_names:
        columns = {column["name"] for column in inspector.get_columns("role_requests")}
        if "company_id" not in columns:
            with engine.begin() as connection:
                connection.execute(text("ALTER TABLE role_requests ADD COLUMN company_id INTEGER DEFAULT 1"))

    if "employees" in table_names:
        employee_columns = {column["name"] for column in inspector.get_columns("employees")}
        missing_employee_columns = {
            "suspension_date": "TEXT",
            "suspension_reason": "TEXT",
            "suspended_by": "TEXT",
            "suspended_by_email": "TEXT",
            "first_name": "TEXT",
            "last_name": "TEXT",
            "phone_number": "TEXT",
            "designation": "TEXT",
            "profile_picture": "TEXT",
            "address": "TEXT",
            "employee_code": "TEXT",
            "profile_completion_score": "INTEGER DEFAULT 0",
            "profile_completed_at": "TEXT",
        }
        with engine.begin() as connection:
            for column_name, column_type in missing_employee_columns.items():
                if column_name not in employee_columns:
                    connection.execute(text(f"ALTER TABLE employees ADD COLUMN {column_name} {column_type}"))
            connection.execute(text("UPDATE employees SET status = 'deactivated' WHERE status = 'inactive'"))

    if "audit_logs" in table_names:
        audit_columns = {column["name"] for column in inspector.get_columns("audit_logs")}
        missing_audit_columns = {
            "device_name": "TEXT",
            "browser": "TEXT",
            "ip_address": "TEXT",
            "session_id": "TEXT",
            "performed_by": "TEXT",
            "performed_by_email": "TEXT",
        }
        with engine.begin() as connection:
            for column_name, column_type in missing_audit_columns.items():
                if column_name not in audit_columns:
                    connection.execute(text(f"ALTER TABLE audit_logs ADD COLUMN {column_name} {column_type}"))


ensure_existing_sqlite_schema()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(employee_router)
app.include_router(audit_router)
app.include_router(analytics_router)
app.include_router(invitation_router)
app.include_router(reactivation_router)
app.include_router(notification_router)
app.include_router(attendance_router)
app.include_router(user_activity_router)
app.include_router(profile_completion_router)
app.include_router(holiday_router)
app.include_router(session_router)


@app.get("/")
def home():
    return {"message": "Employee API Running"}




