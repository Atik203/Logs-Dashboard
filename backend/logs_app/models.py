from django.contrib.auth.models import User
from django.db import models
from django.utils import timezone


class Log(models.Model):
    DEBUG = "DEBUG"
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    CRITICAL = "CRITICAL"

    SEVERITY_CHOICES = [
        (DEBUG, "Debug"),
        (INFO, "Info"),
        (WARNING, "Warning"),
        (ERROR, "Error"),
        (CRITICAL, "Critical"),
    ]

    timestamp = models.DateTimeField(default=timezone.now, db_index=True)
    message = models.TextField()
    severity = models.CharField(max_length=10, choices=SEVERITY_CHOICES, db_index=True)
    source = models.CharField(max_length=100, db_index=True)

    class Meta:
        ordering = ["-timestamp"]
        indexes = [
            models.Index(fields=["severity"]),
            models.Index(fields=["source"]),
            models.Index(fields=["timestamp", "severity"]),
        ]

    def __str__(self):
        return f"[{self.timestamp}] {self.severity} - {self.source}"


class UserFilterPreference(models.Model):
    """Saved filter presets per user."""

    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="filter_preferences"
    )
    name = models.CharField(max_length=100, help_text="Name of the saved filter")
    severity = models.CharField(max_length=10, blank=True, default="")
    source = models.CharField(max_length=100, blank=True, default="")
    date_from = models.DateField(null=True, blank=True)
    date_to = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        unique_together = [["user", "name"]]

    def __str__(self):
        return f"{self.user.username} - {self.name}"
