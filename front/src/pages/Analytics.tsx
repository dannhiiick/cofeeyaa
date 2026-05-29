/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useState } from 'react';
import { fetchAnalytics } from '../api/client';
import type { AnalyticsResponse } from '../types';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  Search, 
  AlertTriangle,
  Award,
  BookOpen
} from 'lucide-react';
import './Analytics.css';

export function AnalyticsPage() {
  const [period, setPeriod] = useState('30');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Analytics response state
  const [stats, setStats] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = useCallback(async (
    nextPeriod: string,
    nextStartDate?: string,
    nextEndDate?: string
  ) => {
    setLoading(true);
    setError(null);
    try {
      const s = nextPeriod === 'custom'
        ? await fetchAnalytics('custom', nextStartDate, nextEndDate)
        : await fetchAnalytics(nextPeriod);
      setStats(s);
    } catch (err) {
      console.error(err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (period !== 'custom') {
      loadAnalytics(period);
    }
  }, [loadAnalytics, period]);

  const handleCustomSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) return;
    setPeriod('custom');
    loadAnalytics('custom', startDate, endDate);
  };

  if (loading && !stats) {
    return (
      <div className="analytics-loading animate-fade-in">
        <div className="coffee-loader">
          <BarChart3 size={40} className="steaming-cup" />
          <span>Генерация финансовой отчетности...</span>
        </div>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="analytics-container animate-fade-in">
        <div className="settings-error-alert">{error}</div>
      </div>
    );
  }

  // Find max value in trend for scaling CSS chart bars
  const salesTrend = stats?.sales_trend ?? [];
  const maxTrendVal = salesTrend.length > 0
    ? Math.max(...salesTrend.map((s) => Number(s.revenue)), 100)
    : 100;

  return (
    <div className="analytics-container animate-fade-in">
      
      {/* Date period controls bar */}
      <div className="analytics-controls-bar glass-panel">
        <div className="segmented-controls">
          <button 
            className={`control-btn ${period === 'today' ? 'active' : ''}`}
            onClick={() => setPeriod('today')}
          >
            Сегодня
          </button>
          <button 
            className={`control-btn ${period === '7' ? 'active' : ''}`}
            onClick={() => setPeriod('7')}
          >
            7 дней
          </button>
          <button 
            className={`control-btn ${period === '30' ? 'active' : ''}`}
            onClick={() => setPeriod('30')}
          >
            30 дней
          </button>
        </div>

        <form onSubmit={handleCustomSearch} className="custom-date-form">
          <div className="date-inputs">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="glass-input date-field"
              required
            />
            <span className="date-arrow">→</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="glass-input date-field"
              required
            />
          </div>
          <button type="submit" className="glass-btn select-period-btn">
            <Search size={14} /> Отчет
          </button>
        </form>
      </div>

      {stats && (
        <>
          {error && <div className="settings-error-alert">{error}</div>}

          {/* Profitability KPI summary blocks */}
          <div className="dashboard-grid-4">
            <div className="stat-card glass-panel">
              <div className="stat-card-header">
                <DollarSign size={24} className="stat-icon primary" />
                <span className="stat-title">Общая выручка</span>
              </div>
              <div className="stat-value">₸{Number(stats.metrics.revenue).toLocaleString('ru-KZ')}</div>
              <p className="stat-desc">За интервал: {stats.period.start} - {stats.period.end}</p>
            </div>

            <div className="stat-card glass-panel">
              <div className="stat-card-header">
                <BookOpen size={24} className="stat-icon danger" />
                <span className="stat-title">Себестоимость сырья</span>
              </div>
              <div className="stat-value text-danger">₸{Number(stats.metrics.cogs).toLocaleString('ru-KZ', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
              <p className="stat-desc">Затрачено кофейных зерен, молока и др.</p>
            </div>

            <div className="stat-card glass-panel">
              <div className="stat-card-header">
                <TrendingUp size={24} className="stat-icon accent" />
                <span className="stat-title">Операционная прибыль</span>
              </div>
              <div className="stat-value text-success">₸{Number(stats.metrics.net_profit).toLocaleString('ru-KZ', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
              <p className="stat-desc">Выручка за вычетом сырьевого списания</p>
            </div>

            <div className="stat-card glass-panel">
              <div className="stat-card-header">
                <Award size={24} className="stat-icon info" />
                <span className="stat-title">Рентабельность продаж</span>
              </div>
              <div className="stat-value">{stats.metrics.profitability}%</div>
              <p className="stat-desc">Маржинальный коэффициент эффективности</p>
            </div>
          </div>

          <div className="analytics-split">
            {/* Visual pure CSS trend chart */}
            <div className="analytics-split-left glass-panel">
              <div className="split-header">
                <h3>Хронологический тренд выручки</h3>
                <span className="analytics-pill">Выручка по дням</span>
              </div>

              <div className="pure-css-chart-container mt-20">
                {stats.sales_trend.length === 0 ? (
                  <p className="placeholder-text">Данные тренда недоступны за выбранный день.</p>
                ) : (
                  <div className="chart-bar-layout">
                    {stats.sales_trend.map((s) => {
                      const hPercent = (Number(s.revenue) / maxTrendVal) * 85; // Max 85% height
                      return (
                        <div key={s.date} className="chart-bar-wrapper">
                          <div className="bar-hover-val">₸{Number(s.revenue).toLocaleString('ru-KZ')}</div>
                          <div className="chart-bar-track">
                            <div 
                              className="chart-bar-fill" 
                              style={{ height: `${Math.max(4, hPercent)}%` }}
                            ></div>
                          </div>
                          <span className="chart-bar-label">{s.date}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Top Items Table & warehouse alarm side list */}
            <div className="analytics-split-right flex-column gap-20">
              {/* Popular list */}
              <div className="split-card glass-panel flex-grow">
                <div className="split-header">
                  <h3>Популярные блюда и напитки</h3>
                  <ShoppingBag size={18} className="text-primary" />
                </div>

                <div className="top-products-scroll mt-10">
                  {stats.top_products.length === 0 ? (
                    <div className="empty-state">Продажи отсутствуют за период.</div>
                  ) : (
                    <table className="analytics-table">
                      <thead>
                        <tr>
                          <th>Наименование</th>
                          <th>Кол-во</th>
                          <th>Сумма</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.top_products.map((p) => (
                          <tr key={p.name}>
                            <td><strong>{p.name}</strong></td>
                            <td>{p.quantity} шт.</td>
                            <td><span className="text-primary">₸{Number(p.revenue).toLocaleString('ru-KZ')}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* Critical items alert */}
              {stats.critical_items.length > 0 && (
                <div className="split-card glass-panel critical-stock-card animate-pulse">
                  <div className="split-header">
                    <h3 className="text-danger">Внимание: Дефицит сырья</h3>
                    <AlertTriangle size={18} className="text-danger" />
                  </div>
                  <p className="mt-5">Ингредиенты ниже критического лимита:</p>
                  <div className="critical-list mt-10">
                    {stats.critical_items.map((item) => (
                      <div key={item.id} className="critical-list-row">
                        <span>{item.name}</span>
                        <strong className="text-danger">{item.quantity} {item.unit}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

    </div>
  );
}
