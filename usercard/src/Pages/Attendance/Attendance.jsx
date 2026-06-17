import "./Attendance.css";

const attendanceData = [
  {
    id: 1,
    name: "Rakesh",
    department: "IT",
    status: "Present",
    date: "07-06-2026",
  },
  {
    id: 2,
    name: "Rahul",
    department: "HR",
    status: "Absent",
    date: "07-06-2026",
  },
  {
    id: 3,
    name: "Kiran",
    department: "Finance",
    status: "Present",
    date: "07-06-2026",
  },
  {
    id: 4,
    name: "Suresh",
    department: "Sales",
    status: "Present",
    date: "07-06-2026",
  },
];

function Attendance() {
  const role =
    localStorage.getItem("role");


  const downloadCSV = () => {
    const headers = [
      "ID",
      "Name",
      "Department",
      "Status",
      "Date",
    ];

    const rows = attendanceData.map((emp) => [
      emp.id,
      emp.name,
      emp.department,
      emp.status,
      emp.date,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.join(",")
      ),
    ].join("\n");

    const blob = new Blob(
      [csvContent],
      {
        type: "text/csv;charset=utf-8;",
      }
    );

    const link =
      document.createElement("a");

    const url =
      URL.createObjectURL(blob);

    const today = new Date()
      .toISOString()
      .split("T")[0];

    link.setAttribute(
      "href",
      url
    );

    link.setAttribute(
      "download",
      `attendance-report-${today}.csv`
    );

    document.body.appendChild(
      link
    );

    link.click();

    document.body.removeChild(
      link
    );
  };

  return (
    <div className="attendance-page">

      <div className="attendance-header">

        <h2>
          Attendance Management
        </h2>

        <div className="attendance-actions">

          <button className="mark-btn">
            Mark Attendance
          </button>

          {role === "admin" && (
            <button
              className="download-btn"
              onClick={downloadCSV}
            >
              Download Report
            </button>
          )}

        </div>

      </div>

      <div className="attendance-card">

        <table className="attendance-table">

          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Department</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>

          <tbody>

            {attendanceData.map(
              (emp) => (
                <tr key={emp.id}>

                  <td>{emp.id}</td>

                  <td>{emp.name}</td>

                  <td>
                    {emp.department}
                  </td>

                  <td>

                    <span
                      className={
                        emp.status ===
                          "Present"
                          ? "present"
                          : "absent"
                      }
                    >
                      {emp.status}
                    </span>

                  </td>

                  <td>{emp.date}</td>

                </tr>
              )
            )}

          </tbody>

        </table>

      </div>

    </div>
  );
}

export default Attendance;