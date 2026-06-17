from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine

# IMPORTANT: create_all mundhu models import cheyyali
from app.models.company_model import Company
from app.models.employee_model import Employee
from app.models.audit_log_model import AuditLog
from app.routes.audit_routes import router as audit_router
from app.routes.employee_routes import router

from app.routes.audit_routes import (
    router as audit_router
)



app = FastAPI()

# Tables create avuthayi
Base.metadata.create_all(bind=engine)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(router)
app.include_router(audit_router)

@app.get("/")
def home():
    return {
        "message": "Employee API Running"
    }