import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  FaEdit,
  FaExchangeAlt,
  FaHistory,
  FaTrash,
} from "react-icons/fa";

import {
  getEmployees,
  addEmployee,
  updateEmployee,
  deleteEmployee,
  transferEmployeeDepartment,
  getDepartmentTransferHistory,
} from "../../services/employeeService";

import EmployeeForm from "../../Components/EmployeeForm";

import "./Employees.css";

const defaultDepartments = [
  "Engineering",
  "Human Resources",
  "Finance",
  "Sales",
  "Marketing",
  "Operations",
  "Design",
  "IT",
  "General Department",
];

const readJson = (key, fallback) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const writeJson = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new Event("attendance-storage-changed"));
};

const getCompanyId = () => localStorage.getItem("company_id") || "1";

const updateLocalUserDepartment = (employee, department) => {
  const users = readJson("users", []);
  if (users.length) {
    writeJson(
      "users",
      users.map((user) =>
        user.email === employee.email ? { ...user, department } : user
      )
    );
  }

  if (localStorage.getItem("email") === employee.email) {
    localStorage.setItem("department", department);
  }
};

const updateDepartmentPermissions = (companyId, employee, department) => {
  const key = `department_permissions_${companyId}`;
  const permissions = readJson(key, null);
  if (!permissions) return;

  if (Array.isArray(permissions)) {
    writeJson(
      key,
      permissions.map((entry) => {
        const matches = entry.employee_id === employee.id || entry.employeeId === employee.id || entry.email === employee.email;
        return matches
          ? { ...entry, department, currentDepartment: department, allowedDepartments: [department] }
          : entry;
      })
    );
    return;
  }

  if (typeof permissions === "object") {
    const next = { ...permissions };
    [employee.id, employee.email].forEach((lookupKey) => {
      if (next[lookupKey]) {
        next[lookupKey] = {
          ...next[lookupKey],
          department,
          currentDepartment: department,
          allowedDepartments: [department],
        };
      }
    });
    writeJson(key, next);
  }
};

const recordTransferArtifacts = ({ companyId, employee, fromDepartment, toDepartment, reason, adminName }) => {
  const timestamp = new Date().toISOString();
  const transfer = {
    id: `transfer-${employee.id}-${Date.now()}`,
    employee_id: employee.id,
    employee_name: employee.name,
    employee_email: employee.email,
    from_department: fromDepartment,
    to_department: toDepartment,
    reason: reason || "Department transfer",
    transferred_by: adminName,
    transferred_at: timestamp,
  };

  writeJson(`department_transfer_history_${companyId}`, [
    transfer,
    ...readJson(`department_transfer_history_${companyId}`, []),
  ]);

  writeJson(`local_audit_logs_${companyId}`, [
    {
      id: `audit-transfer-${employee.id}-${Date.now()}`,
      user_name: adminName,
      action: `Department Transfer: ${fromDepartment} to ${toDepartment}`,
      related_employee: employee.name,
      company_id: companyId,
      timestamp,
    },
    ...readJson(`local_audit_logs_${companyId}`, []),
  ]);

  writeJson(`local_notifications_${companyId}`, [
    {
      id: `department-transfer-${employee.id}-${Date.now()}`,
      type: "department_transfer",
      title: "Department Updated",
      message: `Your department changed from ${fromDepartment} to ${toDepartment}.`,
      recipient_email: employee.email,
      related_id: employee.id,
      created_at: timestamp,
      is_read: false,
    },
    ...readJson(`local_notifications_${companyId}`, []),
  ]);

  return transfer;
};

