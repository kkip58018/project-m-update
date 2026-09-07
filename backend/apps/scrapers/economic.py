import time
import logging
from typing import Optional, Dict
from bs4 import BeautifulSoup
from curl_cffi import requests as curl_requests
import cloudscraper

from apps.analysis.constants import CORE_INDICATORS, SCORING_ONLY_INDICATORS, EXTRA_INDICATORS, SCORING_EXCLUDED_INDICATORS
from apps.analysis.constants import ECON_SCRAPE_URLS, DIRECTION
from apps.services import supabase_client

logger = logging.getLogger(__name__)


def scrape_indicator_data(url: str) -> Optional[Dict]:
    """
    Scrape economic indicator data from Trading Economics or Investing.com.
    Returns a dict with keys: date, actual, previous, forecast, source.
    Attempts to use curl_cffi first, falling back to cloudscraper.
    """
    if not url:
        return None

    def clean_value(val):
        if val in [None, "N/A", ""]:
            return None
        val_str = str(val)
        for char in ["%", "K", "M", "B", ","]:
            val_str = val_str.replace(char, "")
        try:
            return float(val_str)
        except Exception:
            return None

    response = None
    source = "curl_cffi"

    # --- Fetching Strategy ---
    
    # 1. Primary: curl_cffi
    try:
        response = curl_requests.get(
            url,
            headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "application/json, text/plain, */*",
                "Accept-Language": "en-US,en;q=0.9",
                "Origin": "https://www.investing.com",
                "Referer": "https://www.investing.com/",
            },
            timeout=15,
            impersonate="chrome120"
        )
        if response.status_code != 200:
            logger.warning(f"curl_cffi failed with status {response.status_code} for {url}. Falling back to cloudscraper...")
            response = None
    except Exception as e:
        logger.warning(f"curl_cffi exception for {url}: {e}. Falling back to cloudscraper...")
        response = None

    # 2. Fallback: cloudscraper
    if not response:
        try:
            scraper = cloudscraper.create_scraper()
            response = scraper.get(
                url,
                headers={
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                    "Accept": "application/json, text/html, application/xhtml+xml",
                },
                timeout=15,
            )
            source = "cloudscraper fallback"
            
            if response.status_code != 200:
                logger.error(f"Both scrapers failed. Final status {response.status_code} for {url}")
                return None
        except Exception as e:
            logger.error(f"cloudscraper fallback exception for {url}: {e}")
            return None

    # --- Parsing Logic ---
    try:
        # Investing.com JSON API
        if "investing.com" in url:
            try:
                data = response.json()
                occurrences = data.get("occurrences", [])
                
                if not occurrences:
                    return None
                    
                # Find latest occurrence with actual value
                latest_valid_idx = None
                for idx, occ in enumerate(occurrences):
                    if occ.get("actual") is not None:
                        latest_valid_idx = idx
                        break

                if latest_valid_idx is None:
                    latest_valid_idx = 0

                latest = occurrences[latest_valid_idx]

                raw_time = latest.get("occurrence_time", "")
                date_str = raw_time.split("T")[0] if "T" in raw_time else raw_time
                
                actual = latest.get("actual")
                previous = latest.get("previous")
                forecast = latest.get("forecast")

                # Preliminary Release Check (Investing.com ONLY)
                is_prelim = latest.get("preliminary", False)
                ref_period = latest.get("reference_period")

                if not is_prelim and ref_period:
                    for occ in occurrences[latest_valid_idx + 1:]:
                        if (
                            occ.get("reference_period") == ref_period
                            and occ.get("preliminary") is True
                        ):
                            prelim_actual = occ.get("actual")
                            if prelim_actual is not None:
                                previous = prelim_actual
                            break

                return {
                    "date": date_str,
                    "actual": clean_value(actual),
                    "previous": clean_value(previous),
                    "forecast": clean_value(forecast),
                    "source": f"Investing.com API ({source})",
                }
            except ValueError:
                pass

        # Trading Economics HTML table
        elif "tradingeconomics.com" in url:
            soup = BeautifulSoup(response.text, "html.parser")
            table = soup.find("table", class_="table")
            if table:
                rows = table.find_all("tr")
                if len(rows) > 2:
                    cols = rows[2].find_all("td")
                    
                    if len(cols) >= 7:
                        date = cols[0].text.strip()
                        actual = cols[4].text.strip()
                        prev = cols[5].text.strip()
                        forecast = cols[6].text.strip()
                    elif len(cols) >= 6:
                        date = cols[0].text.strip()
                        actual = cols[3].text.strip()
                        prev = cols[4].text.strip()
                        forecast = cols[5].text.strip()
                    else:
                        return None

                    return {
                        "date": date,
                        "actual": clean_value(actual),
                        "previous": clean_value(prev),
                        "forecast": clean_value(forecast),
                        "source": f"TradingEconomics HTML ({source})",
                    }
        return None
    except Exception as e:
        logger.error(f"Parsing error for {url}: {e}")
        return None


