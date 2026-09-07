import requests
import json,os
import logging

logger = logging.getLogger(__name__)

def fetch_retail_sentiment():
    """
    Fetch retail sentiment from the external API used in the original app.
    Returns a list of dicts with keys: pair, long_pct.
    """
    RETAIL_API_URL = os.environ.get('RETAIL_API_URL')
    if not RETAIL_API_URL:
        logger.error("RETAIL_API_URL not configured")
        return []

    try:
        response = requests.get(RETAIL_API_URL, timeout=10)
        response.raise_for_status()
        outer_data = response.json()
        inner_data = json.loads(outer_data["bodyMessage"])
        all_brokers_data = inner_data["response"]["brokerPairValueModels"]

        # Find the "Average" broker (brokerId == "-1")
        for broker in all_brokers_data:
            if broker.get("brokerId") == "-1":
                results = []
                for pair_model in broker.get("pairValueModels", []):
                    api_name = pair_model["pairName"]
                    # Convert API pair name (e.g., EURUSD) to our system format (EUR/USD)
                    if len(api_name) == 6:
                        system_pair = f"{api_name[:3]}/{api_name[3:]}"
                    else:
                        # Skip non-forex or other formats
                        continue
                    long_pct = float(pair_model["value"])
                    results.append({
                        'pair': system_pair,
                        'long_pct': long_pct,
                    })
                return results
        return []
    except Exception as e:
        logger.error(f"Failed to fetch retail sentiment: {e}")
        return []