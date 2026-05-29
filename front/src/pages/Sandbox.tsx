import { useState } from 'react';
import { Coffee, Server, Play, Award, BarChart4 } from 'lucide-react';
import './Sandbox.css';

export function SandboxPage() {
  const [activeTab, setActiveTab] = useState<'stock' | 'loyalty' | 'profit'>('stock');

  // --- ALGORITHM 1: STOCK VALIDATION ---
  const [stockProduct, setStockProduct] = useState('cappuccino');
  const [stockQty, setStockQty] = useState(5);
  const [stockBeans, setStockBeans] = useState(15.5); // Current stock
  const [stockMilk, setStockMilk] = useState(4.5);
  const [stockCups] = useState(250);
  const [stockTrace, setStockTrace] = useState<string[]>([]);
  const [stockResult, setStockResult] = useState<'success' | 'failure' | null>(null);

  const runStockAlgorithm = () => {
    const trace: string[] = [];
    trace.push(`[SYSTEM LOG ${new Date().toLocaleTimeString()}] Инициализация алгоритма маршрутизации заказа...`);
    
    // Define recipe ingredients requirements
    let reqBeans = 0;
    let reqMilk = 0;
    let reqCups = 0;
    let prodName = '';

    if (stockProduct === 'espresso') {
      prodName = 'Эспрессо 50мл';
      reqBeans = 0.009 * stockQty;
      reqCups = 1 * stockQty;
    } else if (stockProduct === 'cappuccino') {
      prodName = 'Капучино 250мл';
      reqBeans = 0.009 * stockQty;
      reqMilk = 0.150 * stockQty;
      reqCups = 1 * stockQty;
    } else {
      prodName = 'Латте 400мл';
      reqBeans = 0.009 * stockQty;
      reqMilk = 0.250 * stockQty;
      reqCups = 1 * stockQty;
    }

    trace.push(`Шаг 1: Разбор рецептуры для ${stockQty} шт. '${prodName}':`);
    if (reqBeans > 0) trace.push(`   - Потребность Кофейных зерен: ${reqBeans.toFixed(3)} кг`);
    if (reqMilk > 0) trace.push(`   - Потребность Свежего молока: ${reqMilk.toFixed(3)} л`);
    if (reqCups > 0) trace.push(`   - Потребность Стаканов: ${reqCups} шт.`);

    trace.push(`Шаг 2: Запрос текущего наличия в реляционной БД склада...`);
    trace.push(`   - Кофейные зерна на складе: ${stockBeans.toFixed(3)} кг`);
    trace.push(`   - Свежее молоко на складе: ${stockMilk.toFixed(3)} л`);
    trace.push(`   - Стаканы на складе: ${stockCups} шт.`);

    trace.push(`Шаг 3: Сопоставление необходимых объемов сырья с фактическими...`);
    
    let isSufficient = true;
    const errors: string[] = [];

    if (stockBeans < reqBeans) {
      isSufficient = false;
      errors.push(`ДЕФИЦИТ: Кофейные зерна (Не хватает ${(reqBeans - stockBeans).toFixed(3)} кг)`);
    }
    if (stockMilk < reqMilk) {
      isSufficient = false;
      errors.push(`ДЕФИЦИТ: Свежее молоко (Не хватает ${(reqMilk - stockMilk).toFixed(3)} л)`);
    }
    if (stockCups < reqCups) {
      isSufficient = false;
      errors.push(`ДЕФИЦИТ: Стаканы (Не хватает ${reqCups - stockCups} шт.)`);
    }

    if (isSufficient) {
      trace.push(`[ALGORITHM RESULT] ПРОВЕРКА ПРОЙДЕНА. Ресурсы в наличии.`);
      trace.push(`Шаг 4: Резервирование ресурсов. Создание операции списания (Write-off)...`);
      trace.push(`   - Новые остатки: Зерна: ${(stockBeans - reqBeans).toFixed(3)}кг, Молоко: ${(stockMilk - reqMilk).toFixed(3)}л, Стаканы: ${stockCups - reqCups}шт.`);
      setStockResult('success');
    } else {
      trace.push(`[ALGORITHM RESULT] ОШИБКА ПРОВЕРКИ. Вызов исключения 'InsufficientStockException'...`);
      errors.forEach(err => trace.push(`   -> Исключение: ${err}`));
      setStockResult('failure');
    }

    setStockTrace(trace);
  };

  // --- ALGORITHM 2: LOYALTY ENGINE ---
  const [loyaltyPrice, setLoyaltyPrice] = useState(1200);
  const [loyaltyTier, setLoyaltyTier] = useState<'none' | 'bronze' | 'silver' | 'gold'>('silver');
  const [useBonuses, setUseBonuses] = useState(true);
  const [clientBonuses, setClientBonuses] = useState(450);
  const [loyaltyTrace, setLoyaltyTrace] = useState<string[]>([]);
  const [loyaltyCalc, setLoyaltyCalc] = useState<{
    discount: number;
    bonusUsed: number;
    finalPrice: number;
    earned: number;
  } | null>(null);

  const runLoyaltyAlgorithm = () => {
    const trace: string[] = [];
    trace.push(`[SYSTEM LOG ${new Date().toLocaleTimeString()}] Инициализация ценового калькулятора...`);
    trace.push(`Шаг 1: Чтение исходной суммы заказа: ${loyaltyPrice} руб.`);
    
    // Tier discount
    let tierPercent = 0;
    if (loyaltyTier === 'bronze') tierPercent = 5;
    else if (loyaltyTier === 'silver') tierPercent = 10;
    else if (loyaltyTier === 'gold') tierPercent = 15;

    const tierDiscount = (loyaltyPrice * tierPercent) / 100;
    trace.push(`Шаг 2: Расчет скидки по карте лояльности (${tierPercent}%):`);
    trace.push(`   - Скидка уровня '${loyaltyTier}': ${tierDiscount} руб.`);
    
    let discountedPrice = loyaltyPrice - tierDiscount;
    trace.push(`   - Стоимость с учетом скидки карты: ${discountedPrice} руб.`);

    // Bonus points application
    let bonusUsed = 0;
    if (useBonuses) {
      trace.push(`Шаг 3: Обработка списания бонусных баллов...`);
      trace.push(`   - Баланс бонусов гостя: ${clientBonuses} б.`);
      
      // Max bonus payment is 50% of the discounted price
      const maxBonusPayment = discountedPrice * 0.5;
      trace.push(`   - Максимальный лимит оплаты бонусами (50% стоимости): ${maxBonusPayment} руб.`);

      bonusUsed = Math.min(clientBonuses, maxBonusPayment);
      trace.push(`   - К списанию принято: ${bonusUsed} бонусов (1 бонус = 1 рубль)`);
    } else {
      trace.push(`Шаг 3: Списание бонусов не выбрано.`);
    }

    const finalPrice = discountedPrice - bonusUsed;
    const earnedBonuses = Math.floor(finalPrice * 0.05);

    trace.push(`Шаг 4: Расчет итоговой суммы к оплате и начислений...`);
    trace.push(`   - ИТОГО К ОПЛАТЕ: ${finalPrice} руб.`);
    trace.push(`   - Будет начислено бонусов (5% кэшбек): +${earnedBonuses} б.`);
    trace.push(`[ALGORITHM RESULT] Оплата сформирована успешно. Статус заказа: COMPLETED.`);

    setLoyaltyCalc({
      discount: tierDiscount,
      bonusUsed: bonusUsed,
      finalPrice: finalPrice,
      earned: earnedBonuses
    });
    setLoyaltyTrace(trace);
  };

  // --- ALGORITHM 3: PROFITABILITY CALCULATOR ---
  const [profitSales, setProfitSales] = useState(15000);
  const [profitCogsPercent, setProfitCogsPercent] = useState(30); // Raw materials cost %
  const [profitTrace, setProfitTrace] = useState<string[]>([]);
  const [profitMetrics, setProfitMetrics] = useState<{
    cogs: number;
    netProfit: number;
    rentability: number;
  } | null>(null);

  const runProfitAlgorithm = () => {
    const trace: string[] = [];
    trace.push(`[SYSTEM LOG ${new Date().toLocaleTimeString()}] Генерация аналитического отчета о рентабельности...`);
    trace.push(`Шаг 1: Агрегация сумм закрытых продаж за период: ${profitSales} руб.`);
    
    // COGS
    const cogs = (profitSales * profitCogsPercent) / 100;
    trace.push(`Шаг 2: Расчет совокупной себестоимости потраченного сырья (COGS):`);
    trace.push(`   - Формула: Сумма(Ингредиент.cost_price * Кол_во)`);
    trace.push(`   - Себестоимость сырья (${profitCogsPercent}% от продаж): ${cogs} руб.`);

    // Net profit
    const netProfit = profitSales - cogs;
    trace.push(`Шаг 3: Расчет чистой операционной маржинальной прибыли...`);
    trace.push(`   - Чистая прибыль (Выручка - Себестоимость): ${netProfit} руб.`);

    // Profitability
    const rentability = (netProfit / profitSales) * 100;
    trace.push(`Шаг 4: Вычисление индекса рентабельности продаж (Profit Margin %):`);
    trace.push(`   - Формула: (Чистая прибыль / Выручка) * 100%`);
    trace.push(`   - РЕНТАБЕЛЬНОСТЬ: ${rentability.toFixed(2)}%`);
    trace.push(`[ALGORITHM RESULT] Отчет сформирован. Рекомендация: ${rentability > 50 ? 'Бизнес-модель высокоэффективна' : 'Рекомендуется оптимизировать цены'}`);

    setProfitMetrics({
      cogs,
      netProfit,
      rentability
    });
    setProfitTrace(trace);
  };

  return (
    <div className="sandbox-container animate-fade-in">
      {/* Sandbox Header */}
      <div className="sandbox-desc-banner glass-panel">
        <Server className="banner-icon" size={32} />
        <div>
          <h3>Интерактивная песочница алгоритмов</h3>
          <p>
            Этот модуль предназначен для проверки и демонстрации логики трех ключевых алгоритмов, 
            заданных Техническим Заданием. Вы можете регулировать параметры и наблюдать за шагами трассировки алгоритмов в реальном времени.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="sandbox-tabs">
        <button 
          className={`tab-btn glass-btn ${activeTab === 'stock' ? 'active' : ''}`}
          onClick={() => setActiveTab('stock')}
        >
          <Coffee size={16} /> 1. Маршрутизация & Склад
        </button>
        <button 
          className={`tab-btn glass-btn ${activeTab === 'loyalty' ? 'active' : ''}`}
          onClick={() => setActiveTab('loyalty')}
        >
          <Award size={16} /> 2. Гибкая скидка & Лояльность
        </button>
        <button 
          className={`tab-btn glass-btn ${activeTab === 'profit' ? 'active' : ''}`}
          onClick={() => setActiveTab('profit')}
        >
          <BarChart4 size={16} /> 3. Расчет рентабельности
        </button>
      </div>

      {/* Tab Panels */}
      <div className="sandbox-panel-layout">
        
        {/* --- TAB 1: STOCK VALIDATION --- */}
        {activeTab === 'stock' && (
          <div className="sandbox-grid animate-fade-in">
            {/* Inputs */}
            <div className="sandbox-card glass-panel">
              <h4>Входные параметры заказа</h4>
              <div className="input-group-row">
                <label className="input-label">Выбор товара</label>
                <select 
                  value={stockProduct} 
                  onChange={(e) => setStockProduct(e.target.value)}
                  className="glass-input"
                >
                  <option value="espresso">Эспрессо (0.009кг зерен)</option>
                  <option value="cappuccino">Капучино (0.009кг зерен + 0.150л молока)</option>
                  <option value="latte">Латте 400мл (0.009кг зерен + 0.250л молока)</option>
                </select>
              </div>

              <div className="input-group-row">
                <label className="input-label">Количество в заказе (шт.)</label>
                <input 
                  type="number" 
                  value={stockQty} 
                  onChange={(e) => setStockQty(Math.max(1, Number(e.target.value)))}
                  className="glass-input"
                  min="1"
                />
              </div>

              <h4 className="mt-20">Текущий складской остаток сырья</h4>
              
              <div className="input-group-row">
                <label className="input-label">Зерна на складе (кг)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={stockBeans} 
                  onChange={(e) => setStockBeans(Math.max(0, Number(e.target.value)))}
                  className="glass-input"
                />
              </div>

              <div className="input-group-row">
                <label className="input-label">Молоко на складе (л)</label>
                <input 
                  type="number" 
                  step="0.1"
                  value={stockMilk} 
                  onChange={(e) => setStockMilk(Math.max(0, Number(e.target.value)))}
                  className="glass-input"
                />
              </div>

              <button className="glass-btn glass-btn-primary w-100 mt-20" onClick={runStockAlgorithm}>
                <Play size={16} /> Выполнить трассировку
              </button>
            </div>

            {/* Trace Output */}
            <div className="sandbox-card glass-panel console-panel">
              <div className="console-header">
                <span>Консоль пошагового выполнения алгоритма (Трассировка)</span>
                {stockResult && (
                  <span className={`result-pill ${stockResult}`}>
                    {stockResult === 'success' ? 'SUCCESS (Одобрено)' : 'REJECT (Отклонено)'}
                  </span>
                )}
              </div>
              <div className="console-body">
                {stockTrace.length === 0 ? (
                  <p className="placeholder-text">Нажмите "Выполнить трассировку" для просмотра шагов работы алгоритма...</p>
                ) : (
                  stockTrace.map((line, idx) => (
                    <div key={idx} className={`console-line ${line.startsWith('[ALGORITHM') ? 'highlight' : ''} ${line.includes('Исключение') ? 'text-danger' : ''}`}>
                      {line}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- TAB 2: LOYALTY ENGINE --- */}
        {activeTab === 'loyalty' && (
          <div className="sandbox-grid animate-fade-in">
            {/* Inputs */}
            <div className="sandbox-card glass-panel">
              <h4>Параметры лояльности</h4>
              
              <div className="input-group-row">
                <label className="input-label">Сумма заказа без скидки (руб.)</label>
                <input 
                  type="number" 
                  value={loyaltyPrice} 
                  onChange={(e) => setLoyaltyPrice(Math.max(0, Number(e.target.value)))}
                  className="glass-input"
                />
              </div>

              <div className="input-group-row">
                <label className="input-label">Уровень карты гостя</label>
                <select 
                  value={loyaltyTier} 
                  onChange={(e) => setLoyaltyTier(e.target.value as any)}
                  className="glass-input"
                >
                  <option value="none">Базовый (0%)</option>
                  <option value="bronze">Бронза (5% скидка)</option>
                  <option value="silver">Серебро (10% скидка)</option>
                  <option value="gold">Золото (15% скидка)</option>
                </select>
              </div>

              <div className="input-group-row mt-10">
                <label className="checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={useBonuses} 
                    onChange={(e) => setUseBonuses(e.target.checked)} 
                  />
                  <span>Использовать списание бонусов</span>
                </label>
              </div>

              {useBonuses && (
                <div className="input-group-row">
                  <label className="input-label">Доступно бонусов у гостя (б.)</label>
                  <input 
                    type="number" 
                    value={clientBonuses} 
                    onChange={(e) => setClientBonuses(Math.max(0, Number(e.target.value)))}
                    className="glass-input"
                  />
                </div>
              )}

              <button className="glass-btn glass-btn-primary w-100 mt-20" onClick={runLoyaltyAlgorithm}>
                <Play size={16} /> Расчитать стоимость
              </button>
            </div>

            {/* Trace Output */}
            <div className="sandbox-card glass-panel flex-column">
              <div className="console-header">
                <span>Математический отчет и Трассировка</span>
              </div>
              
              {/* Calc Stats */}
              {loyaltyCalc && (
                <div className="loyalty-stats-grid">
                  <div className="stat-pill">
                    <span className="pill-title">Скидка карты</span>
                    <span className="pill-val text-danger">-{loyaltyCalc.discount} руб.</span>
                  </div>
                  <div className="stat-pill">
                    <span className="pill-title">Списано бонусов</span>
                    <span className="pill-val text-danger">-{loyaltyCalc.bonusUsed} б.</span>
                  </div>
                  <div className="stat-pill">
                    <span className="pill-title">Итого к оплате</span>
                    <span className="pill-val text-success">{loyaltyCalc.finalPrice} руб.</span>
                  </div>
                  <div className="stat-pill">
                    <span className="pill-title">Кэшбек гостю</span>
                    <span className="pill-val text-primary">+{loyaltyCalc.earned} б.</span>
                  </div>
                </div>
              )}

              <div className="console-body flex-grow mt-10">
                {loyaltyTrace.length === 0 ? (
                  <p className="placeholder-text">Запустите расчет для трассировки формул стоимости...</p>
                ) : (
                  loyaltyTrace.map((line, idx) => (
                    <div key={idx} className="console-line">
                      {line}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- TAB 3: PROFITABILITY CALCULATOR --- */}
        {activeTab === 'profit' && (
          <div className="sandbox-grid animate-fade-in">
            {/* Inputs */}
            <div className="sandbox-card glass-panel">
              <h4>Параметры аналитического среза</h4>
              
              <div className="input-group-row">
                <label className="input-label">Общая выручка за период (руб.)</label>
                <input 
                  type="number" 
                  value={profitSales} 
                  onChange={(e) => setProfitSales(Math.max(0, Number(e.target.value)))}
                  className="glass-input"
                />
              </div>

              <div className="input-group-row">
                <label className="input-label">Средняя себестоимость ингредиентов (%)</label>
                <input 
                  type="number" 
                  value={profitCogsPercent} 
                  onChange={(e) => setProfitCogsPercent(Math.max(0, Math.min(100, Number(e.target.value))))}
                  className="glass-input"
                  min="0"
                  max="100"
                />
              </div>

              <button className="glass-btn glass-btn-primary w-100 mt-20" onClick={runProfitAlgorithm}>
                <Play size={16} /> Сгенерировать метрики
              </button>
            </div>

            {/* Trace Output */}
            <div className="sandbox-card glass-panel flex-column">
              <div className="console-header">
                <span>Аналитическая выработка</span>
              </div>
              
              {/* Metrics Stats */}
              {profitMetrics && (
                <div className="loyalty-stats-grid">
                  <div className="stat-pill">
                    <span className="pill-title">Себестоимость (COGS)</span>
                    <span className="pill-val text-danger">{profitMetrics.cogs} руб.</span>
                  </div>
                  <div className="stat-pill">
                    <span className="pill-title">Чистая прибыль</span>
                    <span className="pill-val text-success">{profitMetrics.netProfit} руб.</span>
                  </div>
                  <div className="stat-pill">
                    <span className="pill-title">Рентабельность</span>
                    <span className="pill-val text-primary">{profitMetrics.rentability.toFixed(2)}%</span>
                  </div>
                </div>
              )}

              <div className="console-body flex-grow mt-10">
                {profitTrace.length === 0 ? (
                  <p className="placeholder-text">Нажмите "Сгенерировать метрики" для трассировки формул прибыльности...</p>
                ) : (
                  profitTrace.map((line, idx) => (
                    <div key={idx} className="console-line">
                      {line}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
