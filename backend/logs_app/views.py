import csv

from django.contrib.auth import get_user_model
from django.db.models import Count
from django.db.models.functions import TruncDay, TruncMonth
from django.http import StreamingHttpResponse
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .filters import LogFilter
from .models import Log, UserFilterPreference
from .serializers import (
    LogSerializer,
    RegisterSerializer,
    UserFilterPreferenceSerializer,
    UserSerializer,
)

User = get_user_model()


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def register_user(request):
    """Register a new user and return JWT tokens"""
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        # Generate JWT tokens for the new user
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "user": UserSerializer(user).data,
                "refresh": str(refresh),
                "access": str(refresh.access_token),
            },
            status=status.HTTP_201_CREATED,
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def get_current_user(request):
    """Get the current authenticated user's profile"""
    serializer = UserSerializer(request.user)
    return Response(serializer.data)


class Echo:
    """An object that implements just the write method of the file-like interface."""

    def write(self, value):
        """Write the value by returning it, instead of storing in a buffer."""
        return value


class LogViewSet(viewsets.ModelViewSet):
    queryset = Log.objects.all()
    serializer_class = LogSerializer
    filterset_class = LogFilter
    search_fields = ["message", "source"]
    ordering_fields = ["timestamp", "severity", "source"]
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=["get"])
    def raw(self, request):
        qs = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def aggregated(self, request):
        group_by = request.query_params.get("group_by", "date")
        interval = request.query_params.get("interval", "day")
        qs = self.filter_queryset(self.get_queryset())

        if group_by == "date":
            ts = TruncDay("timestamp") if interval == "day" else TruncMonth("timestamp")
            data = (
                qs.annotate(period=ts)
                .values("period")
                .annotate(count=Count("id"))
                .order_by("period")
            )
            result = [
                {"date": item["period"].date().isoformat(), "count": item["count"]}
                for item in data
            ]
            return Response(result)
        elif group_by == "severity":
            data = qs.values("severity").annotate(count=Count("id")).order_by("-count")
            return Response(list(data))
        else:  # source
            data = qs.values("source").annotate(count=Count("id")).order_by("-count")
            return Response(list(data))

    @action(detail=False, methods=["get"])
    def export_csv(self, request):
        """Stream CSV export for large datasets."""
        qs = self.filter_queryset(self.get_queryset())

        def generate_csv():
            """Generator function for streaming CSV rows."""
            writer = csv.writer(Echo())
            # Header
            yield writer.writerow(["id", "timestamp", "message", "severity", "source"])
            # Data rows
            for log in qs.iterator(chunk_size=500):
                yield writer.writerow(
                    [log.id, log.timestamp, log.message, log.severity, log.source]
                )

        response = StreamingHttpResponse(generate_csv(), content_type="text/csv")
        response["Content-Disposition"] = 'attachment; filename="logs_export.csv"'
        return response


class UserFilterPreferenceViewSet(viewsets.ModelViewSet):
    """CRUD endpoints for per-user saved filters."""

    queryset = UserFilterPreference.objects.all()
    serializer_class = UserFilterPreferenceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Filter to current user's preferences only."""
        return self.queryset.filter(user=self.request.user)

    def perform_create(self, serializer):
        """Assign the current user to the filter preference."""
        serializer.save(user=self.request.user)
