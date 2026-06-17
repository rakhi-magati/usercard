from app.database import SessionLocal
from app.models.employee_model import Employee

db = SessionLocal()

employees = db.query(Employee).all()

print("Total Employees:", len(employees))

for employee in employees:
    print(
        employee.id,
        employee.name,
        employee.company_id
    )

db.close()