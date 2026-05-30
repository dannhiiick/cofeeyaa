import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  fetchInventory, 
  fetchProducts,
  fetchClients,
  fetchOrders,
  fetchAnalytics,
  onServerWakeup
} from '../api/client';
import type { InventoryItem, CoffeeProduct, Client, Order } from '../types';
import { 
  Coffee, 
  Users, 
  Boxes, 
  BarChart3, 
  AlertTriangle, 
  TrendingUp, 
  Activity,
  ArrowRight,
  CheckCircle2,
  Search,
  Award
} from 'lucide-react';
import './Home.css';

function getProductSvg(name: string) {
  const lowercaseName = name.toLowerCase();
  
  if (lowercaseName.includes('эспрессо')) {
    return (
      <svg className="food-svg-icon" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 8h1a3 3 0 1 1 0 6h-1" />
        <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8z" />
        <line x1="6" y1="2" x2="6" y2="4" />
        <line x1="10" y1="2" x2="10" y2="4" />
        <line x1="14" y1="2" x2="14" y2="4" />
      </svg>
    );
  }
  if (lowercaseName.includes('капучино')) {
    return (
      <svg className="food-svg-icon" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 8h1a3 3 0 1 1 0 6h-1" />
        <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8z" />
        <path d="M6 4c0 1.5 1 1.5 1 3" />
        <path d="M10 4c0 1.5 1 1.5 1 3" />
        <path d="M13 4c0 1.5 1 1.5 1 3" />
      </svg>
    );
  }
  if (lowercaseName.includes('латте')) {
    return (
      <svg className="food-svg-icon" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2h12v2H6V2z" />
        <path d="M7 4h10l-2 15a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L7 4z" />
        <line x1="7" y1="9" x2="17" y2="9" strokeDasharray="2 2" />
        <line x1="8" y1="14" x2="16" y2="14" strokeDasharray="2 2" />
      </svg>
    );
  }
  if (lowercaseName.includes('круассан')) {
    return (
      <svg className="food-svg-icon" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 14c2-4 6-6 9-6s7 2 9 6c-3-2-6-3-9-3s-6 1-9 3z" />
        <path d="M6 13c1.5-2 3.5-3 6-3s4.5 1 6 3c-2-1.5-4-2-6-2s-4 .5-6 2z" />
        <path d="M1.5 16.5c1.5-3 5-5 8.5-5s7 2 8.5 5c-2.5-2-6-3-8.5-3s-6 1-8.5 3z" />
      </svg>
    );
  }
  if (lowercaseName.includes('печенье')) {
    return (
      <svg className="food-svg-icon" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <circle cx="8" cy="9" r="1.5" fill="currentColor" />
        <circle cx="12" cy="7" r="1" fill="currentColor" />
        <circle cx="15" cy="10" r="1.5" fill="currentColor" />
        <circle cx="10" cy="14" r="1.5" fill="currentColor" />
        <circle cx="14" cy="15" r="1" fill="currentColor" />
      </svg>
    );
  }
  
  // Fallback
  return (
    <svg className="food-svg-icon" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  );
}

