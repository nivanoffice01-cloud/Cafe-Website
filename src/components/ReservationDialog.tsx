import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { seatsFor, seatingPlans, type SeatingZone } from '../data/seating'
import { submitWebsiteReservation } from '../lib/crm'

type Props = { onClose: () => void }

const arrivalTimes = ['5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM']

function localDateValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function toTwentyFourHour(value: string) {
  const [clock, period] = value.split(' ')
  const [hourText, minute] = clock.split(':')
  let hour = Number(hourText)
  if (period === 'PM' && hour !== 12) hour += 12
  if (period === 'AM' && hour === 12) hour = 0
  return `${String(hour).padStart(2, '0')}:${minute}`
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
  const [stage, setStage] = useState<'seats' | 'details'>('seats')
  const [saved, setSaved] = useState(false)
  const [notice, setNotice] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [occasion, setOccasion] = useState('Regular visit')
  const [specialRequests, setSpecialRequests] = useState('')
  const [consent, setConsent] = useState(false)
  const [submissionState, setSubmissionState] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [reference, setReference] = useState('')
  const requestKeyRef = useRef(crypto.randomUUID())
  const backdropRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const datesRef = useRef<HTMLDivElement>(null)
  const backRef = useRef<HTMLButtonElement>(null)
  const plan = seatingPlans[zone]
  const chosenCluster = plan.clusters.find((cluster) => selectedSeats.some((seat) => seat.startsWith(`${cluster.id}-`)))
  const dateLabel = new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(`${date}T12:00:00`))
  const seatsComplete = selectedSeats.length === guests && Boolean(chosenCluster)

  useEffect(() => {
    backdropRef.current?.scrollTo({ top: 0, behavior: 'instant' })
    if (stage === 'details') backRef.current?.focus({ preventScroll: true })
  }, [stage])

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      if (event.key !== 'Tab') return
      const focusable = document.querySelectorAll<HTMLElement>('.reservation-dialog button:not([disabled]), .reservation-dialog a[href], .reservation-dialog input:not([disabled]), .reservation-dialog select:not([disabled]), .reservation-dialog textarea:not([disabled])')
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

  const markDirty = () => {
    setSaved(false)
    setSubmissionState('idle')
    setReference('')
    setNotice('')
    requestKeyRef.current = crypto.randomUUID()
  }
  const changeGuests = (next: number) => {
    setGuests(Math.max(1, Math.min(6, next)))
    setSelectedSeats([])
    markDirty()
  }
  const changeZone = (next: SeatingZone) => {
    setZone(next)
    setSelectedSeats([])
    markDirty()
  }
  const toggleSeat = (clusterId: string, seatId: string) => {
    markDirty()
    setSelectedSeats((current) => {
      if (current.includes(seatId)) return current.filter((seat) => seat !== seatId)
      if (current.some((seat) => !seat.startsWith(`${clusterId}-`))) return [seatId]
      if (current.length >= guests) return current
      return [...current, seatId]
    })
  }
  const moveDates = (direction: -1 | 1) => {
    datesRef.current?.scrollBy({ left: direction * 240, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
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

  const sendReservation = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!seatsComplete || !chosenCluster) return
    setSubmissionState('submitting')
    setNotice('Sending your request securely to the café…')
    try {
      const receipt = await submitWebsiteReservation({
        requestKey: requestKeyRef.current,
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        date,
        time: toTwentyFourHour(time),
        guests,
        area: plan.name,
        table: chosenCluster.label,
        seats: selectedSeats,
        occasion,
        specialRequests: specialRequests.trim(),
        consent,
        website: '',
      })
      window.localStorage.setItem('mangosteen-reservation-receipt', JSON.stringify({ ...receipt, name, phone, date, time, guests, zone, seats: selectedSeats }))
      setReference(receipt.reference)
      setSaved(true)
      setSubmissionState('success')
      setNotice(`Request ${receipt.reference} reached the café and is pending confirmation.`)
    } catch (error) {
      try {
        window.localStorage.setItem('mangosteen-seating-preference', JSON.stringify({ name, phone, email, date, time, guests, zone, seats: selectedSeats, occasion, specialRequests }))
      } catch { /* The visible error below remains the source of truth. */ }
      setSubmissionState('error')
      setNotice(error instanceof Error ? `${error.message} A copy was saved on this device.` : 'The request was not sent. A copy was saved on this device.')
    }
  }

  return <div ref={backdropRef} className="reservation-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <section className="reservation-dialog" role="dialog" aria-modal="true" aria-labelledby="reservation-title">
      <header className="reservation-header">
        <div><p className="reservation-eyebrow">MANGOSTEEN · INDORE</p><h2 id="reservation-title">{stage === 'seats' ? <>Choose your <em>place.</em></> : <>Make it <em>yours.</em></>}</h2><p>{stage === 'seats' ? 'Plan your evening and select seats together.' : 'Add your details to send a reservation request.'}</p></div>
        <button ref={closeRef} type="button" className="reservation-close" onClick={onClose} aria-label="Close reservation">Close <span aria-hidden="true">×</span></button>
      </header>

      {stage === 'seats' ? <div className="reservation-content">
        <div className="reservation-settings">
          <div className="reservation-step"><span>01</span><strong>Plan your visit</strong></div>
          <div className="reservation-field"><div className="reservation-field-heading"><span className="reservation-label">YOUR EVENING</span><div className="reservation-date-controls"><button type="button" onClick={() => moveDates(-1)} aria-label="Earlier dates">←</button><button type="button" onClick={() => moveDates(1)} aria-label="Later dates">→</button></div></div><div ref={datesRef} className="reservation-dates" role="group" aria-label="Preferred date">{dates.map((item) => <button key={item.value} type="button" className={date === item.value ? 'is-selected' : ''} aria-pressed={date === item.value} onClick={() => { setDate(item.value); markDirty() }}><small>{item.weekday}</small><strong>{item.day}</strong><small>{item.month}</small></button>)}</div></div>
          <div className="reservation-field"><span className="reservation-label">PREFERRED ARRIVAL</span><div className="reservation-times" role="group" aria-label="Preferred arrival time">{arrivalTimes.map((item) => <button key={item} type="button" className={time === item ? 'is-selected' : ''} aria-pressed={time === item} onClick={() => { setTime(item); markDirty() }}>{item}</button>)}</div></div>
          <div className="reservation-field reservation-party"><div><span className="reservation-label">YOUR PARTY</span><small>Up to 6 guests</small></div><div className="reservation-counter"><button type="button" onClick={() => changeGuests(guests - 1)} disabled={guests === 1} aria-label="Remove a guest">−</button><output aria-live="polite">{guests}</output><button type="button" onClick={() => changeGuests(guests + 1)} disabled={guests === 6} aria-label="Add a guest">+</button></div></div>
        </div>

        <div className="reservation-map-column">
          <div className="reservation-map-heading"><div className="reservation-step"><span>02</span><strong>Select your seats</strong></div><p className={seatsComplete ? 'is-complete' : ''} aria-live="polite">{seatsComplete ? 'Seats selected ✓' : `${selectedSeats.length} of ${guests} selected`}</p></div>
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

        <aside className="reservation-summary">
          <div className="reservation-step"><span>03</span><strong>Review your choice</strong></div>
          <div className="reservation-summary-rule"/>
          <p className="reservation-summary-date">{dateLabel}</p>
          <dl>
            <div><dt>Arrival</dt><dd>{time}</dd></div>
            <div><dt>Guests</dt><dd>{guests}</dd></div>
            <div><dt>Area</dt><dd>{plan.name}</dd></div>
            <div><dt>Seats</dt><dd>{selectedSeats.length ? `${chosenCluster?.label} · ${selectedSeats.join(', ')}` : 'Choose on the map'}</dd></div>
          </dl>
          <div className="reservation-stage-action"><p>Seats are a preference. The café will confirm availability after you send your request.</p><button className="reservation-save" type="button" disabled={!seatsComplete} onClick={() => setStage('details')}>Continue to your details <span aria-hidden="true">→</span></button><small>{seatsComplete ? 'Next: contact details · no payment needed' : `Choose ${guests} ${guests === 1 ? 'seat' : 'seats'} in one group to continue`}</small></div>
        </aside>
      </div> : <div className="reservation-details">
        <aside className="reservation-details-recap"><button ref={backRef} type="button" className="reservation-back" onClick={() => setStage('seats')}>← Change seats or arrival</button><p className="reservation-eyebrow">YOUR EVENING</p><h3>{dateLabel}</h3><dl><div><dt>Arrival</dt><dd>{time}</dd></div><div><dt>Guests</dt><dd>{guests}</dd></div><div><dt>Area</dt><dd>{plan.name}</dd></div><div><dt>Selected seats</dt><dd>{chosenCluster?.label} · {selectedSeats.join(', ')}</dd></div></dl><p>Your request is sent to the café for confirmation. Selecting seats here does not guarantee availability.</p></aside>
        <div className="reservation-details-form"><div className="reservation-step"><span>03</span><strong>Send your request</strong></div><h3>Your details</h3><p>We’ll use these details to follow up about your table.</p><form className="reservation-contact" onSubmit={sendReservation}>
            <label><span>Your name *</span><input required autoComplete="name" maxLength={80} value={name} onChange={(event) => { setName(event.target.value); markDirty() }} placeholder="Guest name"/></label>
            <label><span>Mobile number *</span><input required autoComplete="tel" inputMode="tel" minLength={7} maxLength={24} value={phone} onChange={(event) => { setPhone(event.target.value); markDirty() }} placeholder="+91"/></label>
            <label><span>Email</span><input type="email" autoComplete="email" maxLength={120} value={email} onChange={(event) => { setEmail(event.target.value); markDirty() }} placeholder="Optional"/></label>
            <label><span>Occasion</span><select value={occasion} onChange={(event) => { setOccasion(event.target.value); markDirty() }}><option>Regular visit</option><option>Birthday</option><option>Anniversary</option><option>Business meeting</option><option>Celebration</option></select></label>
            <label className="reservation-contact-wide"><span>Anything we should know?</span><textarea maxLength={500} value={specialRequests} onChange={(event) => { setSpecialRequests(event.target.value); markDirty() }} placeholder="Allergies, accessibility, cake or seating notes"/></label>
            <label className="reservation-consent"><input type="checkbox" checked={consent} onChange={(event) => { setConsent(event.target.checked); markDirty() }}/><span>I would like occasional Mangosteen offers. Reservation updates do not require marketing consent.</span></label>
            {submissionState === 'success' && <div className="reservation-receipt"><strong>Request received</strong><span>{reference} · Pending café confirmation</span></div>}
            <div className="reservation-summary-bottom">
              <p className="reservation-disclaimer">Your selected seats are a preference. The café will confirm availability separately.</p>
              <button className="reservation-save" type="submit" disabled={selectedSeats.length !== guests || !name.trim() || phone.trim().length < 7 || submissionState === 'submitting' || submissionState === 'success'}>{submissionState === 'submitting' ? 'Sending securely…' : submissionState === 'success' ? `Request ${reference} received` : 'Send reservation request'}</button>
              <button className="reservation-copy" type="button" disabled={selectedSeats.length !== guests} onClick={copySelection}>Copy request details</button>
              {submissionState === 'error' && <button className="reservation-copy" type="button" onClick={saveSelection}>{saved ? 'Saved on this device' : 'Save request on this device'}</button>}
              <p className={`reservation-notice is-${submissionState}`} role="status" aria-live="polite">{notice || 'Requests enter the café CRM as pending and require staff confirmation.'}</p>
            </div>
          </form></div>
      </div>}
    </section>
  </div>
}
