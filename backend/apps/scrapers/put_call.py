import requests
from bs4 import BeautifulSoup
import cloudscraper
import re
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


def fetch_put_call_ratio(ticker: str) -> float:
    """
    Scrape Barchart for the put/call ratio of a given ticker.
    Returns the ratio as float, or None if failed.
    """
    url_map = {
        "IBIT": "https://www.barchart.com/etfs-funds/quotes/IBIT/overview",
        "GLD": "https://www.barchart.com/etfs-funds/quotes/GLD/overview",
        "SLV": "https://www.barchart.com/etfs-funds/quotes/SLV/overview",
        "QQQ": "https://www.barchart.com/etfs-funds/quotes/QQQ/overview",
        "SPY": "https://www.barchart.com/etfs-funds/quotes/SPY/overview",
        "UUP": "https://www.barchart.com/etfs-funds/quotes/UUP/overview",
        "USO": "https://www.barchart.com/etfs-funds/quotes/USO/overview",
    }
    if ticker not in url_map:
        return None

    target_url = url_map[ticker]
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
        "Accept": "application/json, text/html, application/xhtml+xml",
    }

    try:
        scraper = cloudscraper.create_scraper()
        response = scraper.get(target_url, headers=headers, timeout=15)
        if response.status_code != 200:
            return None

        soup = BeautifulSoup(response.text, "html.parser")

        # Try to find the ratio in column blocks
        for block in soup.find_all("div", class_="column"):
            block_text = block.get_text(separator=" ").strip()
            if "Put/Call Vol Ratio" in block_text:
                match = re.search(r"Put/Call Vol Ratio\s*([0-9.]+)", block_text)
                if match:
                    return float(match.group(1))

        # Fallback: search entire page text
        page_text = soup.get_text(separator=" ")
        match = re.search(r"Put/Call Vol Ratio\s*([0-9.]+)", page_text)
        if match:
            return float(match.group(1))

        return None
    except Exception as e:
        logger.error(f"Barchart scraping error for {ticker}: {e}")
        return None


def fetch_and_store_put_call_ratio(asset_name: str, ticker: str, supabase_client, turso_client):
    """
    Fetch ratio from Barchart and store it in Turso.
    Also updates the retail sentiment in Supabase (for the asset).
    Returns the ratio if successful, else None.
    """
    from apps.analysis.constants import FOREX_PAIRS

    ratio = fetch_put_call_ratio(ticker)
    if ratio is None:
        return None

    # Store in Turso
    today = datetime.now().strftime("%Y-%m-%d")
    turso_client.save_put_call_ratio(ticker, ratio, today)

    # Update retail sentiment for the asset
    asset_map = {
        "IBIT": "BTC",
        "GLD": "XAU",
        "SLV": "XAG",
        "QQQ": "NAS100",
        "SPY": "SPX500",
        "UUP": "USD",
        "USO": "USOIL",
    }
    if ticker in asset_map:
        asset = asset_map[ticker]
        # High put / high call thresholds from original logic
        thresholds = {
            "IBIT": {"high_put": 1.4, "high_call": 0.6},
            "GLD": {"high_put": 0.84, "high_call": 0.32},
            "SLV": {"high_put": 0.50, "high_call": 0.29},
            "QQQ": {"high_put": 1.58, "high_call": 0.7},
            "SPY": {"high_put": 1.30, "high_call": 0.95},
            "UUP": {"high_put": 0.89, "high_call": 0.08},
            "USO": {"high_put": 1.71, "high_call": 0.82},
        }
        th = thresholds.get(ticker, {"high_put": 99, "high_call": 0})
        if ratio >= th["high_put"]:
            score = 2
        elif ratio <= th["high_call"]:
            score = -2
        else:
            score = 0

        if asset == "USD":
            # Store in a separate field or update retail sentiment for the USD pair
            # We'll use a placeholder: we'll update retail_sentiment for "USD" as a fake pair
            supabase_client.upsert_retail_sentiment({
                'pair': 'USD',
                'retail_score': score,
                'long_pct': 50.0  # We don't have a long_pct from put/call
            })
        else:
            target_pair = f"{asset}/USD"
            supabase_client.upsert_retail_sentiment({
                'pair': target_pair,
                'retail_score': score,
                'long_pct': 50.0
            })

    return ratio