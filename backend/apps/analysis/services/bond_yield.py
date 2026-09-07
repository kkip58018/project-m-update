from apps.services import supabase_client
from typing import Dict

class BondYieldService:
    def __init__(self):
        self._load_data()

    def _load_data(self):
        records = supabase_client.get_bond_yield_scores()
        self._scores = {}
        for row in records:
            curr = row['currency_code']
            self._scores[curr] = int(row['score']) if row['score'] is not None else 0

    def get_score(self, currency: str) -> int:
        return self._scores.get(currency.upper(), 0)

    def update_score(self, currency: str, score: int) -> bool:
        data = {
            'currency_code': currency.upper(),
            'score': score,
            'updated_at': 'now()'  # This will be set by Supabase default
        }
        success = supabase_client.upsert_bond_yield_score(data)
        if success:
            self._load_data()
        return success