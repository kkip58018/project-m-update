import os
from supabase import create_client, Client
from typing import Optional, Dict, Any, List
import logging

logger = logging.getLogger(__name__)

class SupabaseClient:
    """Singleton wrapper for Supabase with table-specific helpers."""
    
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialize()
        return cls._instance

    def _initialize(self):
        url = os.environ.get('SUPABASE_URL')
        anon_key = os.environ.get('SUPABASE_ANON_KEY')
        service_key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')
        
        if not url or not anon_key or not service_key:
            raise ValueError("Supabase environment variables missing.")
        
        self._anon_client = create_client(url, anon_key)
        self._admin_client = create_client(url, service_key)

    @property
    def anon(self) -> Client:
        return self._anon_client

    @property
    def admin(self) -> Client:
        return self._admin_client

    # ---------- Economic Indicators ----------
    def get_indicators(self, currency_code: str = None) -> List[Dict]:
        """Fetch economic indicators, optionally filtered by currency."""
        query = self.admin.table('economic_indicators').select('*')
        if currency_code:
            query = query.eq('currency_code', currency_code.upper())
        resp = query.execute()
        return resp.data

    def upsert_indicator(self, data: Dict) -> bool:
        """Insert or update an indicator record."""
        try:
            self.admin.table('economic_indicators').upsert(
                data, on_conflict='currency_code,indicator_name'
            ).execute()
            return True
        except Exception as e:
            logger.error(f"Failed to upsert indicator: {e}")
            return False

    # ---------- Retail Sentiment ----------
    def get_retail_sentiment(self) -> List[Dict]:
        resp = self.admin.table('retail_sentiment').select('*').execute()
        return resp.data

    def upsert_retail_sentiment(self, data: Dict) -> bool:
        try:
            self.admin.table('retail_sentiment').upsert(data, on_conflict='pair').execute()
            return True
        except Exception as e:
            logger.error(f"Failed to upsert retail sentiment: {e}")
            return False

    # ---------- Bond Yield Scores ----------
    def get_bond_yield_scores(self) -> List[Dict]:
        resp = self.admin.table('bond_yield_scores').select('*').execute()
        return resp.data

    def upsert_bond_yield_score(self, data: Dict) -> bool:
        try:
            self.admin.table('bond_yield_scores').upsert(data, on_conflict='currency_code').execute()
            return True
        except Exception as e:
            logger.error(f"Failed to upsert bond yield: {e}")
            return False

    # ---------- Economic Strength ----------
    def get_economic_strength(self) -> List[Dict]:
        resp = self.admin.table('economic_strength').select('*').execute()
        return resp.data

    def upsert_economic_strength(self, data: Dict) -> bool:
        try:
            self.admin.table('economic_strength').upsert(data, on_conflict='currency_code').execute()
            return True
        except Exception as e:
            logger.error(f"Failed to upsert economic strength: {e}")
            return False

    # ---------- User Profiles ----------
    def get_user_profile(self, user_id: str) -> Optional[Dict]:
        resp = self.admin.table('user_profiles').select('*').eq('id', user_id).execute()
        return resp.data[0] if resp.data else None

    def upsert_user_profile(self, data: Dict) -> bool:
        try:
            self.admin.table('user_profiles').upsert(data, on_conflict='id').execute()
            return True
        except Exception as e:
            logger.error(f"Failed to upsert user profile: {e}")
            return False

# Singleton instance
supabase_client = SupabaseClient()