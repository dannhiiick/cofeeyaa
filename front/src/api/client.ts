import type { CurrentUser, Client, CommunicationHistory, NotificationLog, InventoryItem, StockOperation, CoffeeProduct, Order } from '../types';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export type ApiError = { detail?: string } & Record<string, unknown>;

function getStoredAccessToken(): string | null {
  return localStorage.getItem('access_token');
}

function setStoredAccessToken(token: string | null) {
  if (!token) localStorage.removeItem('access_token');
  else localStorage.setItem('access_token', token);
}

export type TokenPair = { access: string; refresh: string; user?: CurrentUser };

function getStoredRefreshToken(): string | null {
  return localStorage.getItem('refresh_token');
}

function setStoredRefreshToken(token: string | null) {
  if (!token) localStorage.removeItem('refresh_token');
  else localStorage.setItem('refresh_token', token);
}

export function hasStoredAuthTokens() {
  return Boolean(getStoredAccessToken() || getStoredRefreshToken());
}

async function refreshAccessToken(): Promise<string> {
  const refresh = getStoredRefreshToken();
  if (!refresh) throw new Error('No refresh token');

  const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh }),
  });

  if (!res.ok) {
    throw new Error('Failed to refresh token');
  }

  const data = (await res.json()) as { access: string };
  setStoredAccessToken(data.access);
  return data.access;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getStoredAccessToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(typeof options.headers === 'object' && options.headers !== null
      ? (options.headers as Record<string, string>)
      : {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    if (res.status === 401) {
      try {
        const newAccess = await refreshAccessToken();
        headers['Authorization'] = `Bearer ${newAccess}`;
        const retryRes = await fetch(
          `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`,
          {
            ...options,
            headers,
          }
        );

        if (!retryRes.ok) {
          let payload: ApiError | undefined;
          try {
            payload = await retryRes.json();
          } catch {
            payload = undefined;
          }
          const detail = payload?.detail || `Request failed with status ${retryRes.status}`;
          throw new Error(detail);
        }

        if (retryRes.status === 204) return undefined as T;
        return (await retryRes.json()) as T;
      } catch {
        // fallthrough and throw original
      }
    }

    let payload: ApiError | undefined;
    try {
      payload = await res.json();
    } catch {
      payload = undefined;
    }
    const detail = payload?.detail || `Request failed with status ${res.status}`;
    throw new Error(detail);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

// ==========================================
// AUTHENTICATION CLIENT APIs
// ==========================================
export async function register(payload: {
  username: string;
  password: string;
  email?: string;
  role?: string;
}) {
  const res = await apiRequest<TokenPair>(`auth/register`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  setStoredAccessToken(res.access);
  setStoredRefreshToken(res.refresh);
  return res.user ?? me();
}

export async function login(payload: { username: string; password: string }) {
  const res = await apiRequest<TokenPair>(`auth/login`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  setStoredAccessToken(res.access);
  setStoredRefreshToken(res.refresh);
  return res.user ?? me();
}

export async function me() {
  return apiRequest<CurrentUser>(`auth/me`, { method: 'GET' });
}

export async function updateMe(payload: {
  username: string;
  email?: string;
  display_name?: string;
  bio?: string;
  city?: string;
  role?: string;
}) {
  return apiRequest<CurrentUser>(`auth/me`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function fetchSettings() {
  return apiRequest<{ role: string; displayName: string; city: string; bio: string }>(`settings`, { method: 'GET' });
}

export async function updateSettings(payload: { role?: string; displayName?: string; city?: string; bio?: string }) {
  return apiRequest<{ role: string; displayName: string; city: string; bio: string }>(`settings`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function logout() {
  setStoredAccessToken(null);
  setStoredRefreshToken(null);
}

// ==========================================
// COFFEE SHOP CLIENT APIs
// ==========================================
export async function fetchProducts() {
  return apiRequest<CoffeeProduct[]>(`products`, { method: 'GET' });
}

export async function fetchClients(search?: string) {
  const query = search ? `?search=${encodeURIComponent(search)}` : '';
  return apiRequest<Client[]>(`clients${query}`, { method: 'GET' });
}

export async function createClient(payload: { name: string; phone: string; email?: string }) {
  return apiRequest<Client>(`clients`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateClient(id: number, payload: Partial<Client>) {
  return apiRequest<Client>(`clients/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteClient(id: number) {
  return apiRequest<void>(`clients/${id}`, { method: 'DELETE' });
}

export async function fetchCommunications(clientId?: number) {
  const query = clientId ? `?client_id=${clientId}` : '';
  return apiRequest<CommunicationHistory[]>(`communications${query}`, { method: 'GET' });
}

export async function createCommunication(payload: { client: number; type: string; content: string }) {
  return apiRequest<CommunicationHistory>(`communications`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchNotifications(clientId?: number) {
  const query = clientId ? `?client_id=${clientId}` : '';
  return apiRequest<NotificationLog[]>(`notifications${query}`, { method: 'GET' });
}

export async function fetchInventory() {
  return apiRequest<InventoryItem[]>(`inventory`, { method: 'GET' });
}

export async function createInventoryItem(payload: { name: string; quantity: number; unit: string; min_threshold: number; cost_price: number }) {
  return apiRequest<InventoryItem>(`inventory`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchStockOperations(itemId?: number) {
  const query = itemId ? `?item_id=${itemId}` : '';
  return apiRequest<StockOperation[]>(`stock-operations${query}`, { method: 'GET' });
}

export async function createStockOperation(payload: { item: number; type: 'inflow' | 'write_off'; quantity: number; reason: string }) {
  return apiRequest<StockOperation>(`stock-operations`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchOrders(status?: string, clientId?: number) {
  const params = [];
  if (status) params.push(`status=${status}`);
  if (clientId) params.push(`client_id=${clientId}`);
  const query = params.length ? `?${params.join('&')}` : '';
  return apiRequest<Order[]>(`orders${query}`, { method: 'GET' });
}

export async function createOrder(payload: { client_id?: number | null; items: { product_id: number; quantity: number }[]; use_bonuses?: boolean }) {
  return apiRequest<Order>(`orders`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateOrderStatus(id: number, status: 'new' | 'processing' | 'completed' | 'cancelled') {
  return apiRequest<Order>(`orders/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function fetchAnalytics(period = '30', startDate?: string, endDate?: string) {
  const params = [`period=${period}`];
  if (startDate) params.push(`start_date=${startDate}`);
  if (endDate) params.push(`end_date=${endDate}`);
  const query = `?${params.join('&')}`;
  return apiRequest<{
    period: { start: string; end: string };
    metrics: {
      revenue: string;
      cogs: string;
      net_profit: string;
      profitability: number;
      total_orders: number;
      critical_stock_count: number;
    };
    top_products: { name: string; quantity: number; revenue: string }[];
    sales_trend: { date: string; revenue: string }[];
    critical_items: InventoryItem[];
  }>(`analytics${query}`, { method: 'GET' });
}
