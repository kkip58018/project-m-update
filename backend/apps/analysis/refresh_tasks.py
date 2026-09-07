"""
Automatic background data refreshes.

* Retail sentiment  -> refreshed every 30 minutes (on the :00 and :30 marks).
* Put / call ratios -> refreshed at 16:00 America/New_York on weekdays
                       (1 hour before the ~17:00 ET US session close).

The scheduler is deliberately a small dependency-free daemon thread.  It is
started from ``config/wsgi.py`` so it only runs inside the WSGI server process
(gunicorn) and never during ``manage.py`` commands or the dev runserver.

A shared Analyzer singleton (see ``.services.analyzer``) is used so that every
refresh updates the same in-memory state the API GET views read from, and the
Django cache is purged afterwards so cached page responses are rebuilt with the
new values.  Set ``ENABLE_BACKGROUND_REFRESH=0`` to disable.
"""

import logging
import os
import threading
from datetime import datetime, timedelta, time as dtime, timezone
from zoneinfo import ZoneInfo

logger = logging.getLogger(__name__)

ET = ZoneInfo("America/New_York")
POLL_SECONDS = 30

# Mirror of the assets refreshed by the admin "refresh put/call" endpoint.
PUT_CALL_ASSETS = [
    ("BTC", "IBIT"),
    ("XAU", "GLD"),
    ("XAG", "SLV"),
    ("NAS100", "QQQ"),
    ("SPX500", "SPY"),
    ("USD", "UUP"),
    ("USOIL", "USO"),
]

_stop = threading.Event()
_thread = None
_lock = threading.Lock()


def _utcnow():
    return datetime.now(timezone.utc)


# --------------------------------------------------------------------------- #
# Individual refresh jobs
# --------------------------------------------------------------------------- #
def refresh_retail_sentiment() -> bool:
    """Pull retail sentiment from the retail API and update the shared state."""
    from django.core.cache import cache
    from .services.analyzer import get_analyzer

    analyzer = get_analyzer()
    ok = analyzer.retail.refresh_from_api()
    if ok:
        # retail service already reloaded its own memory; only purge cached
        # HTTP responses so the very next GET is rebuilt from fresh data.
        cache.clear()
        logger.info("Auto refresh: retail sentiment updated")
    else:
        logger.warning("Auto refresh: retail sentiment refresh returned failure")
    return ok


def refresh_put_call_ratios() -> bool:
    """Scrape put/call ratios for every configured asset and store them."""
    from apps.services import supabase_client, turso_client
    from apps.scrapers.put_call import fetch_and_store_put_call_ratio

    ok = True
    for asset_name, ticker in PUT_CALL_ASSETS:
        try:
            ratio = fetch_and_store_put_call_ratio(asset_name, ticker, supabase_client, turso_client)
            if ratio is None:
                ok = False
        except Exception as exc:  # noqa: BLE001
            logger.error(f"Auto refresh: put/call failed for {ticker}: {exc}")
            ok = False

    # Put/call also rewrites retail sentiment rows for the covered assets, so
    # reload the shared analyzer and drop cached responses afterwards.
    from django.core.cache import cache
    from .services.analyzer import reload_analyzer
    reload_analyzer()
    cache.clear()
    logger.info(f"Auto refresh: put/call ratios refreshed (all ok: {ok})")
    return ok


# --------------------------------------------------------------------------- #
# Schedule computation
# --------------------------------------------------------------------------- #
def _next_retail_run(now):
    """Next :00 / :30 UTC mark strictly after ``now``."""
    start = now.replace(second=0, microsecond=0)
    remainder = start.minute % 30
    if remainder == 0:
        return start + timedelta(minutes=30)
    return start + timedelta(minutes=30 - remainder)


def _next_putcall_run(now):
    """Next weekday 16:00 America/New_York strictly after ``now``."""
    candidate = datetime.combine(now.astimezone(ET).date(), dtime(hour=16, minute=0), tzinfo=ET)
    while candidate <= now or candidate.weekday() >= 5:
        candidate = candidate + timedelta(days=1)
    return candidate


# --------------------------------------------------------------------------- #
# Loop + lifecycle
# --------------------------------------------------------------------------- #
def _run_jobs():
    retail_next = _next_retail_run(_utcnow())
    putcall_next = _next_putcall_run(_utcnow())
    logger.info(
        "Auto refresh scheduler started — retail next: %s, put/call next: %s",
        retail_next.isoformat(), putcall_next.isoformat(),
    )
    while not _stop.wait(POLL_SECONDS):
        now = _utcnow()
        try:
            if now >= retail_next:
                refresh_retail_sentiment()
                retail_next = _next_retail_run(now)
        except Exception as exc:  # noqa: BLE001
            logger.exception("Auto refresh: retail job error: %s", exc)
            retail_next = _next_retail_run(_utcnow())

        try:
            if now >= putcall_next:
                refresh_put_call_ratios()
                putcall_next = _next_putcall_run(_utcnow())
        except Exception as exc:  # noqa: BLE001
            logger.exception("Auto refresh: put/call job error: %s", exc)
            putcall_next = _next_putcall_run(_utcnow())


def start_background_refresh():
    """Start the background scheduler thread once per process (if enabled)."""
    global _thread
    if os.environ.get("ENABLE_BACKGROUND_REFRESH", "1") != "1":
        logger.info("Auto refresh scheduler disabled via ENABLE_BACKGROUND_REFRESH")
        return None

    with _lock:
        if _thread is not None and _thread.is_alive():
            return _thread
        _stop.clear()
        _thread = threading.Thread(
            target=_run_jobs,
            name="macro-auto-refresh",
            daemon=True,
        )
        _thread.start()
        logger.info("Auto refresh scheduler thread started")
    return _thread


def stop_background_refresh():
    """Signal the scheduler thread to stop (used mainly in tests)."""
    _stop.set()
    if _thread is not None:
        _thread.join(timeout=5)
