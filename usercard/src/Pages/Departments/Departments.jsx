import { useEffect, useMemo, useState } from "react";
import { FaSearch, FaBuilding } from "react-icons/fa";
import { getAnalytics } from "../../services/employeeService";
import "./Departments.css";

const getCompanyId = () => localStorage.getItem("company_id") || "1";

function Departments() {
  const companyId = getCompanyId();

  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDepartments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  const fetchDepartments = async () => {
    setLoading(true);
    setError("");
    try {
      const analytics = await getAnalytics(companyId);
      const distribution = analytics?.department_distribution || [];
      const mapped = distribution
        .map((entry) => ({
          id: entry.name,
          name: entry.name,
          employees: entry.value,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
      setDepartments(mapped);
    } catch (err) {
      console.error(err);
      setError("Could not load departments.");
    } finally {
      setLoading(false);
    }
  };

  const filteredDepartments = useMemo(() => {
    return departments.filter((department) =>
      department.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, departments]);

  return (
    <div className="departments-page">
      <div className="department-header">
        <div>
          <h1>Departments</h1>
          <p>Departments are based on the actual employees in your company.</p>
        </div>
      </div>

      <div className="department-toolbar">
        <div className="search-box">
          <FaSearch />
          <input
            type="text"
            placeholder="Search departments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {error && <p className="departments-error">{error}</p>}

      <div className="department-grid">
        {!loading && filteredDepartments.length === 0 && (
          <p className="departments-empty">
            {departments.length === 0
              ? "No departments yet - add employees with a department to see them here."
              : "No departments match your search."}
          </p>
        )}

        {filteredDepartments.map((department) => (
          <div key={department.id} className="department-card">
            <div className="department-icon">
              <FaBuilding />
            </div>

            <div className="department-info">
              <h3>{department.name}</h3>
              <span>
                {department.employees} Employee{department.employees !== 1 && "s"}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="department-footer">
        <div className="department-count">
          <span>Total Departments</span>
          <strong>{departments.length}</strong>
        </div>
      </div>
    </div>
  );
}

export default Departments;
