export interface CurrentUser {
  id: number;
  username: string;
  email: string | null;
  isStaff: boolean;
  displayName: string;
  bio: string;
  city: string;
  role: 'admin' | 'manager' | 'director';
}

export interface Client {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  loyalty_level: 'none' | 'bronze' | 'silver' | 'gold';
  bonuses_balance: number;
  total_spent: string;
  created_at: string;
}

export interface CommunicationHistory {
  id: number;
  client: number;
  manager: number;
  manager_name: string;
  manager_username: string;
  type: 'call' | 'email' | 'meeting' | 'chat';
  content: string;
  created_at: string;
}

export interface NotificationLog {
  id: number;
  client: number;
  type: 'sms' | 'email' | 'push';
  title: string;
  message: string;
  sent_at: string;
}

export interface InventoryItem {
  id: number;
  name: string;
  quantity: string;
  unit: string;
  min_threshold: string;
  cost_price: string;
  updated_at: string;
  is_critical: boolean;
}

export interface StockOperation {
  id: number;
  item: number;
  item_name: string;
  item_unit: string;
  type: 'inflow' | 'write_off';
  quantity: string;
  reason: string;
  performed_by: number;
  operator_name: string;
  created_at: string;
}

export interface ProductIngredient {
  id: number;
  item_id: number;
  item_name: string;
  item_unit: string;
  quantity_required: string;
}

export interface CoffeeProduct {
  id: number;
  name: string;
  price: string;
  image_url: string;
  description: string;
  is_active: boolean;
  ingredients: ProductIngredient[];
}

export interface OrderItem {
  id: number;
  product: number;
  product_name: string;
  quantity: number;
  price: string;
}

export interface Order {
  id: number;
  client: number | null;
  client_name: string | null;
  client_phone: string | null;
  manager: number;
  manager_name: string;
  status: 'new' | 'processing' | 'completed' | 'cancelled';
  total_price: string;
  discount_amount: string;
  final_price: string;
  bonuses_used: number;
  bonuses_earned: number;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
}
