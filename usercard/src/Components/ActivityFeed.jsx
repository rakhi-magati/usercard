function ActivityFeed() {
  const activities = [
    "Employee Added",
    "Employee Updated",
    "Attendance Updated",
    "Department Created",
  ];

  return (
    <div className="activity-card">
      <h3>Recent Activity</h3>

      {activities.map(
        (activity, index) => (
          <div
            key={index}
            className="activity-item"
          >
            ✓ {activity}
          </div>
        )
      )}
    </div>
  );
}

export default ActivityFeed;