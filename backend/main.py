from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from collections import defaultdict
from real_data_fetcher import run_pipeline
from datetime import datetime
from groq import Groq
import json
import os
from reddit_fetcher import fetch_reddit_posts

app = FastAPI()

from pydantic import BaseModel

class Contact(BaseModel):
    name: str
    email: str
    message: str

# 🔥 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 🔥 FILE PATH
DATA_FILE = "data.json"

# 🔥 GROQ SETUP
groq_client = Groq(api_key="GroqAPIKey")

# 🔥 CHAT SESSIONS
chat_sessions = defaultdict(list)


# 🔥 REQUEST MODEL
class ChatRequest(BaseModel):
    message: str
    session_id: str
    system_prompt: str | None = None


# 🔥 LOAD DATA
def load_data():
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE) as f:
            return json.load(f)
    return []


@app.get("/")
def home():
    return {"status": "Backend Running 🚀"}


# ===============================
# 📡 DATA APIs
# ===============================

@app.get("/api/feed")
def get_feed(date: str = Query(None)):
    data = load_data()

    if date:
        data = [d for d in data if d.get("date") == date]

    return {
        "posts": data,
        "count": len(data),
        "date": date
    }


@app.get("/api/cities")
def get_cities(date: str = Query(None)):
    data = load_data()

    if date:
        data = [d for d in data if d.get("date") == date]

    cities = {}

    for d in data:
        city = d["city"]

        if city not in cities:
            cities[city] = {
                "city": city,
                "lat": d["lat"],
                "lon": d["lon"],
                "total": 0,
                "high_count": 0
            }

        cities[city]["total"] += 1

        if d["urgency"] == "HIGH":
            cities[city]["high_count"] += 1

    return list(cities.values())


@app.get("/api/stats")
def get_stats(date: str = Query(None)):
    data = load_data()

    if date:
        data = [d for d in data if d.get("date") == date]

    return {
        "total": len(data),
        "high": len([d for d in data if d["urgency"] == "HIGH"]),
        "last_updated": datetime.now().strftime("%H:%M:%S"),
        "date": date
    }


@app.post("/api/refresh")
def refresh():
    try:
        run_pipeline()
        return {"status": "Data refreshed"}
    except Exception as e:
        return {"error": str(e)}


# ===============================
# 🤖 GROQ LLM CHATBOT
# ===============================

@app.post("/chat")
def chat(req: ChatRequest):
    try:
        session_id = req.session_id
        data = load_data()

        # 🔥 SYSTEM CONTEXT (VERY IMPORTANT)
        system_prompt = req.system_prompt or f"""
        You are a disaster intelligence assistant.

        Current disaster data:
        {data}

        Answer user queries based on this data.
        Be short, clear, and helpful.
        """

        # 🔥 INIT SESSION
        if not chat_sessions[session_id]:
            chat_sessions[session_id].append({
                "role": "system",
                "content": system_prompt
            })

        # 🔥 USER MESSAGE
        chat_sessions[session_id].append({
            "role": "user",
            "content": req.message
        })

        # 🔥 CALL GROQ
        response = groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=chat_sessions[session_id]
        )

        reply = response.choices[0].message.content

        # 🔥 SAVE RESPONSE
        chat_sessions[session_id].append({
            "role": "assistant",
            "content": reply 
        })

        return {
            "reply": reply,
            "session_id": session_id
        }

    except Exception as e:
        print("🔥 LLM ERROR:", str(e))   # 👈 ADD THIS
        raise HTTPException(status_code=500, detail=str(e))


# 🧹 CLEAR CHAT
@app.delete("/chat/{session_id}")
def clear_chat(session_id: str):
    if session_id in chat_sessions:
        del chat_sessions[session_id]
        return {"message": f"Chat cleared: {session_id}"}
    return {"message": "No session found"}

# REDDIT

@app.get("/api/reddit")
def get_reddit(query: str = "disaster"):
    posts = fetch_reddit_posts(query)
    return {"posts": posts}

@app.post("/api/contact")
def save_contact(data: Contact):
    file = "contacts.json"

    contacts = []
    if os.path.exists(file):
        with open(file) as f:
            contacts = json.load(f)

    contacts.append(data.dict())

    with open(file, "w") as f:
        json.dump(contacts, f, indent=4)

    return {"status": "saved"}