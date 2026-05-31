import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { Coffee, ShoppingBag, Users, Boxes, BarChart3, Settings, LogOut, Calculator, UserCheck, Sun, Moon } from 'lucide-react';
import './Sidebar.css';

export function Sidebar() {
  const { user, logout, updateProfile } = useAuth();
  const { t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleRoleChange = async (newRole: 'admin' | 'manager' | 'director') => {
    if (!user) return;
    try {
      await updateProfile({
        username: user.username,
        role: newRole,
      });
    } catch (err) {
      console.error('Failed to switch role:', err);
    }
  };

  const navItems = [
    { icon: Coffee, labelKey: 'sidebar.desktop', path: '/', roles: ['admin', 'manager', 'director'] },
    { icon: ShoppingBag, labelKey: 'sidebar.pos', path: '/pos', roles: ['manager', 'admin', 'director'] },
    { icon: Users, labelKey: 'sidebar.crm', path: '/crm', roles: ['manager', 'director'] },
    { icon: Boxes, labelKey: 'sidebar.warehouse', path: '/warehouse', roles: ['admin', 'director'] },
    { icon: BarChart3, labelKey: 'sidebar.analytics', path: '/analytics', roles: ['director', 'admin'] },
    { icon: Calculator, labelKey: 'sidebar.sandbox', path: '/sandbox', roles: ['admin', 'manager', 'director'] },
    { icon: Settings, labelKey: 'sidebar.profile', path: '/settings', roles: ['admin', 'manager', 'director'] },
  ];

  // Dynamically resolve display name and role badge
  const displayName = user?.username === 'manager' || user?.role === 'manager'
    ? t('sidebar.elena') 
    : (user?.displayName || user?.username || '');

  // Show only first 5 items in bottom nav to avoid overflow
  const bottomNavItems = navItems.slice(0, 5);

  return (
    <>
      {/* ── Desktop / Tablet Sidebar ── */}
      <aside className="sidebar glass-panel">
        <div className="sidebar-header">
          <div className="logo" onClick={() => navigate('/')}>
            <span className="logo-icon"><Coffee size={28} className="logo-svg" /></span>
            <div className="logo-meta">
              <span className="logo-text">{t('sidebar.title')}</span>
              <span className="logo-subtext">{t('sidebar.subtitle')}</span>
            </div>
          </div>
        </div>

        {user && (
          <div className="active-role-panel">
            <div className="role-header">
              <UserCheck size={14} className="role-icon" />
              <span>{t('sidebar.activeRole')}</span>
            </div>
            <div className="role-selector-container">
              <select
                value={user.role}
                onChange={(e) => handleRoleChange(e.target.value as any)}
                className="role-select-box"
              >
                <option value="manager">{t('sidebar.roleManager')}</option>
                <option value="admin">{t('sidebar.roleAdmin')}</option>
                <option value="director">{t('sidebar.roleDirector')}</option>
              </select>
            </div>
          </div>
        )}

        <nav className="sidebar-nav">
          {navItems.map(({ icon: Icon, labelKey, path, roles }) => {
            const isAllowed = user && roles.includes(user.role);
            return (
              <NavLink
                key={path}
                to={path}
                end={path === '/'}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''} ${!isAllowed ? 'role-restricted' : ''}`}
              >
                <Icon size={20} className="nav-icon" />
                <span className="nav-label">{t(labelKey)}</span>
                {!isAllowed && (
                  <span className="restricted-badge">
                    {roles[0].substring(0, 3).toUpperCase()}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          {user && (
            <div className="user-details-card">
              <div className="user-meta">
                <span className="user-name">{displayName}</span>
                <span className="user-role-badge">{user.role.toUpperCase()}</span>
              </div>
              <button className="logout-btn" onClick={logout} title={t('header.logout')}>
                <LogOut size={18} />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ── Mobile Bottom Navigation Bar ── */}
      <nav className="bottom-nav">
        {bottomNavItems.map(({ icon: Icon, labelKey, path, roles }) => {
          const isAllowed = user && roles.includes(user.role);
          return (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              className={({ isActive }) =>
                `bottom-nav-item ${isActive ? 'active' : ''} ${!isAllowed ? 'role-restricted' : ''}`
              }
            >
              <Icon size={22} className="bottom-nav-icon" />
              <span className="bottom-nav-label">{t(labelKey)}</span>
            </NavLink>
          );
        })}
        {/* Theme toggle for mobile */}
        <button
          className="bottom-nav-item bottom-nav-theme-btn"
          onClick={toggleTheme}
          type="button"
          title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
        >
          {theme === 'dark' ? <Sun size={22} className="bottom-nav-icon" /> : <Moon size={22} className="bottom-nav-icon" />}
          <span className="bottom-nav-label">{theme === 'dark' ? 'Light' : 'Dark'}</span>
        </button>
      </nav>
    </>
  );
}
