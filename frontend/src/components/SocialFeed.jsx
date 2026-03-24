const URGENCY = {
  HIGH:   { color:"#ef4444", bg:"rgba(239,68,68,0.07)",  label:"CRITICAL" },
  MEDIUM: { color:"#f59e0b", bg:"rgba(245,158,11,0.07)", label:"WARNING"  },
  LOW:    { color:"#22c55e", bg:"rgba(34,197,94,0.07)",  label:"INFO"     },
};

function timeAgo(iso) {
  if (!iso) return "";
  const mins = (Date.now() - new Date(iso)) / 60000;
  if (mins < 1)  return "just now";
  if (mins < 60) return `${Math.floor(mins)}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

export default function SocialFeed({ city, posts, loading, filter, onFilter }) {

  // 🔥 SIMPLE SUMMARY (LLM-LIKE FOR NOW)
  const generateSummary = () => {
    if (!posts || posts.length === 0) return null;

    const high = posts.filter(p => p.urgency === "HIGH").length;
    const disasterTypes = [...new Set(posts.map(p => p.disaster_type))];

    return `⚠️ ${posts.length} incidents reported in ${city?.city}. 
${high > 0 ? `${high} critical alerts detected. ` : ""}
Main events: ${disasterTypes.join(", ")}.`;
  };

  const summary = generateSummary();

  return (
    <div className="feed-wrap">

      {/* 🔥 HEADER */}
      <div className="feed-head">
        <div className="feed-head-row">
          {city ? (
            <>
              <span>📍</span>
              <span className="feed-city">{city.city}</span>
              <span className="feed-count">{posts.length} reports</span>
            </>
          ) : (
            <span className="feed-placeholder">Click a location on the map</span>
          )}
        </div>

        {city && (
          <div className="feed-filters">
            {["ALL","HIGH","MEDIUM","LOW"].map(f => (
              <button
                key={f}
                className={`f-tag f-${f.toLowerCase()} ${filter===f?"active":""}`}
                onClick={() => onFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 🔥 SUMMARY PANEL (NEW) */}
      {city && summary && (
        <div className="summary-box">
          <h4>🧠 AI Summary</h4>
          <p>{summary}</p>
        </div>
      )}

      {/* 🔥 BODY */}
      <div className="feed-list">

        {/* No city selected */}
        {!city && !loading && (
          <div className="feed-state">
            <div className="feed-state-icon">🗺️</div>
            <p>No location selected</p>
            <small>Click any marker on the map</small>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="feed-state">
            <div className="spinner" />
            <p>Fetching reports...</p>
          </div>
        )}

        {/* Empty results */}
        {city && !loading && posts.length === 0 && (
          <div className="feed-state">
            <div className="feed-state-icon">✅</div>
            <p>No disaster activity for this date</p>
          </div>
        )}

        {/* Posts */}
        {!loading && posts.map((post, i) => {
          const cfg = URGENCY[post.urgency] || URGENCY.LOW;

          return (
            <div
              key={i}
              className="feed-card"
              style={{ borderLeftColor: cfg.color, background: cfg.bg }}
            >
              <div className="card-top">
                <span className="urgency-badge" style={{ color: cfg.color }}>
                  ⬤ {cfg.label}
                </span>

                <span className="dtype-tag">
                  {(post.disaster_type || "general").toUpperCase()}
                </span>

                <span className="card-time">
                  {timeAgo(post.time)}
                </span>
              </div>

              <p className="card-text">{post.text}</p>

              <div className="card-foot">
                <span className="card-source">
                  {post.source || "Data Feed"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}