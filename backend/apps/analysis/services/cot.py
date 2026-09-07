from apps.services import turso_client
from typing import Dict, List, Optional
import logging

logger = logging.getLogger(__name__)

class COTService:
    def __init__(self):
        self._current = {}  # asset -> long_pct (latest)
        self._prev = {}     # asset -> long_pct (previous)
        self._raw = []      # list of dict with latest and previous contract values
        self._load_data()

    def _load_data(self):
        records = turso_client.get_cot_data()
        self._current = {}
        self._prev = {}
        self._raw = []

        if not records:
            logger.warning("No COT records found in Turso")
            return

        # Group by asset
        asset_records = {}
        for row in records:
            if isinstance(row, dict):
                asset = row.get('asset')
                if asset:
                    asset_records.setdefault(asset, []).append(row)
            else:
                logger.warning(f"Unexpected row format: {row}")

        for asset, recs in asset_records.items():
            # Sort by date descending (latest first)
            recs.sort(key=lambda x: x.get('date', ''), reverse=True)
            if not recs:
                continue

            latest = recs[0]
            latest_long = float(latest.get('long_pos', 0) or 0)
            latest_short = float(latest.get('short_pos', 0) or 0)
            latest_total = latest_long + latest_short
            latest_long_pct = (latest_long / latest_total * 100) if latest_total > 0 else 50.0

            self._current[asset] = latest_long_pct

            # Prepare raw entry with previous data
            raw_entry = {
                'asset': asset,
                'class': latest.get('class', 'forex'),
                'latest_date': latest.get('date'),
                'latest_long': latest_long,
                'latest_short': latest_short,
                'latest_long_pct': latest_long_pct,
                'prev_long': None,
                'prev_short': None,
                'prev_long_pct': None,
            }

            if len(recs) > 1:
                prev = recs[1]
                prev_long = float(prev.get('long_pos', 0) or 0)
                prev_short = float(prev.get('short_pos', 0) or 0)
                prev_total = prev_long + prev_short
                prev_long_pct = (prev_long / prev_total * 100) if prev_total > 0 else 50.0
                self._prev[asset] = prev_long_pct
                raw_entry['prev_long'] = prev_long
                raw_entry['prev_short'] = prev_short
                raw_entry['prev_long_pct'] = prev_long_pct
            else:
                # Only one record; previous = current (no change)
                self._prev[asset] = latest_long_pct
                raw_entry['prev_long'] = latest_long
                raw_entry['prev_short'] = latest_short
                raw_entry['prev_long_pct'] = latest_long_pct

            self._raw.append(raw_entry)

        logger.info(f"Loaded COT data for {len(self._current)} assets")

    def get_current(self) -> Dict:
        return self._current

    def get_previous(self) -> Dict:
        return self._prev

    def get_raw(self) -> List:
        """Return raw records with latest and previous data."""
        return self._raw

    def get_net_position(self, asset: str) -> float:
        long = self._current.get(asset, 50.0)
        return long - (100 - long)

    def get_previous_net_position(self, asset: str) -> float:
        """Return net position from previous report, or current if no previous."""
        long = self._prev.get(asset, self._current.get(asset, 50.0))
        return long - (100 - long)

    def get_cot_score_for_pair(self, base: str, quote: str) -> Optional[int]:
        if base not in self._current or quote not in self._current:
            return None

        net_base = self.get_net_position(base)
        net_quote = self.get_net_position(quote)
        current_diff = net_base - net_quote

        prev_base = self.get_previous_net_position(base)
        prev_quote = self.get_previous_net_position(quote)
        prev_diff = prev_base - prev_quote
        change = current_diff - prev_diff

        pos_score = 0
        if current_diff >= 20:
            pos_score = 1
        elif current_diff <= -20:
            pos_score = -1

        change_score = 0
        if change > 0.01:
            change_score = 1
        elif change < -0.01:
            change_score = -1

        return pos_score + change_score

    def update_record(self, asset: str, asset_class: str, date: str, long_pos: float, short_pos: float) -> bool:
        data = {
            'date': date,
            'asset': asset,
            'class': asset_class,
            'long_pos': long_pos,
            'short_pos': short_pos,
        }
        success = turso_client.upsert_cot_record(data)
        if success:
            self._load_data()  # reload cache
        return success

    def _get_history_for_asset(self, asset: str) -> List[Dict]:
        return turso_client.get_cot_data(asset)
    def refresh_from_web(self) -> int:
        """Fetch COT data from web (TitanFX) and update Turso."""
        from apps.scrapers.cot_titanfx import fetch_cot_from_titanfx
        # Reuse the existing scraper logic
        records, report_date = fetch_cot_from_titanfx()  # returns list of (asset, class, long, short) and date
        if not records:
            raise Exception("No COT data retrieved from TitanFX")
        updated = 0
        for asset, asset_class, long_pos, short_pos in records:
            if self.update_record(asset, asset_class, report_date, long_pos, short_pos):
                updated += 1
        return updated
    def get_latest_date(self) -> Optional[str]:
        """Return the date of the latest COT report, or None if no data."""
        if not self._raw:
            return None
        # The raw list is sorted by date descending, first item has latest date
        return self._raw[0].get('latest_date')