// Sentry must be initialised before React so that initialisation errors are
// also captured. The call is a no-op when VITE_SENTRY_DSN is not set.
import { initSentry } from './services/sentry'
initSentry()

// Inter font — cross-platform fallback for the SF Pro Display/Text system stack.
// Weights 400–800 cover all type roles defined in docs/design/liquid-glass/tokens.json.
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import '@fontsource/inter/800.css'

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
