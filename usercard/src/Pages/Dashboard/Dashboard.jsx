import { useEffect, useState, useCallback } from "react";
import {
  FaUsers, FaUserCheck, FaBuilding, FaClock, FaSyncAlt,
} from "react-icons/fa";
import {
  PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import StatCard from "../../Components/StatCard/StatCard";
import { getAnalytics } from "../../services/employeeService";
import "./Dashboard.css";

const COLORS = ["#2563eb", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

function Dashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const companyId = parseInt(localStorage.getItem("company_id") || "1");

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAnalytics(companyId);
      setAnalytics(data);
      setLastRefresh(new Date());
      setError("");
    } catch (err) {
      setError("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading) return <div className="loading">Loading Dashboard...</div>;

  if (error) return (
    <div className="error-box">
      <h3>{error}</h3>
      <button onClick={fetchAnalytics}>Retry</button>
    </div>
  );

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p>Welcome back, Admin 👋</p>
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <button className="refresh-btn" onClick={fetchAnalytics} title="Refresh">
            <FaSyncAlt /> Refresh
          </button>
          <div className="date-box">📅 {new Date().toLocaleDateString()}</div>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard title="Total Employees" value={analytics?.total_employees ?? 0} icon={<FaUsers />} color="#2563eb" />
        <StatCard title="Active Employees" value={analytics?.active_employees ?? 0} icon={<FaUserCheck />} color="#10b981" />
        <StatCard title="Total Departments" value={analytics?.total_departments ?? 0} icon={<FaBuilding />} color="#f59e0b" />
        <StatCard title="Pending Requests" value={analytics?.pending_requests ?? 0} icon={<FaClock />} color="#ef4444" />
      </div>

      <div className="analytics-grid">
        <div className="chart-card">
          <h3>Employee Distribution by Department</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={analytics?.department_distribution || []}
                dataKey="value"
                nameKey="name"
                outerRadius={100}
                label={({ name, value }) => `${name}: ${value}`}
              >
                {(analytics?.department_distribution || []).map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Employee Count by Role</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={analytics?.role_distribution || []}>
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Employee Status Overview</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={analytics?.status_overview || []}>
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {(analytics?.status_overview || []).map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.name === "active" ? "#10b981" : entry.name === "inactive" ? "#ef4444" : "#f59e0b"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="refresh-info">
        Last refreshed: {lastRefresh.toLocaleTimeString()}
      </div>
    </div>
  );
}

export default Dashboard;
