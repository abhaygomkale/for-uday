from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from collections import defaultdict
from real_data_fetcher import run_pipeline
from datetime import datetime
from groq import Groq
import json
import time
import requests
from dotenv import load_dotenv
load_dotenv(override=True)
import os
from reddit_fetcher import fetch_reddit_posts
from database import contacts_collection
from database import client
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

# New Route Imports
from routes.disaster_routes import router as disaster_router
from utils.cache import get_cached

app = FastAPI()

# Register new routers
app.include_router(disaster_router)

print("Connected DBs:", client.list_database_names())

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
groq_api_key = os.getenv("GROQ_API_KEY")
print(f"LOADING GROQ KEY AT STARTUP: {groq_api_key}")
if not groq_api_key:
    print("WARNING: GROQ_API_KEY not found in environment!")

groq_client = Groq(api_key=groq_api_key or "placeholder")

# 🔥 CHAT SESSIONS
chat_sessions = defaultdict(list)


# 🔥 REQUEST MODEL
class ChatRequest(BaseModel):
    message: str
    session_id: str
    system_prompt: str | None = None
    weather_context: str | None = None


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
        city_name = d["city"]
        if city_name not in cities:
            cities[city_name] = {
                "city": city_name,
                "lat": d["lat"],
                "lon": d["lon"],
                "total": 0,
                "high_count": 0
            }

        cities[city_name]["total"] += 1
        if d["urgency"] == "HIGH":
            cities[city_name]["high_count"] += 1

    # This list is exactly what Map.jsx loops through
    return list(cities.values())
# @app.get("/api/cities")
# def get_cities(date: str = Query(None)):
#     data = load_data()

#     if date:
#         data = [d for d in data if d.get("date") == date]

#     cities = {}

#     for d in data:
#         city = d["city"]

#         if city not in cities:
#             cities[city] = {
#                 "city": city,
#                 "lat": d["lat"],
#                 "lon": d["lon"],
#                 "total": 0,
#                 "high_count": 0
#             }

#         cities[city]["total"] += 1

#         if d["urgency"] == "HIGH":
#             cities[city]["high_count"] += 1

#     return list(cities.values())


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
# 🌤️ WEATHER API
# ===============================

weather_cache = {}
CACHE_DURATION = 300 # 5 minutes

@app.get("/api/weather")
def get_weather(city: str):
    now = time.time()
    if city in weather_cache and (now - weather_cache[city]["time"]) < CACHE_DURATION:
        return weather_cache[city]["data"]

    OPENWEATHER_API_KEY = os.getenv("OpenWeather_API_KEY")
    if not OPENWEATHER_API_KEY:
        raise HTTPException(status_code=500, detail="OpenWeather API Key missing.")

    try:
        url = f"https://api.openweathermap.org/data/2.5/weather?q={city}&appid={OPENWEATHER_API_KEY}&units=metric"
        res = requests.get(url, timeout=5)
        res.raise_for_status()
        data = res.json()

        temp = data['main']['temp']
        condition = data['weather'][0]['main']
        humidity = data['main']['humidity']
        wind = data['wind']['speed']
        lat = data['coord']['lat']
        lon = data['coord']['lon']



        weather_data = {
            "city": city,
            "temp": temp,
            "condition": condition,
            "humidity": humidity,
            "wind": wind,
            "lat": lat,
            "lon": lon
        }

        # 🤖 Intelligence layer integration
        risk_level = "LOW"
        disaster_data = load_data()
        
        city_disasters = [d for d in disaster_data if d["city"].lower() == city.lower()]
        has_high_urgency = any(d["urgency"] == "HIGH" for d in city_disasters)
        types = [d.get("disaster_type", "").lower() for d in city_disasters]
        
        is_rain = condition.lower() in ["rain", "thunderstorm", "drizzle", "clouds"]
        if condition.lower() == "clouds": is_rain = False # Clouds is purely visual unless raining
        if condition.lower() in ["rain", "drizzle"]: is_rain = True

        is_storm = condition.lower() in ["thunderstorm", "tornado", "squall"]
        is_heat = temp > 35
        
        if (is_rain and "flood" in types) or is_storm or (is_heat and "drought" in types) or (has_high_urgency and (is_rain or is_heat)):
            risk_level = "HIGH"
        elif is_heat or is_rain or len(city_disasters) > 0:
            risk_level = "MEDIUM"
            
        weather_data["risk_level"] = risk_level

        weather_cache[city] = {"data": weather_data, "time": now}
        return weather_data
    except Exception as e:
        raise HTTPException(status_code=500, detail="Weather API failure")


# ===============================
# 🤖 GROQ LLM CHATBOT
# ===============================

@app.post("/chat")
def chat(req: ChatRequest):
    try:
        session_id = req.session_id
        
        # Pull the new Unified Disaster data from cache to feed the LLM
        cached_disasters = get_cached("disasters_feed", max_age=300)
        if cached_disasters:
            data = cached_disasters.get("events", [])
            data = data[:15] # Send top 15 highest priority events to save tokens
        else:
            data = load_data() # fallback to old logic

        # 🔥 SYSTEM CONTEXT (VERY IMPORTANT)
        weather_info = req.weather_context or "No specific weather data requested by user."
        system_prompt = req.system_prompt or f"""
        You are a disaster intelligence assistant.

        Current disaster data (High Priority events from USGS & GDACS):
        {data}

        Real-time Weather Context:
        {weather_info}

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
        print("🔥 LLM ERROR:", e)
        # Attempt to cast the error so we can see what's actually failing in the response
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
    try:
        contact = {
            "name": data.name,
            "email": data.email,
            "message": data.message,
            "time": datetime.now().isoformat()
        }

        # ✅ SAVE TO MONGODB
        contacts_collection.insert_one(contact)
        
        # Try sending email optionally so it doesn't break the frontend if SendGrid fails
        ADMIN_EMAIL = os.getenv("ADMIN_EMAIL")
        SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY")

        if SENDGRID_API_KEY and ADMIN_EMAIL:
            try:
                message = Mail(
                    from_email=ADMIN_EMAIL,
                    to_emails=ADMIN_EMAIL,
                    subject="🚨 New CrisisLens Query",
                    html_content=f"""
                    <strong>Name:</strong> {data.name} <br>
                    <strong>Email:</strong> {data.email} <br>
                    <strong>Message:</strong> {data.message}
                    """
                )
                sg = SendGridAPIClient(SENDGRID_API_KEY)
                sg.send(message)
            except Exception as email_err:
                print("⚠️ Warning: Could not send email via SendGrid:", getattr(email_err, 'body', str(email_err)))

        return {"status": "saved in database"}

    except Exception as e:
        print("❌ Database Error:", str(e))
        raise HTTPException(status_code=500, detail="Failed to save contact to database")

@app.get("/api/debug_groq_key")
def debug_groq_key():
    return {"groq_api_key_env": os.getenv("GROQ_API_KEY"), "client_api_key": groq_client.api_key}

# Force reload for .env refresh