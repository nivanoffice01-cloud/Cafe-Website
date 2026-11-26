import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './app/App'
import './styles/global.css'
import './styles/order-menu.css'
import './styles/prices.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><App /></React.StrictMode>,
)
