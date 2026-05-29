import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Coffee } from 'lucide-react';
import '../styles/AuthLayout.css';

export function RegisterPage() {
  const { register, isAuthenticated } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'manager' | 'admin' | 'director'>('manager');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register({
        username,
        email: email || undefined,
        password,
        role, // Send the selected role
      });
      navigate('/');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <Coffee size={48} className="auth-logo-svg" />
          <h2 className="auth-title">Создание аккаунта</h2>
          <div className="auth-subtitle">Быстрая регистрация в системе кофейни</div>
        </div>

        <form className="auth-form" onSubmit={onSubmit}>
          <label className="auth-field">
            <span className="auth-label">Логин (Username)</span>
            <input
              className="auth-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Создайте логин"
              required
            />
          </label>

          <label className="auth-field">
            <span className="auth-label">E-mail адрес</span>
            <input
              className="auth-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@vstrecha.ru"
              type="email"
            />
          </label>

          <label className="auth-field">
            <span className="auth-label">Пароль</span>
            <input
              className="auth-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Придумайте пароль"
              type="password"
              required
            />
          </label>

          <label className="auth-field">
            <span className="auth-label">Назначение роли</span>
            <select
              className="auth-select"
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
            >
              <option value="manager">Менеджер (Оформление заказов, CRM)</option>
              <option value="admin">Администратор (Склад сырья, ингредиенты)</option>
              <option value="director">Руководитель (Отчеты рентабельности, выручка)</option>
            </select>
          </label>

          <div className="auth-actions">
            <button className="auth-primary-btn" type="submit" disabled={submitting}>
              {submitting ? 'Создание профиля...' : 'Зарегистрироваться'}
            </button>
            {error ? <div className="auth-error">{error}</div> : null}
          </div>
        </form>

        <div className="auth-footer">
          Уже зарегистрированы?{' '}
          <Link to="/login">
            Войти в систему
          </Link>
        </div>
      </div>
    </div>
  );
}
