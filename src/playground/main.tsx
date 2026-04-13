import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './playground.css'
import '@/styles/index.css'
import { App } from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
