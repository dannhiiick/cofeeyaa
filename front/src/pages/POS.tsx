import { useEffect, useState } from 'react';
import { 
  fetchProducts, 
  fetchClients, 
  createOrder 
} from '../api/client';
import type { CoffeeProduct, Client } from '../types';
import { 
  ShoppingBag, 
  Trash2, 
  Plus, 
  Minus, 
  Award,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import './POS.css';

export function POSPage() {
  const [products, setProducts] = useState<CoffeeProduct[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  
  // Cart state: Record<product_id, quantity>
  const [cart, setCart] = useState<Record<number, number>>({});
  const [useBonuses, setUseBonuses] = useState(false);
  
  // Checkout flow states
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<{ id: number; paid: string; earned: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const loadPOSData = async () => {
      try {
        const prods = await fetchProducts();
        setProducts(prods);
        const clis = await fetchClients();
        setClients(clis);
      } catch (err) {
        console.error('Failed to load POS screen resources:', err);
      }
    };
    loadPOSData();
  }, []);

  const addToCart = (pId: number) => {
    setCart(prev => ({ ...prev, [pId]: (prev[pId] || 0) + 1 }));
    setSuccessMsg(null);
    setErrorMsg(null);
  };

  const removeFromCart = (pId: number) => {
    setCart(prev => {
      const copy = { ...prev };
      if (copy[pId] > 1) copy[pId]--;
      else delete copy[pId];
      return copy;
    });
  };

  const deleteFromCart = (pId: number) => {
    setCart(prev => {
      const copy = { ...prev };
      delete copy[pId];
      return copy;
    });
  };

  const clearCart = () => {
    setCart({});
    setSelectedClient(null);
    setUseBonuses(false);
    setSuccessMsg(null);
    setErrorMsg(null);
  };

  // Dynamic calculations on client-side (reactive visualization)
  const getCartSubtotal = () => {
    let sub = 0;
    Object.entries(cart).forEach(([pId, qty]) => {
      const p = products.find(prod => prod.id === Number(pId));
      if (p) sub += Number(p.price) * qty;
    });
    return sub;
  };

  const getDiscountPercent = () => {
    if (!selectedClient) return 0;
    if (selectedClient.loyalty_level === 'bronze') return 5;
    if (selectedClient.loyalty_level === 'silver') return 10;
    if (selectedClient.loyalty_level === 'gold') return 15;
    return 0;
  };

  const subtotal = getCartSubtotal();
  const discountPercent = getDiscountPercent();
  const cardDiscount = (subtotal * discountPercent) / 100;
  const priceAfterCard = subtotal - cardDiscount;

  // Max bonus payment: up to 50% of the discounted price
  const maxBonusPayment = priceAfterCard * 0.5;
  const clientBonuses = selectedClient ? selectedClient.bonuses_balance : 0;
  const appliedBonuses = useBonuses ? Math.min(clientBonuses, maxBonusPayment) : 0;
  
  const finalPrice = Math.max(0, priceAfterCard - appliedBonuses);
  const cashbackEarned = Math.floor(finalPrice * 0.05);

  const handleCheckout = async () => {
    if (Object.keys(cart).length === 0) return;
    
    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const items = Object.entries(cart).map(([pId, qty]) => ({
      product_id: Number(pId),
      quantity: qty
    }));

    try {
      const order = await createOrder({
        client_id: selectedClient ? selectedClient.id : null,
        items,
        use_bonuses: useBonuses
      });

      setSuccessMsg({
        id: order.id,
        paid: order.final_price,
        earned: order.bonuses_earned
      });
      setCart({});
      setSelectedClient(null);
      setUseBonuses(false);
      
      // Reload clients list to update bonus balance
      const clis = await fetchClients();
      setClients(clis);
    } catch (err) {
      setErrorMsg((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pos-container animate-fade-in">
      <div className="pos-split">
        {/* Menu products list */}
        <div className="menu-grid-panel">
          <div className="panel-title-bar">
            <h3>Меню кофейни</h3>
            <p>Выберите напитки и выпечку для добавления в чек</p>
          </div>

          <div className="products-grid">
            {products.map(p => (
              <div key={p.id} className="menu-item-card glass-panel" onClick={() => addToCart(p.id)}>
                <div className="menu-image-badge">{p.name.substring(0, 2)}</div>
                <div className="menu-meta">
                  <h4 className="menu-name">{p.name}</h4>
                  <p className="menu-desc">{p.description}</p>
                  <div className="menu-price-row">
                    <span className="price-tag">{p.price} ₸</span>
                    <button className="add-fast-btn"><Plus size={14} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Shopping Cart checkout desk */}
        <div className="checkout-desk-panel glass-panel">
          <div className="checkout-head">
            <ShoppingBag size={22} className="text-primary" />
            <h3>Новый чек</h3>
            {Object.keys(cart).length > 0 && (
              <button className="clear-cart-btn" onClick={clearCart} title="Очистить чек">
                <Trash2 size={16} />
              </button>
            )}
          </div>

          {/* Customer Selection */}
          <div className="checkout-section">
            <label className="checkout-label">Выбор клиента (CRM)</label>
            <div className="client-picker-row">
              <select
                className="glass-input client-select"
                value={selectedClient ? selectedClient.id : ''}
                onChange={(e) => {
                  const id = Number(e.target.value);
                  const cli = clients.find(c => c.id === id);
                  setSelectedClient(cli || null);
                  setUseBonuses(false);
                }}
              >
                <option value="">-- Быстрый гость (Без скидки) --</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone}) — {c.loyalty_level.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            {selectedClient && (
              <div className="client-loyalty-info animate-fade-in">
                <div className="loyalty-badge-row">
                  <span className={`loyalty-pill ${selectedClient.loyalty_level}`}>
                    <Award size={12} /> {selectedClient.loyalty_level.toUpperCase()} ({discountPercent}%)
                  </span>
                  <span className="bonus-pill">
                    Баланс: {selectedClient.bonuses_balance} б.
                  </span>
                </div>

                {selectedClient.bonuses_balance > 0 && (
                  <label className="bonus-toggle-label mt-10">
                    <input
                      type="checkbox"
                      checked={useBonuses}
                      onChange={(e) => setUseBonuses(e.target.checked)}
                    />
                    <span>Списать бонусы (макс 50%)</span>
                  </label>
                )}
              </div>
            )}
          </div>

          {/* Cart items list */}
          <div className="checkout-items-list">
            {Object.keys(cart).length === 0 ? (
              <div className="empty-cart-state">
                <ShoppingBag size={48} className="empty-bag-svg" />
                <p>Чек пуст. Выберите товары в левой части меню кофейни.</p>
              </div>
            ) : (
              Object.entries(cart).map(([pId, qty]) => {
                const prod = products.find(p => p.id === Number(pId));
                if (!prod) return null;
                return (
                  <div key={pId} className="cart-row animate-fade-in">
                    <div className="cart-row-main">
                      <strong className="cart-item-name">{prod.name}</strong>
                      <span className="cart-item-price">{prod.price} ₸</span>
                    </div>
                    <div className="cart-row-controls">
                      <div className="qty-controls">
                        <button onClick={() => removeFromCart(prod.id)} className="qty-btn"><Minus size={12} /></button>
                        <span className="qty-val">{qty}</span>
                        <button onClick={() => addToCart(prod.id)} className="qty-btn"><Plus size={12} /></button>
                      </div>
                      <button onClick={() => deleteFromCart(prod.id)} className="cart-delete-btn"><Trash2 size={14} /></button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Sticky footer: price + button + alerts */}
          <div className="checkout-footer">
            {/* Price breakdowns */}
            {Object.keys(cart).length > 0 && (
              <div className="price-breakdown-box">
                <div className="breakdown-row">
                  <span>Подытог чека:</span>
                  <span>{subtotal} ₸</span>
                </div>
                {selectedClient && discountPercent > 0 && (
                  <div className="breakdown-row text-danger">
                    <span>Скидка карты ({discountPercent}%):</span>
                    <span>-{cardDiscount.toFixed(2)} ₸</span>
                  </div>
                )}
                {appliedBonuses > 0 && (
                  <div className="breakdown-row text-danger">
                    <span>Списано бонусов:</span>
                    <span>-{appliedBonuses.toFixed(2)} ₸</span>
                  </div>
                )}
                <div className="breakdown-divider"></div>
                <div className="breakdown-row total-price-row">
                  <span>Итого к оплате:</span>
                  <span className="final-price-tag">{finalPrice.toFixed(2)} ₸</span>
                </div>
                {selectedClient && (
                  <div className="breakdown-row cashback-row text-success">
                    <span>Кэшбек гостю (5%):</span>
                    <span>+{cashbackEarned} б.</span>
                  </div>
                )}
              </div>
            )}

            {/* Place Order CTA */}
            {Object.keys(cart).length > 0 && (
              <button 
                className="glass-btn glass-btn-primary w-100 checkout-submit-btn" 
                onClick={handleCheckout}
                disabled={submitting}
              >
                {submitting ? 'Проверка остатков сырья...' : 'Оформить и оплатить чек'}
              </button>
            )}

            {/* Message outcomes */}
            {successMsg && (
              <div className="checkout-alert success animate-fade-in">
                <CheckCircle2 size={24} className="text-success" />
                <div>
                  <strong>Чек #{successMsg.id} закрыт!</strong>
                  <p>Оплачено: {successMsg.paid} ₸. Начислено кэшбека: +{successMsg.earned} бонусов.</p>
                </div>
              </div>
            )}

            {errorMsg && (
              <div className="checkout-alert error animate-fade-in">
                <AlertTriangle size={24} />
                <div>
                  <strong>Ошибка списания со склада:</strong>
                  <p>{errorMsg}</p>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
