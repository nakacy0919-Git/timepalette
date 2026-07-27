import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css' // ←★これが絶対に必要です！
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)