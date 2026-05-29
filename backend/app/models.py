from django.db import models
from django.conf import settings


class UserProfile(models.Model):
    class Role(models.TextChoices):
        ADMIN = "admin", "Администратор"
        MANAGER = "manager", "Менеджер"
        DIRECTOR = "director", "Руководитель"

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="profile",
    )
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.MANAGER,
        verbose_name="Роль"
    )
    display_name = models.CharField(max_length=255, blank=True, verbose_name="Имя")
    bio = models.TextField(blank=True)
    city = models.CharField(max_length=255, blank=True)

    def __str__(self) -> str:
        return self.display_name or self.user.username


class Client(models.Model):
    class LoyaltyLevel(models.TextChoices):
        NONE = "none", "Базовый (0%)"
        BRONZE = "bronze", "Бронза (5%)"
        SILVER = "silver", "Серебро (10%)"
        GOLD = "gold", "Золото (15%)"

    name = models.CharField(max_length=255, verbose_name="ФИО Клиента")
    phone = models.CharField(max_length=50, unique=True, verbose_name="Номер телефона")
    email = models.EmailField(blank=True, null=True, verbose_name="Email")
    loyalty_level = models.CharField(
        max_length=20,
        choices=LoyaltyLevel.choices,
        default=LoyaltyLevel.NONE,
        verbose_name="Уровень лояльности"
    )
    bonuses_balance = models.IntegerField(default=0, verbose_name="Баланс бонусов")
    total_spent = models.DecimalField(
        max_digits=10, decimal_places=2, default=0.00, verbose_name="Всего потрачено"
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата регистрации")

    class Meta:
        verbose_name = "Клиент"
        verbose_name_plural = "Клиенты"

    def __str__(self) -> str:
        return f"{self.name} ({self.phone})"


class CommunicationHistory(models.Model):
    class CommType(models.TextChoices):
        CALL = "call", "Звонок"
        EMAIL = "email", "Email"
        MEETING = "meeting", "Личная встреча"
        CHAT = "chat", "Чат / Мессенджер"

    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name="communications", verbose_name="Клиент")
    manager = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, verbose_name="Менеджер")
    type = models.CharField(max_length=20, choices=CommType.choices, default=CommType.CALL, verbose_name="Тип связи")
    content = models.TextField(verbose_name="Содержание разговора")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата коммуникации")

    class Meta:
        verbose_name = "История коммуникации"
        verbose_name_plural = "Истории коммуникаций"

    def __str__(self) -> str:
        return f"{self.client.name} - {self.get_type_display()} ({self.created_at.strftime('%d.%m.%Y')})"


class NotificationLog(models.Model):
    class NotificationType(models.TextChoices):
        SMS = "sms", "SMS"
        EMAIL = "email", "Email"
        PUSH = "push", "Push"

    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name="notifications", verbose_name="Клиент")
    type = models.CharField(max_length=20, choices=NotificationType.choices, default=NotificationType.SMS, verbose_name="Тип")
    title = models.CharField(max_length=255, verbose_name="Заголовок")
    message = models.TextField(verbose_name="Сообщение")
    sent_at = models.DateTimeField(auto_now_add=True, verbose_name="Время отправки")

    class Meta:
        verbose_name = "Уведомление"
        verbose_name_plural = "Уведомления"

    def __str__(self) -> str:
        return f"Уведомление {self.client.name} - {self.sent_at.strftime('%d.%m.%Y %H:%M')}"


class InventoryItem(models.Model):
    name = models.CharField(max_length=255, unique=True, verbose_name="Наименование ингредиента")
    quantity = models.DecimalField(max_digits=10, decimal_places=3, default=0.000, verbose_name="Текущий остаток")
    unit = models.CharField(max_length=20, verbose_name="Единица измерения")
    min_threshold = models.DecimalField(
        max_digits=10, decimal_places=3, default=1.000, verbose_name="Критический остаток"
    )
    cost_price = models.DecimalField(
        max_digits=10, decimal_places=2, default=0.00, verbose_name="Себестоимость единицы"
    )
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Последнее обновление")

    class Meta:
        verbose_name = "Ингредиент склада"
        verbose_name_plural = "Склад (Ингредиенты)"

    def __str__(self) -> str:
        return f"{self.name} ({self.quantity} {self.unit})"

    @property
    def is_critical(self) -> bool:
        return self.quantity <= self.min_threshold


