import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Bell, Settings, User, LogOut, CheckCircle, AlertTriangle, Sun, Moon } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { fetchInventory } from '../api/client';
import type { InventoryItem } from '../types';
import './Header.css';

export function Header() {
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [criticalItems, setCriticalItems] = useState<InventoryItem[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (!user) return;
    const loadStockAlerts = async () => {
      try {
        const items = await fetchInventory();
        const low = items.filter(item => item.is_critical);
        setCriticalItems(low);
      } catch (err) {
        console.error('Failed to load stock alerts in header:', err);
      }
    };

    loadStockAlerts();
    // Poll every 30 seconds for live stock alerts
    const interval = setInterval(loadStockAlerts, 30000);
    return () => clearInterval(interval);
  }, [user, location.pathname]);

  const displayNameToShow = user?.username === 'manager' || user?.role === 'manager'
    ? t('sidebar.elena')
    : (user?.displayName || user?.username || '');

  const getPageMeta = () => {
    switch (location.pathname) {
      case '/':
        return {
          title: language === 'ru' 
            ? 'Главная панель' 
            : language === 'kk' 
            ? 'Басты панель' 
            : 'System Dashboard',
          subtitle: language === 'ru' 
            ? `Добро пожаловать в ИС кофейни, ${displayNameToShow}!` 
            : language === 'kk' 
            ? `Кофехана АЖ-не қош келдіңіз, ${displayNameToShow}!` 
            : `Welcome to Coffee Shop IS, ${displayNameToShow}!`
        };
      case '/pos':
        return {
          title: language === 'ru' 
            ? 'Кассовый терминал POS' 
            : language === 'kk' 
            ? 'POS кассалық терминалы' 
            : 'POS Checkout Terminal',
          subtitle: language === 'ru' 
            ? 'Оформление быстрых заказов кофейни и применение скидок' 
            : language === 'kk' 
            ? 'Кофехананың жылдам тапсырыстарын ресімдеу және жеңілдіктерді қолдану' 
            : 'Quick checkout processing and guest loyalty discount management'
        };
      case '/crm':
        return {
          title: language === 'ru' 
            ? 'Управление клиентами CRM' 
            : language === 'kk' 
            ? 'CRM клиенттерді басқару' 
            : 'CRM Guest Directory',
          subtitle: language === 'ru' 
            ? 'База гостей кофейни, баланс бонусов и история взаимодействий' 
            : language === 'kk' 
            ? 'Қонақтар базасы, бонустар балансы және өзара әрекеттесу тарихы' 
            : 'Active guest database, loyalty bonuses, and communication logs'
        };
      case '/warehouse':
        return {
          title: language === 'ru' 
            ? 'Складской учет ингредиентов' 
            : language === 'kk' 
            ? 'Ингредиенттер қоймасының есебі' 
            : 'Warehouse Stock Control',
          subtitle: language === 'ru' 
            ? 'Контроль остатков, оприходование новых поставок и списания' 
            : language === 'kk' 
            ? 'Қалдықтарды бақылау, жаңа кірістерді тіркеу және есептен шығару' 
            : 'Raw material levels tracker, stock receipts, and waste write-offs'
        };
      case '/analytics':
        return {
          title: language === 'ru' 
            ? 'Аналитическая панель' 
            : language === 'kk' 
            ? 'Аналитикалық панель' 
            : 'Analytics & Reports',
          subtitle: language === 'ru' 
            ? 'Финансовые метрики, расчет себестоимости и отчетность о рентабельности' 
            : language === 'kk' 
            ? 'Қаржылық көрсеткіштер, өзіндік құнды есептеу және рентабельділік есебі' 
            : 'Financial charts, menu cost analysis (COGS), and profit margin reporting'
        };
      case '/sandbox':
        return {
          title: language === 'ru' 
            ? 'Песочница алгоритмов' 
            : language === 'kk' 
            ? 'Сынақ алгоритмдері' 
            : 'Algorithm Sandboxing Flowcharts',
          subtitle: language === 'ru' 
            ? 'Интерактивная визуализация бизнес-логики и математики расчетов' 
            : language === 'kk' 
            ? 'Бизнес-логиканы және есептеулер математикасын интерактивті визуализациялау' 
            : 'Interactive step-by-step logic checking and calculation traces'
        };
      case '/settings':
        return {
          title: language === 'ru' 
            ? 'Настройки профиля' 
            : language === 'kk' 
            ? 'Профиль параметрлері' 
            : 'User Account Profile',
          subtitle: language === 'ru' 
            ? 'Редактирование личных данных и параметров авторизации' 
            : language === 'kk' 
            ? 'Жеке деректерді және авторизация параметрлерін өңдеу' 
            : 'Manage personal credentials and active configuration parameters'
        };
      default:
        return {
          title: language === 'ru' 
            ? 'Информационная система' 
            : language === 'kk' 
            ? 'Ақпараттық жүйе' 
            : 'Information System',
          subtitle: language === 'ru' 
            ? 'Кофейня «Встреча» — Автоматизация процессов' 
            : language === 'kk' 
            ? '«Встреча» кофеханасы — Процестерді автоматтандыру' 
            : 'Vstrecha Coffee Shop — Core business automation'
        };
    }
  };

  const { title, subtitle } = getPageMeta();

  return (
    <header className="header glass-panel">
      <div className="header-left">
        <h1 className="page-title">{title}</h1>
        <p className="header-subtitle">{subtitle}</p>
      </div>

      <div className="header-right">
        {/* Theme Toggle */}
        <button
          className="header-btn theme-toggle-btn"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          type="button"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Language Selection Buttons */}
        <div className="language-selector glass-panel">
          <button 
            onClick={() => setLanguage('ru')} 
            className={`lang-btn ${language === 'ru' ? 'active' : ''}`}
            title="Русский"
          >
            РУС
          </button>
          <button 
            onClick={() => setLanguage('kk')} 
            className={`lang-btn ${language === 'kk' ? 'active' : ''}`}
            title="Қазақша"
          >
            ҚАЗ
          </button>
          <button 
            onClick={() => setLanguage('en')} 
            className={`lang-btn ${language === 'en' ? 'active' : ''}`}
            title="English"
          >
            ENG
          </button>
        </div>

        {/* Real-time stock notification bell */}
        <div className="notification-wrapper">
          <button 
            className={`header-btn notifications ${criticalItems.length > 0 ? 'has-alerts' : ''}`}
            type="button" 
            title={t('header.notifications')}
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell size={20} />
            {criticalItems.length > 0 && (
              <span className="badge danger">{criticalItems.length}</span>
            )}
          </button>

          {showNotifications && (
            <div className="notifications-dropdown glass-panel">
              <h4 className="dropdown-title">{t('header.notifications')}</h4>
              <div className="notifications-list">
                {criticalItems.length === 0 ? (
                  <div className="notif-item success-notif">
                    <CheckCircle size={16} className="notif-icon-success" />
                    <span>{t('header.noAlerts')}</span>
                  </div>
                ) : (
                  criticalItems.map(item => (
                    <div key={item.id} className="notif-item error-notif" onClick={() => { navigate('/warehouse'); setShowNotifications(false); }}>
                      <AlertTriangle size={16} className="notif-icon-danger" />
                      <div>
                        <strong className="notif-label">{item.name}</strong>
                        <span className="notif-desc">
                          {language === 'ru' 
                            ? `Остаток: ${item.quantity} ${item.unit} (Мин: ${item.min_threshold})`
                            : language === 'kk'
                            ? `Қалдық: ${item.quantity} ${item.unit} (Минимум: ${item.min_threshold})`
                            : `Balance: ${item.quantity} ${item.unit} (Min: ${item.min_threshold})`}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <button className="view-all-notif-btn" onClick={() => { navigate('/warehouse'); setShowNotifications(false); }}>
                {t('header.openWarehouse')}
              </button>
            </div>
          )}
        </div>

        <Link className="header-btn settings" to="/settings" title={t('header.myProfile')}>
          <Settings size={20} />
        </Link>

        <div className="user-menu">
          <Link className="user-btn" to="/settings">
            <div className="avatar-placeholder">
              <User size={18} />
            </div>
            <span className="user-display-name">{displayNameToShow}</span>
          </Link>
          <div className="dropdown-menu glass-panel">
            <Link to="/settings">{t('header.myProfile')}</Link>
            <Link to="/sandbox">{t('sidebar.sandbox')}</Link>
            <hr className="menu-divider" />
            <button
              type="button"
              className="dropdown-action text-danger"
              onClick={() => {
                logout();
                navigate('/login', { replace: true });
              }}
            >
              <LogOut size={16} />
              {t('header.logout')}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
