from .indicators import IndicatorsService
from .cot import COTService
from .retail import RetailService
from .bond_yield import BondYieldService
from .economic_strength import EconomicStrengthService
from .seasonality import SeasonalityService
from .seasonality_db import SeasonalityDBService
from .trend import TrendService
from apps.analysis.constants import FOREX_PAIRS, STANDARD_CURRENCIES, CORE_INDICATORS, SCORING_ONLY_INDICATORS, EXTRA_INDICATORS, SCORING_EXCLUDED_INDICATORS
from typing import Dict, List, Tuple, Optional
from .seasonality_db import seasonality_db
import logging
import threading
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Shared Analyzer singleton.
#
# Views in different modules previously each built their own Analyzer() at
# import time.  When an admin ran a refresh (e.g. retail sentiment / COT) the
# data store + the *admin module's* analyzer were reloaded, but the GET views
# that actually serve the frontend kept reading their own stale in-memory copy
# -- so the UI stayed on old data no matter how many times it was refreshed.
# Every view and background job must go through get_analyzer() so they all
# operate on one object, and reload_analyzer() is called after any data write
# so the serving process picks up the new values immediately.
# ---------------------------------------------------------------------------
_analyzer_instance: Optional['Analyzer'] = None
_analyzer_lock = threading.Lock()


def get_analyzer() -> 'Analyzer':
    """Return the shared Analyzer instance, creating it on first use."""
    global _analyzer_instance
    if _analyzer_instance is None:
        with _analyzer_lock:
            if _analyzer_instance is None:
                _analyzer_instance = Analyzer()
    return _analyzer_instance


def reload_analyzer() -> 'Analyzer':
    """Reload all in-memory services from the data store on the shared Analyzer."""
    global _analyzer_instance
    with _analyzer_lock:
        if _analyzer_instance is None:
            _analyzer_instance = Analyzer()
        else:
            _analyzer_instance.load_all_data()
    return _analyzer_instance

