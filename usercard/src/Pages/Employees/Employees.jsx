import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  FaBan,
  FaEdit,
  FaExchangeAlt,
  FaHistory,
  FaTrash,
  FaUndo,
} from "react-icons/fa";

import {
  getEmployees,
  addEmployee,
  updateEmployee,
  deleteEmployee,
  suspendEmployee,
  reinstateEmployee,
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
const normalizeStatus = (status) => {
  const value = (status || "active").toLowerCase();
  return value === "inactive" ? "deactivated" : value;
};
const statusLabel = (status) => {
  const value = normalizeStatus(status);
  if (value === "deactivated") return "Deactivated";
  if (value === "suspended") return "Suspended";
  return "Active";
};

const syncLocalUserStatus = (employee) => {
  const users = readJson("users", []);
  if (users.length) {
    writeJson(
      "users",
      users.map((user) =>
        user.email === employee.email
          ? {
            ...user,
            status: employee.status,
            employeeId: employee.id,
            suspension_date: employee.suspension_date || "",
            suspension_reason: employee.suspension_reason || "",
            suspended_by: employee.suspended_by || "",
          }
          : user
      )
    );
  }

  if (localStorage.getItem("email") === employee.email) {
    localStorage.setItem("status", normalizeStatus(employee.status));
    localStorage.setItem("suspension_date", employee.suspension_date || "");
    localStorage.setItem("suspension_reason", employee.suspension_reason || "");
    localStorage.setItem("suspended_by", employee.suspended_by || "");
  }
};

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
  const [showSuspensionModal, setShowSuspensionModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [transferForm, setTransferForm] = useState({ department: "", reason: "" });
  const [suspensionReason, setSuspensionReason] = useState("");
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
    company_id: getCompanyId(),
    designation: "",
    phone_number: "",
    employee_code: "",
    profile_picture: "",
    address: "",
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
      company_id: getCompanyId(),
      designation: "",
      phone_number: "",
      employee_code: "",
      profile_picture: "",
      address: "",
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
      const payload = { ...formData, company_id: companyId, admin_name: adminName };
      if (editId) {
        await updateEmployee(editId, payload);
      } else {
        await addEmployee(payload);
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
      status: normalizeStatus(employee.status),
      join_date: employee.join_date || "",
      company_id: employee.company_id || 1,
      designation: employee.designation || "",
      phone_number: employee.phone_number || "",
      employee_code: employee.employee_code || "",
      profile_picture: employee.profile_picture || "",
      address: employee.address || "",
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

  const openSuspensionModal = (employee) => {
    setSelectedEmployee(employee);
    setSuspensionReason(employee.suspension_reason || "");
    setShowSuspensionModal(true);
  };

  const closeSuspensionModal = () => {
    setShowSuspensionModal(false);
    setSelectedEmployee(null);
    setSuspensionReason("");
  };

  const updateEmployeeInState = (updatedEmployee) => {
    const nextEmployees = employees.map((employee) =>
      employee.id === updatedEmployee.id ? updatedEmployee : employee
    );
    setEmployees(nextEmployees);
    writeJson(`employees_cache_${companyId}`, nextEmployees);
    syncLocalUserStatus(updatedEmployee);
  };

  const handleSuspend = async (event) => {
    event.preventDefault();
    if (!selectedEmployee || !suspensionReason.trim()) return;

    try {
      const response = await suspendEmployee(selectedEmployee.id, {
        company_id: companyId,
        admin_name: adminName,
        reason: suspensionReason.trim(),
      });
      updateEmployeeInState(response.data);
      toast.success("Account suspended successfully");
      closeSuspensionModal();
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.detail || "Suspension failed");
    }
  };

  const handleReinstate = async (employee) => {
    if (!window.confirm(`Reinstate ${employee.name}?`)) return;

    try {
      const response = await reinstateEmployee(employee.id, companyId, adminName);
      updateEmployeeInState(response.data);
      toast.success("Account reinstated successfully");
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.detail || "Reinstatement failed");
    }
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
          company_id: companyId,
        });
        serverTransfer = transferResponse?.transfer || null;
      } catch {
        await updateEmployee(selectedEmployee.id, { ...updatedEmployee, company_id: companyId, admin_name: adminName });
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
      await deleteEmployee(id, companyId, adminName);
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
              <th>Profile</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {currentEmployees.map((employee) => (
              <tr key={employee.id}>
                <td>
                  <div className="employee-cell">
                    <div className="employee-avatar">
                      {employee.name?.charAt(0).toUpperCase()}
                    </div>

                    <div className="employee-details">
                      <h4>{employee.name}</h4>
                      <p>{employee.email}</p>
                    </div>
                  </div>
                </td>

                <td>{employee.role}</td>
                <td>{employee.department}</td>
                <td>
                  <span className={`status-badge ${normalizeStatus(employee.status)}`}>
                    {statusLabel(employee.status)}
                  </span>
                </td>
                <td>
                  <span
                    className={`profile-completion-badge ${(employee.profile_completion_score ?? 0) === 100
                        ? "complete"
                        : (employee.profile_completion_score ?? 0) < 60
                          ? "low"
                          : ""
                      }`}
                  >
                    {employee.profile_completion_score ?? 0}%
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

                      {normalizeStatus(employee.status) === "suspended" ? (
                        <button
                          className="reinstate-btn"
                          onClick={() => handleReinstate(employee)}
                        >
                          <FaUndo />
                          <span>Reinstate</span>
                        </button>
                      ) : (
                        <button
                          className="suspend-btn"
                          onClick={() => openSuspensionModal(employee)}
                          disabled={normalizeStatus(employee.status) === "deactivated"}
                        >
                          <FaBan />
                          <span>Suspend</span>
                        </button>
                      )}

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


      {role === "admin" && showSuspensionModal && selectedEmployee && (
        <div className="modal-overlay">
          <div className="modal-content suspension-modal">
            <div className="modal-header">
              <div>
                <h3>Suspend Account</h3>
                <p>{selectedEmployee.name} &bull; {selectedEmployee.role}</p>
              </div>
              <button className="close-btn" onClick={closeSuspensionModal}>x</button>
            </div>

            <form className="transfer-form" onSubmit={handleSuspend}>
              <label>
                Suspension reason
                <textarea
                  placeholder="Explain why this account is being suspended"
                  value={suspensionReason}
                  onChange={(event) => setSuspensionReason(event.target.value)}
                  required
                />
              </label>

              <div className="transfer-modal-actions">
                <button type="button" className="transfer-cancel-btn" onClick={closeSuspensionModal}>Cancel</button>
                <button type="submit" className="suspension-submit-btn">Suspend Account</button>
              </div>
            </form>
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
