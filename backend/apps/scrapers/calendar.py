import logging
from datetime import datetime, timezone

import pytz
import requests

logger = logging.getLogger(__name__)

# ForexFactory publishes its calendar as plain JSON (no Cloudflare challenge).
WEEK_URLS = [
    "https://nfs.faireconomy.media/ff_calendar_thisweek.json",
    "https://nfs.faireconomy.media/ff_calendar_nextweek.json",
]

EAT = pytz.timezone("Africa/Nairobi")  # UTC+3, no DST

EXCLUDED_WORDS = [
    "german", "french", "italian", "spanish", "sppi", "tokyo",
    "Retail Sales Monitor", "Trimmed", "Weekly", "Core Retail Sales",
    "RatingDog", "Empire",
]

UA_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*",
    "Referer": "https://www.forexfactory.com/",
}


def _to_eat(date_value):
    """Convert ForexFactory's ISO date (with UTC offset) to Kenyan time (EAT)."""
    if not date_value:
        return ""
    text = str(date_value).strip()
    try:
        dt = datetime.fromisoformat(text)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(EAT).strftime("%d %b %Y, %I:%M %p (EAT)")
    except ValueError:
        # Not an ISO string; return the raw text as a fallback.
        return text


def _eat_date(date_value):
    """Return the event's calendar date in EAT as YYYY-MM-DD (for client filters)."""
    if not date_value:
        return ""
    text = str(date_value).strip()
    try:
        dt = datetime.fromisoformat(text)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(EAT).strftime("%Y-%m-%d")
    except ValueError:
        return ""


def _is_relevant(currency_upper, event_lower):
    """Keep only events that map to the indicators the dashboard tracks."""
    # Global keywords
    global_keywords = [
        "gdp", "retail sales", "manufacturing pmi", "services pmi",
        "cpi", "ppi", "unemployment rate", "employment change",
        "consumer confidence", "bank holiday",
    ]
    if any(kw in event_lower for kw in global_keywords):
        return True

    # USD only
    usd_keywords = [
        "pce", "non-farm employment change", "unemployment claims",
        "adp", "jolts job openings", "average hourly earnings",
        "federal funds rate", "fomc statement",
    ]
    if currency_upper == "USD" and any(kw in event_lower for kw in usd_keywords):
        return True

    # JPY only
    if currency_upper == "JPY" and any(kw in event_lower for kw in ["household spending", "boj policy rate"]):
        return True

    # AUD only
    if currency_upper == "AUD" and any(kw in event_lower for kw in ["cash rate", "rba rate statement"]):
        return True

    # NZD only
    nzd_keywords = [
        "manufacturing index", "services index",
        "official cash rate", "rbnz rate statement",
    ]
    if currency_upper == "NZD" and any(kw in event_lower for kw in nzd_keywords):
        return True

    # CAD only
    if currency_upper == "CAD" and any(kw in event_lower for kw in ["overnight rate", "boc rate statement"]):
        return True

    # GBP only
    if currency_upper == "GBP" and any(kw in event_lower for kw in ["official bank rate", "boe monetary policy report"]):
        return True

    # EUR only
    if currency_upper == "EUR" and any(kw in event_lower for kw in ["main refinancing rate", "monetary policy statement"]):
        return True

    return False


def _str(value):
    """Render a value for display, mapping null/None to an empty string."""
    if value is None:
        return ""
    text = str(value).strip()
    return text


def fetch_forexfactory_calendar():
    """
    Fetch this week's ForexFactory calendar from the public JSON feed and return
    the events relevant to MacroPulse, with times shown in Kenyan time (EAT).
    """
    items = []
    for url in WEEK_URLS:
        try:
            response = requests.get(url, headers=UA_HEADERS, timeout=20)
            if response.status_code == 200:
                payload = response.json()
                if isinstance(payload, list) and payload:
                    items = payload
                    break
        except Exception as exc:  # noqa: BLE001
            logger.warning("ForexFactory calendar fetch failed for %s: %s", url, exc)

    if not items:
        logger.error("No ForexFactory calendar data could be fetched.")
        return []

    excluded_lower = [w.lower() for w in EXCLUDED_WORDS]
    parsed = []

    for item in items:
        event_name = _str(item.get("title"))
        currency = _str(item.get("country")).upper()
        raw_date = item.get("date")

        if not event_name or not currency:
            continue

        event_lower = event_name.lower()
        if any(word in event_lower for word in excluded_lower):
            continue

        if not _is_relevant(currency, event_lower):
            continue

        parsed.append({
            "date_time": _to_eat(raw_date),
            "date": _eat_date(raw_date),
            "currency": currency,
            "event": event_name,
            "actual": _str(item.get("actual")),
            "forecast": _str(item.get("forecast")),
            "previous": _str(item.get("previous")),
        })

    return parsed
