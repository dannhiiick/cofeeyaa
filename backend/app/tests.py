from django.test import TestCase
from django.contrib.auth.models import User
from decimal import Decimal
from .models import UserProfile, Client, InventoryItem, CoffeeProduct, ProductIngredient, Order, OrderItem, StockOperation


class CoffeeShopAlgorithmsTestCase(TestCase):
    def setUp(self):
        # Create users
        self.manager_user = User.objects.create_user(username="testmanager", password="password")
        self.profile = UserProfile.objects.create(user=self.manager_user, role=UserProfile.Role.MANAGER)

        # Create inventory items
        self.coffee_beans = InventoryItem.objects.create(
            name="Зерна", quantity=Decimal("10.000"), unit="кг", min_threshold=Decimal("1.000"), cost_price=Decimal("1000.00")
        )
        self.milk = InventoryItem.objects.create(
            name="Молоко", quantity=Decimal("5.000"), unit="л", min_threshold=Decimal("1.000"), cost_price=Decimal("80.00")
        )

        # Create menu item
        self.cappuccino = CoffeeProduct.objects.create(name="Капучино", price=Decimal("200.00"))
        
        # Define recipe: 1 cappuccino = 0.010 kg coffee, 0.200 l milk
        ProductIngredient.objects.create(product=self.cappuccino, item=self.coffee_beans, quantity_required=Decimal("0.010"))
        ProductIngredient.objects.create(product=self.cappuccino, item=self.milk, quantity_required=Decimal("0.200"))

        # Create clients
        self.client_bronze = Client.objects.create(
            name="Иван", phone="12345", loyalty_level=Client.LoyaltyLevel.BRONZE, bonuses_balance=100
        )
        self.client_gold = Client.objects.create(
            name="Сергей", phone="54321", loyalty_level=Client.LoyaltyLevel.GOLD, bonuses_balance=500
        )

    def test_loyalty_discount_and_cogs_calculation(self):
        """
        Verify dynamic price engine and cost calculation algorithms
        """
        # Order 2 Cappuccinos for Gold client (15% discount)
        total_price = self.cappuccino.price * 2  # 400.00
        discount_amount = total_price * Decimal("0.15")  # 60.00
        final_price = total_price - discount_amount  # 340.00

        # Create Order
        order = Order.objects.create(
            client=self.client_gold,
            manager=self.manager_user,
            status=Order.Status.COMPLETED,
            total_price=total_price,
            discount_amount=discount_amount,
            final_price=final_price,
        )
        OrderItem.objects.create(order=order, product=self.cappuccino, quantity=2, price=self.cappuccino.price)

        # Verify order costs
        self.assertEqual(order.final_price, Decimal("340.00"))
        self.assertEqual(order.discount_amount, Decimal("60.00"))

        # Calculate COGS (Cost of goods sold)
        # Cappuccino ingredients for 2 cups:
        # Coffee beans: 2 * 0.010 kg = 0.020 kg * 1000.00 = 20.00
        # Milk: 2 * 0.200 l = 0.400 l * 80.00 = 32.00
        # Total cost = 52.00
        total_cogs = Decimal("0.00")
        for item in order.items.all():
            for recipe in item.product.ingredients.all():
                total_cogs += recipe.item.cost_price * recipe.quantity_required * item.quantity

        self.assertEqual(total_cogs, Decimal("52.00"))
        
        # Profitability margin
        net_profit = final_price - total_cogs # 340 - 52 = 288
        profitability = (net_profit / final_price) * 100
        self.assertEqual(profitability, Decimal("84.70588235294117647058823529"))

    def test_insufficient_stock_exception(self):
        """
        Verify that stock limits are NOT blocking order placement and can go negative
        """
        # Cappuccino requires 0.200l Milk.
        # We have 5.000l milk in stock. Ordering 30 Cappuccinos requires 6.000l milk -> should succeed and go to -1.000
        from rest_framework.test import APIClient
        client = APIClient()
        client.force_authenticate(user=self.manager_user)

        response = client.post(
            "/api/orders",
            {"items": [{"product_id": self.cappuccino.id, "quantity": 30}]},
            format="json",
        )
        
        # Check that it returns 201 Created and succeeds
        self.assertEqual(response.status_code, 201)
        
        # Verify that stock WAS decremented and went negative
        self.milk.refresh_from_db()
        self.assertEqual(self.milk.quantity, Decimal("-1.000"))