export function Home() {
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  
  // Dashboard states
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [products, setProducts] = useState<CoffeeProduct[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [analytics, setAnalytics] = useState<Awaited<ReturnType<typeof fetchAnalytics>> | null>(null);
  const [crmSearch, setCrmSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [wakeupAttempt, setWakeupAttempt] = useState<{ attempt: number; total: number } | null>(null);

  // Listen for cold-start retries from the API client
  useEffect(() => {
    const unsub = onServerWakeup((attempt, total) => {
      setWakeupAttempt({ attempt, total });
    });
    return () => { unsub(); };
  }, []);



  useEffect(() => {
    if (!user) return;
    
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        const analyticsRequest =
          user.role === 'admin' || user.role === 'director'
            ? fetchAnalytics('30').catch(() => null)
            : Promise.resolve(null);

        const [stock, prods, crmClients, completedOrders, analyticsData] = await Promise.all([
          fetchInventory(),
          fetchProducts(),
          fetchClients(),
          fetchOrders('completed'),
          analyticsRequest
        ]);
        
        setInventory(stock);
        setProducts(prods);
        setClients(crmClients);
        setOrders(completedOrders);
        setAnalytics(analyticsData);
      } catch (err) {
        console.error('Failed to load dashboard statistics:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const searchClients = async () => {
      try {
        const crmClients = await fetchClients(crmSearch);
        setClients(crmClients);
      } catch (err) {
        console.error('Failed to refresh CRM search:', err);
      }
    };

    const timer = window.setTimeout(searchClients, 250);
    return () => window.clearTimeout(timer);
  }, [crmSearch, user]);



  if (loading) {
    return (
      <div className="dashboard-loading animate-fade-in">
        <div className="coffee-loader">
          <Coffee size={40} className="steaming-cup" />
          {wakeupAttempt ? (
            <>
              <span style={{ color: '#c8a96e', fontWeight: 600 }}>
                {language === 'ru' ? 'Сервер просыпается...' : language === 'kk' ? 'Сервер оянып жатыр...' : 'Server waking up...'}
              </span>
              <span style={{ fontSize: 13, color: '#8a7060', marginTop: 6 }}>
                {language === 'ru'
                  ? `Попытка ${wakeupAttempt.attempt} из ${wakeupAttempt.total} — бесплатный хостинг засыпает после простоя`
                  : language === 'kk'
                  ? `${wakeupAttempt.attempt}/${wakeupAttempt.total} әрекет — тегін хостинг ұйқыға кетеді`
                  : `Retry ${wakeupAttempt.attempt}/${wakeupAttempt.total} — free tier sleeps after inactivity`}
              </span>
              <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                {Array.from({ length: wakeupAttempt.total }).map((_, i) => (
                  <div key={i} style={{
                    width: 10, height: 10, borderRadius: '50%',
                    background: i < wakeupAttempt.attempt ? '#c8a96e' : '#3a2a1a',
                    transition: 'background 0.4s'
                  }} />
                ))}
              </div>
            </>
          ) : (
            <span>{language === 'ru' ? 'Загрузка данных системы...' : language === 'kk' ? 'Жүйе деректерін жүктеу...' : 'Loading system metrics...'}</span>
          )}
        </div>
      </div>
    );
  }

  const formatCurrency = (value: number | string) =>
    `₸${Number(value || 0).toLocaleString('ru-KZ', {
      maximumFractionDigits: 0,
    })}`;

  const completedRevenue = orders.reduce((sum, order) => sum + Number(order.final_price), 0);
  const revenueValue = analytics ? Number(analytics.metrics.revenue) : completedRevenue;
  const profitValue = analytics ? Number(analytics.metrics.net_profit) : completedRevenue;
  const marginValue = analytics ? Number(analytics.metrics.profitability) : 0;
  const topClient = [...clients].sort((a, b) => Number(b.total_spent) - Number(a.total_spent))[0] || null;

  return (
    <div className="dashboard-container animate-fade-in">
      {/* Top Banner Title */}
      <div className="welcome-banner glass-panel">
        <div className="banner-left">
          <div className="banner-badge">{t('banner.title')}</div>
          <h2>{t('banner.welcome')}</h2>
          <p>{t('banner.desc')}</p>
          <div className="banner-buttons">
            <button className="glass-btn glass-btn-primary" onClick={() => navigate('/sandbox')}>
              <Coffee size={18} /> {t('banner.sandbox')}
            </button>
            <button className="glass-btn" onClick={() => navigate('/settings')}>
              {t('banner.settings')}
            </button>
          </div>
        </div>
        <div className="banner-right">
          <div className="clock-widget">
            <span className="clock-time">
              {new Date().toLocaleTimeString(language === 'ru' ? 'ru-RU' : language === 'kk' ? 'kk-KZ' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span className="clock-date">
              {new Date().toLocaleDateString(language === 'ru' ? 'ru-RU' : language === 'kk' ? 'kk-KZ' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
          </div>
        </div>
      </div>

      {/* Main Unified Dashboard Panels */}
      <div className="dashboard-split-layout">
        
        {/* LEFT MASTER COLUMN (2/3 width) */}
        <div className="master-column">
          
          {/* Central Grid of Food and Drinks */}
          <div className="dashboard-section-card glass-panel">
            <div className="dashboard-section-header">
              <div className="section-title-with-icon">
                <Coffee className="section-header-icon primary" size={20} />
                <h3>{t('food.title')}</h3>
              </div>
              <button className="text-btn" onClick={() => navigate('/pos')}>
                POS Terminal <ArrowRight size={14} />
              </button>
            </div>
            
            <div className="food-drinks-dashboard-grid">
              {products.slice(0, 6).map((product) => {
                // Dynamically build translated name
                let displayName = product.name;
                let displayDesc = product.description;
                if (product.name.includes("Эспрессо")) {
                  displayName = t('food.espresso') + " / Эспрессо";
                  displayDesc = t('food.espresso.desc');
                } else if (product.name.includes("Капучино")) {
                  displayName = t('food.cappuccino') + " / Капучино";
                  displayDesc = t('food.cappuccino.desc');
                } else if (product.name.includes("Латте Макиато")) {
                  displayName = t('food.latte') + " / Латте Макиато";
                  displayDesc = t('food.latte.desc');
                } else if (product.name.includes("Карамельный Латте")) {
                  displayName = t('food.caramelLatte') + " / Карамельный Латте";
                  displayDesc = t('food.caramelLatte.desc');
                } else if (product.name.includes("Круассан")) {
                  displayName = t('food.croissant') + " / Круассан с маслом";
                  displayDesc = t('food.croissant.desc');
                } else if (product.name.includes("печенье")) {
                  displayName = t('food.cookie') + " / Шоколадное печенье";
                  displayDesc = t('food.cookie.desc');
                }

                return (
                  <div key={product.id} className="food-dashboard-card glass-panel">
                    <div className="food-card-badge">{getProductSvg(product.name)}</div>
                    <div className="food-card-details">
                      <h4>{displayName}</h4>
                      <p className="food-card-desc">{displayDesc}</p>
                      <div className="food-card-price-row">
                        <span className="food-price-tag">{product.price} ₸</span>
                        <span className="food-recipe-indicator">
                          <CheckCircle2 size={12} className="text-success" /> {language === 'ru' ? 'Рецепт ОК' : language === 'kk' ? 'Рецепт ОК' : 'Recipe OK'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Inventory Management Section (placed above Analytics) */}
          <div className="dashboard-section-card glass-panel">
            <div className="dashboard-section-header">
              <div className="section-title-with-icon">
                <Boxes className="section-header-icon primary" size={20} />
                <h3>{t('warehouse.title')}</h3>
              </div>
              <span className="warning-pill"><AlertTriangle size={12} /> {language === 'ru' ? 'Складской баланс' : language === 'kk' ? 'Қойма теңгерімі' : 'Warehouse Inventory'}</span>
            </div>

            <div className="inventory-dashboard-grid-table">
              <div className="grid-table-header">
                <span>{t('warehouse.ingredient')}</span>
                <span className="text-center">{t('warehouse.available')}</span>
                <span className="text-center">{t('warehouse.critical')}</span>
                <span className="text-right">STATUS</span>
              </div>
              <div className="grid-table-body">
                {inventory.map((item) => {
                  let displayName = item.name;
                  if (item.name.includes("зерна")) displayName = t('warehouse.beans');
                  else if (item.name.includes("молоко")) displayName = t('warehouse.milk');
                  else if (item.name.includes("Сахарный")) displayName = t('warehouse.sugar');
                  else if (item.name.includes("сироп")) displayName = t('warehouse.syrup');
                  else if (item.name.includes("250мл")) displayName = t('warehouse.cups250');
                  else if (item.name.includes("400мл")) displayName = t('warehouse.cups400');
                  else if (item.name.includes("печенье")) displayName = t('warehouse.cookies');
                  else if (item.name.includes("круассаны")) displayName = t('warehouse.croissants');

                  return (
                    <div key={item.id} className={`grid-table-row ${item.is_critical ? 'critical-row' : ''}`}>
                      <span className="ingredient-name">{displayName}</span>
                      <span className="ingredient-qty text-center font-bold">{item.quantity} {item.unit}</span>
                      <span className="ingredient-threshold text-center text-secondary">{item.min_threshold} {item.unit}</span>
                      <span className="ingredient-status text-right">
                        {item.is_critical ? (
                          <span className="status-badge critical">{language === 'ru' ? 'ДЕФИЦИТ' : language === 'kk' ? 'ТАПШЫЛЫҚ' : 'LOW STOCK'}</span>
                        ) : (
                          <span className="status-badge optimal">{language === 'ru' ? 'ОПТИМАЛЬНО' : language === 'kk' ? 'ОПТИМАЛДЫ' : 'OPTIMAL'}</span>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Financial Analytics Section */}
          <div className="dashboard-section-card glass-panel">
            <div className="dashboard-section-header">
              <div className="section-title-with-icon">
                <BarChart3 className="section-header-icon primary" size={20} />
                <h3>{t('analytics.title')}</h3>
              </div>
              <span className="analytics-pill">{t('analytics.desc')}</span>
            </div>

            <div className="analytics-dashboard-summary-cards">
              <div className="analytics-stat-pill glass-panel">
                <div className="stat-pill-header">
                  <TrendingUp size={16} className="text-success animate-pulse" />
                  <span>{t('analytics.revenue')}</span>
                </div>
                <div className="stat-pill-value">{formatCurrency(revenueValue)}</div>
                <div className="stat-pill-graph-visual">
                  <div className="bar height-30"></div>
                  <div className="bar height-45"></div>
                  <div className="bar height-60"></div>
                  <div className="bar height-50"></div>
                  <div className="bar height-75"></div>
                  <div className="bar height-90 active"></div>
                  <div className="bar height-80"></div>
                </div>
              </div>

              <div className="analytics-stat-pill glass-panel">
                <div className="stat-pill-header">
                  <Activity size={16} className="text-primary" />
                  <span>{t('analytics.profit')}</span>
                </div>
                <div className="stat-pill-value">{formatCurrency(profitValue)}</div>
                <div className="stat-pill-graph-visual">
                  <div className="bar height-20"></div>
                  <div className="bar height-35"></div>
                  <div className="bar height-50"></div>
                  <div className="bar height-40"></div>
                  <div className="bar height-60"></div>
                  <div className="bar height-80 active"></div>
                  <div className="bar height-70"></div>
                </div>
              </div>

              <div className="analytics-stat-pill glass-panel">
                <div className="stat-pill-header">
                  <CheckCircle2 size={16} className="text-success" />
                  <span>{t('analytics.margin')}</span>
                </div>
                <div className="stat-pill-value">{marginValue.toFixed(1)}%</div>
                <div className="stat-pill-graph-visual">
                  <div className="bar height-60"></div>
                  <div className="bar height-65"></div>
                  <div className="bar height-70"></div>
                  <div className="bar height-70"></div>
                  <div className="bar height-72 active"></div>
                  <div className="bar height-72"></div>
                  <div className="bar height-72"></div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT SIDEBAR COLUMN (1/3 width) */}
        <div className="right-sidebar-column">
          
          {/* Loyalty/Customer CRM Panel */}
          <div className="dashboard-section-card glass-panel">
            <div className="dashboard-section-header">
              <div className="section-title-with-icon">
                <Users className="section-header-icon primary" size={20} />
                <h3>{t('crm.title')}</h3>
              </div>
            </div>

            <div className="crm-dashboard-content">
              {/* Search Box */}
              <div className="crm-search-wrapper">
                <Search size={16} className="crm-search-icon" />
                <input 
                  type="text" 
                  placeholder={t('crm.search')} 
                  value={crmSearch}
                  onChange={(e) => setCrmSearch(e.target.value)}
                  className="glass-input crm-search-input"
                />
              </div>

              {/* CRM Levels Sub-panel */}
              <div className="crm-levels-subpanel">
                <span className="subpanel-subtitle">{t('crm.levels')}</span>
                <div className="loyalty-levels-vertical-tracker">
                  <div className="loyalty-level-badge glass-panel">
                    <span className="level-name font-bold">{t('crm.login')}</span>
                    <span className="level-discount">0%</span>
                  </div>
                  <div className="loyalty-level-badge bronze glass-panel">
                    <span className="level-name font-bold">{t('crm.bronze')}</span>
                    <span className="level-discount">5%</span>
                  </div>
                  <div className="loyalty-level-badge silver glass-panel">
                    <span className="level-name font-bold">{t('crm.silver')}</span>
                    <span className="level-discount">10%</span>
                  </div>
                  <div className="loyalty-level-badge gold glass-panel active-gold">
                    <span className="level-name font-bold">{t('crm.gold')}</span>
                    <span className="level-discount">15%</span>
                  </div>
                </div>
              </div>

              {/* Active customer profile card */}
              <div className="crm-active-guest-example-card glass-panel">
                <div className="guest-example-header">
                  <Award size={20} className="text-secondary animate-bounce" />
                  <h4>{topClient ? t('crm.example') : t('crm.search')}</h4>
                </div>
                <div className="guest-example-body">
                  {topClient ? (
                    <>
                      <div className="guest-main-info">
                        <strong className="guest-name">{topClient.name}</strong>
                        <span className={`guest-loyalty-pill ${topClient.loyalty_level}`}>
                          {topClient.loyalty_level.toUpperCase()}
                        </span>
                      </div>
                      <div className="guest-meta-rows">
                        <div className="guest-meta-row">
                          <span>{t('crm.phone')}:</span>
                          <strong className="text-right">{topClient.phone}</strong>
                        </div>
                        <div className="guest-meta-row">
                          <span>{t('crm.bonuses')}:</span>
                          <strong className="text-right text-success">{topClient.bonuses_balance} б.</strong>
                        </div>
                        <div className="guest-meta-row">
                          <span>{t('crm.spent')}:</span>
                          <strong className="text-right text-primary">{formatCurrency(topClient.total_spent)}</strong>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="guest-meta-rows">
                      <div className="guest-meta-row">
                        <span>{language === 'ru' ? 'Клиенты' : language === 'kk' ? 'Клиенттер' : 'Clients'}:</span>
                        <strong className="text-right">0</strong>
                      </div>
                      <button className="glass-btn w-100" onClick={() => navigate('/crm')}>
                        <Users size={16} /> CRM
                      </button>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* Recent Orders Activity Panel */}
          <div className="dashboard-section-card glass-panel">
            <div className="dashboard-section-header">
              <div className="section-title-with-icon">
                <Activity className="section-header-icon primary" size={20} />
                <h3>{t('dashboard.recentOrders')}</h3>
              </div>
              <button className="text-btn" onClick={() => navigate('/pos')}>
                POS Terminal <ArrowRight size={14} />
              </button>
            </div>

            <div className="recent-orders-list">
              {orders.length === 0 ? (
                <div className="empty-orders-state">
                  <p className="placeholder-text">{t('dashboard.noOrders')}</p>
                </div>
              ) : (
                [...orders].slice(0, 5).map((order) => (
                  <div key={order.id} className="order-feed-item glass-panel">
                    <div className="order-feed-header">
                      <span className="order-id-label">#{order.id}</span>
                      <span className={`order-status-badge ${order.status}`}>
                        {order.status === 'completed' 
                          ? t('dashboard.completed') 
                          : order.status === 'cancelled' 
                          ? t('dashboard.cancelled') 
                          : order.status}
                      </span>
                    </div>
                    <div className="order-feed-body">
                      <div className="order-items-summary">
                        {order.items && order.items.map((item, idx) => (
                          <span key={idx} className="order-item-pill">
                            {item.product_name} × {item.quantity}
                          </span>
                        ))}
                      </div>
                      <div className="order-meta-info">
                        <span className="order-guest-name">
                          {order.client_name ? order.client_name : t('dashboard.guest')}
                        </span>
                        <span className="order-price-tag">
                          {formatCurrency(order.final_price)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
