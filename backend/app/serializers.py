from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserProfile, Client, CommunicationHistory, NotificationLog, InventoryItem, StockOperation, CoffeeProduct, ProductIngredient, Order, OrderItem


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ["role", "display_name", "bio", "city"]


class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ["id", "username", "email", "profile"]


class ClientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = [
            "id",
            "name",
            "phone",
            "email",
            "loyalty_level",
            "bonuses_balance",
            "total_spent",
            "created_at",
        ]


class CommunicationHistorySerializer(serializers.ModelSerializer):
    manager_name = serializers.CharField(source="manager.profile.display_name", read_only=True)
    manager_username = serializers.CharField(source="manager.username", read_only=True)

    class Meta:
        model = CommunicationHistory
        fields = ["id", "client", "manager", "manager_name", "manager_username", "type", "content", "created_at"]


class NotificationLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationLog
        fields = ["id", "client", "type", "title", "message", "sent_at"]


class InventoryItemSerializer(serializers.ModelSerializer):
    is_critical = serializers.BooleanField(read_only=True)

    class Meta:
        model = InventoryItem
        fields = [
            "id",
            "name",
            "quantity",
            "unit",
            "min_threshold",
            "cost_price",
            "updated_at",
            "is_critical",
        ]


class StockOperationSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source="item.name", read_only=True)
    item_unit = serializers.CharField(source="item.unit", read_only=True)
    operator_name = serializers.CharField(source="performed_by.profile.display_name", read_only=True)

    class Meta:
        model = StockOperation
        fields = [
            "id",
            "item",
            "item_name",
            "item_unit",
            "type",
            "quantity",
            "reason",
            "performed_by",
            "operator_name",
            "created_at",
        ]


class ProductIngredientSerializer(serializers.ModelSerializer):
    item_id = serializers.IntegerField(source="item.id", read_only=True)
    item_name = serializers.CharField(source="item.name", read_only=True)
    item_unit = serializers.CharField(source="item.unit", read_only=True)

    class Meta:
        model = ProductIngredient
        fields = ["id", "item_id", "item_name", "item_unit", "quantity_required"]


class CoffeeProductSerializer(serializers.ModelSerializer):
    ingredients = ProductIngredientSerializer(many=True, read_only=True)

    class Meta:
        model = CoffeeProduct
        fields = ["id", "name", "price", "image_url", "description", "is_active", "ingredients"]


class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)

    class Meta:
        model = OrderItem
        fields = ["id", "product", "product_name", "quantity", "price"]


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    client_name = serializers.CharField(source="client.name", read_only=True)
    client_phone = serializers.CharField(source="client.phone", read_only=True)
    manager_name = serializers.CharField(source="manager.profile.display_name", read_only=True)

    class Meta:
        model = Order
        fields = [
            "id",
            "client",
            "client_name",
            "client_phone",
            "manager",
            "manager_name",
            "status",
            "total_price",
            "discount_amount",
            "final_price",
            "bonuses_used",
            "bonuses_earned",
            "created_at",
            "updated_at",
            "items",
        ]
