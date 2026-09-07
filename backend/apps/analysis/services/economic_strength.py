from apps.services import supabase_client
from typing import Dict

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

    def calculate_score(self, gdp, unemp, rate, cpi, real_yield) -> int:
        # Linear model coefficients from original analyzer
        coeffs = [14.573, -8.492, 6.131, -3.427, 8.971, 56.805]
        raw = (coeffs[0] * gdp + coeffs[1] * unemp + coeffs[2] * rate +
               coeffs[3] * cpi + coeffs[4] * real_yield + coeffs[5])
        return int(round(max(0, min(100, raw))))