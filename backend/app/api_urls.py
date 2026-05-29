from django.urls import path

from . import api_views
from .auth_views import LoginView, MeView, RegisterView, RefreshView, SettingsView

urlpatterns = [
    # Auth Endpoints
    path("auth/register", RegisterView.as_view(), name="api-auth-register"),
    path("auth/login", LoginView.as_view(), name="api-auth-login"),
    path("auth/refresh", RefreshView.as_view(), name="api-auth-refresh"),
    path("auth/me", MeView.as_view(), name="api-auth-me"),
    path("settings", SettingsView.as_view(), name="api-settings"),

    # Coffee Shop Menu Products
    path("products", api_views.menu_products_list, name="api-products"),

    # CRM Clients & Communications
    path("clients", api_views.clients_api, name="api-clients"),
    path("clients/<int:pk>", api_views.client_detail_api, name="api-client-detail"),
    path("communications", api_views.communications_api, name="api-communications"),
    path("notifications", api_views.notifications_api, name="api-notifications"),

    # Warehouse Stock Management
    path("inventory", api_views.inventory_api, name="api-inventory"),
    path("stock-operations", api_views.stock_operations_api, name="api-stock-operations"),

    # Orders POS & Status Routing
    path("orders", api_views.orders_api, name="api-orders"),
    path("orders/<int:pk>", api_views.order_detail_api, name="api-order-detail"),

    # Director Analytics Reports
    path("analytics", api_views.analytics_api, name="api-analytics"),
]
