from django.core.management.base import BaseCommand
from django.db import transaction
from django.contrib.auth.models import User
from decimal import Decimal
from ...models import UserProfile, Client, InventoryItem, CoffeeProduct, ProductIngredient, Order, OrderItem, CommunicationHistory, NotificationLog


class Command(BaseCommand):
    help = "Seed database with Coffee Shop Vstrecha data"

    def handle(self, *args, **options):
        self.stdout.write("Seeding Coffee Shop Vstrecha database...")

        with transaction.atomic():
            # 1. Clear old data
            OrderItem.objects.all().delete()
            Order.objects.all().delete()
            ProductIngredient.objects.all().delete()
            CoffeeProduct.objects.all().delete()
            StockOperation.objects.all().delete() if hasattr(globals(), 'StockOperation') else None
            from django.apps import apps
            try:
                apps.get_model('app', 'StockOperation').objects.all().delete()
                apps.get_model('app', 'CommunicationHistory').objects.all().delete()
                apps.get_model('app', 'NotificationLog').objects.all().delete()
            except Exception:
                pass
            
            InventoryItem.objects.all().delete()
            Client.objects.all().delete()
            
            # Clear users except superusers
            UserProfile.objects.all().delete()
            User.objects.filter(is_superuser=False).delete()

            self.stdout.write("Old data cleared.")

            # 2. Create Users with Roles
            users_to_create = [
                {"username": "admin", "email": "admin@vstrecha.kz", "password": "admin123", "role": UserProfile.Role.ADMIN, "name": "Әкімші Бауыржан"},
                {"username": "manager", "email": "manager@vstrecha.kz", "password": "manager123", "role": UserProfile.Role.MANAGER, "name": "Менеджер Елена В."},
                {"username": "director", "email": "director@vstrecha.kz", "password": "director123", "role": UserProfile.Role.DIRECTOR, "name": "Директор Аскар"},
            ]

            created_users = {}
            for u_data in users_to_create:
                user = User.objects.create_user(
                    username=u_data["username"],
                    email=u_data["email"],
                    password=u_data["password"]
                )
                profile = UserProfile.objects.create(
                    user=user,
                    role=u_data["role"],
                    display_name=u_data["name"],
                    city="Алматы"
                )
                created_users[u_data["role"]] = user
                self.stdout.write(f"Created user '{u_data['username']}' with role '{u_data['role']}'")

            # 3. Create Warehouse Ingredients
            ingredients_data = [
                {"name": "Кофейные зерна (Арабика)", "quantity": 15.500, "unit": "кг", "min_threshold": 3.000, "cost_price": 1400.00},
                {"name": "Свежее молоко", "quantity": 45.000, "unit": "л", "min_threshold": 10.000, "cost_price": 75.00},
                {"name": "Сахарный песок", "quantity": 25.000, "unit": "кг", "min_threshold": 5.000, "cost_price": 60.00},
                {"name": "Карамельный сироп", "quantity": 4.500, "unit": "л", "min_threshold": 1.000, "cost_price": 400.00},
                {"name": "Стаканы 250мл с крышкой", "quantity": 450.000, "unit": "шт", "min_threshold": 80.000, "cost_price": 5.50},
                {"name": "Стаканы 400мл с крышкой", "quantity": 350.000, "unit": "шт", "min_threshold": 60.000, "cost_price": 7.50},
                {"name": "Шоколадное печенье (порц)", "quantity": 8.000, "unit": "шт", "min_threshold": 15.000, "cost_price": 30.00}, # intentionally critical
                {"name": "Свежие круассаны (заморозка)", "quantity": 30.000, "unit": "шт", "min_threshold": 8.000, "cost_price": 45.00},
            ]

            ingredients = {}
            for ing_data in ingredients_data:
                item = InventoryItem.objects.create(**ing_data)
                ingredients[ing_data["name"]] = item
                self.stdout.write(f"Created ingredient: {item.name}")

            # 4. Create Coffee Products (Menu Items)
            products_data = [
                {
                    "name": "Эспрессо 50мл",
                    "price": 110.00,
                    "image_url": "espresso",
                    "description": "Классический крепкий кофе, сваренный под давлением.",
                    "recipe": [
                        ("Кофейные зерна (Арабика)", 0.009),
                        ("Стаканы 250мл с крышкой", 1.0)
                    ]
                },
                {
                    "name": "Капучино 250мл",
                    "price": 170.00,
                    "image_url": "cappuccino",
                    "description": "Эспрессо с горячим вспененным молоком и нежной молочной пенкой.",
                    "recipe": [
                        ("Кофейные зерна (Арабика)", 0.009),
                        ("Свежее молоко", 0.150),
                        ("Стаканы 250мл с крышкой", 1.0)
                    ]
                },
                {
                    "name": "Латте Макиато 400мл",
                    "price": 220.00,
                    "image_url": "latte",
                    "description": "Нежный слоистый кофейный напиток с преобладанием молока.",
                    "recipe": [
                        ("Кофейные зерна (Арабика)", 0.009),
                        ("Свежее молоко", 0.250),
                        ("Стаканы 400мл с крышкой", 1.0)
                    ]
                },
                {
                    "name": "Карамельный Латте 400мл",
                    "price": 250.00,
                    "image_url": "caramel_latte",
                    "description": "Сладкий латте с добавлением натурального карамельного сиропа.",
                    "recipe": [
                        ("Кофейные зерна (Арабика)", 0.009),
                        ("Свежее молоко", 0.250),
                        ("Карамельный сироп", 0.020),
                        ("Стаканы 400мл с крышкой", 1.0)
                    ]
                },
                {
                    "name": "Круассан с маслом",
                    "price": 140.00,
                    "image_url": "croissant",
                    "description": "Традиционная французская выпечка из слоеного теста на натуральном сливочном масле.",
                    "recipe": [
                        ("Свежие круассаны (заморозка)", 1.0)
                    ]
                },
                {
                    "name": "Шоколадное печенье",
                    "price": 90.00,
                    "image_url": "cookie",
                    "description": "Ароматное домашнее печенье с крупными каплями молочного шоколада.",
                    "recipe": [
                        ("Шоколадное печенье (порц)", 1.0)
                    ]
                },
            ]

            for prod_data in products_data:
                recipe = prod_data.pop("recipe")
                product = CoffeeProduct.objects.create(**prod_data)
                self.stdout.write(f"Created product: {product.name}")
                for ing_name, req_qty in recipe:
                    ProductIngredient.objects.create(
                        product=product,
                        item=ingredients[ing_name],
                        quantity_required=Decimal(str(req_qty))
                    )

            # 5. Create Clients
            clients_data = [
                {"name": "Алихан Марат", "phone": "+7 701 111-22-33", "email": "alikhan@mail.kz", "loyalty_level": Client.LoyaltyLevel.BRONZE, "bonuses_balance": 180, "total_spent": 3600.00},
                {"name": "Аружан Смагулова", "phone": "+7 777 222-33-44", "email": "aruzhan@yandex.kz", "loyalty_level": Client.LoyaltyLevel.SILVER, "bonuses_balance": 520, "total_spent": 8500.00},
                {"name": "Данияр Петров", "phone": "+7 707 333-44-55", "email": "daniyar@gmail.kz", "loyalty_level": Client.LoyaltyLevel.GOLD, "bonuses_balance": 1250, "total_spent": 18200.00},
                {"name": "Мадина Федорова", "phone": "+7 747 444-55-66", "email": "madina@inbox.kz", "loyalty_level": Client.LoyaltyLevel.NONE, "bonuses_balance": 0, "total_spent": 0.00},
            ]

            created_clients = []
            for c_data in clients_data:
                client = Client.objects.create(**c_data)
                created_clients.append(client)
                self.stdout.write(f"Created client: {client.name}")

            # 6. Create some historical Orders for Analytics
            # We want Orders spread over the last few days to make graphs look nice
            from django.utils import timezone
            import datetime
            import random

            manager_user = created_users[UserProfile.Role.MANAGER]
            all_menu_products = list(CoffeeProduct.objects.all())

            # Seed some communication logs
            CommHistory = apps.get_model('app', 'CommunicationHistory')
            Notification = apps.get_model('app', 'NotificationLog')

            for client in created_clients[:3]:
                CommHistory.objects.create(
                    client=client,
                    manager=manager_user,
                    type=CommunicationHistory.CommType.CALL,
                    content=f"Обсудили программу лояльности. Клиент доволен своим уровнем {client.get_loyalty_level_display()}."
                )
                Notification.objects.create(
                    client=client,
                    type=NotificationLog.NotificationType.SMS,
                    title="Бонусный баланс",
                    message=f"Уважаемый {client.name}, ваш баланс бонусов составляет {client.bonuses_balance}."
                )

            # Order seeding
            for i in range(25):
                days_ago = random.randint(0, 10)
                order_date = timezone.now() - datetime.timedelta(days=days_ago, hours=random.randint(0, 12))
                client = random.choice([None] + created_clients)
                
                # Pick 1-3 random products
                sampled_prods = random.sample(all_menu_products, random.randint(1, 3))
                
                total = Decimal("0.00")
                items_to_save = []
                for p in sampled_prods:
                    qty = random.randint(1, 2)
                    price = p.price
                    total += price * qty
                    items_to_save.append((p, qty, price))

                # Calculate discount
                discount = Decimal("0.00")
                if client:
                    if client.loyalty_level == Client.LoyaltyLevel.BRONZE:
                        discount = total * Decimal("0.05")
                    elif client.loyalty_level == Client.LoyaltyLevel.SILVER:
                        discount = total * Decimal("0.10")
                    elif client.loyalty_level == Client.LoyaltyLevel.GOLD:
                        discount = total * Decimal("0.15")

                final = total - discount
                earned = int(final * Decimal("0.05"))

                order = Order.objects.create(
                    client=client,
                    manager=manager_user,
                    status=Order.Status.COMPLETED if days_ago > 0 else random.choice([Order.Status.COMPLETED, Order.Status.PROCESSING, Order.Status.NEW]),
                    total_price=total,
                    discount_amount=discount,
                    final_price=final,
                    bonuses_used=0,
                    bonuses_earned=earned,
                )
                
                # Force exact creation date back in time
                Order.objects.filter(id=order.id).update(created_at=order_date)

                for prod, qty, price in items_to_save:
                    OrderItem.objects.create(
                        order=order,
                        product=prod,
                        quantity=qty,
                        price=price
                    )

            self.stdout.write(self.style.SUCCESS("Coffee Shop database successfully seeded!"))
