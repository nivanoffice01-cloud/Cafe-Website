import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './app/App'
import './styles/global.css'
import './styles/order-menu.css'
import './styles/prices.css'
import './features/supplied-frontend/fonts.css'
import './styles/typography.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><App /></React.StrictMode>,
)
