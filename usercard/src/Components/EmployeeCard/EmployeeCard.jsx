import "./EmployeeCard.css";

function EmployeeCard({ employee }) {
  return (
    <div className="employee-card">
      <img
        src={employee.image}
        alt={employee.name}
      />

      <h3>{employee.name}</h3>

      <p>{employee.role}</p>

      <p>{employee.email}</p>

      <span className="department">
        {employee.department}
      </span>

      <span
        className={`status ${employee.status.toLowerCase()}`}
      >
        {employee.status}
      </span>

      <button>View Profile</button>
    </div>
  );
}

export default EmployeeCard;