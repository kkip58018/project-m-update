import os
import requests
import json
from apps.services import supabase_client
from typing import Dict
import logging

logger = logging.getLogger(__name__)


class RetailService:
    def __init__(self):
        self._scores = {}
        self._long_pct = {}
        self._load_data()

    def _load_data(self):
        records = supabase_client.get_retail_sentiment()
        self._scores = {}
        self._long_pct = {}
        for row in records:
            pair = row['pair']
            self._scores[pair] = row['retail_score']
            self._long_pct[pair] = row['long_pct']

    def get_scores(self) -> Dict:
        return self._scores

    def get_long_pct(self) -> Dict:
        return self._long_pct

    def get_score_for_pair(self, pair: str) -> int:
        return self._scores.get(pair, 0)

    def refresh_from_api(self) -> bool:
        """
        Fetch from external retail sentiment API and update Supabase.
        Returns True on success, False on failure.
        """
        retail_api_url = os.environ.get('RETAIL_API_URL')
        if not retail_api_url:
            logger.error("RETAIL_API_URL not configured")
            return False

        try:
            response = requests.get(retail_api_url, timeout=10)
            response.raise_for_status()
            outer_data = response.json()
            inner_data = json.loads(outer_data.get('bodyMessage', '{}'))
            all_brokers_data = inner_data.get('response', {}).get('brokerPairValueModels', [])

            # Forex pairs and ETH/USD
            from apps.analysis.constants import FOREX_PAIRS
            my_system_pairs = FOREX_PAIRS + ['ETH/USD']
            api_to_system = {p.replace('/', ''): p for p in my_system_pairs}

            # Find the "Average" broker (brokerId == "-1")
            for broker in all_brokers_data:
                if broker.get('brokerId') == '-1':
                    for pair_model in broker.get('pairValueModels', []):
                        api_name = pair_model['pairName']
                        if api_name in api_to_system:
                            system_pair = api_to_system[api_name]
                            long_pct = float(pair_model['value'])
                            # Contrarian score
                            if long_pct <= 20:
                                score = 2
                            elif long_pct <= 40:
                                score = 1
                            elif long_pct >= 80:
                                score = -2
                            elif long_pct >= 60:
                                score = -1
                            else:
                                score = 0
                            # Upsert to Supabase
                            supabase_client.upsert_retail_sentiment({
                                'pair': system_pair,
                                'retail_score': score,
                                'long_pct': long_pct,
                            })
                    break

            # Reload data into memory
            self._load_data()
            logger.info("Retail sentiment refreshed successfully")
            return True

        except Exception as e:
            logger.error(f"Failed to refresh retail sentiment: {e}")
            return False