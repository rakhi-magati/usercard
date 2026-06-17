from app.database import SessionLocal

# IMPORTANT
from app.models.company_model import Company
from app.models.employee_model import Employee

db = SessionLocal()

employees = db.query(Employee).all()

for index, employee in enumerate(employees):

    if index < 5:
        employee.company_id = 1
    else:
        employee.company_id = 2

db.commit()

print("Employees assigned successfully")

db.close()