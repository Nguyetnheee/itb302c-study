import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { runTests } from './lib/test-engine.ts'

// Run core algorithms test suite on launch to verify correctness
if (import.meta.env.DEV) {
  runTests();
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
