"""
Middleware that tells browsers / CDNs never to store API responses.

Django's ``cache_page`` still caches responses server-side (and those keys are
explicitly cleared by every data-mutating/refresh endpoint), but we also want
to stop any intermediate/browser cache from pinning an old JSON payload after a
refresh.  Setting ``Cache-Control: no-store`` on every ``/api/`` response does
exactly that without disabling the server-side response cache.
"""


class NoCacheAPIHeadersMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        if request.path.startswith('/api/'):
            response['Cache-Control'] = 'no-store'
        return response
