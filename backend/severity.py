def get_severity(text):
    text = text.lower()
    if "help" in text or "urgent" in text:
        return "HIGH"
    elif "flood" in text or "earthquake" in text:
        return "MEDIUM"
    return "LOW"