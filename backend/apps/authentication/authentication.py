from rest_framework import authentication, exceptions
from apps.services import supabase_client
import logging

logger = logging.getLogger(__name__)


class CustomUser:
    """
    A simple user class that works with DRF's authentication system.
    """
    def __init__(self, user_id, email, is_admin=False, is_paused=False):
        self.id = user_id
        self.email = email
        self.username = email
        self.is_staff = is_admin
        self.is_active = True
        self.is_authenticated = True
        self.is_admin = is_admin
        self.is_paused = is_paused
        self.pk = user_id


class SupabaseJWTAuthentication(authentication.BaseAuthentication):
    """
    Authenticate using a Supabase JWT token.
    Checks user_profiles for 'approved' and 'paused' status.
    """
    
    def authenticate(self, request):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return None
        
        try:
            parts = auth_header.split()
            if len(parts) != 2 or parts[0].lower() != 'bearer':
                raise exceptions.AuthenticationFailed('Invalid Authorization header')
            token = parts[1]
        except Exception:
            raise exceptions.AuthenticationFailed('Invalid Authorization header')
        
        try:
            # Verify token with Supabase
            user_data = supabase_client.admin.auth.get_user(token)
            if not user_data or not user_data.user:
                raise exceptions.AuthenticationFailed('Invalid token')
            
            supabase_user = user_data.user
            user_id = supabase_user.id
            email = supabase_user.email
            
            # Fetch profile from user_profiles
            profile_resp = supabase_client.admin.table('user_profiles') \
                .select('is_admin, approved, paused') \
                .eq('id', user_id) \
                .execute()
            
            if not profile_resp.data:
                # Create profile if missing
                supabase_client.admin.table('user_profiles').insert({
                    'id': user_id,
                    'email': email,
                    'is_admin': False,
                    'approved': False,
                    'paused': False,
                }).execute()
                is_admin = False
                approved = False
                is_paused = False
            else:
                profile = profile_resp.data[0]
                is_admin = profile.get('is_admin', False)
                approved = profile.get('approved', False)
                is_paused = profile.get('paused', False)
            
            # Check approval - user-friendly message
            if not approved:
                raise exceptions.AuthenticationFailed(
                    'Your account is pending admin approval. Please wait for approval or contact support@macropulse.io.'
                )
            
            # Check paused status - user-friendly message
            if is_paused:
                raise exceptions.AuthenticationFailed(
                    'Your account has been paused. Please contact support@macropulse.io for assistance.'
                )
            
            # Create custom user
            user = CustomUser(
                user_id=user_id,
                email=email,
                is_admin=is_admin,
                is_paused=is_paused
            )
            user.token = token
            
            return (user, token)
            
        except Exception as e:
            logger.error(f"Authentication failed: {e}")
            raise exceptions.AuthenticationFailed(str(e))