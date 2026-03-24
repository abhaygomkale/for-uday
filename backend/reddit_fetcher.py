import requests

def fetch_reddit_posts(query="disaster", limit=5):
    url = f"https://www.reddit.com/search.json?q={query}&limit={limit}&sort=new"

    headers = {
        "User-Agent": "Mozilla/5.0"
    }

    try:
        res = requests.get(url, headers=headers, timeout=5)

        if res.status_code != 200:
            raise Exception("Bad response")

        data = res.json()

        posts = []

        for item in data.get("data", {}).get("children", []):
            p = item.get("data", {})

            posts.append({
                "title": p.get("title", "No title"),
                "url": "https://reddit.com" + p.get("permalink", ""),
                "source": "Reddit",
                "time": p.get("created_utc", 0)
            })

        return posts

    except Exception as e:
        print("Reddit failed → using fallback:", e)

        # 🔥 FALLBACK DATA (IMPORTANT FOR DEMO)
        return [
            {
                "title": f"{query} disaster reported by users",
                "url": "#",
                "source": "Mock",
                "time": 0
            },
            {
                "title": f"Emergency alerts rising in {query}",
                "url": "#",
                "source": "Mock",
                "time": 0
            }
        ]