class Analyzer:
    """
    Orchestrates all services to provide enriched data for the dashboard.
    """

    def __init__(self):
        self.indicators = IndicatorsService()
        self.cot = COTService()
        self.retail = RetailService()
        self.bond_yield = BondYieldService()
        self.econ_strength = EconomicStrengthService()
        self.seasonality = SeasonalityService()
        # self.seasonality = SeasonalityDBService
        self.trend = TrendService()
        self._usd_pc_score = 0  # Will be set if put/call data exists
   
    def get_enriched_pairs(self, include_currencies: bool = True) -> List[Dict]:
        """
        Returns a list of dicts for each asset/currency with all scores and detailed indicator breakdowns.
        Structure:
        {
            'asset': str,                  # e.g., 'EUR/USD', 'USD', 'XAU/USD'
            'bias': str,                   # 'Very Bullish', 'Bullish', 'Neutral', etc.
            'overall': int,                # overall combined score
            'trend': int,                  # trend component
            'seasonality': int,            # seasonality component
            'cot': int,                    # COT component
            'retail': int,                 # retail (contrarian) component
            'indicator_scores': dict       # {indicator_name: score} for all relevant indicators
        }
        """
        results = []
        current_month = self._get_current_month_abbr()

        # Helper to get indicator difference for a pair
        def get_indicator_diff(base: str, quote: str, indicator: str) -> int:
            base_score = self.indicators.get_indicator_scores(base).get(indicator, 0)
            quote_score = self.indicators.get_indicator_scores(quote).get(indicator, 0)
            return base_score - quote_score

        # ======================================================================
        # 1. Forex pairs
        # ======================================================================
        for pair in FOREX_PAIRS:
            base, quote = pair.split('/')
            # Skip if either currency lacks data
            if base not in self.indicators.get_currency_scores() or quote not in self.indicators.get_currency_scores():
                continue

            # Core component scores
            fund = self.indicators.get_currency_score(base) - self.indicators.get_currency_score(quote)
            cot = self.cot.get_cot_score_for_pair(base, quote) or 0
            retail = self.retail.get_score_for_pair(pair)
            trend = self.trend.get_trend_score(pair)
            season = seasonality_db.get_seasonality_score(pair, current_month)
            overall = fund + cot + retail + trend + season
            bias = self._bias_from_score(overall)

            # Build full indicator list for this pair
            indicator_set = set(CORE_INDICATORS) | set(SCORING_ONLY_INDICATORS)
            if base in EXTRA_INDICATORS:
                indicator_set.update(EXTRA_INDICATORS[base])
            if quote in EXTRA_INDICATORS:
                indicator_set.update(EXTRA_INDICATORS[quote])
            # Remove excluded indicators
            if base in SCORING_EXCLUDED_INDICATORS:
                for excl in SCORING_EXCLUDED_INDICATORS[base]:
                    indicator_set.discard(excl)
            if quote in SCORING_EXCLUDED_INDICATORS:
                for excl in SCORING_EXCLUDED_INDICATORS[quote]:
                    indicator_set.discard(excl)

            indicator_scores = {}
            for ind in indicator_set:
                indicator_scores[ind] = get_indicator_diff(base, quote, ind)

            results.append({
                'asset': pair,
                'bias': bias,
                'overall': overall,
                'trend': trend,
                'seasonality': season,
                'cot': cot,
                'retail': retail,
                'indicator_scores': indicator_scores,
            })

        # ======================================================================
        # 2. Non-forex assets (metals, crypto, oil, indices)
        # ======================================================================
        nonforex_assets = [
            ('XAU', 'USD'), ('XAG', 'USD'), ('BTC', 'USD'), ('ETH', 'USD'),
            ('USOIL', 'USD'), ('SPX500', 'USD'), ('NAS100', 'USD')
        ]
        # Categorization helpers
        growth_inds = ["GDP", "Retail Sales", "Manufacturing PMI", "Services PMI", "Consumer Confidence"]
        jobs_inds = ["Unemployment Rate", "NFP", "Unemployment claims", "ADP", "JOLTS job openings"]
        inflation_inds = ["CPI YoY", "PPI YoY", "PCE YoY"]

        usd_extra = EXTRA_INDICATORS.get('USD', [])
        all_usd_indicators = list(set(CORE_INDICATORS + SCORING_ONLY_INDICATORS + usd_extra))
        if 'USD' in SCORING_EXCLUDED_INDICATORS:
            for excl in SCORING_EXCLUDED_INDICATORS['USD']:
                if excl in all_usd_indicators:
                    all_usd_indicators.remove(excl)

        for base, quote in nonforex_assets:
            pair = f"{base}/{quote}"
            is_metal = base in ['XAU', 'XAG']
            is_crypto = base in ['BTC', 'ETH']
            is_oil = base == 'USOIL'
            is_index = base in ['SPX500', 'NAS100']
            invert_growth_jobs = is_metal
            invert_inflation = is_metal or is_crypto or is_oil or is_index

            fund = self._compute_nonforex_fund_score(base)
            cot = self._get_cot_score_for_asset(base)
            retail = self.retail.get_score_for_pair(pair)
            trend = self.trend.get_trend_score(pair)
            season = seasonality_db.get_seasonality_score(pair, current_month)
            overall = fund + cot + retail + trend + season
            bias = self._bias_from_score(overall)

            # Build indicator scores using USD with inversions
            usd_scores = self.indicators.get_indicator_scores('USD')
            indicator_scores = {}
            for ind in all_usd_indicators:
                score = usd_scores.get(ind, 0)
                if ind in growth_inds and invert_growth_jobs:
                    score = -score
                elif ind in jobs_inds and invert_growth_jobs:
                    score = -score
                elif ind in inflation_inds and invert_inflation:
                    score = -score
                indicator_scores[ind] = score

            results.append({
                'asset': pair,
                'bias': bias,
                'overall': overall,
                'trend': trend,
                'seasonality': season,
                'cot': cot,
                'retail': retail,
                'indicator_scores': indicator_scores,
            })

        # ======================================================================
        # 3. Individual currencies (if requested)
        # ======================================================================
        if include_currencies:
            for curr in STANDARD_CURRENCIES:
                fund = self.indicators.get_currency_score(curr)
                cot = self._get_cot_score_for_asset(curr)
                retail = self._aggregate_retail_for_currency(curr)
                trend = self._aggregate_trend_for_currency(curr)
                season = self._aggregate_seasonality_for_currency(curr)
                overall = fund + cot + retail + trend + season
                bias = self._bias_from_score(overall)

                # Raw indicator scores for this currency (no differences)
                indicator_scores = self.indicators.get_indicator_scores(curr)

                results.append({
                    'asset': curr,
                    'bias': bias,
                    'overall': overall,
                    'trend': trend,
                    'seasonality': season,
                    'cot': cot,
                    'retail': retail,
                    'indicator_scores': indicator_scores,
                })

        return results
    
    def _bias_from_score(self, score: int) -> str:
        if score >= 9:
            return "Very Bullish"
        elif score >= 5:
            return "Bullish"
        elif score <= -9:
            return "Very Bearish"
        elif score <= -5:
            return "Bearish"
        else:
            return "Neutral"

    def _compute_nonforex_fund_score(self, base: str) -> int:
        """Compute fundamental score for metals, crypto, oil, indices."""
        # For these assets, we use USD indicators with inversions as per original logic
        usd_data = self.indicators.get_raw_data('USD')
        usd_scores = self.indicators.get_indicator_scores('USD')
        is_metal = base in ['XAU', 'XAG']
        is_crypto = base in ['BTC', 'ETH']
        is_oil = base == 'USOIL'
        is_index = base in ['SPX500', 'NAS100']
        invert_growth_jobs = is_metal
        invert_inflation = is_metal or is_crypto or is_oil or is_index

        GROWTH = ["GDP", "Retail Sales", "Manufacturing PMI", "Services PMI", "Consumer Confidence"]
        JOBS = ["Unemployment Rate", "NFP", "Unemployment claims", "ADP", "JOLTS job openings"]
        INFLATION = ["CPI YoY", "PPI YoY", "PCE YoY"]

        def sum_category(indicators, invert):
            total = 0
            for ind in indicators:
                if ind not in usd_data:
                    continue
                actual, forecast, _, _ = usd_data[ind]
                if actual is None or forecast is None:
                    continue
                score = usd_scores.get(ind, 0)
                total += -score if invert else score
            return total

        growth = sum_category(GROWTH, invert_growth_jobs)
        jobs = sum_category(JOBS, invert_growth_jobs)
        inflation = sum_category(INFLATION, invert_inflation)
        bond = self.bond_yield.get_score('USD')
        if invert_growth_jobs:
            bond = -bond
        return growth + jobs + inflation + bond

    def _get_cot_score_for_asset(self, asset: str) -> int:
        """Return COT score for a single asset (net positioning + change)."""
        current = self.cot.get_current()
        previous = self.cot.get_previous()
        if asset not in current:
            return 0
        cur_long = current[asset]
        cur_net = cur_long - (100 - cur_long)
        # Net positioning score
        if cur_net >= 60:
            pos = 2
        elif cur_net >= 20:
            pos = 1
        elif cur_net <= -60:
            pos = -2
        elif cur_net <= -20:
            pos = -1
        else:
            pos = 0
        # Change score
        if asset in previous:
            prev_long = previous[asset]
            prev_net = prev_long - (100 - prev_long)
            change = cur_net - prev_net
        else:
            change = 0
        change_score = 1 if change > 0 else -1 if change < 0 else 0
        return pos + change_score

    def _aggregate_retail_for_currency(self, curr: str) -> int:
        scores = []
        for pair in FOREX_PAIRS:
            if curr not in pair:
                continue
            base, quote = pair.split('/')
            sign = 1 if curr == base else -1
            scores.append(sign * self.retail.get_score_for_pair(pair))
        return round(sum(scores) / len(scores)) if scores else 0

    def _aggregate_trend_for_currency(self, curr: str) -> int:
        scores = []
        for pair in FOREX_PAIRS:
            if curr not in pair:
                continue
            base, quote = pair.split('/')
            sign = 1 if curr == base else -1
            scores.append(sign * self.trend.get_trend_score(pair))
        return round(sum(scores) / len(scores)) if scores else 0

    def _aggregate_seasonality_for_currency(self, curr: str) -> int:
        month = self._get_current_month_abbr()
        scores = []
        for pair in FOREX_PAIRS:
            if curr not in pair:
                continue
            base, quote = pair.split('/')
            sign = 1 if curr == base else -1
            scores.append(sign * seasonality_db.get_seasonality_score(pair, month))
        return round(sum(scores) / len(scores)) if scores else 0
    def _get_current_month_abbr(self) -> str:
        from datetime import datetime
        return datetime.now().strftime('%b')
    def get_asset_scorecard(self, asset: str) -> dict:
        """
        Return detailed scorecard data for a given asset.
        asset can be a currency code (AUD, USD, etc.) or a pair (XAU/USD, BTC/USD, etc.)
        """
        # Determine if asset is a currency or a pair
        asset = asset.upper()
        current_month = self._get_current_month_abbr()
        
        # Check if it's a forex currency (standalone)
        if asset in STANDARD_CURRENCIES:
            # Treat as individual currency
            return self._get_currency_scorecard(asset, current_month)
        else:
            # Try to parse as pair
            if '/' in asset:
                base, quote = asset.split('/')
                # Check if it's a non-forex asset (metals, crypto, etc.)
                if base in ['XAU', 'XAG', 'BTC', 'ETH', 'USOIL', 'SPX500', 'NAS100']:
                    return self._get_nonforex_scorecard(base, quote, current_month)
            # If not found, return error
            raise ValueError(f"Asset {asset} not recognized")

    def _get_currency_scorecard(self, curr: str, month: str) -> dict:
        """Detailed data for a single currency."""
        # Get raw indicator data
        raw = self.indicators.get_raw_data(curr)
        scores = self.indicators.get_indicator_scores(curr)
        
        # Categories
        GROWTH = ["GDP", "Retail Sales", "Manufacturing PMI", "Services PMI", "Consumer Confidence"]
        JOBS = ["Unemployment Rate", "NFP", "Unemployment claims", "ADP", "JOLTS job openings"]
        INFLATION = ["CPI YoY", "PPI YoY", "PCE YoY"]
        
        def get_category_data(cat_list):
            rows = []
            total = 0
            for ind in cat_list:
                if ind not in raw:
                    continue
                actual, forecast, date_val, prev_val = raw[ind]
                if actual is None or forecast is None:
                    continue
                score = scores.get(ind, 0)
                total += score
                surprise = actual - forecast
                bias = "Bullish" if score > 0 else "Bearish" if score < 0 else "Neutral"
                rows.append({
                    'indicator': ind,
                    'bias': bias,
                    'actual': f"{actual:.2f}",
                    'forecast': f"{forecast:.2f}",
                    'surprise': f"{surprise:+.2f}",
                })
            return rows, total
        
        growth_rows, growth_score = get_category_data(GROWTH)
        jobs_rows, jobs_score = get_category_data(JOBS)
        inflation_rows, inflation_score = get_category_data(INFLATION)
        
        # Bond yield
        bond = self.bond_yield.get_score(curr)
        bond_bias = "Bullish" if bond > 0 else "Bearish" if bond < 0 else "Neutral"
        inflation_rows.append({
            'indicator': f"{curr} 2Y Yield (21d SMA)",
            'bias': bond_bias,
            'actual': '—',
            'forecast': '—',
            'surprise': '—',
        })
        inflation_score += bond
        
        # Fundamental score
        fund_score = self.indicators.get_currency_score(curr) + bond
        
        # COT score
        cot_raw = self._get_cot_score_for_asset(curr)
        
        # Retail score (average across pairs)
        retail_score = self._aggregate_retail_for_currency(curr)
        
        # Trend score (average across pairs)
        trend_score = self._aggregate_trend_for_currency(curr)
        
        # Seasonality score (average across pairs)
        season_score = self._aggregate_seasonality_for_currency(curr)
        
        # Overall
        overall = fund_score + cot_raw + retail_score + trend_score + season_score
        bias = self._bias_from_score(overall)
        
        return {
            'name': curr,
            'type': 'forex',
            'overall_score': overall,
            'bias': bias,
            'trend_score': trend_score,
            'seasonality_score': season_score,
            'retail_score': retail_score,
            'cot_score': cot_raw,
            'fund_score': fund_score,
            'growth': growth_rows,
            'jobs': jobs_rows,
            'inflation': inflation_rows,
            'bond': {'score': bond, 'bias': bond_bias},
            'history': self._get_asset_history(curr),
        }
    
    def _get_nonforex_scorecard(self, base: str, quote: str, month: str) -> dict:
        """Detailed data for non-forex assets (metals, crypto, oil, indices)."""
        usd_raw = self.indicators.get_raw_data('USD')
        usd_scores = self.indicators.get_indicator_scores('USD')
        
        is_metal = base in ['XAU', 'XAG']
        is_crypto = base in ['BTC', 'ETH']
        is_oil = base == 'USOIL'
        is_index = base in ['SPX500', 'NAS100']
        
        # Inversion rules
        invert_growth_jobs = is_metal          # Gold & Silver: invert growth + jobs + inflation
        invert_inflation = is_metal or is_crypto or is_oil or is_index  # All non‑forex invert inflation
        
        GROWTH = ["GDP", "Retail Sales", "Manufacturing PMI", "Services PMI", "Consumer Confidence"]
        JOBS = ["Unemployment Rate", "NFP", "Unemployment claims", "ADP", "JOLTS job openings"]
        INFLATION = ["CPI YoY", "PPI YoY", "PCE YoY"]
        
        def get_category_data(cat_list, invert):
            rows = []
            total = 0
            for ind in cat_list:
                if ind not in usd_raw:
                    continue
                actual, forecast, date_val, prev_val = usd_raw[ind]
                if actual is None or forecast is None:
                    continue
                score = usd_scores.get(ind, 0)
                if invert:
                    score = -score
                total += score
                surprise = actual - forecast
                bias = "Bullish" if score > 0 else "Bearish" if score < 0 else "Neutral"
                rows.append({
                    'indicator': ind,
                    'bias': bias,
                    'actual': f"{actual:.2f}",
                    'forecast': f"{forecast:.2f}",
                    'surprise': f"{surprise:+.2f}",
                })
            return rows, total
        
        growth_rows, growth_score = get_category_data(GROWTH, invert_growth_jobs)
        jobs_rows, jobs_score = get_category_data(JOBS, invert_growth_jobs)
        inflation_rows, inflation_score = get_category_data(INFLATION, invert_inflation)
        
        # Bond yield (invert if metal)
        bond = self.bond_yield.get_score('USD')
        if invert_growth_jobs:
            bond = -bond
        bond_bias = "Bullish" if bond > 0 else "Bearish" if bond < 0 else "Neutral"
        inflation_rows.append({
            'indicator': "USD 2Y Yield (21d SMA)",
            'bias': bond_bias,
            'actual': '—',
            'forecast': '—',
            'surprise': '—',
        })
        inflation_score += bond
        
        fund_score = growth_score + jobs_score + inflation_score + bond
        
        pair = f"{base}/{quote}"
        cot = self._get_cot_score_for_asset(base)
        retail = self.retail.get_score_for_pair(pair)
        trend = self.trend.get_trend_score(pair)
        season = self.seasonality.get_seasonality_score(pair, month)
        
        overall = fund_score + cot + retail + trend + season
        bias = self._bias_from_score(overall)
        
        # Determine asset type
        if is_metal:
            asset_type = 'metal'
        elif is_crypto:
            asset_type = 'crypto'
        elif is_oil:
            asset_type = 'commodity'
        elif is_index:
            asset_type = 'index'
        else:
            asset_type = 'unknown'
        
        return {
            'name': pair,
            'type': asset_type,
            'overall_score': overall,
            'bias': bias,
            'trend_score': trend,
            'seasonality_score': season,
            'retail_score': retail,
            'cot_score': cot,
            'fund_score': fund_score,
            'growth': growth_rows,
            'jobs': jobs_rows,
            'inflation': inflation_rows,
            'bond': {'score': bond, 'bias': bond_bias},
            'history': self._get_asset_history(pair),
        }
    
    def _get_asset_history(self, asset: str) -> list:
        """Fetch historical scores from Turso."""
        from apps.services import turso_client
        if asset in STANDARD_CURRENCIES:
            # For currencies, we might store under asset_historical_scores with asset = currency
            return turso_client.get_asset_score_history(asset)
        else:
            # For pairs, try to get history
            return turso_client.get_asset_score_history(asset)
    
    def get_forex_scorecard(self, pair: str) -> dict:
        if pair not in FOREX_PAIRS:
            raise ValueError(f"Pair {pair} not in supported forex pairs list")
        
        base, quote = pair.split('/')
        current_month = self._get_current_month_abbr()
        
        # Get full indicator list for this pair
        indicator_list = self._get_indicator_list_for_pair(base, quote)
        
        # Category definitions
        GROWTH_NAMES = {"GDP", "Retail Sales", "Manufacturing PMI", "Services PMI", "Consumer Confidence"}
        JOBS_NAMES = {"Unemployment Rate", "NFP", "Unemployment claims", "ADP", "JOLTS job openings"}
        INFLATION_NAMES = {"CPI YoY", "PPI YoY", "PCE YoY"}
        
        # Filter indicators per category
        growth_indicators = [ind for ind in indicator_list if ind in GROWTH_NAMES]
        jobs_indicators = [ind for ind in indicator_list if ind in JOBS_NAMES]
        inflation_indicators = [ind for ind in indicator_list if ind in INFLATION_NAMES]
        
        # Core scores
        fund = self.indicators.get_currency_score(base) - self.indicators.get_currency_score(quote)
        cot = self.cot.get_cot_score_for_pair(base, quote) or 0
        retail = self.retail.get_score_for_pair(pair)
        trend = self.trend.get_trend_score(pair)
        season = self.seasonality.get_seasonality_score(pair, current_month)
        overall = fund + cot + retail + trend + season
        bias = self._bias_from_score(overall)
        
        # Details and scores per category
        growth_details = self._get_category_details_from_list(base, quote, growth_indicators)
        growth_score = self._get_category_score_from_list(base, quote, growth_indicators)
        
        jobs_details = self._get_category_details_from_list(base, quote, jobs_indicators)
        jobs_score = self._get_category_score_from_list(base, quote, jobs_indicators)
        
        inflation_details = self._get_category_details_from_list(base, quote, inflation_indicators)
        inflation_score = self._get_category_score_from_list(base, quote, inflation_indicators)
        
        # Institutional details
        inst_details = self._get_institutional_details(base, quote)
        retail_details = self._get_retail_details(retail)
        
        # Component scores
        tech_details = [
            f"Trend: {self._component_bias(trend)}",
            f"Seasonality: {self._component_bias(season)}"
        ]
        tech_score = trend + season
        
        # Build components
        components = {
            'technicals': {'name': 'Technicals', 'score': tech_score, 'details': tech_details},
            'institutional': {'name': 'Institutional Activity', 'score': cot, 'details': inst_details},
            'sentiment': {'name': 'Sentiment Bias', 'score': retail, 'details': retail_details},
            'growth': {'name': 'Economic Growth', 'score': growth_score, 'details': growth_details},
            'jobs': {'name': 'Job Market', 'score': jobs_score, 'details': jobs_details},
            'inflation': {'name': 'Inflation Data', 'score': inflation_score, 'details': inflation_details},
        }
        
        return {
            'pair': pair,
            'overall': overall,
            'bias': bias,
            'components': components,
            'history': self._get_forex_history(pair),
        }

    def _component_bias(self, score: int) -> str:
        if score >= 2:
            return "Very Bullish"
        elif score == 1:
            return "Bullish"
        elif score == 0:
            return "Neutral"
        elif score == -1:
            return "Bearish"
        else:
            return "Very Bearish"
    
    def _get_cot_details(self, base: str, quote: str) -> list:
        """Return details about COT positioning and change."""
        current = self.cot.get_current()
        previous = self.cot.get_previous()
        if base not in current or quote not in current:
            return ["COT data missing for one or both currencies."]
        
        net_base_cur = current[base] - (100 - current[base])
        net_quote_cur = current[quote] - (100 - current[quote])
        current_diff = net_base_cur - net_quote_cur
        
        if base in previous and quote in previous:
            net_base_prev = previous[base] - (100 - previous[base])
            net_quote_prev = previous[quote] - (100 - previous[quote])
            prev_diff = net_base_prev - net_quote_prev
            change = current_diff - prev_diff
        else:
            change = 0
        
        pos_text = "Very Bullish" if current_diff >= 60 else "Bullish" if current_diff >= 20 else "Neutral" if current_diff > -20 else "Bearish" if current_diff >= -60 else "Very Bearish"
        chg_text = "Bullish" if change > 0.01 else "Bearish" if change < -0.01 else "Neutral"
        return [
            f"COT Net Positioning: {pos_text}",
            f"COT Weekly Change: {chg_text}"
        ]
    
    def _get_retail_details(self, contrarian_score: int) -> list:
        sentiment = self._component_bias(contrarian_score)
        crowd_map = {
            "Very Bullish": "Very Bearish",
            "Bullish": "Bearish",
            "Neutral": "Neutral",
            "Bearish": "Bullish",
            "Very Bearish": "Very Bullish"
        }
        crowd = crowd_map.get(sentiment, "Neutral")
        return [
            f"Retail Sentiment: {sentiment}",
            f"Crowd bias: {crowd.lower()}"
        ]
    
    def _sum_indicator_diff(self, base: str, quote: str, indicators: list) -> int:
        """Sum the difference of indicator scores between base and quote."""
        total = 0
        base_scores = self.indicators.get_indicator_scores(base)
        quote_scores = self.indicators.get_indicator_scores(quote)
        for ind in indicators:
            total += base_scores.get(ind, 0) - quote_scores.get(ind, 0)
        return total
    
    def _indicator_diff_details(self, base: str, quote: str, indicators: list) -> list:
        """Return detail strings for each indicator difference."""
        details = []
        base_scores = self.indicators.get_indicator_scores(base)
        quote_scores = self.indicators.get_indicator_scores(quote)
        for ind in indicators:
            b = base_scores.get(ind, 0)
            q = quote_scores.get(ind, 0)
            diff = b - q
            if diff != 0:
                bias = self._component_bias(diff)
                details.append(f"{ind}: {bias} ({'+' if diff > 0 else ''}{diff:+d})")
        return details if details else ["No data available"]
    
    def _get_forex_history(self, pair: str) -> list:
        from apps.services import turso_client
        return turso_client.get_forex_score_history(pair)

    def _get_indicator_list_for_pair(self, base: str, quote: str) -> List[str]:
        """Return the full list of indicator names relevant to a currency pair."""
        indicator_set = set(CORE_INDICATORS) | set(SCORING_ONLY_INDICATORS)
        if base in EXTRA_INDICATORS:
            indicator_set.update(EXTRA_INDICATORS[base])
        if quote in EXTRA_INDICATORS:
            indicator_set.update(EXTRA_INDICATORS[quote])
        # Remove excluded
        if base in SCORING_EXCLUDED_INDICATORS:
            for excl in SCORING_EXCLUDED_INDICATORS[base]:
                indicator_set.discard(excl)
        if quote in SCORING_EXCLUDED_INDICATORS:
            for excl in SCORING_EXCLUDED_INDICATORS[quote]:
                indicator_set.discard(excl)
        return list(indicator_set)
    def _get_category_details_from_list(self, base: str, quote: str, indicator_list: List[str]) -> list:
        """Return details for a list of indicators."""
        details = []
        base_scores = self.indicators.get_indicator_scores(base)
        quote_scores = self.indicators.get_indicator_scores(quote)
        for ind in indicator_list:
            b = base_scores.get(ind, 0)
            q = quote_scores.get(ind, 0)
            diff = b - q
            if diff != 0:
                bias = self._component_bias(diff)
                details.append(f"{ind}: {bias} ({'+' if diff > 0 else ''}{diff})")
        return details if details else ["No data available"]

    def _get_category_score_from_list(self, base: str, quote: str, indicator_list: List[str]) -> int:
        """Return total score for a list of indicators."""
        total = 0
        base_scores = self.indicators.get_indicator_scores(base)
        quote_scores = self.indicators.get_indicator_scores(quote)
        for ind in indicator_list:
            total += base_scores.get(ind, 0) - quote_scores.get(ind, 0)
        return total
    def _get_institutional_details(self, base: str, quote: str) -> list:
        current = self.cot.get_current()
        previous = self.cot.get_previous()
        if base not in current or quote not in current:
            return ["COT data missing for one or both currencies."]
        net_base_cur = current[base] - (100 - current[base])
        net_quote_cur = current[quote] - (100 - current[quote])
        current_diff = net_base_cur - net_quote_cur
        if base in previous and quote in previous:
            prev_base = previous[base] - (100 - previous[base])
            prev_quote = previous[quote] - (100 - previous[quote])
            prev_diff = prev_base - prev_quote
            change = current_diff - prev_diff
        else:
            change = 0
        pos_text = "Very Bullish" if current_diff >= 60 else "Bullish" if current_diff >= 20 else "Neutral" if current_diff > -20 else "Bearish" if current_diff >= -60 else "Very Bearish"
        chg_text = "Bullish" if change > 0.01 else "Bearish" if change < -0.01 else "Neutral"
        return [
            f"COT Net Positioning: {pos_text}",
            f"COT Weekly Change: {chg_text}"
        ]
    
    def load_all_data(self):
        self.indicators = IndicatorsService()
        self.cot = COTService()
        self.retail = RetailService()
        self.bond_yield = BondYieldService()
        self.econ_strength = EconomicStrengthService()
        self.seasonality = SeasonalityService()
        self.trend = TrendService()
    
    def refresh_all_put_call(self) -> bool:
        """Scrape put/call for all configured assets and update Turso."""
        from apps.scrapers.put_call import fetch_and_store_all_put_call
        # Define mapping: asset_name -> ticker
        asset_map = {
            'Bitcoin': 'IBIT',
            'Gold': 'GLD',
            'Silver': 'SLV',
            'Nasdaq': 'QQQ',
            'S&P500': 'SPY',
            'USDollar': 'UUP',
            'USOil': 'USO',
        }
        success = True
        for asset, ticker in asset_map.items():
            try:
                ratio = fetch_and_store_all_put_call(asset, ticker)
                if ratio is None:
                    success = False
            except Exception as e:
                logger.error(f"Failed to fetch put/call for {asset}: {e}")
                success = False
        return success