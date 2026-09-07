import requests
from bs4 import BeautifulSoup
import re
from datetime import datetime, timedelta
import logging
import cloudscraper

logger = logging.getLogger(__name__)

EXCLUDED_WORDS = [
    "german", "french", "italian", "spanish", "sppi", "tokyo",
    "Retail Sales Monitor", "Trimmed", "Weekly", "Core Retail Sales",
    "RatingDog", "Empire",
]


def fetch_forexfactory_calendar():
    """
    Scrape ForexFactory calendar and return events with times converted to EAT.
    """
    url = "https://www.forexfactory.com/calendar?week=this"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json, text/html, application/xhtml+xml",
    }

    try:
        response = requests.get(url, headers=headers, timeout=15)
        if response.status_code != 200:
            # Fallback to cloudscraper
            scraper = cloudscraper.create_scraper()
            response = scraper.get(url, headers=headers, timeout=15)
        if response.status_code != 200:
            logger.error(f"Failed to fetch calendar (HTTP {response.status_code})")
            return []

        soup = BeautifulSoup(response.text, "html.parser")
        table = soup.find("table", class_="calendar__table")
        if not table:
            logger.error("Could not find calendar table on ForexFactory")
            return []

        parsed = []
        current_date = "Unknown Date"
        excluded_lower = [w.lower() for w in EXCLUDED_WORDS]

        for row in table.find_all("tr", class_="calendar__row"):
            # Parse Date & Convert ET to Kenyan Time (EAT)
            date_cell = row.find("td", class_="calendar__date")
            if date_cell and date_cell.text.strip():
                raw_date = " ".join(date_cell.text.split())
                # Look for times like "8:30am" or "2:00pm"
                time_match = re.search(r'(\d{1,2}:\d{2})([a-p]m)', raw_date.lower())
                if time_match:
                    try:
                        time_str = time_match.group(0)
                        dt_obj = datetime.strptime(time_str, "%I:%M%p")
                        # ForexFactory defaults to US Eastern Time. EDT to EAT is +7 hours
                        dt_eat = dt_obj + timedelta(hours=7)
                        eat_time_str = dt_eat.strftime("%I:%M %p")
                        current_date = raw_date.lower().replace(time_str, f"{eat_time_str} (EAT)").upper()
                    except:
                        current_date = raw_date
                else:
                    current_date = raw_date

            # Currency
            currency_cell = row.find("td", class_="calendar__currency")
            currency = currency_cell.text.strip() if currency_cell else ""

            # Event
            event_cell = row.find("td", class_="calendar__event")
            event_name = event_cell.text.strip() if event_cell else ""

            # Actual, Forecast, Previous
            actual_cell = row.find("td", class_="calendar__actual")
            actual = actual_cell.text.strip() if actual_cell else ""
            forecast_cell = row.find("td", class_="calendar__forecast")
            forecast = forecast_cell.text.strip() if forecast_cell else ""
            previous_cell = row.find("td", class_="calendar__previous")
            previous = previous_cell.text.strip() if previous_cell else ""

            if not currency or not event_name:
                continue

            event_lower = event_name.lower()
            currency_upper = currency.upper()

            # Exclude words
            if any(word in event_lower for word in excluded_lower):
                continue

            is_matched = False

            # Global keywords
            global_keywords = [
                "gdp", "retail sales", "manufacturing pmi", "services pmi",
                "cpi", "ppi", "unemployment rate", "employment change",
                "consumer confidence", "bank holiday",
            ]
            if any(kw in event_lower for kw in global_keywords):
                is_matched = True

            # USD only
            usd_keywords = [
                "pce", "non-farm employment change", "unemployment claims",
                "adp", "jolts job openings", "average hourly earnings",
                "federal funds rate", "fomc statement",
            ]
            if currency_upper == "USD" and any(kw in event_lower for kw in usd_keywords):
                is_matched = True

            # JPY only
            jpy_keywords = ["household spending", "boj policy rate"]
            if currency_upper == "JPY" and any(kw in event_lower for kw in jpy_keywords):
                is_matched = True

            # AUD only
            aud_keywords = ["cash rate", "rba rate statement"]
            if currency_upper == "AUD" and any(kw in event_lower for kw in aud_keywords):
                is_matched = True

            # NZD only
            nzd_keywords = [
                "manufacturing index", "services index",
                "official cash rate", "rbnz rate statement",
            ]
            if currency_upper == "NZD" and any(kw in event_lower for kw in nzd_keywords):
                is_matched = True

            # CAD only
            cad_keywords = ["overnight rate", "boc rate statement"]
            if currency_upper == "CAD" and any(kw in event_lower for kw in cad_keywords):
                is_matched = True

            # GBP only
            gbp_keywords = ["official bank rate", "boe monetary policy report"]
            if currency_upper == "GBP" and any(kw in event_lower for kw in gbp_keywords):
                is_matched = True

            # EUR only
            eur_keywords = ["main refinancing rate", "monetary policy statement"]
            if currency_upper == "EUR" and any(kw in event_lower for kw in eur_keywords):
                is_matched = True

            if is_matched:
                parsed.append({
                    "date_time": current_date,
                    "currency": currency_upper,
                    "event": event_name,
                    "actual": actual,
                    "forecast": forecast,
                    "previous": previous,
                })

        return parsed

    except Exception as e:
        logger.error(f"Error scraping ForexFactory: {e}")
        return []