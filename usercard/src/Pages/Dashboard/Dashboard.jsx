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
} from "recharts";

import StatCard from "../../Components/StatCard/StatCard";
import "./Dashboard.css";

const chartData = [
  { day: "Mon", employees: 120 },
  { day: "Tue", employees: 160 },
  { day: "Wed", employees: 210 },
  { day: "Thu", employees: 260 },
  { day: "Fri", employees: 180 },
  { day: "Sat", employees: 110 },
  { day: "Sun", employees: 125 },
];

function Dashboard() {
  return (
    <div className="dashboard">

      <div className="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p>Welcome back, Admin! Here's what's happening.</p>
        </div>

        <div className="date-box">
          📅 May 21, 2025
        </div>
      </div>

      {/* Stats Cards */}

      <div className="stats-grid">

        <StatCard
          title="Total Employees"
          value="256"
          icon={<FaUsers />}
          growth="+12.5% from last month"
          color="#3B82F6"
        />

        <StatCard
          title="Active Employees"
          value="210"
          icon={<FaUserCheck />}
          growth="+8.3% from last month"
          color="#10B981"
        />

        <StatCard
          title="Attendance Today"
          value="92%"
          icon={<FaCalendarAlt />}
          growth="+5.4% from yesterday"
          color="#8B5CF6"
        />

        <StatCard
          title="Departments"
          value="12"
          icon={<FaBuilding />}
          growth="No change"
          color="#F59E0B"
        />
      </div>

      {/* Bottom Section */}

      <div className="bottom-grid">

        <div className="chart-card">
          <div className="card-top">
            <h3>Employee Overview</h3>

            <select>
              <option>This Week</option>
            </select>
          </div>

          <div className="chart-container">
            <ResponsiveContainer
              width="100%"
              height={300}
            >
              <LineChart data={chartData}>
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
        </div>

        <div className="recent-card">
          <div className="card-top">
            <h3>Recent Employees</h3>

            <span className="view-all">
              View All
            </span>
          </div>

          <div className="employee-item">
            <img src="https://i.pravatar.cc/40?img=1" />
            <div>
              <h4>John Doe</h4>
              <p>Developer</p>
            </div>
            <span>IT Department</span>
          </div>

          <div className="employee-item">
            <img src="https://i.pravatar.cc/40?img=2" />
            <div>
              <h4>Jane Smith</h4>
              <p>UI/UX Designer</p>
            </div>
            <span>Design Department</span>
          </div>

          <div className="employee-item">
            <img src="https://i.pravatar.cc/40?img=3" />
            <div>
              <h4>Michael Johnson</h4>
              <p>HR Manager</p>
            </div>
            <span>HR Department</span>
          </div>

          <div className="employee-item">
            <img src="https://i.pravatar.cc/40?img=4" />
            <div>
              <h4>Emily Davis</h4>
              <p>Data Analyst</p>
            </div>
            <span>Analytics Department</span>
          </div>

        </div>

      </div>
    </div>
  );
}

export default Dashboard;