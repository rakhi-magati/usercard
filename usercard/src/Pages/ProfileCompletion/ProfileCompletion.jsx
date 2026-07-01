import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { FaChartBar, FaFilter, FaSlidersH } from "react-icons/fa";
import {
  getProfileCompletionOverview,
  setProfileCompletionThreshold,
} from "../../services/employeeService";
import "./ProfileCompletion.css";

const getCompanyId = () => parseInt(localStorage.getItem("company_id") || "1");

function ProfileCompletion() {
  const companyId = getCompanyId();
  const adminName = localStorage.getItem("userName") || localStorage.getItem("name") || "Admin";

  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [belowThresholdOnly, setBelowThresholdOnly] = useState(false);
  const [thresholdInput, setThresholdInput] = useState("");
  const [savingThreshold, setSavingThreshold] = useState(false);

  const fetchOverview = async (filterBelow = belowThresholdOnly) => {
    setLoading(true);
    try {
      const data = await getProfileCompletionOverview(companyId, filterBelow);
      setOverview(data);
      setThresholdInput(String(data.threshold));
    } catch (error) {
      console.error(error);
      toast.error("Failed to load profile completion data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleFilter = () => {
    const next = !belowThresholdOnly;
    setBelowThresholdOnly(next);
    fetchOverview(next);
  };

  const handleThresholdSave = async (event) => {
    event.preventDefault();
    const value = parseInt(thresholdInput, 10);
    if (Number.isNaN(value) || value < 0 || value > 100) {
      toast.error("Threshold must be a number between 0 and 100");
      return;
    }

    setSavingThreshold(true);
    try {
      await setProfileCompletionThreshold(companyId, value, adminName);
      toast.success("Threshold updated");
      fetchOverview();
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.detail || "Failed to update threshold");
    } finally {
      setSavingThreshold(false);
    }
  };

  if (loading) return <div className="loading">Loading profile completion data...</div>;

  const employees = overview?.employees || [];

  return (
    <div className="profile-completion-page">
      <div className="page-header">
        <h1><FaChartBar /> Profile Completion</h1>
        <p>Monitor profile completeness across your company and identify employees who need a nudge.</p>
      </div>

      <div className="completion-stats-grid">
        <div className="stat-box">
          <span className="stat-label">Average Completion</span>
          <span className="stat-value">{overview?.average_completion ?? 0}%</span>
        </div>
        <div className="stat-box">
          <span className="stat-label">Total Employees</span>
          <span className="stat-value">{overview?.total_employees ?? 0}</span>
        </div>
        <div className="stat-box warn">
          <span className="stat-label">Below Threshold</span>
          <span className="stat-value">{overview?.below_threshold_count ?? 0}</span>
        </div>
        <div className="stat-box good">
          <span className="stat-label">Fully Completed</span>
          <span className="stat-value">{overview?.fully_completed_count ?? 0}</span>
        </div>
      </div>

      <div className="controls-row">
        <button className={`filter-btn ${belowThresholdOnly ? "active" : ""}`} onClick={toggleFilter}>
          <FaFilter /> {belowThresholdOnly ? "Showing Below Threshold Only" : "Show Below Threshold Only"}
        </button>

        <form className="threshold-form" onSubmit={handleThresholdSave}>
          <FaSlidersH />
          <label htmlFor="threshold-input">Alert threshold</label>
          <input
            id="threshold-input"
            type="number"
            min="0"
            max="100"
            value={thresholdInput}
            onChange={(event) => setThresholdInput(event.target.value)}
          />
          <span>%</span>
          <button type="submit" disabled={savingThreshold}>
            {savingThreshold ? "Saving..." : "Save"}
          </button>
        </form>
      </div>

      <div className="table-card">
        <table className="completion-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Department</th>
              <th>Designation</th>
              <th>Completion</th>
              <th>Missing Fields</th>
            </tr>
          </thead>
          <tbody>
            {employees.length === 0 ? (
              <tr>
                <td colSpan={5} className="empty-cell">No employees match this view.</td>
              </tr>
            ) : (
              employees.map((employee) => (
                <tr key={employee.id}>
                  <td>
                    <div className="employee-info">
                      <strong>{employee.name}</strong>
                      <span>{employee.email}</span>
                    </div>
                  </td>
                  <td>{employee.department || "-"}</td>
                  <td>{employee.designation || "-"}</td>
                  <td>
                    <div className="mini-progress-track">
                      <div
                        className={`mini-progress-fill ${employee.completion_percentage === 100 ? "complete" : employee.below_threshold ? "low" : ""}`}
                        style={{ width: `${employee.completion_percentage}%` }}
                      />
                    </div>
                    <span className="mini-progress-label">{employee.completion_percentage}%</span>
                  </td>
                  <td>
                    {employee.missing_fields.length === 0 ? (
                      <span className="complete-tag">Complete</span>
                    ) : (
                      <span className="missing-tag">{employee.missing_fields.join(", ")}</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ProfileCompletion;
