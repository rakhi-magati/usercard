import { useEffect, useState } from "react";
import "./Employees.css";
import EmployeeCard from "../../Components/EmployeeCard/EmployeeCard";

function Employees() {
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await fetch(
          "https://jsonplaceholder.typicode.com/users"
        );

        const data = await response.json();

        // Convert API data to your card structure
        const formattedEmployees = data.map((user) => ({
          id: user.id,
          name: user.name,
          role: "Software Engineer",
          department: user.company.name,
          status: user.id % 2 === 0 ? "Active" : "Inactive",
          image: `https://i.pravatar.cc/150?img=${user.id}`,
          email: user.email,
          phone: user.phone,
        }));

        setEmployees(formattedEmployees);
      } catch (error) {
        console.error("Error fetching employees:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  const filteredEmployees = employees.filter(
    (employee) =>
      employee.name
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (department === "" ||
        employee.department === department)
  );

  const departments = [
    ...new Set(employees.map((emp) => emp.department)),
  ];

  if (loading) {
    return <h2>Loading employees...</h2>;
  }

  return (
    <div className="employees-page">
      <div className="employee-header">
        <div>
          <h1>Employees</h1>
          <p>Manage employee information</p>
        </div>

        <button className="add-btn">
          + Add Employee
        </button>
      </div>

      <div className="controls">
        <input
          type="text"
          placeholder="Search employee..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
        >
          <option value="">
            All Departments
          </option>

          {departments.map((dept) => (
            <option key={dept} value={dept}>
              {dept}
            </option>
          ))}
        </select>
      </div>

      <div className="employee-grid">
        {filteredEmployees.map((employee) => (
          <EmployeeCard
            key={employee.id}
            employee={employee}
          />
        ))}
      </div>
    </div>
  );
}

export default Employees;