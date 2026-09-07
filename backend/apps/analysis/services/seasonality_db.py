from apps.services import supabase_client
from typing import List, Dict, Optional
import logging
import yfinance as yf
import pandas as pd
import calendar
import time
from datetime import datetime
        
logger = logging.getLogger(__name__)


class SeasonalityDBService:
    def __init__(self):
        self._monthly_cache = {}
        self._annual_cache = {}
        self._load_monthly()
        self._load_annual()

    def _normalize_pair(self, pair: str) -> str:
        return pair.replace('/', '').upper()

    def _load_monthly(self):
        try:
            resp = supabase_client.admin.table('seasonality_monthly').select('*').execute()
            self._monthly_cache = {}
            for row in resp.data:
                pair = row['pair']
                if pair not in self._monthly_cache:
                    self._monthly_cache[pair] = {}
                self._monthly_cache[pair][row['month']] = {
                    'bias': row['bias'],
                    'value': row['value'],
                    'ytd': row.get('ytd_performance', None)
                }
            logger.info(f"Loaded monthly seasonality for {len(self._monthly_cache)} pairs")
        except Exception as e:
            logger.error(f"Failed to load monthly seasonality: {e}")
            self._monthly_cache = {}

    def _load_annual(self):
        try:
            resp = supabase_client.admin.table('seasonality_annual').select('*').execute()
            self._annual_cache = {}
            for row in resp.data:
                pair = row['pair']
                if pair not in self._annual_cache:
                    self._annual_cache[pair] = {}
                self._annual_cache[pair][row['week']] = {
                    'cumulative_return': row['cumulative_return'],
                    'ytd': row.get('ytd_performance', None)
                }
            logger.info(f"Loaded annual seasonality for {len(self._annual_cache)} pairs")
        except Exception as e:
            logger.error(f"Failed to load annual seasonality: {e}")
            self._annual_cache = {}

    def get_monthly_seasonality(self, pair: str) -> List[Dict]:
        normalized = self._normalize_pair(pair)
        data = self._monthly_cache.get(normalized, {})
        month_order = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        result = []
        for month in month_order:
            item = data.get(month, {})
            result.append({
                'month': month,
                'avg_return': item.get('value', 0.0),
                'bias': item.get('bias', 'Neutral'),
                'ytd_performance': item.get('ytd', None)
            })
        return result

    def get_annual_seasonality(self, pair: str) -> List[Dict]:
        normalized = self._normalize_pair(pair)
        data = self._annual_cache.get(normalized, {})
        weeks = sorted(data.keys())
        return [{
            'week': w,
            'cumulative_return': data[w].get('cumulative_return', 0.0),
            'ytd_performance': data[w].get('ytd', None)
        } for w in weeks]

    def get_seasonality_score(self, pair: str, month: str) -> int:
        normalized = self._normalize_pair(pair)
        data = self._monthly_cache.get(normalized, {})
        item = data.get(month, {})
        bias = item.get('bias', 'Neutral')
        if bias == 'Bullish':
            return 1
        elif bias == 'Bearish':
            return -1
        return 0

    def refresh_from_yfinance(self) -> dict:
        """Fetch all seasonality data from Yahoo Finance and upsert to Supabase."""
        # All pairs
        FOREX_PAIRS = [
            "AUD/CAD", "AUD/CHF", "AUD/JPY", "AUD/NZD", "AUD/USD",
            "CAD/CHF", "CAD/JPY",
            "CHF/JPY",
            "EUR/AUD", "EUR/CAD", "EUR/CHF", "EUR/GBP", "EUR/JPY", "EUR/NZD", "EUR/USD",
            "GBP/AUD", "GBP/CAD", "GBP/CHF", "GBP/JPY", "GBP/NZD", "GBP/USD",
            "NZD/CAD", "NZD/CHF", "NZD/JPY", "NZD/USD",
            "USD/CAD", "USD/CHF", "USD/JPY",
        ]
        SPECIAL_PAIRS = [
            "XAU/USD", "XAG/USD", "BTC/USD", "ETH/USD", 
            "USOIL/USD", "SPX500/USD", "NAS100/USD"
        ]
        ALL_PAIRS = FOREX_PAIRS + SPECIAL_PAIRS
    
        def get_yf_ticker(pair):
            special_tickers = {
                "XAU/USD": "GC=F",
                "XAG/USD": "SI=F",
                "BTC/USD": "BTC-USD",
                "ETH/USD": "ETH-USD",
                "USOIL/USD": "CL=F",
                "SPX500/USD": "^GSPC",
                "NAS100/USD": "^IXIC"
            }
            if pair in special_tickers:
                return special_tickers[pair]
            return f"{pair.replace('/', '').replace(' ', '').upper()}=X"
    
        current_year = datetime.now().year
        all_monthly_records = []
        all_annual_records = []
        processed = 0
        failed = 0
        errors = []
    
        for pair in ALL_PAIRS:
            cleaned_pair = pair.replace("/", "").replace(" ", "").upper()
            yf_symbol = get_yf_ticker(pair)
            
            try:
                ticker = yf.Ticker(yf_symbol)
                df = ticker.history(period="10y", interval="1d")
                if df.empty:
                    failed += 1
                    errors.append(f"{pair}: No data found")
                    continue
                    
                # Monthly
                monthly_df = df.resample("ME").agg({"Open": "first", "Close": "last"})
                monthly_df["Monthly_Return_Pct"] = ((monthly_df["Close"] - monthly_df["Open"]) / monthly_df["Open"]) * 100
                monthly_df["Month"] = monthly_df.index.month
                monthly_seasonality = monthly_df.groupby("Month")["Monthly_Return_Pct"].mean()
    
                for month, value in monthly_seasonality.items():
                    if pd.isna(value):
                        continue
                    val_float = float(value)
                    bias = "Bullish" if val_float > 0 else "Bearish" if val_float < 0 else "Neutral"
                    month_text = calendar.month_abbr[int(month)]
                    all_monthly_records.append({
                        "pair": cleaned_pair,
                        "month": month_text,
                        "value": round(val_float, 4),
                        "bias": bias
                    })
    
                # Annual weekly
                df["Year"] = df.index.year
                df["Week"] = ((df.index.dayofyear - 1) // 7) + 1
                df["Year_Start_Close"] = df.groupby("Year")["Close"].transform("first")
                df["Cum_Return"] = ((df["Close"] - df["Year_Start_Close"]) / df["Year_Start_Close"]) * 100
                historical_df = df[df["Year"] < current_year]
                ten_year_avg_curve = historical_df.groupby("Week")["Cum_Return"].mean()
    
                for week, value in ten_year_avg_curve.items():
                    if pd.isna(value):
                        continue
                    all_annual_records.append({
                        "pair": cleaned_pair,
                        "week": int(week),
                        "cumulative_return": round(float(value), 4)
                    })
    
                processed += 1
                time.sleep(0.5)  # rate limit
    
            except Exception as e:
                failed += 1
                errors.append(f"{pair}: {str(e)}")
    
        # Bulk upsert
        monthly_count = 0
        annual_count = 0
        if all_monthly_records:
            supabase_client.admin.table("seasonality_monthly").upsert(
                all_monthly_records, 
                on_conflict="pair,month"
            ).execute()
            monthly_count = len(all_monthly_records)
        if all_annual_records:
            supabase_client.admin.table("seasonality_annual").upsert(
                all_annual_records, 
                on_conflict="pair,week"
            ).execute()
            annual_count = len(all_annual_records)
    
        # Reload cache
        self._load_monthly()
        self._load_annual()
    
        return {
            "processed": processed,
            "failed": failed,
            "monthly_records": monthly_count,
            "annual_records": annual_count,
            "errors": errors[:5]  # limit to first 5 for brevity
        }
    def reload(self):
        self._load_monthly()
        self._load_annual()
    

# Singleton
seasonality_db = SeasonalityDBService()