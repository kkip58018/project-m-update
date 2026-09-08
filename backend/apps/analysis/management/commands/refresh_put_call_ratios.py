"""
Update put/call ratios from your local machine using yfinance.

The deployed backend cannot reach Barchart (bot challenge) and the raw Yahoo
HTTP fallback is unreliable from Render, so run this locally where yfinance
works normally.  It computes today's put/call volume ratio for every tracked
ETF and writes it to Turso (plus the derived retail sentiment to Supabase) --
exactly what the server-side refresh does, but fetched from an unblocked IP.

Usage (from the backend/ folder, using your local virtualenv):

    python manage.py refresh_put_call_ratios                # all assets
    python manage.py refresh_put_call_ratios --ticker=GLD   # one ticker
    python manage.py refresh_put_call_ratios --dry-run      # compute only
"""

import time

from django.core.management.base import BaseCommand

from apps.analysis.refresh_tasks import PUT_CALL_ASSETS
from apps.scrapers.put_call import store_put_call_ratio
from apps.services import supabase_client, turso_client


def _compute_ratio(ticker):
    """Sum put & call volume across every expiration and return the ratio."""
    import yfinance as yf

    tk = yf.Ticker(ticker)
    expirations = tk.options
    if not expirations:
        return None, 0, 0

    total_call_volume = 0
    total_put_volume = 0
    for exp_date in expirations:
        try:
            chain = tk.option_chain(exp_date)
            total_call_volume += int(chain.calls["volume"].fillna(0).sum())
            total_put_volume += int(chain.puts["volume"].fillna(0).sum())
        except Exception:  # noqa: BLE001
            continue

    if total_call_volume <= 0:
        return None, total_put_volume, total_call_volume
    return total_put_volume / total_call_volume, total_put_volume, total_call_volume


class Command(BaseCommand):
    help = "Compute put/call volume ratios locally with yfinance and store them."

    def add_arguments(self, parser):
        parser.add_argument(
            "--ticker",
            default=None,
            help="Only update one ticker, e.g. --ticker=GLD.",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Compute and print the ratios but do NOT write to the database.",
        )
        parser.add_argument(
            "--pause",
            type=float,
            default=3.0,
            help="Seconds to pause between assets to avoid rate limits (default 3).",
        )

    def handle(self, *args, **options):
        only_ticker = (options.get("ticker") or "").upper() or None
        dry_run = options["dry_run"]
        pause = max(0.0, options["pause"])

        assets = PUT_CALL_ASSETS
        if only_ticker:
            assets = [(asset, tk) for asset, tk in assets if tk == only_ticker]
        if not assets:
            self.stdout.write(self.style.ERROR(f"No tracked asset matches ticker {only_ticker}"))
            return

        self.stdout.write(self.style.WARNING(
            f"Scanning put/call volume for {len(assets)} asset(s): "
            + ", ".join(f"{a} ({t})" for a, t in assets)
        ))
        if dry_run:
            self.stdout.write("DRY RUN: ratios will be computed but not saved.\n")

        updated = 0
        failed = []

        for asset_name, ticker in assets:
            self.stdout.write(f"[{asset_name}] ({ticker}) fetching options chains...", ending=" ")
            self.stdout.flush()

            try:
                ratio, put_vol, call_vol = _compute_ratio(ticker)
            except Exception as exc:  # noqa: BLE001
                self.stdout.write(self.style.ERROR(f"error: {exc}"))
                failed.append(ticker)
                continue

            if ratio is None:
                self.stdout.write(self.style.ERROR("no options volume data"))
                failed.append(ticker)
                continue

            sentiment = "Bearish" if ratio > 1 else "Bullish"
            self.stdout.write(
                f"put={put_vol:,} call={call_vol:,} ratio={ratio:.2f} ({sentiment})", ending=" "
            )

            if dry_run:
                self.stdout.write(self.style.SUCCESS("(dry-run, not saved)"))
            else:
                ok = store_put_call_ratio(asset_name, ticker, ratio, supabase_client, turso_client)
                if ok:
                    self.stdout.write(self.style.SUCCESS("-> saved"))
                    updated += 1
                else:
                    self.stdout.write(self.style.ERROR("-> TURSO SAVE FAILED"))
                    failed.append(ticker)

            if pause > 0:
                time.sleep(pause)

        self.stdout.write("\n" + "=" * 50)
        if dry_run:
            self.stdout.write(self.style.SUCCESS(f"Done (dry-run). Computed ratios for {len(assets) - len(failed)} asset(s)."))
        else:
            self.stdout.write(self.style.SUCCESS(f"Done. Saved ratios for {updated} asset(s)."))
        if failed:
            self.stdout.write(self.style.ERROR(f"Failed ({len(failed)}): {', '.join(failed)}"))
