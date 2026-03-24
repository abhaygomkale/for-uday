export default function AlertPanel({ cities = [] }) {
  
  const hotCities = cities.filter(c => c.high_count > 0);

  // 🔥 IF NO ALERTS → SHOW SAFE STATE
  if (!cities.length) {
    return (
      <div className="ticker safe">
        <span className="ticker-badge green">🟢 SAFE</span>
        <span>No disaster alerts for selected date</span>
      </div>
    );
  }

  if (!hotCities.length) {
    return (
      <div className="ticker safe">
        <span className="ticker-badge green">🟢 SAFE</span>
        <span>All regions stable — no critical alerts</span>
      </div>
    );
  }

  // Duplicate for smooth scroll
  const items = [...hotCities, ...hotCities];

  return (
    <div className="ticker">
      
      {/* 🔥 LIVE BADGE */}
      <span className="ticker-badge red">🔴 LIVE ALERTS</span>

      <div className="ticker-scroll">
        <div className="ticker-inner">
          {items.map((c, i) => (
            <span key={i} className="ticker-item">
              
              <span className="t-dot" />

              <strong>{c.city}</strong>

              &nbsp;— {c.high_count} critical alert{c.high_count !== 1 ? "s" : ""}

              {/* 🔥 TOTAL CONTEXT */}
              <span className="t-total">
                {" "}({c.total} total)
              </span>

              <span className="t-sep">|</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}