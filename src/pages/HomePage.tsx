import { useState } from 'react'
import { ReservationDialog } from '../components/ReservationDialog'

function LeafMark() {
  return <svg className="holding-logo" viewBox="0 0 52 38" aria-hidden="true"><path d="M25.5 26C13 24 7 17 7 7c11 0 18 4 20 13M27 22C28 10 35 4 46 3c0 11-5 19-18 23M26 20v14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
}

export function HomePage() {
  const [reservationOpen, setReservationOpen] = useState(false)

  return <>
    <main className="holding-page">
      <section className="holding-content" aria-labelledby="holding-title">
        <div className="holding-brand"><LeafMark/><span>MANGOSTEEN<small>CAFÉ · INDORE</small></span></div>
        <p className="holding-kicker">A LITTLE WORLD ABOVE THE CITY</p>
        <h1 id="holding-title">Mangosteen Café</h1>
        <p className="holding-note">Our next chapter is being prepared.</p>
        <div className="holding-actions">
          <a href="/menu">Explore Menu</a>
          <button type="button" onClick={() => setReservationOpen(true)}>Reserve a Table</button>
        </div>
      </section>
    </main>
    {reservationOpen && <ReservationDialog onClose={() => setReservationOpen(false)}/>}
  </>
}
