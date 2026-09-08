import requests
from bs4 import BeautifulSoup
import cloudscraper
import re
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Yahoo Finance options-chain fallback
#
# Barchart blocks server/datacenter IPs (HTTP 202 bot challenge), which makes
# the primary scraper fail when this code runs on Render.  Yahoo's options
# chain API is reachable from servers, so we compute the put/call volume ratio
# from it as a fallback.
# ---------------------------------------------------------------------------
YAHOO_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*",
}
YAHOO_EXPIRATIONS_TO_SUM = 6

_yahoo_session = None
_yahoo_crumb = None


def _yahoo_fetch_ratio(ticker: str):
    """Compute total put volume / total call volume from Yahoo's options chain."""
    global _yahoo_session, _yahoo_crumb

    def new_session():
        session = requests.Session()
        session.headers.update(YAHOO_HEADERS)
        try:
            session.get("https://fc.yahoo.com", timeout=12)
        except Exception:  # noqa: BLE001
            pass
        try:
            crumb_resp = session.get("https://query1.finance.yahoo.com/v1/test/getcrumb", timeout=12)
            crumb = crumb_resp.text.strip() if crumb_resp.status_code == 200 else None
        except Exception:  # noqa: BLE001
            crumb = None
        return session, crumb

    if _yahoo_session is None or _yahoo_crumb is None:
        _yahoo_session, _yahoo_crumb = new_session()

    def fetch_options(session, crumb, params):
        response = session.get(
            f"https://query2.finance.yahoo.com/v7/finance/options/{ticker}",
            params={"crumb": crumb, **params},
            timeout=15,
        )
        if response.status_code != 200:
            return None
        payload = response.json()
        try:
            return payload["optionChain"]["result"][0]
        except (KeyError, IndexError, TypeError):
            return None

    try:
        result = fetch_options(_yahoo_session, _yahoo_crumb, {})
        # "Invalid Crumb" -> refresh the session/crumb once and retry.
        if result is None:
            _yahoo_session, _yahoo_crumb = new_session()
            result = fetch_options(_yahoo_session, _yahoo_crumb, {})
        if result is None:
            return None

        expirations = (result.get("expirationDates") or [])[:YAHOO_EXPIRATIONS_TO_SUM]
        if not expirations:
            return None

        put_volume = 0
        call_volume = 0
        for expiration in expirations:
            chain = fetch_options(_yahoo_session, _yahoo_crumb, {"date": expiration})
            if not chain:
                continue
            for entry in chain.get("options", []) or []:
                for call in entry.get("calls", []) or []:
                    call_volume += call.get("volume") or 0
                for put in entry.get("puts", []) or []:
                    put_volume += put.get("volume") or 0

        if call_volume <= 0:
            return None
        return put_volume / call_volume
    except Exception as exc:  # noqa: BLE001
        logger.error(f"Yahoo put/call fetch failed for {ticker}: {exc}")
        return None


def fetch_put_call_ratio(ticker: str) -> float:
    """
    Fetch the put/call volume ratio for a ticker.
    Tries Barchart first, then falls back to Yahoo Finance's options chain.
    Returns the ratio as float, or None if both fail.
    """
    ratio = _fetch_barchart_ratio(ticker)
    if ratio is not None:
        return ratio
    logger.warning(f"Barchart failed for {ticker}; falling back to Yahoo Finance options chain")
    return _yahoo_fetch_ratio(ticker)


def _fetch_barchart_ratio(ticker: str) -> float:
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


def store_put_call_ratio(asset_name: str, ticker: str, ratio: float, supabase_client, turso_client):
    """
    Persist a known put/call ratio:
      * today's ratio into Turso's put_call_history table
      * a derived contrarian retail score into Supabase's retail_sentiment table

    Used both by the server-side scraper and by the local refresh command.
    Returns True only if the Turso history write succeeded.
    """
    # Store in Turso
    today = datetime.now().strftime("%Y-%m-%d")
    turso_ok = turso_client.save_put_call_ratio(ticker, ratio, today)

    # Update retail sentiment for the asset (independent of the Turso write)
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

    return turso_ok


def fetch_and_store_put_call_ratio(asset_name: str, ticker: str, supabase_client, turso_client):
    """
    Fetch ratio from Barchart (Yahoo fallback) and store it in Turso.
    Also updates the retail sentiment in Supabase (for the asset).
    Returns the ratio if successful, else None.
    """
    ratio = fetch_put_call_ratio(ticker)
    if ratio is None:
        return None

    store_put_call_ratio(asset_name, ticker, ratio, supabase_client, turso_client)
    return ratio