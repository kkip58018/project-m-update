import yfinance as yf
import pandas as pd
from django.core.cache import cache
import logging

logger = logging.getLogger(__name__)

# Try to import tradingview_ta with fallback
try:
    from tradingview_ta import TA_Handler
except ImportError:
    # Create a dummy if missing
    class TA_Handler:
        def __init__(self, *args, **kwargs):
            pass
        def get_analysis(self):
            raise Exception("tradingview_ta not available")

try:
    from tradingview_ta import Interval
except ImportError:
    class Interval:
        INTERVAL_1_DAY = "1d"

class TrendService:
    def __init__(self, ma_periods=None):
        self.ma_periods = ma_periods or [20, 50, 100, 200]

    def get_trend_score(self, pair: str) -> int:
        """Return a trend score in [-2, -1, 0, 1, 2]."""
        cache_key = f"trend_{pair}"
        score = cache.get(cache_key)
        if score is not None:
            return score

        # Try TradingView first
        try:
            base, quote = pair.split('/')
            handler = TA_Handler(
                symbol=f"{base}{quote}",
                screener="forex",
                exchange="FX_IDC",
                interval=Interval.INTERVAL_1_DAY,
            )
            analysis = handler.get_analysis()
            indicators = analysis.indicators
            close = indicators.get('close')
            if close is None:
                raise Exception("No close price")
            ma_values = {}
            for p in self.ma_periods:
                ma_key = f"SMA{p}"
                val = indicators.get(ma_key)
                if val is None:
                    ma_key = f"EMA{p}"
                    val = indicators.get(ma_key)
                ma_values[p] = val
            if any(v is None for v in ma_values.values()):
                raise Exception("Missing MA data")
            below_count = sum(1 for ma in ma_values.values() if close > ma)
            raw_score = (below_count / len(ma_values)) * 4 - 2
            score = max(-2, min(2, round(raw_score)))
            cache.set(cache_key, score, timeout=3600)
            return score
        except Exception as e:
            logger.debug(f"TradingView trend failed for {pair}: {e}")
            # Fallback to Yahoo Finance
            score = self._fallback_trend(pair)
            cache.set(cache_key, score, timeout=3600)
            return score

    def _fetch_history(self, symbol: str, period: str = "1y") -> pd.DataFrame:
        """Fetch historical data with error handling."""
        try:
            ticker = yf.Ticker(symbol)
            df = ticker.history(period=period, interval="1d")
            if df.empty:
                logger.warning(f"No price data for {symbol}")
            return df
        except Exception as e:
            logger.warning(f"Failed to fetch {symbol}: {e}")
            return pd.DataFrame()

    def _get_symbols(self, pair: str) -> list:
        """Return a list of possible Yahoo Finance symbols to try."""
        mapping = {
            "XAU/USD": "GC=F",
            "XAG/USD": "SI=F",
            "BTC/USD": "BTC-USD",
            "ETH/USD": "ETH-USD",
            "USOIL/USD": "CL=F",
            "SPX500/USD": "^GSPC",
            "NAS100/USD": "^IXIC",
        }
        if pair in mapping:
            return [mapping[pair]]
        base, quote = pair.split('/')
        symbols = [f"{base}{quote}=X", f"{base}{quote}"]
        if base in ['EUR', 'GBP', 'AUD', 'NZD']:
            symbols.append(f"{base}USD=X")
        return symbols

    def _fallback_trend(self, pair: str) -> int:
        """Compute trend using yfinance with multiple symbol fallback."""
        symbols = self._get_symbols(pair)
        df = None
        for sym in symbols:
            df = self._fetch_history(sym)
            if df is not None and not df.empty:
                break
        if df is None or df.empty:
            return 0

        try:
            close_prices = df['Close']
            latest = close_prices.iloc[-1]
            ma_values = {}
            for p in self.ma_periods:
                if len(close_prices) >= p:
                    ma_values[p] = close_prices.rolling(window=p).mean().iloc[-1]
            if not ma_values:
                return 0
            below_count = sum(1 for ma in ma_values.values() if latest > ma)
            raw_score = (below_count / len(ma_values)) * 4 - 2
            return max(-2, min(2, round(raw_score)))
        except Exception as e:
            logger.warning(f"Yahoo Finance trend fallback failed for {pair}: {e}")
            return 0