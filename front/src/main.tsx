import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { API_BASE_URL } from './api/client.ts'

// Pre-warm: kick off a background ping to wake up Render free tier
// immediately when the page loads — before the user does anything.
// Uses keepalive so it survives page navigations.
fetch(`${API_BASE_URL}/products`, {
  method: 'GET',
  keepalive: true,
}).catch(() => { /* ignore — this is best-effort */ });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
