"""
Refresh every economic indicator that uses investing.com as its PRIMARY source.

investing.com's JSON feed (endpoints.investing.com/...) returns 403 from server
/ datacenter IPs such as Render, and it also rate-limits / fingerprints repeated
automated requests even from a local IP.  Run this manually from your local
machine, in a normal browser session first if possible.

The command warms up an investing.com session (to collect cookies), retries each
request several times with impersonation rotation + exponential backoff, and
writes the parsed values straight to Supabase (which is what the deployed
backend reads from).

Usage (from the backend/ folder, using your local virtualenv):

    python manage.py refresh_investing_indicators                 # all currencies
    python manage.py refresh_investing_indicators --currency=USD  # one currency
    python manage.py refresh_investing_indicators --dry-run       # fetch, don't write
    python manage.py refresh_investing_indicators --attempts=6    # more retries
"""

import random
import time

from django.core.management.base import BaseCommand, CommandError

from apps.analysis.constants import ECON_SCRAPE_URLS, DIRECTION
from apps.services import supabase_client

WARM_URL = "https://www.investing.com/economic-calendar/"
IMPERSONATIONS = ["chrome124", "chrome120", "safari17_0", "firefox109"]
CURL_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "en-US,en;q=0.9",
    "Origin": "https://www.investing.com",
    "Referer": "https://www.investing.com/economic-calendar/",
}
CLOUD_HEADERS = {
    "User-Agent": CURL_HEADERS["User-Agent"],
    "Accept": "application/json, text/html, application/xhtml+xml",
    "Origin": "https://www.investing.com",
    "Referer": "https://www.investing.com/economic-calendar/",
}


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


def parse_investing_payload(payload, source):
    """Mirror the parsing in apps/scrapers/economic.py for the occurrences JSON."""
    occurrences = payload.get("occurrences", []) or []
    if not occurrences:
        return None

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

    # Preliminary-release handling (Investing.com only)
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
        "source": source,
    }


