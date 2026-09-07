from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

class UserInfoView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        return Response({
            'email': getattr(user, 'email', 'unknown'),
            'is_admin': getattr(user, 'is_admin', False),
            'is_authenticated': True,
        })