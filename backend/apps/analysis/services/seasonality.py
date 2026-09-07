import yfinance as yf
import pandas as pd
from typing import Dict, List, Optional
from datetime import datetime
import logging
from django.core.cache import cache

logger = logging.getLogger(__name__)


class SeasonalityService:
    def __init__(self):
        pass

    # ------------------------------------------------------------------
    # Helpers – symbol variations and data fetching
    # ------------------------------------------------------------------

    def _get_symbols(self, pair: str) -> List[str]:
        """
        Return a list of possible Yahoo Finance ticker symbols for a given pair.
        This covers forex, metals, crypto, indices, and commodities.
        """
        # Special mappings for non-forex assets
        mapping = {
            "XAU/USD": ["GC=F", "XAUUSD=X"],
            "XAG/USD": ["SI=F", "XAGUSD=X"],
            "BTC/USD": ["BTC-USD", "BTCUSD=X"],
            "ETH/USD": ["ETH-USD", "ETHUSD=X"],
            "USOIL/USD": ["CL=F", "USOIL=X", "BZ=F"],
            "SPX500/USD": ["^GSPC", "SPXUSD=X"],
            "NAS100/USD": ["^IXIC", "NAS100USD=X"],
        }
        if pair in mapping:
            return mapping[pair]

        # Forex pairs: e.g., EUR/USD
        base, quote = pair.split('/')
        symbols = []
        # Standard Yahoo forex format
        symbols.append(f"{base}{quote}=X")
        # Without =X
        symbols.append(f"{base}{quote}")
        # If quote is USD, add {base}USD=X (e.g., EURUSD=X, GBPUSD=X)
        if quote == "USD":
            symbols.append(f"{base}USD=X")
        # If base is EUR, try EUR{quote}=X
        if base == "EUR":
            symbols.append(f"EUR{quote}=X")
        # If base is GBP, try GBP{quote}=X
        if base == "GBP":
            symbols.append(f"GBP{quote}=X")
        # Generic with slash
        symbols.append(f"{base}/{quote}")
        # Remove duplicates and invalid empty strings
        return list(set([s for s in symbols if s]))

    def _fetch_data(self, symbol: str, period: str = "10y") -> pd.DataFrame:
        """
        Fetch daily OHLC data using yf.Ticker().history. 
        This reliably returns a flat DataFrame, preventing MultiIndex KeyErrors.
        """
        try:
            ticker = yf.Ticker(symbol)
            df = ticker.history(period=period, interval="1d")
            
            if df.empty:
                logger.debug(f"No data for {symbol} (period={period})")
                return pd.DataFrame()
                
            # Strip timezones from the index to prevent pandas resample('ME') errors
            if df.index.tz is not None:
                df.index = df.index.tz_localize(None)
                
            return df
        except Exception as e:
            logger.debug(f"Error fetching {symbol}: {e}")
            return pd.DataFrame()

    def _get_data(self, pair: str, period: str = "10y") -> pd.DataFrame:
        """
        Try multiple symbols and return the first non-empty DataFrame.
        """
        for symbol in self._get_symbols(pair):
            df = self._fetch_data(symbol, period)
            if not df.empty:
                logger.info(f"Using symbol {symbol} for {pair}")
                return df
        logger.warning(f"No data found for {pair} after trying all symbols")
        return pd.DataFrame()

    # ------------------------------------------------------------------
    # Monthly Seasonality
    # ------------------------------------------------------------------

    def get_monthly_seasonality(self, pair: str) -> List[Dict]:
        """
        Compute average monthly returns (10-year) and current year's returns per month.
        Returns a list of dicts: [{'month': 'Jan', 'avg_return': 1.23, 'current_year_return': 0.45}, ...]
        """
        df = self._get_data(pair)
        if df.empty:
            return self._empty_monthly_data()

        try:
            # Resample to calendar months
            monthly = df.resample('ME').agg({'Open': 'first', 'Close': 'last'})
            monthly['Monthly_Return_Pct'] = (
                (monthly['Close'] - monthly['Open']) / monthly['Open']
            ) * 100
            monthly['Month'] = monthly.index.month
            monthly['Year'] = monthly.index.year

            # 10-year average per month
            seasonality = monthly.groupby('Month')['Monthly_Return_Pct'].mean()

            # Current year data
            current_year = datetime.now().year
            this_year = monthly[monthly['Year'] == current_year]
            this_year_data = this_year.set_index('Month')['Monthly_Return_Pct']

            month_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                           'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

            result = []
            for month_num in range(1, 13):
                avg = seasonality.get(month_num)
                avg = float(avg) if pd.notna(avg) else 0.0
                curr = this_year_data.get(month_num)
                curr = float(curr) if pd.notna(curr) else None
                result.append({
                    'month': month_names[month_num - 1],
                    'avg_return': avg,
                    'current_year_return': curr,
                })
            return result
        except Exception as e:
            logger.error(f"Monthly seasonality calculation failed for {pair}: {e}")
            return self._empty_monthly_data()

    def _empty_monthly_data(self) -> List[Dict]:
        month_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        return [{'month': m, 'avg_return': 0.0, 'current_year_return': None} for m in month_names]

    # ------------------------------------------------------------------
    # Annual Seasonality
    # ------------------------------------------------------------------

    def get_annual_seasonality(self, pair: str) -> Dict:
        """
        Returns weekly cumulative return data.
        Structure:
        {
            'weeks': [1, 2, ...],
            'avg_returns': [...],   # 10-year average cumulative return (%)
            'current_prices': [...] # current year's closing price per week (for YTD line)
        }
        """
        df = self._get_data(pair)
        if df.empty:
            return self._empty_annual_data()

        try:
            df['Year'] = df.index.year
            df['Week'] = ((df.index.dayofyear - 1) // 7) + 1

            # 1. 10-Year Average Cumulative Return (%)
            df['Year_Start_Close'] = df.groupby('Year')['Close'].transform('first')
            df['Cum_Return'] = (
                (df['Close'] - df['Year_Start_Close']) / df['Year_Start_Close']
            ) * 100

            current_year = datetime.now().year
            historical = df[df['Year'] < current_year]
            if historical.empty:
                # Fallback: use all years except current
                historical = df[df['Year'] != current_year]
            ten_year_avg = historical.groupby('Week')['Cum_Return'].mean().round(2)

            # 2. Current Year YTD Prices
            ytd_df = df[df['Year'] == current_year]
            if not ytd_df.empty:
                current_prices = ytd_df.groupby('Week')['Close'].last()
            else:
                current_prices = pd.Series(dtype=float)

            # Build result
            all_weeks = sorted(set(ten_year_avg.index) | set(current_prices.index))
            if not all_weeks:
                return self._empty_annual_data()

            result = {
                'weeks': all_weeks,
                'avg_returns': [float(ten_year_avg.get(w, 0.0)) for w in all_weeks],
                'current_prices': [float(current_prices.get(w)) if w in current_prices else None for w in all_weeks],
            }
            return result
        except Exception as e:
            logger.error(f"Annual seasonality calculation failed for {pair}: {e}")
            return self._empty_annual_data()

    def _empty_annual_data(self) -> Dict:
        weeks = list(range(1, 53))
        return {
            'weeks': weeks,
            'avg_returns': [0.0] * 52,
            'current_prices': [None] * 52,
        }

    # ------------------------------------------------------------------
    # Scoring (used by Analyzer)
    # ------------------------------------------------------------------

    def get_seasonality_score(self, pair: str, month: str) -> int:
        """
        Return -1, 0, or 1 based on the 10-year average return for a given month.
        """
        cache_key = f"seasonality_score_{pair}_{month}"
        score = cache.get(cache_key)
        if score is not None:
            return score

        month_num = {
            'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4, 'May': 5, 'Jun': 6,
            'Jul': 7, 'Aug': 8, 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12
        }.get(month[:3], 1)

        # Use monthly seasonality data
        monthly_data = self.get_monthly_seasonality(pair)
        if not monthly_data:
            score = 0
        else:
            for item in monthly_data:
                if item['month'] == month[:3]:
                    avg = item['avg_return']
                    if avg > 0.5:
                        score = 1
                    elif avg < -0.5:
                        score = -1
                    else:
                        score = 0
                    break
            else:
                score = 0

        cache.set(cache_key, score, timeout=86400)
        return score
    