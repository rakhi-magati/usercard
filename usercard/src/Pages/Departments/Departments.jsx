import React, { useMemo, useState } from "react";
import {
  FaPlus,
  FaSearch,
  FaBuilding,
  FaTimes,
} from "react-icons/fa";
import "./Departments.css";

const initialDepartments = [
  {
    id: 1,
    name: "AI Analyst",
    employees: 1,
  },
  {
    id: 2,
    name: "Deployment",
    employees: 0,
  },
  {
    id: 3,
    name: "Design",
    employees: 1,
  },
  {
    id: 4,
    name: "Human Resources",
    employees: 1,
  },
  {
    id: 5,
    name: "Marketing",
    employees: 3,
  },
  {
    id: 6,
    name: "Product",
    employees: 1,
  },
];

function Departments() {
  const [departments, setDepartments] =
    useState(initialDepartments);

  const [search, setSearch] = useState("");

  const [showModal, setShowModal] =
    useState(false);

  const [departmentName, setDepartmentName] =
    useState("");

  const filteredDepartments = useMemo(() => {
    return departments.filter((department) =>
      department.name
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [search, departments]);

  const addDepartment = () => {
    if (!departmentName.trim()) {
      alert("Department name is required.");
      return;
    }

    setDepartments([
      ...departments,
      {
        id: Date.now(),
        name: departmentName,
        employees: 0,
      },
    ]);

    setDepartmentName("");
    setShowModal(false);
  };

  return (
    <div className="departments-page">

      <div className="department-header">

        <div>

          <h1>Departments</h1>

          <p>
            Organize employees by department
          </p>

        </div>

        <button
          className="add-btn"
          onClick={() => setShowModal(true)}
        >
          <FaPlus />
          Add Department
        </button>

      </div>

      <div className="department-toolbar">

        <div className="search-box">

          <FaSearch />

          <input
            type="text"
            placeholder="Search departments..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

        </div>

      </div>

      <div className="department-grid">

        {filteredDepartments.map((department) => (

          <div
            key={department.id}
            className="department-card"
          >

            <div className="department-icon">

              <FaBuilding />

            </div>

            <div className="department-info">

              <h3>{department.name}</h3>

              <span>
                {department.employees} Employee
                {department.employees !== 1 && "s"}
              </span>

            </div>

          </div>

        ))}

      </div>

      <div className="department-footer">

        <div className="department-count">

          <span>Total Departments</span>

          <strong>
            {departments.length}
          </strong>

        </div>

      </div>

      {showModal && (

        <div className="modal-overlay">

          <div className="department-modal">

            <div className="modal-header">

              <h2>Add New Department</h2>

              <button
                onClick={() =>
                  setShowModal(false)
                }
              >
                <FaTimes />
              </button>

            </div>

            <div className="modal-body">

              <label>
                Department Name
              </label>

              <input
                type="text"
                placeholder="Enter department name"
                value={departmentName}
                onChange={(e) =>
                  setDepartmentName(
                    e.target.value
                  )
                }
              />

            </div>

            <div className="modal-footer">

              <button
                className="cancel-btn"
                onClick={() =>
                  setShowModal(false)
                }
              >
                Cancel
              </button>

              <button
                className="save-btn"
                onClick={addDepartment}
              >
                Save
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

export default Departments;