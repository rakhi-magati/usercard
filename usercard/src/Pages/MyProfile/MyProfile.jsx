import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { FaUserCircle, FaSave, FaExclamationCircle } from "react-icons/fa";
import {
  getMyProfileCompletion,
  updateMyProfile,
} from "../../services/employeeService";
import "./MyProfile.css";

const getCompanyId = () => parseInt(localStorage.getItem("company_id") || "1");
const getEmployeeId = () => parseInt(localStorage.getItem("employeeId") || "0");

const emptyForm = {
  first_name: "",
  last_name: "",
  phone_number: "",
  designation: "",
  profile_picture: "",
  address: "",
  employee_code: "",
};

function MyProfile() {
  const employeeId = getEmployeeId();
  const companyId = getCompanyId();

  const [completion, setCompletion] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchCompletion = async () => {
    if (!employeeId) {
      setLoading(false);
      return;
    }
    try {
      const data = await getMyProfileCompletion(employeeId, companyId);
      setCompletion(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load profile completion");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompletion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (field) => (event) => {
    setFormData((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!employeeId) {
      toast.error("Unable to identify your employee record");
      return;
    }

    setSaving(true);
    try {
      const updated = await updateMyProfile(employeeId, {
        ...formData,
        company_id: companyId,
      });
      toast.success("Profile updated successfully");
      setCompletion({
        employee_id: updated.id,
        completion_percentage: updated.profile_completion_score,
        missing_fields: updated.missing_fields || [],
        recommendation: updated.recommendation,
      });
      setFormData(emptyForm);
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.detail || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading">Loading your profile...</div>;

  if (!employeeId) {
    return (
      <div className="my-profile-page">
        <div className="empty-state">
          We couldn&apos;t find your employee record. Please contact your administrator.
        </div>
      </div>
    );
  }

  const percentage = completion?.completion_percentage ?? 0;
  const missingFields = completion?.missing_fields || [];

  return (
    <div className="my-profile-page">
      <div className="page-header">
        <h1><FaUserCircle /> My Profile</h1>
        <p>Keep your profile up to date to improve your account readiness.</p>
      </div>

      <div className="completion-card">
        <div className="completion-summary">
          <div className="completion-percentage">
            Profile Completion: <strong>{percentage}%</strong>
          </div>
          <div className="progress-bar-track">
            <div
              className={`progress-bar-fill ${percentage === 100 ? "complete" : ""}`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {completion?.recommendation && (
          <p className="completion-recommendation">{completion.recommendation}</p>
        )}

        {missingFields.length > 0 && (
          <div className="missing-fields">
            <h4><FaExclamationCircle /> Missing Information</h4>
            <ul>
              {missingFields.map((field) => (
                <li key={field}>{field}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <form className="profile-form" onSubmit={handleSubmit}>
        <h3>Complete Your Details</h3>
        <p className="form-hint">
          Only fields you fill in below will be updated. Leave a field blank to keep it unchanged.
        </p>

        <div className="form-grid">
          <div className="form-group">
            <label>First Name</label>
            <input
              type="text"
              placeholder="First name"
              value={formData.first_name}
              onChange={handleChange("first_name")}
            />
          </div>

          <div className="form-group">
            <label>Last Name</label>
            <input
              type="text"
              placeholder="Last name"
              value={formData.last_name}
              onChange={handleChange("last_name")}
            />
          </div>

          <div className="form-group">
            <label>Phone Number</label>
            <input
              type="tel"
              placeholder="+1 555 123 4567"
              value={formData.phone_number}
              onChange={handleChange("phone_number")}
            />
          </div>

          <div className="form-group">
            <label>Designation</label>
            <input
              type="text"
              placeholder="e.g. Senior Software Engineer"
              value={formData.designation}
              onChange={handleChange("designation")}
            />
          </div>

          <div className="form-group">
            <label>Employee ID</label>
            <input
              type="text"
              placeholder="e.g. EMP-1042"
              value={formData.employee_code}
              onChange={handleChange("employee_code")}
            />
          </div>

          <div className="form-group">
            <label>Profile Picture URL</label>
            <input
              type="text"
              placeholder="https://example.com/photo.jpg"
              value={formData.profile_picture}
              onChange={handleChange("profile_picture")}
            />
          </div>

          <div className="form-group full-width">
            <label>Address</label>
            <textarea
              placeholder="Street, City, State, ZIP"
              value={formData.address}
              onChange={handleChange("address")}
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="save-btn" disabled={saving}>
            <FaSave /> {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default MyProfile;
