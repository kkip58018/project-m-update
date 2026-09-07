from .supabase_client import SupabaseClient
from .turso_client import TursoClient

supabase_client = SupabaseClient()
turso_client = TursoClient()

__all__ = ['supabase_client', 'turso_client']