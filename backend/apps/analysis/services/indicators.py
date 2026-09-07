from apps.services import supabase_client
from apps.analysis.constants import DIRECTION, CORE_INDICATORS, EXTRA_INDICATORS, SCORING_ONLY_INDICATORS, SCORING_EXCLUDED_INDICATORS
from typing import Dict, Optional, List, Tuple
from apps.scrapers.economic import scrape_indicator_data
from apps.analysis.constants import ECON_SCRAPE_URLS, EXTRA_INDICATORS, SCORING_EXCLUDED_INDICATORS
from datetime import datetime

class IndicatorsService:
    """Handles loading, scoring, and updating economic indicators."""
    
    def __init__(self):
        self._raw_data = {}       # currency -> {indicator -> (actual, forecast, date, previous)}
        self._indicator_scores = {}  # currency -> {indicator -> score}
        self._currency_scores = {}   # currency -> total score
        self._bullish_percentages = {}  # currency -> bullish %
        self._load_data()

    def _load_data(self):
        """Load all indicators from Supabase and compute scores."""
        records = supabase_client.get_indicators()
        self._raw_data.clear()
        self._indicator_scores.clear()
        self._currency_scores.clear()
        self._bullish_percentages.clear()

        for row in records:
            curr = row.get('currency_code')
            ind = row.get('indicator_name')
            if not curr or not ind:
                continue
            actual = float(row['actual_value']) if row.get('actual_value') is not None else None
            forecast = float(row['forecast_value']) if row.get('forecast_value') is not None else None
            date = row.get('release_date')
            prev = float(row['previous_value']) if row.get('previous_value') is not None else None
            
            self._raw_data.setdefault(curr, {})[ind] = (actual, forecast, date, prev)
            
            # Compute score
            direction = DIRECTION.get(ind, 'higher')
            if actual is None or forecast is None:
                score = 0
            else:
                if direction == 'higher':
                    score = 1 if actual > forecast else (-1 if actual < forecast else 0)
                else:
                    score = 1 if actual < forecast else (-1 if actual > forecast else 0)
            self._indicator_scores.setdefault(curr, {})[ind] = score

        # Compute aggregate scores per currency
        for curr in self._raw_data:
            indicators = self._get_indicators_for_currency(curr)
            total = 0
            beats = 0
            surprises = 0
            for ind in indicators:
                if ind not in self._raw_data[curr]:
                    continue
                actual, forecast, _, _ = self._raw_data[curr][ind]
                if actual is None or forecast is None:
                    continue
                score = self._indicator_scores[curr].get(ind, 0)
                total += score
                if actual != forecast:
                    surprises += 1
                    direction = DIRECTION.get(ind, 'higher')
                    if (direction == 'higher' and actual > forecast) or (direction == 'lower' and actual < forecast):
                        beats += 1
            self._currency_scores[curr] = total
            self._bullish_percentages[curr] = (beats / surprises * 100.0) if surprises > 0 else 0.0

    def _get_indicators_for_currency(self, curr: str) -> List[str]:
        inds = list(CORE_INDICATORS) + list(SCORING_ONLY_INDICATORS)
        if curr in EXTRA_INDICATORS:
            inds.extend(EXTRA_INDICATORS[curr])
        if curr in SCORING_EXCLUDED_INDICATORS:
            for excl in SCORING_EXCLUDED_INDICATORS[curr]:
                if excl in inds:
                    inds.remove(excl)
        return inds

    def get_raw_data(self, currency: str = None) -> Dict:
        if currency:
            return self._raw_data.get(currency.upper(), {})
        return self._raw_data

    def get_indicator_scores(self, currency: str = None) -> Dict:
        if currency:
            return self._indicator_scores.get(currency.upper(), {})
        return self._indicator_scores

    def get_currency_scores(self) -> Dict:
        return self._currency_scores

    def get_currency_score(self, currency: str) -> int:
        return self._currency_scores.get(currency.upper(), 0)

    def get_bullish_percentage(self, currency: str) -> float:
        return self._bullish_percentages.get(currency.upper(), 0.0)
    def update_indicator(self, currency: str, indicator: str, actual: float, forecast: float, date: str, previous: float = None) -> bool:
        """Update a single indicator and reload the cache."""
        currency = currency.upper()
        direction = DIRECTION.get(indicator, 'higher')
        if actual is None or forecast is None:
            score = 0
        else:
            if direction == 'higher':
                score = 1 if actual > forecast else (-1 if actual < forecast else 0)
            else:
                score = 1 if actual < forecast else (-1 if actual > forecast else 0)

        data = {
            'currency_code': currency,
            'indicator_name': indicator,
            'actual_value': actual,
            'forecast_value': forecast,
            'release_date': date,
            'previous_value': previous,
            'score': score,
        }
        success = supabase_client.upsert_indicator(data)
        if success:
            self._load_data()  # reload the cache
        return success
  
    def refresh_from_web(self, currency: str, progress_callback=None) -> tuple:
        """
        Fetch all indicators for a currency from web sources and update database.
        Returns (updated_count, message_string)
        """
        currency = currency.upper()
        all_indicators = list(CORE_INDICATORS) + list(SCORING_ONLY_INDICATORS)
        if currency in EXTRA_INDICATORS:
            all_indicators.extend(EXTRA_INDICATORS[currency])
        if currency in SCORING_EXCLUDED_INDICATORS:
            for excl in SCORING_EXCLUDED_INDICATORS[currency]:
                if excl in all_indicators:
                    all_indicators.remove(excl)
    
        total = len(all_indicators)
        updated = 0
        failed = 0
        source_primary = 0
        source_fallback = 0
        failed_indicators = []
    
        for i, ind_name in enumerate(all_indicators):
            key = f"{currency} - {ind_name}"
            urls = ECON_SCRAPE_URLS.get(key, {})
            scraped = None
            source_used = None
    
            if urls.get("primary"):
                scraped = scrape_indicator_data(urls["primary"])
                if scraped:
                    source_used = scraped.get("source")
            if not scraped and urls.get("fallback"):
                scraped = scrape_indicator_data(urls["fallback"])
                if scraped:
                    source_used = scraped.get("source")
    
            if scraped:
                date_str = scraped.get("date")
                actual = scraped.get("actual")
                previous = scraped.get("previous")
                forecast = scraped.get("forecast")
    
                if forecast is None and previous is not None:
                    forecast = previous
                if actual is not None and forecast is not None:
                    # Use the update method (which upserts to Supabase)
                    self.update_indicator(
                        currency, ind_name, actual, forecast, date_str, previous
                    )
                    updated += 1
                    if source_used == "primary":
                        source_primary += 1
                    elif source_used == "fallback":
                        source_fallback += 1
                else:
                    failed += 1
                    failed_indicators.append(ind_name)
            else:
                failed += 1
                failed_indicators.append(ind_name)
    
            if progress_callback:
                progress_callback(i + 1, total)
    
        # Build message
        msg_parts = []
        if updated > 0:
            msg_parts.append(f"✅ {updated} indicators updated")
            if source_primary > 0:
                msg_parts.append(f"   └ Primary sources: {source_primary}")
            if source_fallback > 0:
                msg_parts.append(f"   └ Fallback sources: {source_fallback}")
        if failed > 0:
            msg_parts.append(f"❌ {failed} indicators failed")
            if failed_indicators:
                msg_parts.append(
                    f"   └ Failed: {', '.join(failed_indicators[:5])}"
                    + (f" (+{len(failed_indicators)-5} more)" if len(failed_indicators) > 5 else "")
                )
    
        message = "\n".join(msg_parts) if msg_parts else "No indicators processed."
        return updated, message