function Employees() {
  const role = localStorage.getItem("role")?.toLowerCase() || "user";
  const [employees, setEmployees] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [transferForm, setTransferForm] = useState({ department: "", reason: "" });
  const [transferHistory, setTransferHistory] = useState(() =>
    readJson(`department_transfer_history_${getCompanyId()}`, [])
  );
  const [editId, setEditId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const employeesPerPage = 6;
  const companyId = getCompanyId();
  const adminName = localStorage.getItem("userName") || localStorage.getItem("name") || "Admin";

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
  const [errors] = useState({
    name: "",
    email: "",
    role: "",
    department: "",
  });

  const departmentOptions = useMemo(() => {
    const departments = employees
      .map((employee) => employee.department)
      .filter(Boolean);
    return Array.from(new Set([...defaultDepartments, ...departments])).sort();
  }, [employees]);

  useEffect(() => {
    fetchEmployees();
    fetchTransferHistory();
  }, [companyId]);

  const fetchTransferHistory = async () => {
    try {
      const data = await getDepartmentTransferHistory(companyId);
      const history = Array.isArray(data) ? data : [];
      setTransferHistory(history);
      writeJson(`department_transfer_history_${companyId}`, history);
    } catch {
      setTransferHistory(readJson(`department_transfer_history_${companyId}`, []));
    }
  };

  const fetchEmployees = async () => {
    try {
      const data = await getEmployees(companyId);
      if (Array.isArray(data)) {
        setEmployees(data);
        writeJson(`employees_cache_${companyId}`, data);
      } else {
        setEmployees([]);
      }
    } catch (error) {
      console.error(error);
      setEmployees(readJson(`employees_cache_${companyId}`, []));
    }
  };

  const resetForm = () => {
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

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
      resetForm();
      setEditId(null);
      setShowModal(false);

      toast.success(editId ? "Employee Updated Successfully" : "Employee Added Successfully");
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

  const openTransferModal = (employee) => {
    setSelectedEmployee(employee);
    setTransferForm({ department: employee.department || "", reason: "" });
    setShowTransferModal(true);
  };

  const closeTransferModal = () => {
    setShowTransferModal(false);
    setSelectedEmployee(null);
    setTransferForm({ department: "", reason: "" });
  };

  const handleTransfer = async (event) => {
    event.preventDefault();
    if (!selectedEmployee) return;

    const nextDepartment = transferForm.department.trim();
    const previousDepartment = selectedEmployee.department || "Unassigned";

    if (!nextDepartment) {
      toast.error("Select a department");
      return;
    }

    if (nextDepartment === previousDepartment) {
      toast.error("Choose a different department");
      return;
    }

    const updatedEmployee = {
      ...selectedEmployee,
      department: nextDepartment,
    };

    try {
      let serverTransfer = null;
      try {
        const transferResponse = await transferEmployeeDepartment(selectedEmployee.id, {
          department: nextDepartment,
          reason: transferForm.reason,
          admin_name: adminName,
        });
        serverTransfer = transferResponse?.transfer || null;
      } catch {
        await updateEmployee(selectedEmployee.id, updatedEmployee);
      }

      const nextEmployees = employees.map((employee) =>
        employee.id === selectedEmployee.id ? updatedEmployee : employee
      );
      setEmployees(nextEmployees);
      writeJson(`employees_cache_${companyId}`, nextEmployees);

      updateLocalUserDepartment(selectedEmployee, nextDepartment);
      updateDepartmentPermissions(companyId, selectedEmployee, nextDepartment);

      const transfer = serverTransfer || recordTransferArtifacts({
        companyId,
        employee: selectedEmployee,
        fromDepartment: previousDepartment,
        toDepartment: nextDepartment,
        reason: transferForm.reason,
        adminName,
      });
      setTransferHistory((history) => [transfer, ...history.filter((item) => item.id !== transfer.id)]);
      if (serverTransfer) {
        writeJson(`department_transfer_history_${companyId}`, [
          transfer,
          ...readJson(`department_transfer_history_${companyId}`, []).filter((item) => item.id !== transfer.id),
        ]);
      }

      toast.success("Employee transferred successfully");
      closeTransferModal();
    } catch (error) {
      console.error(error);
      toast.error("Department transfer failed");
    }
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this employee?");
    if (!confirmDelete) return;

    try {
      await deleteEmployee(id);
      fetchEmployees();
      toast.success("Employee Deleted Successfully");
    } catch (error) {
      console.error(error);
      toast.error("Delete Failed");
    }
  };

  const indexOfLastEmployee = currentPage * employeesPerPage;
  const indexOfFirstEmployee = indexOfLastEmployee - employeesPerPage;
  const currentEmployees = employees.slice(indexOfFirstEmployee, indexOfLastEmployee);
  const totalPages = Math.ceil(employees.length / employeesPerPage);

  return (
    <div className="employees-container">
      <div className="employee-header">
        <div>
          <h2>Employee Management</h2>
          <p>Transfer employees between departments and track every move.</p>
        </div>

        {role === "admin" && (
          <button
            className="add-employee-btn"
            onClick={() => {
              setEditId(null);
              resetForm();
              setShowModal(true);
            }}
          >
            + Add Employee
          </button>
        )}
      </div>

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
            {currentEmployees.map((employee) => (
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
                  <span className={`status-badge ${employee.status === "inactive" ? "inactive" : "active"}`}>
                    {employee.status === "inactive" ? "Inactive" : "Active"}
                  </span>
                </td>
                <td>{employee.join_date || "N/A"}</td>
                <td>
                  {role === "admin" ? (
                    <div className="action-buttons">
                      <button
                        className="edit-btn"
                        onClick={() => handleEdit(employee)}
                      >
                        <FaEdit />
                        <span>Edit</span>
                      </button>

                      <button
                        className="transfer-btn"
                        onClick={() => openTransferModal(employee)}
                      >
                        <FaExchangeAlt />
                        <span>Transfer</span>
                      </button>

                      <button
                        className="delete-btn"
                        onClick={() => handleDelete(employee.id)}
                      >
                        <FaTrash />
                        <span>Delete</span>
                      </button>
                    </div>
                  ) : (
                    "-"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="pagination-container">
          <p>
            Showing {employees.length === 0 ? 0 : indexOfFirstEmployee + 1}-
            {Math.min(indexOfLastEmployee, employees.length)} of {employees.length} employees
          </p>

          <div className="pagination-buttons">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>
              &lt;
            </button>

            {[...Array(totalPages)].map((_, index) => (
              <button
                key={index + 1}
                className={currentPage === index + 1 ? "active-page" : ""}
                onClick={() => setCurrentPage(index + 1)}
              >
                {index + 1}
              </button>
            ))}

            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)}>
              &gt;
            </button>
          </div>
        </div>
      </div>

      {role === "admin" && (
        <section className="transfer-history-card">
          <div className="transfer-history-header">
            <h3><FaHistory /> Department Transfer History</h3>
            <span>{transferHistory.length} records</span>
          </div>

          <div className="transfer-history-list">
            {transferHistory.length === 0 ? (
              <p className="transfer-empty">No department transfers yet.</p>
            ) : (
              transferHistory.slice(0, 6).map((transfer) => (
                <div className="transfer-history-item" key={transfer.id}>
                  <div>
                    <strong>{transfer.employee_name}</strong>
                    <p>{transfer.from_department} to {transfer.to_department}</p>
                  </div>
                  <span>{new Date(transfer.transferred_at).toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        </section>

      )}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <EmployeeForm
              formData={formData}
              errors={errors}
              setFormData={setFormData}
              handleSubmit={handleSubmit}
              isEdit={!!editId}
              onCancel={() => setShowModal(false)}
            />
          </div>
        </div>
      )}


      {role === "admin" && showTransferModal && selectedEmployee && (
        <div className="modal-overlay">
          <div className="modal-content transfer-modal">
            <div className="modal-header">
              <div>
                <h3>Transfer Department</h3>
                <p>{selectedEmployee.name}</p>
              </div>
              <button className="close-btn" onClick={closeTransferModal}>x</button>
            </div>

            <form className="transfer-form" onSubmit={handleTransfer}>
              <label>
                Current department
                <input value={selectedEmployee.department || "Unassigned"} disabled />
              </label>

              <label>
                New department
                <select
                  value={transferForm.department}
                  onChange={(event) => setTransferForm({ ...transferForm, department: event.target.value })}
                  required
                >
                  <option value="">Select department</option>
                  {departmentOptions.map((department) => (
                    <option key={department} value={department}>{department}</option>
                  ))}
                </select>
              </label>

              <label>
                Reason
                <textarea
                  placeholder="Reason for transfer"
                  value={transferForm.reason}
                  onChange={(event) => setTransferForm({ ...transferForm, reason: event.target.value })}
                />
              </label>

              <div className="transfer-modal-actions">
                <button type="button" className="transfer-cancel-btn" onClick={closeTransferModal}>Cancel</button>
                <button type="submit" className="transfer-submit-btn">Transfer Employee</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Employees;


