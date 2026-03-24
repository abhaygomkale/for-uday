import json
from datetime import datetime, timedelta
import random

DATA_FILE = "data.json"

def generate_mock_data():
    """Generate realistic disaster data with dates"""

    cities = [
        ("Nagpur", 21.1458, 79.0882),
        ("Delhi", 28.6139, 77.2090),
        ("Mumbai", 19.0760, 72.8777),
        ("Pune", 18.5204, 73.8567),
        ("Chennai", 13.0827, 80.2707)
    ]

    disaster_types = ["flood", "earthquake", "cyclone", "rain"]

    data = []

    for _ in range(10):
        city, lat, lon = random.choice(cities)
        disaster = random.choice(disaster_types)

        # Random past 3 days
        date = datetime.now() - timedelta(days=random.randint(0, 3))

        text = f"{disaster.capitalize()} reported in {city}"

        urgency = "LOW"
        if disaster in ["flood", "earthquake"]:
            urgency = "MEDIUM"
        if "help" in text.lower():
            urgency = "HIGH"

        data.append({
            "text": text,
            "city": city,
            "lat": lat,
            "lon": lon,
            "urgency": urgency,
            "disaster_type": disaster,
            "date": date.strftime("%Y-%m-%d"),   # 🔥 IMPORTANT
            "time": date.strftime("%H:%M:%S")
        })

    return data


def run_pipeline():
    """Main pipeline"""

    data = generate_mock_data()

    with open(DATA_FILE, "w") as f:
        json.dump(data, f, indent=4)

    print(f"✅ Data generated: {len(data)} records")