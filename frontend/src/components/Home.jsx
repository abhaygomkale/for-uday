import { useState } from "react";

export default function Home() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    message: ""
  });

  const handleSubmit = async () => {
    try {
      await fetch("http://localhost:8000/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });

      alert("Message sent!");
      setForm({ name: "", email: "", message: "" });

    } catch {
      alert("Error sending message");
    }
  };

  return (
    <div style={container}>

      {/* 🔥 HERO */}
      <div style={hero}>
        <h1 style={title}>🌍 CrisisLens</h1>
        <p style={subtitle}>
          AI-powered disaster intelligence for real-time awareness and response
        </p>
      </div>

      {/* 🔥 GRID */}
      <div style={grid}>

        {/* ABOUT */}
        <div style={glassCard}>
          <h2>About</h2>
          <p>
            CrisisLens combines AI, geospatial intelligence, and real-time social signals
            to detect, analyze, and visualize disasters. It helps authorities make faster,
            data-driven decisions.
          </p>
        </div>

        {/* FEATURES */}
        <div style={glassCard}>
          <h2>Features</h2>
          <ul style={{ lineHeight: "1.8" }}>
            <li>📍 Interactive disaster map</li>
            <li>📡 Reddit + social intelligence</li>
            <li>🤖 AI chatbot insights</li>
            <li>📊 Real-time analytics dashboard</li>
          </ul>
        </div>

        {/* CONTACT */}
        <div style={{ ...glassCard, gridColumn: "span 2" }}>
          <h2>Contact Us</h2>

          <div style={{ display: "flex", gap: "10px" }}>
            <input
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              style={input}
            />

            <input
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              style={input}
            />
          </div>

          <textarea
            placeholder="Message"
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            style={{ ...input, height: "80px" }}
          />

          <button onClick={handleSubmit} style={btn}>
            Send Message 🚀
          </button>
        </div>

      </div>
    </div>
  );
}

//////////////////////
// 🔥 STYLES
//////////////////////

const container = {
  minHeight: "100vh",
  background: "linear-gradient(135deg, #0f172a, #020617)",
  color: "white",
  padding: "40px",
  fontFamily: "sans-serif"
};

const hero = {
  textAlign: "center",
  marginBottom: "40px",
  animation: "fadeIn 1s ease"
};

const title = {
  fontSize: "42px",
  fontWeight: "bold",
  marginBottom: "10px"
};

const subtitle = {
  opacity: 0.7,
  fontSize: "16px"
};

const grid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "20px"
};

const glassCard = {
  background: "rgba(255,255,255,0.05)",
  backdropFilter: "blur(12px)",
  borderRadius: "16px",
  padding: "20px",
  border: "1px solid rgba(255,255,255,0.1)",
  boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
  transition: "0.3s",
};

const input = {
  width: "100%",
  marginBottom: "10px",
  padding: "10px",
  borderRadius: "8px",
  border: "none",
  outline: "none",
  background: "rgba(255,255,255,0.1)",
  color: "white"
};

const btn = {
  padding: "10px 20px",
  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  marginTop: "10px",
  transition: "0.3s"
};