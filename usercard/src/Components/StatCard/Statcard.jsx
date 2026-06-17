import "./StatCard.css";

function StatCard({
  title,
  value,
  icon,
  growth,
  color,
}) {
  return (
    <div className="stat-card">

      <div
        className="stat-icon"
        style={{
          backgroundColor: `${color}20`,
          color,
        }}
      >
        {icon}
      </div>

      <div>
        <p>{title}</p>

        <h2>{value}</h2>

        <small>{growth}</small>
      </div>

    </div>
  );
}

export default StatCard;