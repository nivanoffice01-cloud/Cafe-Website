import { HomePage } from '../pages/HomePage'
import { OrderMenuPage } from '../pages/OrderMenuPage'

export default function App() {
  if (['/menu', '/m'].includes(window.location.pathname.replace(/\/$/, '') || '/')) return <OrderMenuPage />
  return <HomePage />
}
