import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  fetchInventory, 
  fetchProducts
} from '../api/client';
import type { InventoryItem, CoffeeProduct } from '../types';
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
  Award,
  ShieldCheck
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
  const [crmSearch, setCrmSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Active step of flowchart trace visualization
  const [activeStep, setActiveStep] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        const [stock, prods] = await Promise.all([
          fetchInventory(),
          fetchProducts()
        ]);
        
        setInventory(stock);
        setProducts(prods);
      } catch (err) {
        console.error('Failed to load dashboard statistics:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [user]);

  // Handle sequential trace simulation for flowchart
  const handleSimulateTrace = () => {
    setActiveStep(1);
    const intervals = [1000, 2000, 3000, 4000];
    intervals.forEach((time, index) => {
      setTimeout(() => {
        setActiveStep(index + 1);
      }, time);
    });
    // Reset after some time
    setTimeout(() => {
      setActiveStep(null);
    }, 6000);
  };

  if (loading) {
    return (
      <div className="dashboard-loading animate-fade-in">
        <div className="coffee-loader">
          <Coffee size={40} className="steaming-cup" />
          <span>{language === 'ru' ? 'Загрузка данных системы...' : language === 'kk' ? 'Жүйе деректерін жүктеу...' : 'Loading system metrics...'}</span>
        </div>
      </div>
    );
  }

  // Sample static data in Tenge (₸) matching user request
  const weeklyRevenue1 = "₸45,000";
  const weeklyRevenue2 = "₸45,000";

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
                <div className="stat-pill-value">{weeklyRevenue1}</div>
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
                <div className="stat-pill-value">{weeklyRevenue2}</div>
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
                <div className="stat-pill-value">72.4%</div>
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

              {/* Active customer profile card example */}
              <div className="crm-active-guest-example-card glass-panel">
                <div className="guest-example-header">
                  <Award size={20} className="text-secondary animate-bounce" />
                  <h4>{t('crm.example')}</h4>
                </div>
                <div className="guest-example-body">
                  <div className="guest-main-info">
                    <strong className="guest-name">{t('crm.guestName')}</strong>
                    <span className="guest-loyalty-pill gold">GOLD GUEST</span>
                  </div>
                  <div className="guest-meta-rows">
                    <div className="guest-meta-row">
                      <span>{t('crm.phone')}:</span>
                      <strong className="text-right">+7 707 123-45-67</strong>
                    </div>
                    <div className="guest-meta-row">
                      <span>{t('crm.bonuses')}:</span>
                      <strong className="text-right text-success">1250 ₸</strong>
                    </div>
                    <div className="guest-meta-row">
                      <span>{t('crm.spent')}:</span>
                      <strong className="text-right text-primary">18,200 ₸</strong>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Extended Algorithm Flowchart Panel */}
          <div className="dashboard-section-card glass-panel">
            <div className="dashboard-section-header">
              <div className="section-title-with-icon">
                <ShieldCheck className="section-header-icon primary" size={20} />
                <h3>{t('flowchart.title')}</h3>
              </div>
              <button className="glass-btn lang-btn active" onClick={handleSimulateTrace}>
                {language === 'ru' ? 'ТРАССИРОВКА' : language === 'kk' ? 'ТРАССИРОВКА' : 'TRACE'}
              </button>
            </div>

            <div className="extended-algorithm-flowchart-card glass-panel">
              <div className="flowchart-nodes-list">
                
                {/* Step 1 */}
                <div className={`flowchart-node ${activeStep === 1 ? 'active-step glow-primary' : ''}`}>
                  <div className="node-number">1</div>
                  <div className="node-content">
                    <span className="node-title">[{t('flowchart.step1')}]</span>
                    <p className="node-desc">{language === 'ru' ? 'Проверка соединения с реляционной БД' : language === 'kk' ? 'Реляциялық ДҚ-мен қосылымды тексеру' : 'Relational DB connections test'}</p>
                  </div>
                </div>

                <div className="flowchart-arrow">↓</div>

                {/* Step 2 */}
                <div className={`flowchart-node ${activeStep === 2 ? 'active-step glow-info' : ''}`}>
                  <div className="node-number">2</div>
                  <div className="node-content">
                    <span className="node-title">[{t('flowchart.step2')}]</span>
                    <p className="node-desc">{language === 'ru' ? 'Валидация остатков ингредиентов по рецепту' : language === 'kk' ? 'Рецепт бойынша ингредиент қалдықтарын валидациялау' : 'Validation of ingredients by recipe'}</p>
                  </div>
                </div>

                <div className="flowchart-arrow">↓</div>

                {/* Step 3 */}
                <div className={`flowchart-node ${activeStep === 3 ? 'active-step glow-secondary' : ''}`}>
                  <div className="node-number">3</div>
                  <div className="node-content">
                    <span className="node-title">[{t('flowchart.step3')}]</span>
                    <p className="node-desc">{language === 'ru' ? 'Расчет кэшбека +5% на баланс лояльности' : language === 'kk' ? 'Адалдық теңгеріміне +5% кэшбэк есептеу' : 'Calculation of +5% cashback on loyalty'}</p>
                  </div>
                </div>

                <div className="flowchart-arrow">↓</div>

                {/* Step 4 */}
                <div className={`flowchart-node ${activeStep === 4 ? 'active-step glow-success' : ''}`}>
                  <div className="node-number">4</div>
                  <div className="node-content">
                    <span className="node-title">[{t('flowchart.step4')}]</span>
                    <p className="node-desc">{language === 'ru' ? 'Списание бонусов и применение скидки' : language === 'kk' ? 'Бонустарды есептен шығару және жеңілдікті қолдану' : 'Bonus write-off and final discount'}</p>
                  </div>
                </div>

              </div>

              {/* Flowchart Outcomes Footer */}
              <div className="flowchart-logs-console mt-15">
                <div className="console-header-bar">
                  <span className="console-title">{t('flowchart.logTitle')}</span>
                  {activeStep && <span className="console-status-pulse">RUNNING</span>}
                </div>
                <div className="console-trace-log">
                  {activeStep === null && (
                    <span className="text-secondary italic">{language === 'ru' ? 'Нажмите ТРАССИРОВКА для запуска...' : language === 'kk' ? 'Іске қосу үшін ТРАССИРОВКА түймесін басыңыз...' : 'Click TRACE to launch visual run...'}</span>
                  )}
                  {activeStep === 1 && (
                    <span className="text-primary font-mono">19:18:59 [SYSTEM] Connection pool verification: OK. Database responded in 4.2ms.</span>
                  )}
                  {activeStep === 2 && (
                    <span className="text-info font-mono">19:19:00 [STOCK] Recipe match: Cappuccino req = 9g beans, 150ml milk. Sufficient stock.</span>
                  )}
                  {activeStep === 3 && (
                    <span className="text-warning font-mono">19:19:01 [CRM] Customer Ivan I. identified (GOLD). Base discount set: 15%.</span>
                  )}
                  {activeStep === 4 && (
                    <span className="text-success font-mono">19:19:02 [PRICING] Final Price = ₸1,190. Cash back points calculated: +59. SUCCESS.</span>
                  )}
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
