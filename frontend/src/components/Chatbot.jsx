import { useState } from "react";

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: "bot", text: "Hi! Ask about disasters 🌍" }
  ]);
  const [input, setInput] = useState("");

  const session_id = "demo-session";

  const sendMessage = async () => {
    if (!input) return;

    const userMsg = { sender: "user", text: input };
    setMessages(prev => [...prev, userMsg]);

    try {
      const res = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: input,
          session_id
        })
      });

      const data = await res.json();

      setMessages(prev => [
        ...prev,
        { sender: "bot", text: data.reply }
      ]);

    } catch {
      setMessages(prev => [
        ...prev,
        { sender: "bot", text: "Error connecting to AI." }
      ]);
    }

    setInput("");
  };

  return (
    <>
      {/* 🔥 FLOATING BUTTON */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            background: "#6366f1",
            color: "white",
            border: "none",
            borderRadius: "50%",
            width: "55px",
            height: "55px",
            fontSize: "22px",
            cursor: "pointer",
            zIndex: 1000
          }}
        >
          🤖
        </button>
      )}

      {/* 🔥 SLIDING PANEL */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: open ? 0 : "-350px",
          width: "350px",
          height: "100%",
          background: "#0f172a",
          color: "white",
          transition: "right 0.3s ease",
          zIndex: 999,
          display: "flex",
          flexDirection: "column"
        }}
      >
        {/* HEADER */}
        <div style={{
          padding: "10px",
          borderBottom: "1px solid #333",
          display: "flex",
          justifyContent: "space-between"
        }}>
          <span>🤖 AI Assistant</span>
          <button onClick={() => setOpen(false)}>✖</button>
        </div>

        {/* MESSAGES */}
        <div style={{
          flex: 1,
          overflowY: "auto",
          padding: "10px"
        }}>
          {messages.map((m, i) => (
            <div key={i} style={{
              textAlign: m.sender === "user" ? "right" : "left",
              margin: "6px 0"
            }}>
              {m.text}
            </div>
          ))}
        </div>

        {/* INPUT */}
        <div style={{ display: "flex", padding: "10px" }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            style={{ flex: 1 }}
          />
          <button onClick={sendMessage}>➤</button>
        </div>
      </div>
    </>
  );
}