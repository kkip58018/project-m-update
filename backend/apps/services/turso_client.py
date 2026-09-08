import os
import time
import requests
from typing import List, Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

MAX_RETRIES = 3


class TursoClient:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialize()
        return cls._instance

    def _initialize(self):
        self.url = os.environ.get('TURSO_DATABASE_URL')
        self.token = os.environ.get('TURSO_AUTH_TOKEN')
        if not self.url or not self.token:
            raise ValueError("Turso environment variables missing.")

        host = self.url.split('://')[-1].split('/')[0]
        self.http_endpoint = f"https://{host}/v2/pipeline"
        self.session = self._new_session()

    def _new_session(self) -> requests.Session:
        session = requests.Session()
        session.headers.update({
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json",
        })
        return session

    def _execute(self, sql: str, args: Optional[List[Dict]] = None) -> List[Dict]:
        """Execute SQL and return rows as list of dicts with column names.

        Turso occasionally closes an idle keep-alive connection; retrying on a
        brand-new session (instead of reusing the stale socket) fixes the
        intermittent ConnectionReset errors.
        """
        payload = {
            "requests": [{
                "type": "execute",
                "stmt": {"sql": sql, "args": args or []}
            }]
        }

        for attempt in range(1, MAX_RETRIES + 1):
            try:
                resp = self.session.post(self.http_endpoint, json=payload)
                resp.raise_for_status()
                data = resp.json()

                # Extract rows and column names
                rows = []
                cols = []
                if data.get('results'):
                    for result in data['results']:
                        result_data = result.get('response', {}).get('result', {})
                        cols = result_data.get('cols', [])
                        rows_data = result_data.get('rows', [])

                        # Convert to dict with column names
                        for row in rows_data:
                            if isinstance(row, list):
                                row_dict = {}
                                for i, col in enumerate(cols):
                                    if isinstance(row[i], dict):
                                        row_dict[col['name']] = row[i].get('value')
                                    else:
                                        row_dict[col['name']] = row[i]
                                rows.append(row_dict)
                            elif isinstance(row, dict):
                                rows.append(row)
                return rows
            except Exception as e:
                logger.warning(f"Turso query failed (attempt {attempt}/{MAX_RETRIES}): {e}")
                if attempt < MAX_RETRIES:
                    # Drop the stale keep-alive connection and reconnect fresh.
                    try:
                        self.session.close()
                    except Exception:  # noqa: BLE001
                        pass
                    self.session = self._new_session()
                    time.sleep(0.5 * attempt)
                else:
                    logger.error(f"Turso query failed after {MAX_RETRIES} attempts: {e}")
                    raise

    def query(self, sql: str, params: Optional[List[Any]] = None) -> List[Dict]:
        """Convenience method with typed params."""
        args = []
        if params:
            for p in params:
                if isinstance(p, str):
                    args.append({"type": "text", "value": p})
                elif isinstance(p, (int, float)):
                    args.append({"type": "float" if isinstance(p, float) else "integer", "value": p})
                else:
                    args.append({"type": "text", "value": str(p)})
        return self._execute(sql, args)

    # ---------- COT Data ----------
    def get_cot_data(self, asset: str = None) -> List[Dict]:
        sql = "SELECT * FROM cot_data"
        params = []
        if asset:
            sql += " WHERE asset = ?"
            params.append(asset)
        sql += " ORDER BY date DESC"
        return self.query(sql, params)

    def upsert_cot_record(self, data: Dict) -> bool:
        sql = """
            INSERT OR REPLACE INTO cot_data (date, asset, class, long_pos, short_pos)
            VALUES (?, ?, ?, ?, ?)
        """
        params = [
            data['date'],
            data['asset'],
            data.get('class', 'forex'),
            data['long_pos'],
            data['short_pos']
        ]
        try:
            self.query(sql, params)
            return True
        except Exception as e:
            logger.error(f"Failed to upsert COT record: {e}")
            return False

    # ---------- Historical Scores ----------
    def get_forex_score_history(self, pair: str) -> List[Dict]:
        sql = "SELECT date, score FROM forex_historical_scores WHERE pair = ? ORDER BY date ASC"
        return self.query(sql, [pair])

    def save_forex_score(self, pair: str, score: float, date: str) -> bool:
        sql = "INSERT OR REPLACE INTO forex_historical_scores (date, pair, score) VALUES (?, ?, ?)"
        try:
            self.query(sql, [date, pair, score])
            return True
        except Exception as e:
            logger.error(f"Failed to save forex score: {e}")
            return False

    def get_asset_score_history(self, asset: str) -> List[Dict]:
        sql = "SELECT date, score FROM asset_historical_scores WHERE asset = ? ORDER BY date ASC"
        return self.query(sql, [asset])

    def save_asset_score(self, asset: str, score: float, date: str) -> bool:
        sql = "INSERT OR REPLACE INTO asset_historical_scores (date, asset, score) VALUES (?, ?, ?)"
        try:
            self.query(sql, [date, asset, score])
            return True
        except Exception as e:
            logger.error(f"Failed to save asset score: {e}")
            return False

    # ---------- Put/Call Ratio ----------
    def get_put_call_history(self, ticker: str) -> List[Dict]:
        sql = "SELECT date, ratio FROM put_call_history WHERE ticker = ? ORDER BY date ASC"
        return self.query(sql, [ticker])

    def save_put_call_ratio(self, ticker: str, ratio: float, date: str) -> bool:
        sql = "INSERT OR REPLACE INTO put_call_history (ticker, date, ratio) VALUES (?, ?, ?)"
        try:
            self.query(sql, [ticker, date, ratio])
            return True
        except Exception as e:
            logger.error(f"Failed to save put/call ratio: {e}")
            return False

# Singleton
turso_client = TursoClient()