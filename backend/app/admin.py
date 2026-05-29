from django.contrib import admin
from .models import UserProfile, Client, CommunicationHistory, NotificationLog, InventoryItem, StockOperation, CoffeeProduct, ProductIngredient, Order, OrderItem

admin.site.site_header = "Кофейня «Встреча» Администратор"
admin.site.site_title = "Кофейня «Встреча»"
admin.site.index_title = "Управление бизнес-процессами"


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "display_name", "role", "city")
    search_fields = ("user__username", "display_name", "city")
    list_filter = ("role", "city")


@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "phone", "email", "loyalty_level", "bonuses_balance", "total_spent")
    search_fields = ("name", "phone", "email")
    list_filter = ("loyalty_level", "created_at")


@admin.register(CommunicationHistory)
class CommunicationHistoryAdmin(admin.ModelAdmin):
    list_display = ("id", "client", "manager", "type", "created_at")
    search_fields = ("client__name", "manager__username", "content")
    list_filter = ("type", "created_at")


@admin.register(NotificationLog)
class NotificationLogAdmin(admin.ModelAdmin):
    list_display = ("id", "client", "type", "title", "sent_at")
    search_fields = ("client__name", "title", "message")
    list_filter = ("type", "sent_at")


@admin.register(InventoryItem)
class InventoryItemAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "quantity", "unit", "min_threshold", "cost_price", "is_critical")
    search_fields = ("name",)
    list_filter = ("unit",)


@admin.register(StockOperation)
class StockOperationAdmin(admin.ModelAdmin):
    list_display = ("id", "item", "type", "quantity", "reason", "performed_by", "created_at")
    search_fields = ("item__name", "reason", "performed_by__username")
    list_filter = ("type", "created_at")


class ProductIngredientInline(admin.TabularInline):
    model = ProductIngredient
    extra = 1


@admin.register(CoffeeProduct)
class CoffeeProductAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "price", "is_active")
    search_fields = ("name", "description")
    list_filter = ("is_active",)
    inlines = [ProductIngredientInline]


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("id", "client", "manager", "status", "total_price", "discount_amount", "final_price", "created_at")
    search_fields = ("id", "client__name", "manager__username")
    list_filter = ("status", "created_at")
    inlines = [OrderItemInline]
