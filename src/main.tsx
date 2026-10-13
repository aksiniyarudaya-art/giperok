import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './styles/tokens.css'
import './styles/base.css'
import './styles/components.css'
import App from './App'
import { ToastProvider } from './ui'

try {
  const t = localStorage.getItem('theme')
  if (t === 'dark' || t === 'light') document.documentElement.dataset.theme = t
} catch { /* хранилище недоступно */ }

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <ToastProvider>
        <App />
      </ToastProvider>
    </HashRouter>
  </StrictMode>,
)
