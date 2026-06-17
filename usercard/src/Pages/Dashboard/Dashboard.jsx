import { useEffect, useState } from "react";

import {
  FaUsers,
  FaUserCheck,
  FaCalendarAlt,
  FaBuilding,
} from "react-icons/fa";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";

import StatCard from "../../Components/StatCard/StatCard";
import { getEmployees } from "../../services/employeeService";

import "./Dashboard.css";

function Dashboard() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);

      const employeesData =
        await getEmployees();

      setEmployees(
        Array.isArray(employeesData)
          ? employeesData
          : []
      );

      setError("");

    } catch (err) {

      setError(
        "Failed to load employees"
      );

    } finally {

      setLoading(false);

    }
  };

  const totalEmployees =
    employees.length;

  const activeEmployees =
    employees.length;

  const departments =
    new Set(
      employees.map(
        (emp) =>
          emp.department ||
          "Unknown"
      )
    ).size;

  const chartData =
    employees.map(
      (emp, index) => ({
        day: `Emp ${index + 1}`,
        employees: index + 1,
      })
    );

  const departmentData = [
    {
      name: "IT",
      value: 15,
    },
    {
      name: "HR",
      value: 8,
    },
    {
      name: "Finance",
      value: 6,
    },
    {
      name: "Sales",
      value: 10,
    },
  ];

  const attendanceData = [
    {
      day: "Mon",
      attendance: 90,
    },
    {
      day: "Tue",
      attendance: 85,
    },
    {
      day: "Wed",
      attendance: 92,
    },
    {
      day: "Thu",
      attendance: 88,
    },
    {
      day: "Fri",
      attendance: 95,
    },
  ];

  const COLORS = [
    "#2563eb",
    "#10b981",
    "#f59e0b",
    "#ef4444",
  ];

  if (loading) {
    return (
      <div className="loading">
        Loading Dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-box">
        <h3>{error}</h3>

        <button
          onClick={
            fetchEmployees
          }
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard">

      {/* Header */}

      <div className="dashboard-header">

        <div>
          <h1>
            Dashboard
          </h1>

          <p>
            Welcome back,
            Admin 👋
          </p>
        </div>

        <div className="date-box">
          📅{" "}
          {new Date().toLocaleDateString()}
        </div>

      </div>

      {/* Stats */}

      <div className="stats-grid">

        <StatCard
          title="Total Employees"
          value={
            totalEmployees
          }
          icon={<FaUsers />}
        />

        <StatCard
          title="Active Employees"
          value={
            activeEmployees
          }
          icon={
            <FaUserCheck />
          }
        />

        <StatCard
          title="Attendance"
          value="92%"
          icon={
            <FaCalendarAlt />
          }
        />

        <StatCard
          title="Departments"
          value={departments}
          icon={
            <FaBuilding />
          }
        />

      </div>

      {/* Overview */}

      <div className="bottom-grid">

        <div className="chart-card">

          <div className="card-top">
            <h3>
              Employee Overview
            </h3>
          </div>

          <ResponsiveContainer
            width="100%"
            height={300}
          >
            <LineChart
              data={chartData}
            >
              <CartesianGrid strokeDasharray="3 3" />

              <XAxis dataKey="day" />

              <YAxis />

              <Tooltip />

              <Line
                type="monotone"
                dataKey="employees"
                stroke="#2563eb"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>

        </div>

        <div className="recent-card">

          <h3>
            Recent Employees
          </h3>

          {employees
            .slice(0, 5)
            .map(
              (employee) => (
                <div
                  key={
                    employee.id
                  }
                  className="employee-item"
                >
                  <img
                    src={`https://i.pravatar.cc/40?u=${employee.id}`}
                    alt=""
                  />

                  <div>
                    <h4>
                      {
                        employee.name
                      }
                    </h4>

                    <p>
                      Employee
                    </p>
                  </div>

                  <span>
                    {
                      employee.department
                    }
                  </span>

                </div>
              )
            )}

        </div>

      </div>

      {/* Analytics */}

      <div className="analytics-grid">

        <div className="chart-card">

          <h3>
            Department Distribution
          </h3>

          <ResponsiveContainer
            width="100%"
            height={300}
          >
            <PieChart>

              <Pie
                data={
                  departmentData
                }
                dataKey="value"
                outerRadius={100}
                label
              >
                {departmentData.map(
                  (
                    entry,
                    index
                  ) => (
                    <Cell
                      key={
                        index
                      }
                      fill={
                        COLORS[
                          index
                        ]
                      }
                    />
                  )
                )}
              </Pie>

              <Tooltip />

            </PieChart>
          </ResponsiveContainer>

        </div>

        <div className="chart-card">

          <h3>
            Attendance Analytics
          </h3>

          <ResponsiveContainer
            width="100%"
            height={300}
          >
            <BarChart
              data={
                attendanceData
              }
            >
              <XAxis dataKey="day" />

              <YAxis />

              <Tooltip />

              <Bar
                dataKey="attendance"
                fill="#2563eb"
              />
            </BarChart>
          </ResponsiveContainer>

        </div>

      </div>

      {/* Activity */}

      <div className="activity-card">

        <h3>
          Recent Activity
        </h3>

        <div className="activity-item">
          ✓ Employee Added
        </div>

        <div className="activity-item">
          ✓ Employee Updated
        </div>

        <div className="activity-item">
          ✓ Attendance Updated
        </div>

        <div className="activity-item">
          ✓ Department Created
        </div>

      </div>

    </div>
  );
}

export default Dashboard;