def refresh_currency_indicators(currency_code):
    """Fetch all indicators for a currency from web sources and update Supabase."""
    currency_code = currency_code.upper()
    all_indicators = list(CORE_INDICATORS) + list(SCORING_ONLY_INDICATORS)
    
    if currency_code in EXTRA_INDICATORS:
        all_indicators.extend(EXTRA_INDICATORS[currency_code])
        
    if currency_code in SCORING_EXCLUDED_INDICATORS:
        for excl in SCORING_EXCLUDED_INDICATORS[currency_code]:
            if excl in all_indicators:
                all_indicators.remove(excl)

    updated = 0
    failed = 0
    failed_indicators = []

    for ind_name in all_indicators:
        key = f"{currency_code} - {ind_name}"
        urls = ECON_SCRAPE_URLS.get(key, {})
        scraped = None

        if urls.get("primary"):
            scraped = scrape_indicator_data(urls["primary"])
            
        if not scraped and urls.get("fallback"):
            logger.info(f"Primary failed for {key}, attempting fallback.")
            time.sleep(2) # Delay before fallback to prevent rate limits
            scraped = scrape_indicator_data(urls["fallback"])

        if scraped:
            date_str = scraped["date"]
            actual = scraped["actual"]
            previous = scraped["previous"]
            forecast = scraped["forecast"]

            # Fallback logic for missing forecast
            if forecast is None and previous is not None:
                forecast = previous
                
            if actual is not None and forecast is not None:
                # Calculate Score
                direction = DIRECTION.get(ind_name, "higher")
                if direction == "higher":
                    score = 1 if actual > forecast else (-1 if actual < forecast else 0)
                else:
                    score = 1 if actual < forecast else (-1 if actual > forecast else 0)
                
                data = {
                    'currency_code': currency_code,
                    'indicator_name': ind_name,
                    'actual_value': actual,
                    'forecast_value': forecast,
                    'release_date': date_str,
                    'previous_value': previous,
                    'score': score,
                }
                
                success = supabase_client.upsert_indicator(data)
                if success:
                    updated += 1
                else:
                    failed += 1
                    failed_indicators.append(ind_name)
            else:
                failed += 1
                failed_indicators.append(ind_name)
        else:
            failed += 1
            failed_indicators.append(ind_name)
            
        # Brief pause between indicator loops to stay under anti-bot radar
        time.sleep(1.5)

    message = f"Updated {updated} indicators, failed {failed}"
    if failed_indicators:
        message += f" (failed: {', '.join(failed_indicators[:5])})"
        
    return updated, message
# apps/scrapers/economic.py

from apps.analysis.constants import STANDARD_CURRENCIES
from .economic import refresh_currency_indicators

def refresh_all_currency_indicators():
    """
    Refresh all indicators for all currencies.
    Returns (total_updated, total_failed, details_dict)
    """
    total_updated = 0
    total_failed = 0
    details = {}

    for currency in STANDARD_CURRENCIES:
        try:
            updated, failed, msg = refresh_currency_indicators(currency)
            total_updated += updated
            total_failed += failed
            details[currency] = {'updated': updated, 'failed': failed, 'message': msg}
        except Exception as e:
            details[currency] = {'updated': 0, 'failed': 0, 'message': str(e)}
            total_failed += 1

    return total_updated, total_failed, details