"""
Centralized pagination configuration for DRF viewsets.
Reduces code duplication across all apps.
"""

from rest_framework.pagination import PageNumberPagination


class StandardResultsSetPagination(PageNumberPagination):
    """
    Standard pagination class used across all apps.
    Configurable page size with sensible defaults.
    """
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


class LargeResultsSetPagination(PageNumberPagination):
    """
    Pagination for endpoints that return larger datasets.
    Used for analytics, exports, and bulk operations.
    """
    page_size = 100
    page_size_query_param = 'page_size'
    max_page_size = 500


class SmallResultsSetPagination(PageNumberPagination):
    """
    Pagination for endpoints that return small, quick results.
    Used for dropdowns, autocomplete, etc.
    """
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 50
