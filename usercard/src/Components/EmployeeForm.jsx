import "./EmployeeForm.css";

function EmployeeForm({
  formData,
  errors = {},
  setFormData,
  handleSubmit,
  isEdit,
  onCancel,
}) {

  

  //  Form validation check
  const isFormValid =
    formData.name?.trim() &&
    formData.email?.trim() &&
    formData.role?.trim() &&
    formData.department?.trim() &&
    Object.keys(errors).length === 0;

  return (
     <form className="employee-form" onSubmit={handleSubmit}>
      <h2 className="form-title">
        {isEdit ? "Edit Employee" : "Add Employee"}
      </h2>

      <div className="form-grid">

        {/* Name */}
        <div className="form-group">
          <label>
            Name <span>*</span>
          </label>

          <input
            type="text"
            placeholder="Employee name"
            value={formData.name || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                name: e.target.value,
              })
            }
          />

          {errors.name && (
            <p className="error-text">
              {errors.name}
            </p>
          )}
        </div>

        {/* Email */}
        <div className="form-group">
          <label>
            Email <span>*</span>
          </label>

          <input
            type="email"
            placeholder="employee@company.com"
            value={formData.email || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                email: e.target.value,
              })
            }
          />

          {errors.email && (
            <p className="error-text">
              {errors.email}
            </p>
          )}
        </div>

        {/* Role */}
        <div className="form-group">
          <label>
            Role <span>*</span>
          </label>

          <input
            type="text"
            placeholder="Developer"
            value={formData.role || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                role: e.target.value,
              })
            }
          />

          {errors.role && (
            <p className="error-text">
              {errors.role}
            </p>
          )}
        </div>

        {/* Designation */}
        <div className="form-group">
          <label>Designation</label>

          <input
            type="text"
            placeholder="Senior Software Engineer"
            value={formData.designation || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                designation: e.target.value,
              })
            }
          />
        </div>

        {/* Phone Number */}
        <div className="form-group">
          <label>Phone Number</label>

          <input
            type="tel"
            placeholder="+1 555 123 4567"
            value={formData.phone_number || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                phone_number: e.target.value,
              })
            }
          />
        </div>

        {/* Employee ID */}
        <div className="form-group">
          <label>Employee ID</label>

          <input
            type="text"
            placeholder="EMP-1042"
            value={formData.employee_code || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                employee_code: e.target.value,
              })
            }
          />
        </div>

        {/* Profile Picture */}
        <div className="form-group">
          <label>Profile Picture URL</label>

          <input
            type="text"
            placeholder="https://example.com/photo.jpg"
            value={formData.profile_picture || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                profile_picture: e.target.value,
              })
            }
          />
        </div>

        {/* Address */}
        <div className="form-group">
          <label>Address</label>

          <input
            type="text"
            placeholder="Street, City, State, ZIP"
            value={formData.address || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                address: e.target.value,
              })
            }
          />
        </div>

        {/* Department */}
        <div className="form-group">
          <label>
            Department <span>*</span>
          </label>

          <input
            type="text"
            placeholder="IT Department"
            value={formData.department || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                department: e.target.value,
              })
            }
          />

          {errors.department && (
            <p className="error-text">
              {errors.department}
            </p>
          )}
        </div>

        {/* Status */}
        <div className="form-group">
          <label>Status</label>

          <select
            value={formData.status || "active"}
            onChange={(e) =>
              setFormData({
                ...formData,
                status: e.target.value,
              })
            }
          >
            <option value="active">
              Active
            </option>

            <option value="deactivated">
              Deactivated
            </option>

            <option value="suspended">
              Suspended
            </option>

            <option value="suspended">
              Suspended
            </option>
          </select>
        </div>

        {/* Join Date */}
        <div className="form-group">
          <label>Joined Date</label>

          <input
            type="date"
            value={formData.join_date || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                join_date: e.target.value,
              })
            }
          />
        </div>

      </div>

      {/* Buttons */}
      <div className="form-actions">

        <button
          type="button"
          className="cancel-btn"
          onClick={onCancel}
        >
          Cancel
        </button>

       <button
          type="submit"
          className="submit-btn"
          disabled={
            !formData.name ||
            !formData.email ||
            !formData.role ||
            !formData.department ||
            !formData.join_date
          }
        >
          {isEdit
            ? "Update Employee"
            : "Add Employee"}
        </button>


      </div>
    </form>
  );
}

export default EmployeeForm;





