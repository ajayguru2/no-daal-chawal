import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import PinProtection from './components/PinProtection'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <PinProtection>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </PinProtection>
  </React.StrictMode>,
)
