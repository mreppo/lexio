// Sentry must be initialised before React so that initialisation errors are
// also captured. The call is a no-op when VITE_SENTRY_DSN is not set.
import { initSentry } from './services/sentry'
initSentry()

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Root element not found')
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
