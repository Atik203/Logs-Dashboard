from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    LogViewSet,
    UserFilterPreferenceViewSet,
    get_current_user,
    register_user,
)

router = DefaultRouter()
router.register(r"logs", LogViewSet, basename="log")
router.register(
    r"filter-preferences", UserFilterPreferenceViewSet, basename="filter-preference"
)

urlpatterns = [
    path("auth/register/", register_user, name="register"),
    path("auth/me/", get_current_user, name="current-user"),
] + router.urls
