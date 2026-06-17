from fastapi import APIRouter
from fastapi.responses import StreamingResponse
import csv
import io

router = APIRouter(
    prefix="/attendance",
    tags=["Attendance"]
)

attendance_data = [
    {
        "id": 1,
        "name": "Rakesh",
        "department": "IT",
        "status": "Present",
        "date": "10-06-2026"
    },
    {
        "id": 2,
        "name": "Rahul",
        "department": "HR",
        "status": "Absent",
        "date": "10-06-2026"
    }
]


@router.get("/download")
def download_attendance():

    output = io.StringIO()

    writer = csv.writer(output)

    writer.writerow(
        [
            "ID",
            "Name",
            "Department",
            "Status",
            "Date"
        ]
    )

    for row in attendance_data:
        writer.writerow(row.values())

    output.seek(0)

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition":
            "attachment; filename=attendance_report.csv"
        }
    )