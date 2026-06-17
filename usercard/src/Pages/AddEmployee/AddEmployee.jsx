import { useState } from "react";
import { addEmployee } from "../../services/employeeService";
import { useNavigate } from "react-router-dom";

import "./AddEmployee.css";

function AddEmployee() {
  const navigate = useNavigate();

  const [formData, setFormData] =
    useState({
      name: "",
      email: "",
      role: "",
      department: "",
      salary: "",
      city: "",
    });

  const [errors, setErrors] =
    useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    setErrors({
      ...errors,
      [e.target.name]: "",
    });
  };

  const validate = () => {
    let temp = {};

    if (!formData.name.trim()) {
      temp.name = "Name is required";
    }

    if (!formData.email.trim()) {
      temp.email = "Email is required";
    } else if (
      !/\S+@\S+\.\S+/.test(
        formData.email
      )
    ) {
      temp.email =
        "Enter valid email";
    }

    if (!formData.role) {
      temp.role =
        "Role is required";
    }

    if (
      !formData.department.trim()
    ) {
      temp.department =
        "Department is required";
    }

    setErrors(temp);

    return Object.keys(temp)
      .length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      setLoading(true);

      await addEmployee(formData);

      alert(
        "Employee Added Successfully"
      );

      navigate("/employees");

    } catch (error) {
      console.error(error);

      alert(
        "Failed to add employee"
      );
    } finally {
      setLoading(false);
    }
  };

  const isFormValid =
    formData.name.trim() &&
    formData.email.trim() &&
    formData.role &&
    formData.department.trim();

  return (
    <div className="add-employee">
      <div className="form-card">

        <h2>Add Employee</h2>

        <form onSubmit={handleSubmit}>

          {/* Name */}
          <div className="form-group">
            <input
              type="text"
              name="name"
              placeholder="Employee Name"
              value={formData.name}
              onChange={handleChange}
            />

            {errors.name && (
              <span className="error">
                {errors.name}
              </span>
            )}
          </div>

          {/* Email */}
          <div className="form-group">
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
            />

            {errors.email && (
              <span className="error">
                {errors.email}
              </span>
            )}
          </div>

          {/* Role */}
          <div className="form-group">
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
            >
              <option value="">
                Select Role
              </option>

              <option value="admin">
                Admin
              </option>

              <option value="user">
                User
              </option>
            </select>

            {errors.role && (
              <span className="error">
                {errors.role}
              </span>
            )}
          </div>

          {/* Department */}
          <div className="form-group">
            <input
              type="text"
              name="department"
              placeholder="Department"
              value={
                formData.department
              }
              onChange={handleChange}
            />

            {errors.department && (
              <span className="error">
                {errors.department}
              </span>
            )}
          </div>

          {/* Salary */}
          <input
            type="number"
            name="salary"
            placeholder="Salary"
            value={formData.salary}
            onChange={handleChange}
          />

          {/* City */}
          <input
            type="text"
            name="city"
            placeholder="City"
            value={formData.city}
            onChange={handleChange}
          />

          <button
            type="submit"
            disabled={
              !isFormValid || loading
            }
          >
            {loading
              ? "Saving..."
              : "Add Employee"}
          </button>

        </form>

      </div>
    </div>
  );
}

export default AddEmployee;