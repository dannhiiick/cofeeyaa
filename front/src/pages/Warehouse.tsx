import { useEffect, useState } from 'react';
import { 
  fetchInventory, 
  fetchStockOperations, 
  createStockOperation 
} from '../api/client';
import type { InventoryItem, StockOperation } from '../types';
import { 
  AlertTriangle, 
  History, 
  Save
} from 'lucide-react';
import './Warehouse.css';

export function WarehousePage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [operations, setOperations] = useState<StockOperation[]>([]);
  
  // Form states
  const [selectedItem, setSelectedItem] = useState<number | ''>('');
  const [opType, setOpType] = useState<'inflow' | 'write_off'>('inflow');
  const [qty, setQty] = useState('');
  const [reason, setReason] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    loadWarehouseData();
  }, []);

  const loadWarehouseData = async () => {
    try {
      const stock = await fetchInventory();
      setItems(stock);
      const ops = await fetchStockOperations();
      setOperations(ops);
      if (stock.length > 0) {
        setSelectedItem(stock[0].id);
      }
    } catch (err) {
      console.error('Failed to load warehouse data:', err);
    }
  };

  const handleSubmitOperation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || !qty) return;

    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await createStockOperation({
        item: Number(selectedItem),
        type: opType,
        quantity: Number(qty),
        reason: reason
      });

      setSuccessMsg('Операция по складу успешно проведена!');
      setQty('');
      setReason('');
      await loadWarehouseData();
    } catch (err) {
      setErrorMsg((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="warehouse-container animate-fade-in">
      <div className="warehouse-split">
        {/* Inventory Levels left side */}
        <div className="inventory-levels-panel glass-panel">
          <div className="panel-title-bar flex-row-between">
            <div>
              <h3>Остатки сырья на складе</h3>
              <p>Учет сырьевых ингредиентов и контроль критических объемов</p>
            </div>
            {items.some(item => item.is_critical) && (
              <span className="stock-alarm-pill animate-pulse">
                <AlertTriangle size={12} /> Обнаружен дефицит
              </span>
            )}
          </div>

          <div className="ingredients-bars-scroll mt-15">
            {items.length === 0 ? (
              <div className="empty-state">Нет данных о складе.</div>
            ) : (
              items.map(item => {
                const current = Number(item.quantity);
                const min = Number(item.min_threshold);
                
                // Visual percentage calculations (scaled for neat presentation)
                const maxCapacityMock = min * 3;
                const percentage = Math.min(100, Math.max(5, (current / maxCapacityMock) * 100));

                return (
                  <div key={item.id} className={`ingredient-bar-card ${item.is_critical ? 'critical-alarm' : ''}`}>
                    <div className="bar-meta-label">
                      <div className="bar-left-meta">
                        <strong className="ing-name-lbl">{item.name}</strong>
                        {item.is_critical && <span className="critical-tag">Дефицит</span>}
                      </div>
                      <span className="ing-qty-val">
                        {item.quantity} {item.unit} / <small>мин: {item.min_threshold} {item.unit}</small>
                      </span>
                    </div>

                    {/* Progress Bar capacities */}
                    <div className="capacity-bar-track">
                      <div 
                        className={`capacity-bar-fill ${item.is_critical ? 'bg-danger' : 'bg-primary'}`} 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Adjustments Form right side */}
        <div className="adjustments-panel glass-panel">
          <div className="panel-title-bar">
            <h3>Складские операции</h3>
            <p>Проведение прихода или ручного списания остатков сырья</p>
          </div>

          <form onSubmit={handleSubmitOperation} className="adjustment-form mt-15">
            <label className="form-field">
              <span className="form-label">Выбор сырья</span>
              <select
                value={selectedItem}
                onChange={(e) => setSelectedItem(Number(e.target.value))}
                className="glass-input"
                required
              >
                {items.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.quantity} {item.unit})
                  </option>
                ))}
              </select>
            </label>

            <div className="radio-selection-row">
              <label className={`radio-pill-btn ${opType === 'inflow' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="opType"
                  value="inflow"
                  checked={opType === 'inflow'}
                  onChange={() => setOpType('inflow')}
                />
                <span>Оприходование (Приход)</span>
              </label>

              <label className={`radio-pill-btn ${opType === 'write_off' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="opType"
                  value="write_off"
                  checked={opType === 'write_off'}
                  onChange={() => setOpType('write_off')}
                />
                <span>Списание сырья (Расход)</span>
              </label>
            </div>

            <label className="form-field">
              <span className="form-label">Количество корректировки</span>
              <input
                type="number"
                step="0.001"
                placeholder="0.000"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                className="glass-input"
                required
              />
            </label>

            <label className="form-field">
              <span className="form-label">Причина / Комментарий</span>
              <input
                type="text"
                placeholder="Закупка у поставщика / Усушка сырья"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="glass-input"
                required
              />
            </label>

            {successMsg && <div className="settings-success-alert">{successMsg}</div>}
            {errorMsg && <div className="settings-error-alert">{errorMsg}</div>}

            <button type="submit" className="glass-btn glass-btn-primary w-100 mt-10" disabled={submitting}>
              <Save size={16} /> {submitting ? 'Проведение...' : 'Сохранить складскую проводку'}
            </button>
          </form>
        </div>
      </div>

      {/* Audit Log history log on bottom */}
      <div className="warehouse-audit-panel glass-panel mt-24">
        <div className="panel-title-bar flex-row-between">
          <div>
            <h3>Аудит складских операций</h3>
            <p>Хронологическая история всех складских проводок ИС</p>
          </div>
          <History size={20} className="text-secondary" />
        </div>

        <div className="audit-table-scroll mt-15">
          <table className="audit-table">
            <thead>
              <tr>
                <th>Дата и Время</th>
                <th>Сырьевой ингредиент</th>
                <th>Тип проводки</th>
                <th>Количество</th>
                <th>Комментарий / Обоснование</th>
                <th>Ответственный оператор</th>
              </tr>
            </thead>
            <tbody>
              {operations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center">Складские проводки отсутствуют.</td>
                </tr>
              ) : (
                operations.map(op => (
                  <tr key={op.id} className={op.type}>
                    <td>{new Date(op.created_at).toLocaleString('ru-RU')}</td>
                    <td><strong>{op.item_name}</strong></td>
                    <td>
                      <span className={`op-badge ${op.type}`}>
                        {op.type === 'inflow' ? 'ПРИХОД' : 'СПИСАНИЕ'}
                      </span>
                    </td>
                    <td>{op.quantity} {op.item_unit}</td>
                    <td>{op.reason}</td>
                    <td>{op.operator_name}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
