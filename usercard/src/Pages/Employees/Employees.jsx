import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  FaEdit,
  FaTrash,
} from "react-icons/fa";

import {
  getEmployees,
  addEmployee,
  updateEmployee,
  deleteEmployee,
} from "../../services/employeeService";

import EmployeeForm from "../../Components/EmployeeForm";

import "./Employees.css";

function Employees() {
  const [employees, setEmployees] = useState([]);
  const [showModal, setShowModal] =
    useState(false);

  const [editId, setEditId] =
    useState(null);

  const [currentPage, setCurrentPage] =
    useState(1);

  const employeesPerPage = 6;

  const [formData, setFormData] = useState({
    name: "",
    department: "",
    salary: "",
    city: "",
    email: "",
    role: "",
    status: "active",
    join_date: "",
    company_id: 1,
  });
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    role: "",
    department: "",
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const data = await getEmployees();

      console.log(data); // <-- idi add cheyyi

      if (Array.isArray(data)) {
        setEmployees(data);
      } else {
        setEmployees([]);
      }
    } catch (error) {
      console.error(error);
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("Submitting:", formData);

    if (!formData.name.trim()) {
      toast.error("Name is required");
      return;
    }

    if (!formData.email.includes("@")) {
      toast.error("Enter valid email");
      return;
    }

    try {
      if (editId) {
        await updateEmployee(editId, formData);
      } else {
        await addEmployee(formData);
      }

      await fetchEmployees();

      setFormData({
        name: "",
        department: "",
        salary: "",
        city: "",
        email: "",
        role: "",
        status: "active",
        join_date: "",
        company_id: 1,
      });

      setEditId(null);
      setShowModal(false);

      toast.success(
        editId
          ? "Employee Updated Successfully"
          : "Employee Added Successfully"
      );
    } catch (error) {
      console.error(error);
      toast.error("Operation Failed");
    }
  };

  const handleEdit = (employee) => {
    setEditId(employee.id);

    setFormData({
      name: employee.name || "",
      department: employee.department || "",
      salary: employee.salary || "",
      city: employee.city || "",
      email: employee.email || "",
      role: employee.role || "",
      status: employee.status || "active",
      join_date: employee.join_date || "",
      company_id: employee.company_id || 1,
    });

    setShowModal(true);
  };

  const handleDelete = async (id) => {
    const confirmDelete =
      window.confirm(
        "Are you sure you want to delete this employee?"
      );

    if (!confirmDelete) return;

    try {
      await deleteEmployee(id);

      fetchEmployees();

      toast.success(
        "Employee Deleted Successfully"
      );
    } catch (error) {
      console.error(error);

      toast.error("Delete Failed");
    }
  };
  const indexOfLastEmployee =
    currentPage * employeesPerPage;

  const indexOfFirstEmployee =
    indexOfLastEmployee -
    employeesPerPage;

  const currentEmployees =
    employees.slice(
      indexOfFirstEmployee,
      indexOfLastEmployee
    );

  const totalPages = Math.ceil(
    employees.length /
    employeesPerPage
  );

  return (
    <div className="employees-container">
      {/* Header */}

      <div className="employee-header">
        <h2>Employee Management</h2>

        <button
          className="add-employee-btn"
          onClick={() => {
            setEditId(null);

            setFormData({
              name: "",
              department: "",
              salary: "",
              city: "",
              email: "",
              role: "",
              status: "active",
              join_date: "",
              company_id: 1,
            });

            setShowModal(true);
          }}
        >
          + Add Employee
        </button>
      </div>

      {/* Table */}

      <div className="table-card">
        <table className="employee-table">

          <thead>
            <tr>
              <th>Employee</th>
              <th>Role</th>
              <th>Department</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>

            {currentEmployees.map(
              (employee) => (
                <tr key={employee.id}>

                  <td className="employee-info">

                    <div className="employee-avatar">

                      {employee.name
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("")
                        .substring(0, 2)}

                    </div>

                    <div>

                      <h4>{employee.name}</h4>

                      <p>{employee.email}</p>

                    </div>

                  </td>

                  <td>{employee.role}</td>

                  <td>{employee.department}</td>

                  <td>
                    <span
                      className={`status-badge ${employee.status === "inactive"
                        ? "inactive"
                        : "active"
                        }`}
                    >
                      {employee.status === "inactive"
                        ? "Inactive"
                        : "Active"}
                    </span>

                  </td>

                  <td>
                    {employee.join_date || "N/A"}

                  </td>

                  <td>
                    <div className="action-buttons">

                      <button
                        className="edit-btn"
                        onClick={() =>
                          handleEdit(employee)
                        }
                      >
                        <FaEdit />
                        <span>Edit</span>
                      </button>

                      <button
                        className="delete-btn"
                        onClick={() =>
                          handleDelete(employee.id)
                        }
                      >
                        <FaTrash />
                        <span>Delete</span>
                      </button>

                    </div>
                  </td>

                </tr>



              ))}

          </tbody>

        </table>
        <div className="pagination-container">

          <p>
            Showing{" "}
            {employees.length === 0
              ? 0
              : indexOfFirstEmployee + 1}
            -
            {Math.min(
              indexOfLastEmployee,
              employees.length
            )}{" "}
            of {employees.length} employees
          </p>

          <div className="pagination-buttons">

            <button
              disabled={currentPage === 1}
              onClick={() =>
                setCurrentPage(
                  currentPage - 1
                )
              }
            >
              &lt;
            </button>

            {[
              ...Array(totalPages),
            ].map((_, index) => (
              <button
                key={index + 1}
                className={
                  currentPage ===
                    index + 1
                    ? "active-page"
                    : ""
                }
                onClick={() =>
                  setCurrentPage(
                    index + 1
                  )
                }
              >
                {index + 1}
              </button>
            ))}

            <button
              disabled={
                currentPage === totalPages
              }
              onClick={() =>
                setCurrentPage(
                  currentPage + 1
                )
              }
            >
              &gt;
            </button>

          </div>

        </div>
      </div>

      {/* Modal */}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            {/* <div className="modal-header">
              <h3>
                {editId
                  ? "Edit Employee"
                  : "Add Employee"}
              </h3>

              <button
                className="close-btn"
                onClick={() => {
                  setShowModal(false);
                  setEditId(null);
                }}
              >
                ✕
              </button>
            </div> */}

            <EmployeeForm
              formData={formData}
              errors={errors}
              setFormData={setFormData}
              handleSubmit={handleSubmit}
              isEdit={!!editId}
              onCancel={() =>
                setShowModal(false)
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default Employees;