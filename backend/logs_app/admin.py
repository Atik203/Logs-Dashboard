from django.contrib import admin

from .models import Log


@admin.register(Log)
class LogAdmin(admin.ModelAdmin):
    list_display = ("id", "timestamp", "severity", "source")
    search_fields = ("message", "source")
    list_filter = ("severity", "source")
    ordering = ("-timestamp",)
