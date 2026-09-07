import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings_dev')

application = get_wsgi_application()

# Start automatic background data refreshes (retail sentiment every 30
# minutes; put/call ratios on weekdays one hour before the US session close).
# Skipped automatically when the process is a manage.py command or the dev
# runserver (neither loads this module). Set ENABLE_BACKGROUND_REFRESH=0 to
# opt out.
try:
    from apps.analysis.refresh_tasks import start_background_refresh
    start_background_refresh()
except Exception:  # noqa: BLE001
    import logging
    logging.getLogger(__name__).exception('Failed to start background refresh scheduler')

