import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Home } from './pages/Home';
import { POSPage } from './pages/POS';
import { CRMPage } from './pages/CRM';
import { WarehousePage } from './pages/Warehouse';
import { AnalyticsPage } from './pages/Analytics';
import { SandboxPage } from './pages/Sandbox';
import { LoginPage } from './pages/Login';
import { RegisterPage } from './pages/Register';
import { SettingsPage } from './pages/Settings';
import './App.css';

function AppLayout() {
  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <Header />
        <div className="content-area">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/pos" element={<POSPage />} />
            <Route path="/crm" element={<CRMPage />} />
            <Route path="/warehouse" element={<WarehousePage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/sandbox" element={<SandboxPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <LanguageProvider>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/*" element={<AppLayout />} />
            </Route>
          </Routes>
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}

export default App;
