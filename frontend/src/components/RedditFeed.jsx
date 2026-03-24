import { useEffect, useState } from "react";

export default function RedditFeed({ query = "disaster" }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);

    const q = query || "disaster";

    fetch(`http://localhost:8000/api/reddit?query=${encodeURIComponent(q)}`)
      .then(res => {
        if (!res.ok) throw new Error("API error");
        return res.json();
      })
      .then(data => {
        console.log("Reddit Data:", data); // 🔥 DEBUG
        setPosts(data.posts || []);
      })
      .catch((err) => {
        console.error("Reddit Fetch Error:", err);
        setError(true);
        setPosts([]);
      })
      .finally(() => setLoading(false));

  }, [query]);

  return (
    <div style={{
      padding: "10px",
      color: "white",
      height: "100%",
      display: "flex",
      flexDirection: "column"
    }}>
      
      {/* HEADER */}
      <h4 style={{ marginBottom: "8px" }}>
        📡 Reddit Insights {query !== "disaster" && `— ${query}`}
      </h4>

      {/* LOADING */}
      {loading && <p style={{ opacity: 0.6 }}>Loading Reddit data...</p>}

      {/* ERROR */}
      {error && <p style={{ color: "red" }}>Error loading Reddit data</p>}

      {/* EMPTY */}
      {!loading && !error && posts.length === 0 && (
        <p style={{ opacity: 0.6 }}>
          No Reddit data found (try another city)
        </p>
      )}

      {/* POSTS */}
      <div style={{ overflowY: "auto" }}>
        {posts.map((p, i) => (
          <div
            key={i}
            style={{
              marginBottom: "10px",
              padding: "8px",
              background: "rgba(255,255,255,0.05)",
              borderRadius: "6px"
            }}
          >
            <a
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: "#60a5fa",
                textDecoration: "none",
                fontSize: "14px"
              }}
            >
              {p.title}
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}