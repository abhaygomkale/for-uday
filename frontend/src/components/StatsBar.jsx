export default function StatsBar({ stats }) {
  if (!stats) return <div className="statsbar" />;
  return (
    <div className="statsbar">
      <div className="stat-pill">
        <span className="stat-num stat-total">{stats.total}</span>
        <span className="stat-lbl">TOTAL</span>
      </div>
      <div className="stat-sep" />
      <div className="stat-pill">
        <span className="stat-num stat-high">{stats.high}</span>
        <span className="stat-lbl">CRITICAL</span>
      </div>
      <div className="stat-sep" />
      <div className="stat-pill">
        <span className="stat-num stat-med">{stats.medium}</span>
        <span className="stat-lbl">WARNING</span>
      </div>
      <div className="stat-sep" />
      <div className="stat-pill">
        <span className="stat-num stat-low">{stats.low}</span>
        <span className="stat-lbl">INFO</span>
      </div>
    </div>
  );
}