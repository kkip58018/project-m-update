from apps.services import supabase_client
from typing import Dict, List, Optional
import logging
import requests

from apps.analysis.constants import STANDARD_CURRENCIES

logger = logging.getLogger(__name__)

# Currency code -> country name as returned by the xoomar rates API.
XOOMAR_COUNTRY_MAP = {
    "USD": "United States",
    "EUR": "Euro area",
    "GBP": "United Kingdom",
    "JPY": "Japan",
    "AUD": "Australia",
    "NZD": "New Zealand",
    "CAD": "Canada",
    "CHF": "Switzerland",
}

XOOMAR_RATES_URL = "https://xoomar.com/api/markets/rates"

# Indicators (stored in the economic_indicators table) that feed this page.
GDP_INDICATOR = "GDP"
UNEMPLOYMENT_INDICATOR = "Unemployment Rate"
CPI_INDICATOR = "CPI YoY"


def _to_float(value) -> Optional[float]:
    if value in (None, "", "N/A"):
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


class EconomicStrengthService:
    def __init__(self):
        self._load_data()

    def _load_data(self):
        records = supabase_client.get_economic_strength()
        self._data = {}
        for row in records:
            curr = row['currency_code']
            self._data[curr] = row

    def get_strength(self, currency: str) -> Dict:
        return self._data.get(currency.upper(), {})

    def get_all(self) -> Dict:
        return self._data

    def update_strength(self, currency: str, payload: Dict) -> bool:
        payload['currency_code'] = currency.upper()
        success = supabase_client.upsert_economic_strength(payload)
        if success:
            self._load_data()
        return success

    def _fetch_xoomar_rates(self) -> Dict[str, float]:
        response = requests.get(XOOMAR_RATES_URL, timeout=20)
        response.raise_for_status()
        payload = response.json()
        rates = {}
        for item in payload.get("data", []) or []:
            country = (item.get("country") or "").strip()
            rate = _to_float(item.get("rate"))
            if country and rate is not None:
                rates[country] = rate
        return rates

    def _load_indicator_actuals(self) -> Dict[str, Dict[str, Optional[float]]]:
        actuals = {}
        for row in supabase_client.get_indicators():
            curr = row.get("currency_code")
            name = row.get("indicator_name")
            if not curr or not name:
                continue
            actuals.setdefault(curr, {})[name] = _to_float(row.get("actual_value"))
        return actuals

    def refresh_from_sources(self) -> Dict:
        """
        Rebuild Economic Strength rows for all major currencies from live data:

        * Interest Rate   -> central-bank rate from the xoomar API
        * GDP Growth      -> latest 'GDP' actual  from the indicators DB
        * Unemployment    -> latest 'Unemployment Rate' actual from the indicators DB
        * CPI YoY         -> latest 'CPI YoY' actual from the indicators DB
        * Score           -> recomputed 0-100 strength score

        Real Yield is kept from the previously stored row (it has no live feed yet).
        Returns {'updated': int, 'details': [str]}.
        """
        try:
            xoomar_rates = self._fetch_xoomar_rates()
        except Exception as exc:  # noqa: BLE001
            logger.error("Economic strength: failed to fetch xoomar rates: %s", exc)
            raise ValueError(f"Failed to fetch central-bank rates from xoomar: {exc}")

        indicator_actuals = self._load_indicator_actuals()
        existing = {row['currency_code']: row for row in supabase_client.get_economic_strength()}

        updated = 0
        details = []

        for currency in STANDARD_CURRENCIES:
            country = XOOMAR_COUNTRY_MAP.get(currency)
            rate = xoomar_rates.get(country) if country else None
            if rate is None:
                details.append(f"{currency}: no rate from xoomar ({country})")
                continue

            row = existing.get(currency, {})
            current = indicator_actuals.get(currency, {})

            # Prefer the live indicator; fall back to the previously stored value.
            gdp = current.get(GDP_INDICATOR)
            if gdp is None:
                gdp = _to_float(row.get("gdp_growth"))
            unemp = current.get(UNEMPLOYMENT_INDICATOR)
            if unemp is None:
                unemp = _to_float(row.get("unemployment_rate"))
            cpi = current.get(CPI_INDICATOR)
            if cpi is None:
                cpi = _to_float(row.get("cpi_yoy"))

            # Keep the stored real yield when present.
            real_yield = _to_float(row.get("real_yield"))
            if real_yield is None:
                real_yield = 0.0

            prev_score = _to_float(row.get("relative_strength_score"))
            new_score = self.calculate_score(
                gdp if gdp is not None else 0.0,
                unemp if unemp is not None else 0.0,
                rate,
                cpi if cpi is not None else 0.0,
                real_yield,
            )
            delta_score = round(new_score - (prev_score or 0.0))

            if new_score >= 60:
                bias = "Bullish"
            elif new_score <= 40:
                bias = "Bearish"
            else:
                bias = "Neutral"

            payload = {
                "currency_code": currency,
                "gdp_growth": gdp if gdp is not None else 0.0,
                "unemployment_rate": unemp if unemp is not None else 0.0,
                "interest_rate": rate,
                "cpi_yoy": cpi if cpi is not None else 0.0,
                "real_yield": real_yield,
                "bias": bias,
                "relative_strength_score": new_score,
                "delta_score": delta_score,
                "delta_real_yield": row.get("delta_real_yield", 0.0),
            }
            if supabase_client.upsert_economic_strength(payload):
                updated += 1
                src = []
                src.append(f"GDP={payload['gdp_growth']:.2f}" if gdp is not None else "GDP=n/a")
                src.append(f"Unemp={payload['unemployment_rate']:.2f}")
                src.append(f"Rate={rate:.2f}")
                src.append(f"CPI={payload['cpi_yoy']:.2f}")
                details.append(f"{currency}: {', '.join(src)} score={new_score} ({bias})")
            else:
                details.append(f"{currency}: DB upsert failed")

        self._load_data()
        return {"updated": updated, "details": details}

    def calculate_score(self, gdp, unemp, rate, cpi, real_yield) -> int:
        # Linear model coefficients from original analyzer
        coeffs = [14.573, -8.492, 6.131, -3.427, 8.971, 56.805]
        raw = (coeffs[0] * gdp + coeffs[1] * unemp + coeffs[2] * rate +
               coeffs[3] * cpi + coeffs[4] * real_yield + coeffs[5])
        return int(round(max(0, min(100, raw))))