class Command(BaseCommand):
    help = "Refresh indicators whose primary source is investing.com (blocked on Render, run locally)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--currency",
            default=None,
            help="Only refresh a single currency, e.g. --currency=USD",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Fetch and parse the data but do NOT write anything to the database.",
        )
        parser.add_argument(
            "--delay",
            type=float,
            default=3.0,
            help="Base seconds between indicators (default 3.0, random jitter added).",
        )
        parser.add_argument(
            "--attempts",
            type=int,
            default=5,
            help="How many times to retry each URL before giving up (default 5).",
        )
        parser.add_argument(
            "--no-warmup",
            action="store_true",
            help="Skip fetching the investing.com calendar page first (to get cookies).",
        )

    # ------------------------------------------------------------------ #
    # Fetch helpers
    # ------------------------------------------------------------------ #
    def _curl_attempt(self, url, warmup):
        from curl_cffi import requests as curl_requests

        impersonate = random.choice(IMPERSONATIONS)
        session = curl_requests.Session(impersonate=impersonate)
        if warmup:
            try:
                session.get(WARM_URL, headers=CLOUD_HEADERS, timeout=20)
            except Exception:  # noqa: BLE001
                pass
        resp = session.get(url, headers=CURL_HEADERS, timeout=20)
        if resp.status_code == 200:
            return resp.json(), "Investing.com API (curl_cffi)", None
        return None, None, f"curl_cffi status {resp.status_code}"

    def _cloud_attempt(self, url):
        import cloudscraper

        scraper = cloudscraper.create_scraper()
        resp = scraper.get(url, headers=CLOUD_HEADERS, timeout=20)
        if resp.status_code == 200:
            return resp.json(), "Investing.com API (cloudscraper)", None
        return None, None, f"cloudscraper status {resp.status_code}"

    def _fetch_payload(self, url, attempts, warmup):
        """Return (payload_dict, source) or (None, None) after retries/backoff."""
        last_status = None
        for attempt in range(1, attempts + 1):
            # 1) curl_cffi with impersonation
            try:
                payload, source, status = self._curl_attempt(url, warmup)
                if payload is not None:
                    return payload, source
                if status:
                    last_status = status
            except Exception as exc:  # noqa: BLE001
                last_status = f"curl_cffi exception {exc}"

            # 2) cloudscraper
            try:
                payload, source, status = self._cloud_attempt(url)
                if payload is not None:
                    return payload, source
                if status:
                    last_status = status
            except Exception as exc:  # noqa: BLE001
                last_status = f"cloudscraper exception {exc}"

            if attempt < attempts:
                wait = (attempt * 2.5) + random.uniform(0, 3)
                self.stdout.write(f"attempt {attempt} failed ({last_status}); retrying in {wait:.0f}s ...", ending=" ")
                self.stdout.flush()
                time.sleep(wait)
        self.stdout.write(self.style.ERROR(f"gave up after {attempts} attempts (last: {last_status})"))
        return None, None

    # ------------------------------------------------------------------ #
    # Main
    # ------------------------------------------------------------------ #
    def handle(self, *args, **options):
        currency = (options.get("currency") or "").upper() or None
        dry_run = options["dry_run"]
        delay = max(0.0, options["delay"])
        attempts = max(1, options["attempts"])
        warmup = not options["no_warmup"]

        targets = []
        for key, urls in ECON_SCRAPE_URLS.items():
            primary = urls.get("primary") or ""
            if "investing.com" not in primary:
                continue
            currency_code = key.split(" - ")[0]
            indicator_name = key.split(" - ")[1]
            if currency and currency_code != currency:
                continue
            targets.append((currency_code, indicator_name, primary))

        if not targets:
            self.stdout.write(f"No investing.com-sourced indicators found{f' for {currency}' if currency else ''}.")
            return

        self.stdout.write(self.style.WARNING(
            f"Found {len(targets)} investing.com indicator(s) to refresh:\n"
            + "\n".join(f"  - {code} - {name}" for code, name, _ in targets)
        ))
        if dry_run:
            self.stdout.write("DRY RUN: data will be fetched and parsed but not saved.\n")

        updated = 0
        failed = []

        for currency_code, indicator_name, url in targets:
            self.stdout.write(f"\n[{currency_code}] {indicator_name} ...", ending=" ")
            self.stdout.flush()

            payload, source = self._fetch_payload(url, attempts, warmup)
            if payload is None:
                failed.append(f"{currency_code} - {indicator_name}")
                continue

            scraped = parse_investing_payload(payload, source)
            if scraped is None:
                self.stdout.write(self.style.ERROR("response had no occurrences"))
                failed.append(f"{currency_code} - {indicator_name}")
                continue

            actual = scraped.get("actual")
            forecast = scraped.get("forecast")
            previous = scraped.get("previous")

            # Investing does not publish a forecast for some events (e.g. several
            # PMIs). Match apps/analysis/services/indicators.py and fall back to
            # the previous value as the expected print.
            forecast_note = ""
            if forecast is None and previous is not None:
                forecast = previous
                forecast_note = " (forecast not published, used previous)"

            if actual is None or forecast is None:
                self.stdout.write(self.style.ERROR(
                    f"scraped but missing actual/forecast ({source})"
                ))
                failed.append(f"{currency_code} - {indicator_name}")
                continue

            direction = DIRECTION.get(indicator_name, "higher")
            if direction == "higher":
                score = 1 if actual > forecast else (-1 if actual < forecast else 0)
            else:
                score = 1 if actual < forecast else (-1 if actual > forecast else 0)

            data = {
                "currency_code": currency_code,
                "indicator_name": indicator_name,
                "actual_value": actual,
                "forecast_value": forecast,
                "release_date": scraped.get("date"),
                "previous_value": previous,
                "score": score,
            }

            if dry_run:
                self.stdout.write(self.style.SUCCESS(
                    f"OK (would save: actual={actual}, forecast={forecast}{forecast_note}, "
                    f"previous={previous}, score={score})"
                ))
                updated += 1
            else:
                ok = supabase_client.upsert_indicator(data)
                if ok:
                    self.stdout.write(self.style.SUCCESS(
                        f"OK ({source}) actual={actual} forecast={forecast}{forecast_note} score={score}"
                    ))
                    updated += 1
                else:
                    self.stdout.write(self.style.ERROR("DB upsert failed"))
                    failed.append(f"{currency_code} - {indicator_name}")

            if delay > 0 and targets[-1] != (currency_code, indicator_name, url):
                time.sleep(delay + random.uniform(0, 2.5))

        self.stdout.write("\n" + "=" * 60)
        self.stdout.write(self.style.SUCCESS(f"Done. Successfully processed: {updated}"))
        if failed:
            self.stdout.write(self.style.ERROR(f"Failed ({len(failed)}): {', '.join(failed)}"))

        if not dry_run and failed:
            raise CommandError("One or more indicators failed to refresh.")
