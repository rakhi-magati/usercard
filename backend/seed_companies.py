from app.database import SessionLocal
from app.models.company_model import Company

db = SessionLocal()

companies = [
    Company(name="Company A"),
    Company(name="Company B")
]

for company in companies:
    existing = db.query(Company).filter(
        Company.name == company.name
    ).first()

    if not existing:
        db.add(company)

db.commit()
db.close()

print("Companies seeded successfully")