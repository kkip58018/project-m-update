import requests
from bs4 import BeautifulSoup
import cloudscraper
import re
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)


def fetch_cot_from_titanfx():
    """
    Scrape COT data from TitanFX (research.titanfx.com/cftc).
    Returns:
        records: List of tuples (asset_symbol, asset_class, long_pos, short_pos)
        report_date: str in YYYY-MM-DD format
    If scraping fails, returns (None, None).
    """
    url = "https://research.titanfx.com/cftc"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
        "Accept": "application/json, text/html, application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
    }

    try:
        response = requests.get(url, headers=headers, timeout=15)
    except Exception:
        response = None

    if (response is None or response.status_code in [403, 503]
            or (response.text and "Just a moment" in response.text)):
        scraper = cloudscraper.create_scraper()
        response = scraper.get(url, headers=headers, timeout=15)

    if response.status_code != 200:
        logger.error(f"Failed to fetch COT data. HTTP {response.status_code}")
        return None, None

    html_text = response.text
    soup = BeautifulSoup(html_text, "lxml")

    # Extract report date and publish date (+3 days)
    report_date = "Date not found"
    publish_date = "Date not found"
    date_match = re.search(
        r"Data Update:\s*([A-Za-z]+\s\d{1,2},\s\d{4})",
        soup.get_text(separator=" ")
    )
    if date_match:
        report_date = date_match.group(1)
        try:
            parsed_date = datetime.strptime(report_date, "%B %d, %Y")
        except ValueError:
            try:
                parsed_date = datetime.strptime(report_date, "%b %d, %Y")
            except ValueError:
                parsed_date = None
        if parsed_date:
            new_date = parsed_date + timedelta(days=3)
            publish_date = new_date.strftime("%Y-%m-%d")
        else:
            publish_date = datetime.now().strftime("%Y-%m-%d")
    else:
        publish_date = datetime.now().strftime("%Y-%m-%d")

    # Parse asset cards
    assets = soup.find_all(
        "li",
        class_="block p-[15px] md:px-[30px] md:py-[20px] bg-white rounded-[10px] shadow-[0_0_8px_0_rgba(0,0,0,0.10)]"
    )

    target_assets = [
        "eur", "gbp", "jpy", "chf", "aud", "cad", "nzd", "usd",
        "dollar index", "bitcoin", "ethereum", "gold", "silver",
        "nasdaq", "s&p", "crude", "wti", "oil"
    ]
    exclude_assets = ["mini", "micro"]

    asset_mapping = {
        "EUR": ("EUR", "forex"),
        "Euro": ("EUR", "forex"),
        "GBP": ("GBP", "forex"),
        "JPY": ("JPY", "forex"),
        "CHF": ("CHF", "forex"),
        "AUD": ("AUD", "forex"),
        "CAD": ("CAD", "forex"),
        "NZD": ("NZD", "forex"),
        "USD": ("USD", "forex"),
        "Dollar Index": ("USD", "forex"),
        "Gold": ("XAU", "metal"),
        "Silver": ("XAG", "metal"),
        "Bitcoin": ("BTC", "crypto"),
        "Ethereum": ("ETH", "crypto"),
        "Nasdaq": ("NAS100", "index"),
        "S&P": ("SPX500", "index"),
        "Crude Oil WTI": ("USOIL", "commodity"),
        "WTI": ("USOIL", "commodity"),
        "Crude": ("USOIL", "commodity"),
    }

    records = []

    for asset in assets:
        try:
            name_elem = asset.find(
                "a",
                class_="block mb-[20px] text-[18px] md:text-[22px] font-bold underline hover:no-underline"
            )
            if not name_elem:
                continue
            name = name_elem.text.strip()
            name_lower = name.lower()

            if any(excl in name_lower for excl in exclude_assets):
                continue
            if not any(target in name_lower for target in target_assets):
                continue

            ths = asset.find_all("th", class_="font-normal")
            if len(ths) >= 2:
                long_str = ths[0].find_next_sibling("td").text.strip()
                short_str = ths[1].find_next_sibling("td").text.strip()
                long_val = float(long_str.replace(",", ""))
                short_val = float(short_str.replace(",", ""))

                mapped = None
                for key, (sym, cls) in asset_mapping.items():
                    if key.lower() in name_lower:
                        mapped = (sym, cls)
                        break
                if not mapped:
                    sym = name.split()[0].upper()
                    cls = "forex"
                    mapped = (sym, cls)

                asset_sym, asset_class = mapped
                records.append((asset_sym, asset_class, long_val, short_val))
        except Exception as e:
            logger.warning(f"Failed to parse asset card: {e}")
            continue

    if not records:
        logger.warning("No COT data extracted from TitanFX")
        return None, None

    return records, publish_date