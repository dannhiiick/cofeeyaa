import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Coffee } from 'lucide-react';
import '../styles/AuthLayout.css';

export function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || '/';

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login({ username, password });
      navigate(from, { replace: true });
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
          <h2 className="auth-title">Кофейня «Встреча»</h2>
          <div className="auth-subtitle">Вход в Информационную Систему</div>
        </div>

        <form className="auth-form" onSubmit={onSubmit}>
          <label className="auth-field">
            <span className="auth-label">Логин (Username)</span>
            <input
              className="auth-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Введите логин (например, manager)"
              required
            />
          </label>

          <label className="auth-field">
            <span className="auth-label">Пароль (Password)</span>
            <input
              className="auth-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Введите пароль (например, manager123)"
              type="password"
              required
            />
          </label>

          <div className="auth-actions">
            <button className="auth-primary-btn" type="submit" disabled={submitting}>
              {submitting ? 'Выполняется вход...' : 'Войти в систему'}
            </button>
            {error ? <div className="auth-error">{error}</div> : null}
          </div>
        </form>

        <div className="auth-footer">
          Нет учетной записи?{' '}
          <Link to="/register">
            Создать аккаунт
          </Link>
        </div>
      </div>
    </div>
  );
}
