from .settings_base import *

DEBUG = True
ALLOWED_HOSTS = ['localhost', '127.0.0.1']
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.dummy.DummyCache',
    }
}