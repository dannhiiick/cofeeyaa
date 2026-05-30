import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { onServerWakeup } from '../api/client';

function WakeupScreen({ attempt, total }: { attempt: number; total: number }) {
  const dots = [1, 2, 3].map(i => (
    <span
      key={i}
      style={{
        display: 'inline-block',
        width: 10,
        height: 10,
        borderRadius: '50%',
        background: attempt >= i ? '#c8a96e' : '#3a2a1a',
        margin: '0 4px',
        transition: 'background 0.4s',
      }}
    />
  ));

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1a0f07 0%, #2c1810 50%, #1a0f07 100%)',
      gap: 24,
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      {/* Coffee cup icon */}
      <div style={{ fontSize: 56 }}>☕</div>

      {/* Spinner */}
      <div style={{
        width: 48,
        height: 48,
        border: '4px solid #3a2a1a',
        borderTop: '4px solid #c8a96e',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
      }} />

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ color: '#c8a96e', fontSize: 18, fontWeight: 600 }}>
        Сервер просыпается...
      </div>

      <div style={{ color: '#8a7060', fontSize: 14, textAlign: 'center', maxWidth: 280 }}>
        Бесплатный хостинг засыпает после простоя.
        <br />Это займёт до минуты, пожалуйста, подождите.
      </div>

      {/* Retry dots */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ color: '#5a4a3a', fontSize: 13, marginRight: 8 }}>
          Попытка {attempt} из {total}
        </span>
        {dots}
      </div>
    </div>
  );
}

export function ProtectedRoute() {
  const { loading, isAuthenticated } = useAuth();
  const location = useLocation();
  const [wakeup, setWakeup] = useState<{ attempt: number; total: number } | null>(null);

  useEffect(() => {
    const unsub = onServerWakeup((attempt, total) => {
      setWakeup({ attempt, total });
    });
    return () => { unsub(); };
  }, []);

  if (loading) {
    if (wakeup) {
      return <WakeupScreen attempt={wakeup.attempt} total={wakeup.total} />;
    }
    return (
      <div className="app-loading">
        <div>Загрузка аккаунта...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
