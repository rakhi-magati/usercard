from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine

# Import all models before create_all
from app.models.company_model import Company
from app.models.employee_model import Employee
from app.models.audit_log_model import AuditLog
from app.models.invitation_model import Invitation
from app.models.reactivation_model import ReactivationRequest
from app.models.notification_model import Notification
from app.models.department_transfer_model import DepartmentTransferHistory

# Import all routers
from app.routes.employee_routes import router as employee_router
from app.routes.audit_routes import router as audit_router
from app.routes.analytics_routes import router as analytics_router
from app.routes.invitation_routes import router as invitation_router
from app.routes.reactivation_routes import router as reactivation_router
from app.routes.notification_routes import router as notification_router

app = FastAPI()

# Create all tables
Base.metadata.create_all(bind=engine)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
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


@app.get("/")
def home():
    return {"message": "Employee API Running"}
