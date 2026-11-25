import { useState } from 'react'
import { ReservationDialog } from '../../../components/ReservationDialog'
import '../styles/holding.css'

export default function HoldingPage() {
  const [reservationOpen, setReservationOpen] = useState(false)

  return <>
    <main className="marketing-holding" aria-label="Mangosteen Café">
      <div className="marketing-holding-content">
        <img className="marketing-holding-logo" src="/images/architectural/brand-lockup.png" alt="Mangosteen Café, Indore" width="2172" height="724"/>
        <div className="marketing-holding-actions">
          <a href="/menu">Explore Menu</a>
          <button type="button" onClick={() => setReservationOpen(true)}>Reserve a Table</button>
        </div>
      </div>
    </main>
    {reservationOpen && <ReservationDialog onClose={() => setReservationOpen(false)}/>}
  </>
}
