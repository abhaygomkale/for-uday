import { useState, useEffect } from "react";
import { Routes, Route, Link } from "react-router-dom";

import MapView from "./components/Map";
import SocialFeed from "./components/SocialFeed";
import AlertPanel from "./components/AlertPanel";
import StatsBar from "./components/StatsBar";
import Chatbot from "./components/Chatbot";
import RedditFeed from "./components/RedditFeed";
import Home from "./components/Home";

// DEMO DATA
const DEMO_POSTS = [
  {
    text: "Flood reported in Nagpur, rescue teams deployed",
    city: "Nagpur",
    lat: 21.1458,
    lon: 79.0882,
    urgency: "HIGH",
    disaster_type: "flood",
    time: new Date().toISOString()
  },
  {
    text: "Earthquake tremors felt in Delhi",
    city: "Delhi",
    lat: 28.6139,
    lon: 77.2090,
    urgency: "MEDIUM",
    disaster_type: "earthquake",
    time: new Date().toISOString()
  },
  {
    text: "Heavy rainfall in Mumbai",
    city: "Mumbai",
    lat: 19.0760,
    lon: 72.8777,
    urgency: "LOW",
    disaster_type: "rain",
    time: new Date().toISOString()
  }
];

export default function App() {
  const [mode, setMode] = useState("DEMO");
  const [cities, setCities] = useState([]);
  const [stats, setStats] = useState(null);
  const [allPosts, setAllPosts] = useState([]);
  const [selectedCity, setSelectedCity] = useState(null);
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [chatOpen, setChatOpen] = useState(false);

  const fetchData = async (selectedDate) => {
    setLoading(true);

    if (mode === "DEMO") {
      const citiesMap = {};

      DEMO_POSTS.forEach(p => {
        if (!citiesMap[p.city]) {
          citiesMap[p.city] = {
            city: p.city,
            lat: p.lat,
            lon: p.lon,
            total: 0,
            high_count: 0
          };
        }
        citiesMap[p.city].total++;
        if (p.urgency === "HIGH") citiesMap[p.city].high_count++;
      });

      setCities(Object.values(citiesMap));
      setAllPosts(DEMO_POSTS);
      setStats({
        total: DEMO_POSTS.length,
        high: DEMO_POSTS.filter(p => p.urgency === "HIGH").length
      });

      setLoading(false);
      return;
    }

    try {
      const formattedDate = new Date(selectedDate)
        .toISOString()
        .split("T")[0];

      const [citiesRes, feedRes, statsRes] = await Promise.all([
        fetch(`http://localhost:8000/api/cities?date=${formattedDate}`),
        fetch(`http://localhost:8000/api/feed?date=${formattedDate}`),
        fetch(`http://localhost:8000/api/stats?date=${formattedDate}`)
      ]);

      const citiesData = await citiesRes.json();
      const feedData = await feedRes.json();
      const statsData = await statsRes.json();

      setCities(citiesData);
      setAllPosts(feedData.posts || []);
      setStats(statsData);

    } catch (err) {
      console.error(err);
      setCities([]);
      setAllPosts([]);
      setStats(null);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData(date);
  }, [date, mode]);

  const handleCityClick = (city) => {
    setSelectedCity(city);
    setFilter("ALL");
  };

  const visiblePosts = allPosts.filter(p => {
    const matchCity = selectedCity ? p.city === selectedCity.city : true;
    const matchFilter = filter === "ALL" ? true : p.urgency === filter;
    return matchCity && matchFilter;
  });

  return (
    <>
      {/* 🔥 NAVBAR */}
      <nav style={{
        padding: "10px",
        background: "#0f172a",
        display: "flex",
        gap: "20px"
      }}>
        <Link to="/" style={{ color: "white", textDecoration: "none" }}>
          🏠 Home
        </Link>

        <Link to="/dashboard" style={{ color: "white", textDecoration: "none" }}>
          📊 Dashboard
        </Link>
      </nav>

      <Routes>

        {/* 🏠 HOME */}
        <Route path="/" element={<Home />} />

        {/* 📊 DASHBOARD */}
        <Route path="/dashboard" element={

          <div className="app-shell">

            {/* TOP BAR */}
            <header className="topbar">
              <div className="topbar-brand">
                <span className="brand-name">🌍 CRISISLENS</span>
              </div>

              <button
                onClick={() => setMode(mode === "DEMO" ? "LIVE" : "DEMO")}
                style={{
                  padding: "6px 10px",
                  borderRadius: "6px",
                  background: mode === "DEMO" ? "#22c55e" : "#ef4444",
                  color: "white",
                  border: "none",
                  marginRight: "10px"
                }}
              >
                {mode === "DEMO" ? "🧪 DEMO" : "🌐 LIVE"}
              </button>

              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={{ padding: "6px", borderRadius: "6px" }}
              />

              <StatsBar stats={stats} />

              <button
                onClick={() => setChatOpen(!chatOpen)}
                style={{
                  marginLeft: "10px",
                  background: "#6366f1",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  padding: "6px 10px"
                }}
              >
                🤖 AI
              </button>
            </header>

            <AlertPanel cities={cities} />

            {/* MAIN */}
            <main
              className="main-layout"
              style={{
                display: "flex",
                height: "calc(100vh - 120px)",
                transition: "all 0.3s ease",
                marginRight: chatOpen ? "350px" : "0px"
              }}
            >
              {/* MAP */}
              <div className="map-pane" style={{ flex: 2 }}>
                <MapView
                  cities={cities}
                  selectedCity={selectedCity}
                  onCityClick={handleCityClick}
                />
              </div>

              {/* RIGHT PANEL */}
              <div
                className="feed-pane"
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  height: "100%"
                }}
              >
                {/* SOCIAL */}
                <div style={{ flex: 2, overflow: "hidden" }}>
                  <SocialFeed
                    city={selectedCity}
                    posts={visiblePosts}
                    loading={loading}
                    filter={filter}
                    onFilter={setFilter}
                  />
                </div>

                {/* REDDIT */}
                <div
                  style={{
                    flex: 1,
                    borderTop: "1px solid #333",
                    overflowY: "auto"
                  }}
                >
                  <RedditFeed
                    query={
                      selectedCity
                        ? `${selectedCity.city} disaster`
                        : "disaster"
                    }
                  />
                </div>
              </div>
            </main>

            {/* CHATBOT */}
            <Chatbot open={chatOpen} setOpen={setChatOpen} />

          </div>

        } />

      </Routes>
    </>
  );
}