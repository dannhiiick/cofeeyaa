import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { User, Shield, Clipboard, Check, Save } from 'lucide-react';
import './Settings.css';

export function SettingsPage() {
  const { user, updateProfile } = useAuth();
  
  // Profile form states
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [city, setCity] = useState(user?.city || '');
  const [role, setRole] = useState(user?.role || 'manager');
  const [bio, setBio] = useState(user?.bio || '');
  
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Copy helper for demo logins
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setStatus(null);
    setError(null);

    try {
      await updateProfile({
        username: user.username,
        display_name: displayName,
        city: city,
        role: role,
        bio: bio,
      });
      setStatus('Данные вашего профиля успешно обновлены!');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="settings-container animate-fade-in">
      <div className="settings-split">
        {/* Profile Editing Form */}
        <div className="settings-form-panel glass-panel">
          <div className="settings-card-header">
            <User size={24} className="header-icon" />
            <div>
              <h3>Редактирование профиля</h3>
              <p>Управление вашими личными данными и системной ролью.</p>
            </div>
          </div>

          <form onSubmit={onSubmit} className="profile-form">
            <div className="form-grid">
              <label className="form-field">
                <span className="form-label">Имя пользователя (Логин)</span>
                <input 
                  type="text" 
                  value={user?.username} 
                  disabled 
                  className="glass-input disabled-input" 
                />
                <span className="field-note">Логин учетной записи изменить нельзя</span>
              </label>

              <label className="form-field">
                <span className="form-label">Отображаемое ФИО</span>
                <input 
                  type="text" 
                  value={displayName} 
                  onChange={(e) => setDisplayName(e.target.value)} 
                  className="glass-input" 
                  placeholder="Введите ваше имя"
                  required
                />
              </label>

              <label className="form-field">
                <span className="form-label">Город</span>
                <input 
                  type="text" 
                  value={city} 
                  onChange={(e) => setCity(e.target.value)} 
                  className="glass-input" 
                  placeholder="Алматы"
                />
              </label>

              <label className="form-field">
                <span className="form-label">Назначенная роль</span>
                <select 
                  value={role} 
                  onChange={(e) => setRole(e.target.value as any)} 
                  className="glass-input"
                >
                  <option value="manager">Менеджер (CRM & POS Терминал)</option>
                  <option value="admin">Администратор (Склад сырья и учет)</option>
                  <option value="director">Руководитель (Аналитика, отчеты рентабельности)</option>
                </select>
              </label>

              <label className="form-field full-width">
                <span className="form-label">Краткая биография</span>
                <textarea 
                  value={bio} 
                  onChange={(e) => setBio(e.target.value)} 
                  className="glass-input textarea-input" 
                  placeholder="Расскажите о своей роли в кофейне..."
                  rows={3}
                />
              </label>
            </div>

            {status && <div className="settings-success-alert">{status}</div>}
            {error && <div className="settings-error-alert">{error}</div>}

            <button type="submit" className="glass-btn glass-btn-primary save-profile-btn" disabled={saving}>
              <Save size={16} />
              {saving ? 'Сохранение изменений...' : 'Сохранить профиль'}
            </button>
          </form>
        </div>

        {/* Demo Accounts Panel */}
        <div className="demo-accounts-panel glass-panel">
          <div className="settings-card-header">
            <Shield size={24} className="header-icon text-accent" />
            <div>
              <h3>Демо-аккаунты для тестирования</h3>
              <p>Вы можете переключать роли в левой панели, либо войти под специальными пользователями:</p>
            </div>
          </div>

          <div className="demo-accounts-list">
            <div className="demo-account-item">
              <div className="demo-meta">
                <strong className="demo-role font-director">Руководитель (Director)</strong>
                <span className="demo-username">Логин: <code>director</code></span>
                <span className="demo-password">Пароль: <code>director123</code></span>
              </div>
              <button 
                className="copy-btn" 
                onClick={() => handleCopy('director', 'dir-u')}
                title="Скопировать логин"
              >
                {copied === 'dir-u' ? <Check size={16} className="text-success" /> : <Clipboard size={16} />}
              </button>
            </div>

            <div className="demo-account-item">
              <div className="demo-meta">
                <strong className="demo-role font-admin">Администратор (Admin)</strong>
                <span className="demo-username">Логин: <code>admin</code></span>
                <span className="demo-password">Пароль: <code>admin123</code></span>
              </div>
              <button 
                className="copy-btn" 
                onClick={() => handleCopy('admin', 'adm-u')}
                title="Скопировать логин"
              >
                {copied === 'adm-u' ? <Check size={16} className="text-success" /> : <Clipboard size={16} />}
              </button>
            </div>

            <div className="demo-account-item">
              <div className="demo-meta">
                <strong className="demo-role font-manager">Менеджер (Manager)</strong>
                <span className="demo-username">Логин: <code>manager</code></span>
                <span className="demo-password">Пароль: <code>manager123</code></span>
              </div>
              <button 
                className="copy-btn" 
                onClick={() => handleCopy('manager', 'mng-u')}
                title="Скопировать логин"
              >
                {copied === 'mng-u' ? <Check size={16} className="text-success" /> : <Clipboard size={16} />}
              </button>
            </div>
          </div>
          
          <div className="demo-notes">
            <h5>Примечание по RBAC</h5>
            <p>
              Система автоматически блокирует вкладки и возможности, непредусмотренные ролью сотрудника, защищая коммерческие данные предприятия.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
