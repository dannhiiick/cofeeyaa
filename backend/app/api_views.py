from django.utils import timezone
from django.db import transaction
from django.db.models import Sum, F
from decimal import Decimal
import datetime

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response

from .models import UserProfile, Client, CommunicationHistory, NotificationLog, InventoryItem, StockOperation, CoffeeProduct, ProductIngredient, Order, OrderItem
from .serializers import (
    ClientSerializer,
    CommunicationHistorySerializer,
    NotificationLogSerializer,
    InventoryItemSerializer,
    StockOperationSerializer,
    CoffeeProductSerializer,
    OrderSerializer,
)


# ==========================================
# 1. MENU PRODUCTS LISTING
# ==========================================
@api_view(["GET"])
@permission_classes([AllowAny])
def menu_products_list(request):
    """
    Returns all active menu products with their detailed recipes (ingredients).
    """
    qs = CoffeeProduct.objects.filter(is_active=True).order_by("name")
    serializer = CoffeeProductSerializer(qs, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


# ==========================================
# 2. CRM - CLIENTS
# ==========================================
@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def clients_api(request):
    if request.method == "GET":
        qs = Client.objects.all().order_by("-created_at")
        search = request.GET.get("search")
        if search:
            qs = qs.filter(name__icontains=search) | qs.filter(phone__icontains=search)
        return Response(ClientSerializer(qs, many=True).data, status=status.HTTP_200_OK)

    elif request.method == "POST":
        serializer = ClientSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET", "PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
def client_detail_api(request, pk):
    try:
        client = Client.objects.get(pk=pk)
    except Client.DoesNotExist:
        return Response({"detail": "Client not found"}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "GET":
        return Response(ClientSerializer(client).data, status=status.HTTP_200_OK)

    elif request.method == "PATCH":
        serializer = ClientSerializer(client, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == "DELETE":
        client.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ==========================================
# 3. CRM - COMMUNICATIONS LOGS
# ==========================================
@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def communications_api(request):
    if request.method == "GET":
        client_id = request.GET.get("client_id")
        qs = CommunicationHistory.objects.all().order_by("-created_at")
        if client_id:
            qs = qs.filter(client_id=client_id)
        return Response(CommunicationHistorySerializer(qs, many=True).data, status=status.HTTP_200_OK)

    elif request.method == "POST":
        data = request.data.copy()
        # Automatically assign current manager
        data["manager"] = request.user.id
        serializer = CommunicationHistorySerializer(data=data)
        if serializer.is_valid():
            serializer.save(manager=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def notifications_api(request):
    client_id = request.GET.get("client_id")
    qs = NotificationLog.objects.all().order_by("-sent_at")
    if client_id:
        qs = qs.filter(client_id=client_id)
    return Response(NotificationLogSerializer(qs, many=True).data, status=status.HTTP_200_OK)


# ==========================================
# 4. WAREHOUSE - INVENTORY ITEMS
# ==========================================
@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def inventory_api(request):
    """
    GET: List all stock items.
    POST: Create a new inventory item.
    """
    if request.method == "GET":
        qs = InventoryItem.objects.all().order_by("name")
        return Response(InventoryItemSerializer(qs, many=True).data, status=status.HTTP_200_OK)

    elif request.method == "POST":
        # Only admin role can create new inventory types
        if request.user.profile.role != UserProfile.Role.ADMIN:
            return Response({"detail": "Only Admin can create warehouse items"}, status=status.HTTP_403_FORBIDDEN)
            
        serializer = InventoryItemSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ==========================================
# 5. WAREHOUSE - STOCK TRANSACTIONS (INFLOW/WRITE-OFF)
# ==========================================
@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def stock_operations_api(request):
    if request.method == "GET":
        qs = StockOperation.objects.all().order_by("-created_at")
        item_id = request.GET.get("item_id")
        if item_id:
            qs = qs.filter(item_id=item_id)
        return Response(StockOperationSerializer(qs, many=True).data, status=status.HTTP_200_OK)

    elif request.method == "POST":
        # Anyone authenticated can perform stock adjustment, but let's log who did it
        item_id = request.data.get("item")
        op_type = request.data.get("type") # inflow or write_off
        qty_str = request.data.get("quantity")
        reason = request.data.get("reason", "")

        if not item_id or not op_type or not qty_str:
            return Response({"detail": "item, type, and quantity are required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            item = InventoryItem.objects.get(pk=item_id)
            qty = Decimal(str(qty_str))
        except (InventoryItem.DoesNotExist, ValueError):
            return Response({"detail": "Invalid item or quantity value"}, status=status.HTTP_400_BAD_REQUEST)

        if qty <= 0:
            return Response({"detail": "Quantity must be greater than zero"}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            if op_type == StockOperation.OpType.INFLOW:
                item.quantity += qty
            elif op_type == StockOperation.OpType.WRITE_OFF:
                if item.quantity < qty:
                    return Response({"detail": f"Insufficient stock of '{item.name}' for this write-off (current: {item.quantity})"}, status=status.HTTP_400_BAD_REQUEST)
                item.quantity -= qty
            else:
                return Response({"detail": "Invalid operation type"}, status=status.HTTP_400_BAD_REQUEST)

            item.save()

            op = StockOperation.objects.create(
                item=item,
                type=op_type,
                quantity=qty,
                reason=reason,
                performed_by=request.user
            )

            return Response(StockOperationSerializer(op).data, status=status.HTTP_201_CREATED)


# ==========================================
# 6. ORDERS MANAGEMENT (POS & ROUTING)
# ==========================================
@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def orders_api(request):
    if request.method == "GET":
        qs = Order.objects.all().order_by("-created_at")
        status_filter = request.GET.get("status")
        client_id = request.GET.get("client_id")
        if status_filter:
            qs = qs.filter(status=status_filter)
        if client_id:
            qs = qs.filter(client_id=client_id)
        return Response(OrderSerializer(qs, many=True).data, status=status.HTTP_200_OK)

    elif request.method == "POST":
        # ALGORITHM 1 & 2: Order Routing, Stock Validation & Dynamic Loyalty Cost engine
        client_id = request.data.get("client_id")
        items_data = request.data.get("items", []) # list of {"product_id": x, "quantity": y}
        use_bonuses = request.data.get("use_bonuses", False)

        if not items_data:
            return Response({"detail": "Cannot place an empty order"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                # A. Resolve Client
                client = None
                if client_id:
                    try:
                        client = Client.objects.get(pk=client_id)
                    except Client.DoesNotExist:
                        return Response({"detail": "Client not found"}, status=status.HTTP_404_NOT_FOUND)

                # B. Algorithm: Dynamic Price Calculation based on loyalty discount and menu retail price
                total_price = Decimal("0.00")
                resolved_items = []

                for item_req in items_data:
                    p_id = item_req.get("product_id")
                    qty = int(item_req.get("quantity", 1))

                    if qty <= 0:
                        return Response({"detail": "Quantity must be positive"}, status=status.HTTP_400_BAD_REQUEST)

                    product = CoffeeProduct.objects.get(pk=p_id)
                    total_price += product.price * qty
                    resolved_items.append((product, qty))

                # Calculate discount
                discount_amount = Decimal("0.00")
                if client:
                    if client.loyalty_level == Client.LoyaltyLevel.BRONZE:
                        discount_amount = total_price * Decimal("0.05")
                    elif client.loyalty_level == Client.LoyaltyLevel.SILVER:
                        discount_amount = total_price * Decimal("0.10")
                    elif client.loyalty_level == Client.LoyaltyLevel.GOLD:
                        discount_amount = total_price * Decimal("0.15")

                final_price = total_price - discount_amount

                # Bonuses application: pay up to 50% of the discounted price using bonuses (1 bonus = 1 ruble)
                bonuses_used = 0
                if use_bonuses and client and client.bonuses_balance > 0:
                    max_bonus_payment = final_price * Decimal("0.50")
                    available_bonuses = Decimal(client.bonuses_balance)
                    
                    bonuses_to_apply = min(available_bonuses, max_bonus_payment)
                    bonuses_used = int(bonuses_to_apply)
                    
                    discount_amount += Decimal(bonuses_used)
                    final_price -= Decimal(bonuses_used)

                # C. Algorithm: Warehouse Stock Check & Ingredient Routing
                # Group all ingredients required for this order
                ingredients_needed = {}
                for product, qty in resolved_items:
                    for recipe_item in product.ingredients.all():
                        ing_id = recipe_item.item.id
                        needed_qty = recipe_item.quantity_required * qty
                        ingredients_needed[ing_id] = ingredients_needed.get(ing_id, Decimal("0.000")) + needed_qty

                # Validate stock levels
                for ing_id, required_qty in ingredients_needed.items():
                    ing_item = InventoryItem.objects.get(pk=ing_id)
                    if ing_item.quantity < required_qty:
                        # EXCEPTIONS / REJECTIONS FLOW
                        return Response(
                            {
                                "detail": f"Ошибка склада: Недостаточно ингредиента '{ing_item.name}'. Требуется {required_qty} {ing_item.unit}, в наличии {ing_item.quantity} {ing_item.unit}."
                            },
                            status=status.HTTP_400_BAD_REQUEST
                        )

                # D. Sufficient stock: Reserve stock & Log Operations
                for ing_id, required_qty in ingredients_needed.items():
                    ing_item = InventoryItem.objects.get(pk=ing_id)
                    ing_item.quantity -= required_qty
                    ing_item.save()

                    # Write-off operation record
                    StockOperation.objects.create(
                        item=ing_item,
                        type=StockOperation.OpType.WRITE_OFF,
                        quantity=required_qty,
                        reason="Расход на обеспечение заказа",
                        performed_by=request.user
                    )

                # E. Calculate bonuses earned (5% of what was actually paid)
                bonuses_earned = int(final_price * Decimal("0.05"))

                # F. Create Order record
                # Default status is NEW or PROCESSING or COMPLETED. Let's make it COMPLETED immediately for standard POS orders.
                order = Order.objects.create(
                    client=client,
                    manager=request.user,
                    status=Order.Status.COMPLETED,
                    total_price=total_price,
                    discount_amount=discount_amount,
                    final_price=final_price,
                    bonuses_used=bonuses_used,
                    bonuses_earned=bonuses_earned
                )

                # Save Order items
                for product, qty in resolved_items:
                    OrderItem.objects.create(
                        order=order,
                        product=product,
                        quantity=qty,
                        price=product.price
                    )

                # G. Update client loyalty card balance
                if client:
                    client.total_spent += final_price
                    client.bonuses_balance = client.bonuses_balance - bonuses_used + bonuses_earned

                    # Tier upgrades
                    if client.total_spent >= Decimal("15000.00"):
                        client.loyalty_level = Client.LoyaltyLevel.GOLD
                    elif client.total_spent >= Decimal("7000.00"):
                        client.loyalty_level = Client.LoyaltyLevel.SILVER
                    elif client.total_spent >= Decimal("3000.00"):
                        client.loyalty_level = Client.LoyaltyLevel.BRONZE

                    client.save()

                    # Send CRM status notifications
                    NotificationLog.objects.create(
                        client=client,
                        type=NotificationLog.NotificationType.SMS,
                        title="Ваш заказ оформлен!",
                        message=f"Заказ #{order.id} на сумму {final_price} руб. оформлен. Списано: {bonuses_used} бонусов. Начислено: {bonuses_earned} бонусов. Баланс: {client.bonuses_balance}."
                    )

                return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)

        except CoffeeProduct.DoesNotExist:
            return Response({"detail": "Product not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"detail": f"Server error processing order: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated])
def order_detail_api(request, pk):
    try:
        order = Order.objects.get(pk=pk)
    except Order.DoesNotExist:
        return Response({"detail": "Order not found"}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "GET":
        return Response(OrderSerializer(order).data, status=status.HTTP_200_OK)

    elif request.method == "PATCH":
        # Allow canceling order (e.g. restocks items!)
        old_status = order.status
        new_status = request.data.get("status")

        if not new_status:
            return Response({"detail": "status field is required"}, status=status.HTTP_400_BAD_REQUEST)

        if old_status == Order.Status.CANCELLED:
            return Response({"detail": "Cannot modify an already cancelled order"}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            # If changing status to CANCELLED, return stock to warehouse
            if new_status == Order.Status.CANCELLED and old_status != Order.Status.CANCELLED:
                for item in order.items.all():
                    # For each ordered menu item, find ingredients
                    for recipe_item in item.product.ingredients.all():
                        ing_item = recipe_item.item
                        returned_qty = recipe_item.quantity_required * item.quantity
                        ing_item.quantity += returned_qty
                        ing_item.save()

                        # stock inflow log
                        StockOperation.objects.create(
                            item=ing_item,
                            type=StockOperation.OpType.INFLOW,
                            quantity=returned_qty,
                            reason=f"Возврат на склад по отмене заказа #{order.id}",
                            performed_by=request.user
                        )

                # Revert client spent and bonuses if client attached
                if order.client:
                    client = order.client
                    client.total_spent = max(Decimal("0.00"), client.total_spent - order.final_price)
                    client.bonuses_balance = max(0, client.bonuses_balance + order.bonuses_used - order.bonuses_earned)
                    
                    # Downgrade check
                    if client.total_spent < Decimal("3000.00"):
                        client.loyalty_level = Client.LoyaltyLevel.NONE
                    elif client.total_spent < Decimal("7000.00"):
                        client.loyalty_level = Client.LoyaltyLevel.BRONZE
                    elif client.total_spent < Decimal("15000.00"):
                        client.loyalty_level = Client.LoyaltyLevel.SILVER
                        
                    client.save()

                    # Notification log
                    NotificationLog.objects.create(
                        client=client,
                        type=NotificationLog.NotificationType.SMS,
                        title="Отмена заказа",
                        message=f"Заказ #{order.id} отменен. Сумма {order.final_price} руб. и бонусы скорректированы."
                    )

            order.status = new_status
            order.save()
            return Response(OrderSerializer(order).data, status=status.HTTP_200_OK)


# ==========================================
# 7. DIRECTOR DASHBOARD - ANALYTICS & REPORTING
# ==========================================
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def analytics_api(request):
    """
    ALGORITHM 3: Automated report generation using customized period and item filters.
    Calculates profit, cost price of ingredients, and profitability margin.
    """
    user_role = request.user.profile.role
    if user_role != UserProfile.Role.DIRECTOR and user_role != UserProfile.Role.ADMIN:
         return Response({"detail": "Only Director or Admin can access reports"}, status=status.HTTP_403_FORBIDDEN)

    # 1. Period filters
    days_param = request.GET.get("period", "30") # 7, 30, today, custom
    start_date_str = request.GET.get("start_date")
    end_date_str = request.GET.get("end_date")
    
    now = timezone.now()
    if days_param == "today":
        start_date = timezone.make_aware(datetime.datetime.combine(now.date(), datetime.time.min))
        end_date = timezone.make_aware(datetime.datetime.combine(now.date(), datetime.time.max))
    elif days_param == "7":
        start_date = now - datetime.timedelta(days=7)
        end_date = now
    elif days_param == "custom" and start_date_str and end_date_str:
        try:
            start_date = timezone.make_aware(datetime.datetime.strptime(start_date_str, "%Y-%m-%d"))
            end_date = timezone.make_aware(datetime.datetime.strptime(end_date_str, "%Y-%m-%d")) + datetime.timedelta(days=1)
        except ValueError:
            return Response({"detail": "Invalid custom date format (YYYY-MM-DD)"}, status=status.HTTP_400_BAD_REQUEST)
    else: # default 30 days
        start_date = now - datetime.timedelta(days=30)
        end_date = now

    # Get completed orders within the period
    orders = Order.objects.filter(
        status=Order.Status.COMPLETED,
        created_at__range=(start_date, end_date)
    )

    # 2. Main KPI Metrics
    total_revenue = orders.aggregate(val=Sum("final_price"))["val"] or Decimal("0.00")
    total_orders = orders.count()

    # Calculate wholesale ingredients cost of goods sold (COGS)
    total_cost_price = Decimal("0.00")
    for order in orders:
        for item in order.items.all():
            # For each product, calculate recipe cost
            for recipe_item in item.product.ingredients.all():
                # Ingredient cost_price * quantity required * quantity ordered
                item_cost = recipe_item.item.cost_price * recipe_item.quantity_required * item.quantity
                total_cost_price += item_cost

    net_profit = total_revenue - total_cost_price
    
    profitability = Decimal("0.00")
    if total_revenue > 0:
        profitability = (net_profit / total_revenue) * 100

    # 3. Dynamic Charts Aggregations
    # A. Top Products
    top_products = {}
    for order in orders:
        for item in order.items.all():
            prod_name = item.product.name
            if prod_name not in top_products:
                top_products[prod_name] = {"qty": 0, "rev": Decimal("0.00")}
            top_products[prod_name]["qty"] += item.quantity
            top_products[prod_name]["rev"] += item.price * item.quantity

    top_products_list = [
        {"name": k, "quantity": v["qty"], "revenue": v["rev"]}
        for k, v in top_products.items()
    ]
    top_products_list = sorted(top_products_list, key=lambda x: x["quantity"], reverse=True)[:5]

    # B. Stock items health check (Admin / Director overview)
    critical_items_count = InventoryItem.objects.filter(quantity__lte=F("min_threshold")).count()
    critical_items = InventoryItemSerializer(
        InventoryItem.objects.filter(quantity__lte=F("min_threshold")), many=True
    ).data

    # C. Daily Sales Trend (for chart)
    daily_sales = {}
    curr = start_date.date()
    end_limit = end_date.date()
    while curr <= end_limit:
        daily_sales[curr.strftime("%d.%m")] = Decimal("0.00")
        curr += datetime.timedelta(days=1)

    for order in orders:
        day_key = order.created_at.astimezone(timezone.get_current_timezone()).strftime("%d.%m")
        if day_key in daily_sales:
            daily_sales[day_key] += order.final_price

    sales_trend_list = [
        {"date": k, "revenue": v}
        for k, v in daily_sales.items()
    ]

    return Response({
        "period": {
            "start": start_date.strftime("%d.%m.%Y"),
            "end": (end_date - datetime.timedelta(seconds=1)).strftime("%d.%m.%Y")
        },
        "metrics": {
            "revenue": total_revenue,
            "cogs": total_cost_price,
            "net_profit": net_profit,
            "profitability": round(profitability, 2),
            "total_orders": total_orders,
            "critical_stock_count": critical_items_count
        },
        "top_products": top_products_list,
        "sales_trend": sales_trend_list,
        "critical_items": critical_items
    }, status=status.HTTP_200_OK)
