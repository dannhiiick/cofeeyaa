import type { CurrentUser, Client, CommunicationHistory, NotificationLog, InventoryItem, StockOperation, CoffeeProduct, Order, AnalyticsResponse } from '../types';

const DEFAULT_PRODUCTION_API_BASE_URL = 'https://cofeeyaa-backend.onrender.com/api';
const API_REQUEST_TIMEOUT_MS = 20000;
const DEMO_ACCESS_TOKEN = 'demo-access-token';
const DEMO_REFRESH_TOKEN = 'demo-refresh-token';

function getProductionApiBaseUrl() {
  if (typeof window !== 'undefined' && window.location.hostname.endsWith('.onrender.com')) {
    return '/api';
  }
  return DEFAULT_PRODUCTION_API_BASE_URL;
}

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD ? getProductionApiBaseUrl() : '/api');

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

const DEMO_USERS: Record<string, { password: string; user: CurrentUser }> = {
  manager: {
    password: 'manager123',
    user: {
      id: 1,
      username: 'manager',
      email: null,
      isStaff: false,
      displayName: 'Manager',
      bio: '',
      city: '',
      role: 'manager',
    },
  },
  admin: {
    password: 'admin123',
    user: {
      id: 2,
      username: 'admin',
      email: null,
      isStaff: true,
      displayName: 'Admin',
      bio: '',
      city: '',
      role: 'admin',
    },
  },
  director: {
    password: 'director123',
    user: {
      id: 3,
      username: 'director',
      email: null,
      isStaff: true,
      displayName: 'Director',
      bio: '',
      city: '',
      role: 'director',
    },
  },
};

function getStoredDemoUser(): CurrentUser | null {
  const raw = localStorage.getItem('demo_user');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CurrentUser;
  } catch {
    localStorage.removeItem('demo_user');
    return null;
  }
}

function setStoredDemoUser(user: CurrentUser | null) {
  if (!user) localStorage.removeItem('demo_user');
  else localStorage.setItem('demo_user', JSON.stringify(user));
}

function loginWithDemoAccount(payload: { username: string; password: string }) {
  const demo = DEMO_USERS[payload.username.trim().toLowerCase()];
  if (!demo || demo.password !== payload.password) return null;
  setStoredAccessToken(DEMO_ACCESS_TOKEN);
  setStoredRefreshToken(DEMO_REFRESH_TOKEN);
  setStoredDemoUser(demo.user);
  return demo.user;
}

export function hasStoredAuthTokens() {
  return Boolean(getStoredDemoUser() || getStoredAccessToken() || getStoredRefreshToken());
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
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), API_REQUEST_TIMEOUT_MS);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(typeof options.headers === 'object' && options.headers !== null
      ? (options.headers as Record<string, string>)
      : {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
  } catch (err) {
    if ((err as Error).name === 'AbortError') {
      throw new Error('Сервер не отвечает. Проверьте, что backend запущен.');
    }
    throw err;
  } finally {
    window.clearTimeout(timeout);
  }

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
  try {
    const res = await apiRequest<TokenPair>(`auth/login`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setStoredAccessToken(res.access);
    setStoredRefreshToken(res.refresh);
    setStoredDemoUser(null);
    return res.user ?? me();
  } catch (err) {
    const demoUser = loginWithDemoAccount(payload);
    if (demoUser) return demoUser;
    throw err;
  }
}

export async function me() {
  const demoUser = getStoredDemoUser();
  if (demoUser) return demoUser;
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
  setStoredDemoUser(null);
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
  return apiRequest<AnalyticsResponse>(`analytics${query}`, { method: 'GET' });
}
