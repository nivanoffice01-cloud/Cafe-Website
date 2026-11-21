import { useEffect, useMemo, useRef, useState } from 'react'
import { seatsFor, seatingPlans, type SeatingZone } from '../data/seating'

type Props = { onClose: () => void }

const arrivalTimes = ['5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM']

function localDateValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function ReservationDialog({ onClose }: Props) {
  const [today] = useState(() => new Date())
  const dates = useMemo(() => Array.from({ length: 14 }, (_, index) => {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + index)
    return { value: localDateValue(date), weekday: new Intl.DateTimeFormat('en-IN', { weekday: 'short' }).format(date), day: date.getDate(), month: new Intl.DateTimeFormat('en-IN', { month: 'short' }).format(date) }
  }), [today])
  const [date, setDate] = useState(dates[0].value)
  const [time, setTime] = useState(arrivalTimes[2])
  const [guests, setGuests] = useState(2)
  const [zone, setZone] = useState<SeatingZone>('rooftop')
  const [selectedSeats, setSelectedSeats] = useState<string[]>([])
  const [saved, setSaved] = useState(false)
  const [notice, setNotice] = useState('')
  const closeRef = useRef<HTMLButtonElement>(null)
  const plan = seatingPlans[zone]
  const chosenCluster = plan.clusters.find((cluster) => selectedSeats.some((seat) => seat.startsWith(`${cluster.id}-`)))
  const dateLabel = new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(`${date}T12:00:00`))

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      if (event.key !== 'Tab') return
      const focusable = document.querySelectorAll<HTMLElement>('.reservation-dialog button:not([disabled]), .reservation-dialog a[href]')
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
      previousFocus?.focus()
    }
  }, [onClose])

  const changeGuests = (next: number) => {
    setGuests(Math.max(1, Math.min(6, next)))
    setSelectedSeats([])
    setSaved(false)
    setNotice('')
  }
  const changeZone = (next: SeatingZone) => {
    setZone(next)
    setSelectedSeats([])
    setSaved(false)
    setNotice('')
  }
  const toggleSeat = (clusterId: string, seatId: string) => {
    setSaved(false)
    setNotice('')
    setSelectedSeats((current) => {
      if (current.includes(seatId)) return current.filter((seat) => seat !== seatId)
      if (current.some((seat) => !seat.startsWith(`${clusterId}-`))) return [seatId]
      if (current.length >= guests) return current
      return [...current, seatId]
    })
  }
  const requestText = `Mangosteen Café seating preference\n${dateLabel} at ${time}\n${guests} ${guests === 1 ? 'guest' : 'guests'} · ${plan.name}\n${chosenCluster?.label ?? 'No cluster selected'} · seats ${selectedSeats.join(', ')}\n\nThis is a seating preference, not a confirmed reservation. Please confirm availability with the café.`
  const saveSelection = () => {
    if (selectedSeats.length !== guests) return
    try {
      window.localStorage.setItem('mangosteen-seating-preference', JSON.stringify({ date, time, guests, zone, seats: selectedSeats }))
      setSaved(true)
      setNotice('Your seating preference is saved on this device. It has not been sent to the café.')
    } catch {
      setNotice('This browser could not save your selection. You can still copy the details below.')
    }
  }
  const copySelection = async () => {
    try {
      await navigator.clipboard.writeText(requestText)
      setNotice('Request details copied. Share them with the café to ask for confirmation.')
    } catch {
      setNotice('Copy was unavailable in this browser. Please note your selected seats.')
    }
  }

  return <div className="reservation-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <section className="reservation-dialog" role="dialog" aria-modal="true" aria-labelledby="reservation-title">
      <header className="reservation-header">
        <div><p className="reservation-eyebrow">MANGOSTEEN · INDORE</p><h2 id="reservation-title">Choose your <em>place.</em></h2><p>A little corner of the evening, just for you.</p></div>
        <button ref={closeRef} type="button" className="reservation-close" onClick={onClose} aria-label="Close reservation">Close <span aria-hidden="true">×</span></button>
      </header>

      <div className="reservation-content">
        <div className="reservation-settings">
          <div className="reservation-step"><span>01</span><strong>Plan your visit</strong></div>
          <div className="reservation-field"><span className="reservation-label">YOUR EVENING</span><div className="reservation-dates" role="group" aria-label="Preferred date">{dates.map((item) => <button key={item.value} type="button" className={date === item.value ? 'is-selected' : ''} aria-pressed={date === item.value} onClick={() => { setDate(item.value); setSaved(false) }}><small>{item.weekday}</small><strong>{item.day}</strong><small>{item.month}</small></button>)}</div></div>
          <div className="reservation-field"><span className="reservation-label">PREFERRED ARRIVAL</span><div className="reservation-times" role="group" aria-label="Preferred arrival time">{arrivalTimes.map((item) => <button key={item} type="button" className={time === item ? 'is-selected' : ''} aria-pressed={time === item} onClick={() => { setTime(item); setSaved(false) }}>{item}</button>)}</div></div>
          <div className="reservation-field reservation-party"><div><span className="reservation-label">YOUR PARTY</span><small>Up to 6 guests</small></div><div className="reservation-counter"><button type="button" onClick={() => changeGuests(guests - 1)} disabled={guests === 1} aria-label="Remove a guest">−</button><output aria-live="polite">{guests}</output><button type="button" onClick={() => changeGuests(guests + 1)} disabled={guests === 6} aria-label="Add a guest">+</button></div></div>
        </div>

        <div className="reservation-map-column">
          <div className="reservation-map-heading"><div className="reservation-step"><span>02</span><strong>Select your seats</strong></div><p>{selectedSeats.length} of {guests} selected</p></div>
          <div className="reservation-zone-switch" role="group" aria-label="Seating area"><button type="button" className={zone === 'rooftop' ? 'is-selected' : ''} aria-pressed={zone === 'rooftop'} onClick={() => changeZone('rooftop')}>The rooftop</button><button type="button" className={zone === 'inside' ? 'is-selected' : ''} aria-pressed={zone === 'inside'} onClick={() => changeZone('inside')}>Inside Mangosteen</button></div>
          <p className="reservation-map-swipe">Tap seats in one group to choose your place</p>
          <div className="reservation-map-scroll"><div className="reservation-seat-map" aria-label={`${plan.name} schematic seating map`}>
            <div className="reservation-map-edge">{plan.orientation}</div>
            <div className="reservation-map-aisle" aria-hidden="true"/>
            {plan.clusters.map((cluster) => <div key={cluster.id} className={`reservation-cluster${cluster.capacity < guests ? ' is-small' : ''}`} style={{ gridColumn: cluster.column, gridRow: cluster.row, gridTemplateColumns: `repeat(${cluster.columns}, 2.65rem)` }}>
              <span className="reservation-cluster-name">{cluster.label}</span>
              {seatsFor(cluster).map((seatId) => <button key={seatId} type="button" className={`reservation-seat${selectedSeats.includes(seatId) ? ' is-selected' : ''}`} aria-label={`${cluster.label}, seat ${seatId.split('-')[1]}${cluster.capacity < guests ? ', too small for your party' : ''}`} aria-pressed={selectedSeats.includes(seatId)} disabled={cluster.capacity < guests} onClick={() => toggleSeat(cluster.id, seatId)}><span>{seatId.split('-')[1]}</span></button>)}
            </div>)}
            <div className="reservation-map-entry">{plan.entry}</div>
          </div></div>
          <div className="reservation-map-footer"><div className="reservation-legend"><span><i className="reservation-legend-available"/> Selectable</span><span><i className="reservation-legend-selected"/> Your choice</span><span><i className="reservation-legend-small"/> Too small</span></div><p>Select {guests} {guests === 1 ? 'seat' : 'seats'} in one seating group. Choosing another group starts a new selection.</p></div>
        </div>

        <aside className="reservation-summary"><div className="reservation-step"><span>03</span><strong>Your request</strong></div><div className="reservation-summary-rule"/><p className="reservation-summary-date">{dateLabel}</p><dl><div><dt>Arrival</dt><dd>{time}</dd></div><div><dt>Guests</dt><dd>{guests}</dd></div><div><dt>Area</dt><dd>{plan.name}</dd></div><div><dt>Seats</dt><dd>{selectedSeats.length ? `${chosenCluster?.label} · ${selectedSeats.join(', ')}` : 'Choose on the map'}</dd></div></dl><div className="reservation-summary-bottom"><p className="reservation-disclaimer">Illustrative seating layout. Availability and exact positions must be confirmed by the café.</p><button className="reservation-save" type="button" disabled={selectedSeats.length !== guests} onClick={saveSelection}>{saved ? 'Selection saved on this device' : 'Save seating preference'}</button><button className="reservation-copy" type="button" disabled={selectedSeats.length !== guests} onClick={copySelection}>Copy request details</button><p className="reservation-notice" role="status" aria-live="polite">{notice || 'This frontend preview does not send or confirm reservations.'}</p></div></aside>
      </div>
    </section>
  </div>
}