class StockOperation(models.Model):
    class OpType(models.TextChoices):
        INFLOW = "inflow", "Оприходование"
        WRITE_OFF = "write_off", "Списание"

    item = models.ForeignKey(InventoryItem, on_delete=models.CASCADE, related_name="operations", verbose_name="Ингредиент")
    type = models.CharField(max_length=20, choices=OpType.choices, verbose_name="Тип операции")
    quantity = models.DecimalField(max_digits=10, decimal_places=3, verbose_name="Количество")
    reason = models.CharField(max_length=255, verbose_name="Причина / Комментарий")
    performed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, verbose_name="Оператор"
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата и время")

    class Meta:
        verbose_name = "Операция по складу"
        verbose_name_plural = "История операций склада"

    def __str__(self) -> str:
        return f"{self.get_type_display()}: {self.item.name} ({self.quantity} {self.item.unit})"


class CoffeeProduct(models.Model):
    name = models.CharField(max_length=255, unique=True, verbose_name="Название блюда/напитка")
    price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Розничная цена")
    image_url = models.CharField(max_length=500, blank=True, verbose_name="URL изображения")
    description = models.TextField(blank=True, verbose_name="Описание")
    is_active = models.BooleanField(default=True, verbose_name="Активен (в меню)")

    class Meta:
        verbose_name = "Товар меню"
        verbose_name_plural = "Меню (Товары)"

    def __str__(self) -> str:
        return self.name


class ProductIngredient(models.Model):
    product = models.ForeignKey(
        CoffeeProduct, on_delete=models.CASCADE, related_name="ingredients", verbose_name="Товар"
    )
    item = models.ForeignKey(
        InventoryItem, on_delete=models.CASCADE, related_name="products_used_in", verbose_name="Ингредиент склада"
    )
    quantity_required = models.DecimalField(
        max_digits=10, decimal_places=3, verbose_name="Необходимое количество"
    )

    class Meta:
        verbose_name = "Рецепт товара"
        verbose_name_plural = "Рецепты товаров"
        unique_together = ("product", "item")

    def __str__(self) -> str:
        return f"{self.product.name} <- {self.item.name} ({self.quantity_required})"


class Order(models.Model):
    class Status(models.TextChoices):
        NEW = "new", "Новый"
        PROCESSING = "processing", "В обработке"
        COMPLETED = "completed", "Выполнен"
        CANCELLED = "cancelled", "Отклонен"

    client = models.ForeignKey(
        Client, on_delete=models.SET_NULL, null=True, blank=True, related_name="orders", verbose_name="Клиент"
    )
    manager = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, verbose_name="Принял заказ"
    )
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.NEW, verbose_name="Статус заказа"
    )
    total_price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Сумма без скидки")
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, verbose_name="Скидка")
    final_price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Итоговая сумма")
    bonuses_used = models.IntegerField(default=0, verbose_name="Списано бонусов")
    bonuses_earned = models.IntegerField(default=0, verbose_name="Начислено бонусов")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Время создания")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Время изменения")

    class Meta:
        verbose_name = "Заказ"
        verbose_name_plural = "Заказы"

    def __str__(self) -> str:
        client_name = self.client.name if self.client else "Гость"
        return f"Заказ #{self.id} ({client_name}) - {self.get_status_display()}"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items", verbose_name="Заказ")
    product = models.ForeignKey(CoffeeProduct, on_delete=models.PROTECT, verbose_name="Товар")
    quantity = models.IntegerField(default=1, verbose_name="Количество")
    price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Цена продажи")

    class Meta:
        verbose_name = "Позиция заказа"
        verbose_name_plural = "Позиции заказа"

    def __str__(self) -> str:
        return f"{self.product.name} x {self.quantity}"
