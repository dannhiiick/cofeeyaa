import { useEffect, useState } from 'react';
import { 
  fetchClients, 
  createClient, 
  fetchCommunications, 
  createCommunication,
  fetchNotifications
} from '../api/client';
import type { Client, CommunicationHistory, NotificationLog } from '../types';
import { 
  Users, 
  Search, 
  PlusCircle, 
  Phone, 
  Award,
  Save,
  MessageCircle,
  X
} from 'lucide-react';
import './CRM.css';

export function CRMPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  
  // Nested CRM detail states
  const [comms, setComms] = useState<CommunicationHistory[]>([]);
  const [notifs, setNotifs] = useState<NotificationLog[]>([]);
  
  // Forms states
  const [showAddModal, setShowAddModal] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', phone: '', email: '' });
  const [commType, setCommType] = useState<'call' | 'email' | 'meeting' | 'chat'>('call');
  const [commContent, setCommContent] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [submittingComm, setSubmittingComm] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    loadClientsList();
  }, [search]);

  const loadClientsList = async () => {
    try {
      const data = await fetchClients(search);
      setClients(data);
      if (data.length > 0 && !selectedClient) {
        handleSelectClient(data[0]);
      }
    } catch (err) {
      console.error('Failed to load CRM clients list:', err);
    }
  };

  const handleSelectClient = async (cli: Client) => {
    setSelectedClient(cli);
    try {
      const histories = await fetchCommunications(cli.id);
      setComms(histories);
      const alerts = await fetchNotifications(cli.id);
      setNotifs(alerts);
    } catch (err) {
      console.error('Failed to load client details:', err);
    }
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const cli = await createClient(newClient);
      setShowAddModal(false);
      setNewClient({ name: '', phone: '', email: '' });
      await loadClientsList();
      handleSelectClient(cli);
    } catch (err) {
      setErrorMsg((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateComm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || !commContent) return;
    setSubmittingComm(true);
    try {
      await createCommunication({
        client: selectedClient.id,
        type: commType,
        content: commContent
      });
      setCommContent('');
      // Reload communications
      const histories = await fetchCommunications(selectedClient.id);
      setComms(histories);
    } catch (err) {
      console.error('Failed to log communication:', err);
    } finally {
      setSubmittingComm(false);
    }
  };

  return (
    <div className="crm-container animate-fade-in">
      <div className="crm-split">
        {/* CRM Clients list on left */}
        <div className="crm-list-panel glass-panel">
          <div className="crm-search-bar">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Поиск по ФИО или телефону..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="glass-input search-input"
            />
            <button className="glass-btn glass-btn-primary add-client-btn" onClick={() => setShowAddModal(true)}>
              <PlusCircle size={16} /> Добавить
            </button>
          </div>

          <div className="crm-clients-scroll">
            {clients.length === 0 ? (
              <div className="empty-state">Гости не найдены.</div>
            ) : (
              clients.map(cli => (
                <div 
                  key={cli.id} 
                  className={`client-row-item ${selectedClient?.id === cli.id ? 'active' : ''}`}
                  onClick={() => handleSelectClient(cli)}
                >
                  <div className="client-row-meta">
                    <strong className="client-name-title">{cli.name}</strong>
                    <span className="client-phone-sub"><Phone size={10} /> {cli.phone}</span>
                  </div>
                  <span className={`loyalty-badge-mini ${cli.loyalty_level}`}>
                    {cli.loyalty_level.toUpperCase()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Selected Customer details profile on right */}
        <div className="crm-detail-panel glass-panel">
          {selectedClient ? (
            <div className="detail-scrollable">
              {/* Profile Card Header */}
              <div className="client-profile-header">
                <div className="avatar-big">{selectedClient.name.substring(0, 2)}</div>
                <div className="profile-titles">
                  <h2>{selectedClient.name}</h2>
                  <span className={`loyalty-badge ${selectedClient.loyalty_level}`}>
                    <Award size={14} /> Уровень: {selectedClient.loyalty_level.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Grid with statistics */}
              <div className="profile-stats-grid">
                <div className="p-stat-card">
                  <span className="p-stat-title">Всего потрачено</span>
                  <span className="p-stat-val text-primary">{selectedClient.total_spent} ₸</span>
                </div>
                <div className="p-stat-card">
                  <span className="p-stat-title">Баланс бонусов</span>
                  <span className="p-stat-val text-success">{selectedClient.bonuses_balance} ₸</span>
                </div>
                <div className="p-stat-card">
                  <span className="p-stat-title">Номер телефона</span>
                  <span className="p-stat-val phone-text">{selectedClient.phone}</span>
                </div>
                <div className="p-stat-card">
                  <span className="p-stat-title">Email</span>
                  <span className="p-stat-val email-text">{selectedClient.email || 'Не указан'}</span>
                </div>
              </div>

              {/* CRM Splits: Interaction logs and SMS notifications */}
              <div className="crm-logs-split">
                
                {/* Left side: communication history and new logging form */}
                <div className="logs-card flex-column">
                  <h3>История коммуникаций</h3>
                  
                  {/* Logger Form */}
                  <form onSubmit={handleCreateComm} className="comm-logger-form mt-10">
                    <div className="logger-inputs">
                      <select
                        value={commType}
                        onChange={(e) => setCommType(e.target.value as any)}
                        className="glass-input comm-select"
                      >
                        <option value="call">Звонок / Call</option>
                        <option value="chat">Чат / Message</option>
                        <option value="meeting">Встреча / Meeting</option>
                        <option value="email">Email</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Краткое содержание разговора..."
                        value={commContent}
                        onChange={(e) => setCommContent(e.target.value)}
                        className="glass-input comm-text-input"
                        required
                      />
                      <button type="submit" className="glass-btn glass-btn-primary log-btn" disabled={submittingComm}>
                        Записать
                      </button>
                    </div>
                  </form>

                  {/* Logs list */}
                  <div className="comm-history-list mt-15">
                    {comms.length === 0 ? (
                      <p className="placeholder-text">История коммуникаций пуста.</p>
                    ) : (
                      comms.map(c => (
                        <div key={c.id} className="comm-log-bubble animate-fade-in">
                          <div className="comm-bubble-meta">
                            <span className="comm-type-pill">{c.type.toUpperCase()}</span>
                            <span className="comm-manager">Менеджер: {c.manager_name}</span>
                            <span className="comm-date">{new Date(c.created_at).toLocaleDateString('ru-RU')}</span>
                          </div>
                          <p className="comm-bubble-desc">{c.content}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Right side: auto SMS logs */}
                <div className="logs-card">
                  <h3>Оповещения и статусы заказов</h3>
                  <p className="section-desc">Официальные автоматические транзакционные SMS, отправленные клиенту.</p>
                  
                  <div className="notifications-list-crm mt-15">
                    {notifs.length === 0 ? (
                      <p className="placeholder-text">Уведомления не отправлялись.</p>
                    ) : (
                      notifs.map(n => (
                        <div key={n.id} className="notif-log-bubble animate-fade-in">
                          <div className="notif-bubble-meta">
                            <span className="notif-type-pill"><MessageCircle size={10} /> SMS</span>
                            <span className="notif-date">{new Date(n.sent_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })} — {new Date(n.sent_at).toLocaleDateString('ru-RU')}</span>
                          </div>
                          <strong className="notif-title-str">{n.title}</strong>
                          <p className="notif-msg-str">"{n.message}"</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>

            </div>
          ) : (
            <div className="no-client-selected">
              <Users size={64} className="empty-users-svg" />
              <h3>База клиентов CRM кофейни</h3>
              <p>Выберите клиента из списка слева, чтобы открыть его детальный профиль или добавить запись о коммуникациях.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Client Modal */}
      {showAddModal && (
        <div className="modal-backdrop">
          <div className="modal-card glass-panel animate-fade-in">
            <div className="modal-header">
              <h3>Регистрация контрагента в CRM</h3>
              <button className="close-btn" onClick={() => setShowAddModal(false)}><X size={18} /></button>
            </div>
            
            <form onSubmit={handleCreateClient} className="modal-form mt-10">
              <label className="form-field">
                <span className="form-label">ФИО Гостя</span>
                <input
                  type="text"
                  placeholder="Иван Иванов"
                  value={newClient.name}
                  onChange={(e) => setNewClient(prev => ({ ...prev, name: e.target.value }))}
                  className="glass-input"
                  required
                />
              </label>

              <label className="form-field">
                <span className="form-label">Номер телефона</span>
                <input
                  type="text"
                  placeholder="+7 707 123-45-67"
                  value={newClient.phone}
                  onChange={(e) => setNewClient(prev => ({ ...prev, phone: e.target.value }))}
                  className="glass-input"
                  required
                />
              </label>

              <label className="form-field">
                <span className="form-label">E-mail адрес</span>
                <input
                  type="email"
                  placeholder="guest@mail.kz"
                  value={newClient.email}
                  onChange={(e) => setNewClient(prev => ({ ...prev, email: e.target.value }))}
                  className="glass-input"
                />
              </label>

              {errorMsg && <div className="auth-error mt-10">{errorMsg}</div>}

              <button type="submit" className="glass-btn glass-btn-primary mt-15 w-100" disabled={submitting}>
                <Save size={16} /> {submitting ? 'Регистрация...' : 'Сохранить гостя'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
