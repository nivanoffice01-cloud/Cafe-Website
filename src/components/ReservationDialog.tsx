import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { seatsFor, seatingPlans, type SeatingZone } from '../data/seating'
import { submitWebsiteReservation } from '../lib/crm'
import { BookingControls } from '../features/reservations/BookingControls'
import { SeatingMap } from '../features/reservations/SeatingMap'
import { ReservationIcon } from '../features/reservations/ReservationIcon'
import { authenticPhoto } from '../features/supplied-frontend/authentic-photos'

type Props = { onClose: () => void; navigation?: ReactNode; initialSelection?: { date: string; time: string; guests: number } }

const arrivalTimes = ['5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM']
const localRetentionMs = 30 * 24 * 60 * 60 * 1000

function storeLocally(key: string, value: object) {
  window.localStorage.setItem(key, JSON.stringify({ ...value, savedAt: new Date().toISOString() }))
}

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

export function ReservationDialog({ onClose, initialSelection, navigation }: Props) {
  const [today] = useState(() => new Date())
  const dates = useMemo(() => Array.from({ length: 14 }, (_, index) => {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + index)
    return { value: localDateValue(date), weekday: new Intl.DateTimeFormat('en-IN', { weekday: 'short' }).format(date), day: date.getDate(), month: new Intl.DateTimeFormat('en-IN', { month: 'short' }).format(date) }
  }), [today])
  const [date, setDate] = useState(initialSelection && dates.some(d => d.value === initialSelection.date) ? initialSelection.date : dates[0].value)
  const [time, setTime] = useState(initialSelection && arrivalTimes.includes(initialSelection.time) ? initialSelection.time : arrivalTimes[2])
  const [guests, setGuests] = useState(initialSelection && Number.isInteger(initialSelection.guests) && initialSelection.guests >= 1 && initialSelection.guests <= 6 ? initialSelection.guests : 2)
  const [zone, setZone] = useState<SeatingZone>('rooftop')
  const [selectedSeats, setSelectedSeats] = useState<string[]>([])
  const [stage, setStage] = useState<'seats' | 'details'>('seats')
  const [closing, setClosing] = useState(false)
  const closeTimer = useRef<number | undefined>(undefined)
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
  const backRef = useRef<HTMLButtonElement>(null)
  const plan = seatingPlans[zone]
  const chosenCluster = plan.clusters.find((cluster) => selectedSeats.some((seat) => seat.startsWith(`${cluster.id}-`)))
  const dateLabel = new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(`${date}T12:00:00`))
  const seatsComplete = selectedSeats.length === guests && Boolean(chosenCluster)
  const areaPhoto = authenticPhoto(zone === 'rooftop' ? 'rooftop-evening' : 'visit-interior')
  const detailsPhoto = authenticPhoto('story-food')
  const close = () => {
    if (closeTimer.current !== undefined) return
    setClosing(true)
    closeTimer.current = window.setTimeout(onClose, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 250)
  }
  const selectGroup = (id: string) => {
    const cluster = plan.clusters.find(group => group.id === id)
    if (!cluster || cluster.capacity < guests) return
    markDirty()
    setSelectedSeats(seatsFor(cluster).slice(0, guests))
  }

  const completed = submissionState === 'success'
  useEffect(() => {
    backdropRef.current?.scrollTo({ top: 0, behavior: 'instant' })
    if (stage === 'details') backRef.current?.focus({ preventScroll: true })
    if (submissionState === 'success') backdropRef.current?.querySelector<HTMLElement>('.reservation-confirmation h2')?.focus({ preventScroll: true })
  }, [stage, completed])

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const background = document.querySelector<HTMLElement>('.saved-mangosteen.motion-ready')
    const previousInert = background?.inert
    if (background) background.inert = true
    closeRef.current?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        const toggle = backdropRef.current?.querySelector<HTMLButtonElement>('button[aria-label="Toggle menu"]')
        if (toggle?.getAttribute('aria-expanded') === 'true') { toggle.click(); toggle.focus() } else close()
      }
      if (event.key !== 'Tab') return
      const menuOpen = backdropRef.current?.querySelector('button[aria-label="Toggle menu"]')?.getAttribute('aria-expanded') === 'true'
      const container = menuOpen ? backdropRef.current?.querySelector('.reservation-site-navigation') : backdropRef.current
      const focusable = [...(container?.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex="0"]') ?? [])].filter(el => el.getClientRects().length > 0)
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      if (background) background.inert = previousInert ?? false
      window.clearTimeout(closeTimer.current)
      window.removeEventListener('keydown', onKeyDown)
      previousFocus?.focus()
    }
  }, [onClose])

  useEffect(() => {
    for (const key of ['mangosteen-reservation-receipt', 'mangosteen-seating-preference']) {
      try {
        const stored = JSON.parse(window.localStorage.getItem(key) || 'null') as { savedAt?: string } | null
        if (stored?.savedAt && Date.now() - new Date(stored.savedAt).getTime() > localRetentionMs) window.localStorage.removeItem(key)
      } catch { /* Storage can be unavailable in privacy-restricted browsers. */ }
    }
  }, [])

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
  const requestText = `Mangosteen Café seating preference\n${dateLabel} at ${time}\n${guests} ${guests === 1 ? 'guest' : 'guests'} · ${plan.name}\n${chosenCluster?.label ?? 'No cluster selected'} · seats ${selectedSeats.join(', ')}\n\nThis is a seating preference, not a confirmed reservation. Please confirm availability with the café.`
  const saveSelection = () => {
    if (selectedSeats.length !== guests) return
    try {
      storeLocally('mangosteen-seating-preference', { date, time, guests, zone, seats: selectedSeats })
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

  const clearStoredDetails = () => {
    try {
      window.localStorage.removeItem('mangosteen-reservation-receipt')
      window.localStorage.removeItem('mangosteen-seating-preference')
      setSaved(false)
      setNotice('Saved reservation details were removed from this device.')
    } catch {
      setNotice('This browser would not allow the saved details to be removed. Clear this site’s storage in your browser settings.')
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
      setReference(receipt.reference)
      setSaved(true)
      setSubmissionState('success')
      try {
        storeLocally('mangosteen-reservation-receipt', { ...receipt, name, phone, date, time, guests, zone, seats: selectedSeats })
        setNotice(`Request ${receipt.reference} reached the café and is pending confirmation. The receipt is saved on this device.`)
      } catch {
        setNotice(`Request ${receipt.reference} reached the café and is pending confirmation. This browser could not save the receipt locally.`)
      }
    } catch (error) {
      let locallySaved = false
      try {
        storeLocally('mangosteen-seating-preference', { name, phone, email, date, time, guests, zone, seats: selectedSeats, occasion, specialRequests })
        locallySaved = true
      } catch { /* The visible error below remains the source of truth. */ }
      setSubmissionState('error')
      const message = error instanceof Error ? error.message : 'The request was not sent.'
      setNotice(`${message}${locallySaved ? ' A copy was saved on this device.' : ' This browser could not save a local copy.'}`)
    }
  }

  const summary = <dl className="reservation-summary-list">
    <div><dt>Date</dt><dd>{dateLabel}</dd></div>
    <div><dt>Arrival</dt><dd>{time}</dd></div>
    <div><dt>Guests</dt><dd>{guests}</dd></div>
    <div><dt>Area</dt><dd>{plan.name}</dd></div>
    <div><dt>Seating preference</dt><dd>{chosenCluster?.label ?? 'Choose on the map'}</dd></div>
    <div><dt>Seat IDs</dt><dd>{selectedSeats.join(', ') || 'Not selected'}</dd></div>
  </dl>

  return <div ref={backdropRef} className={`reservation-backdrop${closing ? ' is-closing' : ''}`} data-lenis-prevent>
    <section className="reservation-dialog" role="dialog" aria-modal="true" aria-labelledby="reservation-title">
      {navigation && <div className="saved-mangosteen reservation-site-navigation" onClickCapture={event => {
        const link = (event.target as Element).closest<HTMLAnchorElement>('a')
        if (link && !link.href.includes('/contact#book')) onClose()
      }}>{navigation}</div>}
      <div className="reservation-page">
        <div className="reservation-topline"><span className="reservation-eyebrow">MANGOSTEEN · RESERVE A TABLE</span><button ref={closeRef} type="button" className="reservation-close" onClick={close} aria-label="Close reservation"><ReservationIcon name="back"/> Back to Mangosteen</button></div>
        {submissionState === 'success' ? <div className="reservation-confirmation reservation-reveal">
          <div className="reservation-confirmation-photo"><img {...areaPhoto} sizes="(max-width: 767px) 100vw, 50vw" alt={areaPhoto.alt}/><span>At Mangosteen · {plan.name}</span></div>
          <div className="reservation-confirmation-copy"><span className="reservation-success-mark"><ReservationIcon name="check"/></span><p className="reservation-eyebrow">REQUEST RECEIVED · PENDING CONFIRMATION</p><h2 id="reservation-title" tabIndex={-1}>A beautiful evening <em>awaits.</em></h2><p>Your reservation request has been received. Our team will confirm your booking shortly.</p><div className="reservation-receipt"><strong>{reference}</strong><span>Pending café confirmation</span></div>{summary}<p className="reservation-guest-confirmation">For {name} · {phone}</p><button className="reservation-save" onClick={close}>Back to Mangosteen <ReservationIcon name="arrow"/></button><button className="reservation-copy" onClick={copySelection}>Copy request details</button><button className="reservation-copy" onClick={clearStoredDetails}>Remove saved details from this device</button><p className="reservation-notice" role="status">{notice}</p><small>Local copies expire after 30 days. Remove them sooner on a shared device.</small></div>
        </div> : stage === 'seats' ? <>
          <div className="reservation-intro reservation-reveal">
            <header className="reservation-header"><h2 id="reservation-title">Find your<br/><em>perfect</em> table.</h2><p>Choose your date, time and a spot you love at Mangosteen.</p></header>
            <BookingControls zone={zone} date={date} dates={dates} time={time} arrivalTimes={arrivalTimes} guests={guests} onZoneChange={changeZone} onDateChange={value=>{setDate(value);markDirty()}} onTimeChange={value=>{setTime(value);markDirty()}} onGuestsChange={changeGuests}/>
          </div>
          <div className="reservation-content reservation-reveal">
            <div className="reservation-map-column">
              <SeatingMap zone={zone} guests={guests} selectedSeats={selectedSeats} activeId={chosenCluster?.id} onSelectGroup={selectGroup} onToggleSeat={toggleSeat}/>
              <div className="reservation-map-caption"><p><i/> Your choice <span>·</span> Muted groups are too small for your party.</p><p>Illustrated schematic. Physical positions have not been verified.</p></div>
            </div>
            <aside className="reservation-summary">
              <div className="reservation-area-photo" key={zone}><img {...areaPhoto} alt={areaPhoto.alt} sizes="(max-width: 767px) 100vw, 32vw" decoding="async"/><span>Area preview · not the exact table</span></div>
              <div className="reservation-preview-copy">
                <p className="reservation-eyebrow">YOUR PREFERRED SPOT</p><h3>{chosenCluster?.label ?? 'A place for you.'}</h3>
                <div className="reservation-preview-meta"><span><ReservationIcon name="guests"/>{chosenCluster ? `${chosenCluster.capacity} seats` : `${guests} guests`}</span><span><ReservationIcon name="pin"/>{plan.name}</span></div>
                <p className="reservation-area-note"><ReservationIcon name="check"/>{zone === 'rooftop' ? 'Rooftop seating among the greenery.' : 'Indoor seating at Mangosteen.'}</p>
                <div className="reservation-seat-preferences"><div><strong>Choose your seats</strong><output aria-live="polite">{selectedSeats.length} of {guests} selected</output></div>{chosenCluster ? <><p>A table tap selects {guests} preferred {guests === 1 ? 'seat' : 'seats'}. Adjust them here.</p><div role="group" aria-label={`${chosenCluster.label} individual seats`}>{seatsFor(chosenCluster).map(seat => <button key={seat} type="button" aria-label={`Preferred seat ${seat} at ${chosenCluster.label}`} aria-pressed={selectedSeats.includes(seat)} onClick={() => toggleSeat(chosenCluster.id, seat)}>{seat}{selectedSeats.includes(seat) && <ReservationIcon name="check"/>}</button>)}</div></> : <p>Select a suitable table on the map or use the table list.</p>}</div>
                <div className="reservation-stage-action"><button className="reservation-save" type="button" disabled={!seatsComplete} onClick={() => setStage('details')}>Continue to Details <ReservationIcon name="arrow"/></button><p>Seating is a preference. Our team will confirm availability after you send your request.</p></div>
              </div>
            </aside>
          </div>
          <div className="reservation-mobile-sticky"><span>{seatsComplete ? chosenCluster?.label : 'Choose your preferred seats'}<small>{selectedSeats.length} of {guests} selected · {time}</small></span><button type="button" className="reservation-save" disabled={!seatsComplete} onClick={() => setStage('details')}>Continue <ReservationIcon name="arrow"/></button></div>
        </> : <div className="reservation-details reservation-reveal">
          <aside className="reservation-details-recap"><div className="reservation-details-photo"><img {...detailsPhoto} alt={detailsPhoto.alt} sizes="(max-width: 767px) 100vw, 45vw"/><span>A moment at Mangosteen.</span></div><div className="reservation-recap-copy"><p className="reservation-eyebrow">YOUR EVENING, AT A GLANCE</p>{summary}<p>These seats are your preference, not an exclusive whole-table booking. Our team will confirm availability.</p></div></aside>
          <div className="reservation-details-form"><button ref={backRef} type="button" disabled={submissionState === 'submitting'} className="reservation-back" onClick={() => setStage('seats')}><ReservationIcon name="back"/> Change seats or arrival</button><p className="reservation-eyebrow">THE FINAL DETAILS</p><h2 id="reservation-title">Make it <em>yours.</em></h2><p>Leave your details. We’ll take care of the next part.</p><details className="reservation-mobile-recap"><summary>{chosenCluster?.label} · {guests} guests · {time}<span>Review ↓</span></summary>{summary}</details><form className="reservation-contact" aria-busy={submissionState === 'submitting'} onSubmit={sendReservation}>
            <label><span>Full name *</span><input disabled={submissionState === 'submitting'} required autoComplete="name" maxLength={80} value={name} onChange={event => { setName(event.target.value); markDirty() }} placeholder="Guest name"/></label>
            <label><span>Phone number *</span><input disabled={submissionState === 'submitting'} required type="tel" autoComplete="tel" inputMode="tel" minLength={7} maxLength={24} pattern={"[+0-9 \\(\\)\\-]{7,24}"} title="Use digits and common phone punctuation only" value={phone} onChange={event => { setPhone(event.target.value); markDirty() }} placeholder="+91"/></label>
            <label><span>Email</span><input disabled={submissionState === 'submitting'} type="email" autoComplete="email" maxLength={120} value={email} onChange={event => { setEmail(event.target.value); markDirty() }} placeholder="Optional"/></label>
            <label><span>Occasion</span><select disabled={submissionState === 'submitting'} value={occasion} onChange={event => { setOccasion(event.target.value); markDirty() }}><option>Regular visit</option><option>Birthday</option><option>Anniversary</option><option>Business meeting</option><option>Celebration</option></select></label>
            <label className="reservation-contact-wide"><span>Special requests</span><textarea disabled={submissionState === 'submitting'} maxLength={500} value={specialRequests} onChange={event => { setSpecialRequests(event.target.value); markDirty() }} placeholder="Allergies, accessibility or seating notes"/></label>
            <label className="reservation-consent"><input disabled={submissionState === 'submitting'} type="checkbox" checked={consent} onChange={event => { setConsent(event.target.checked); markDirty() }}/><span>I would like occasional Mangosteen offers. Reservation updates do not require marketing consent.</span></label>
            <div className="reservation-summary-bottom"><p>Your request will be pending until the café confirms it.</p><button className="reservation-save" type="submit" disabled={!seatsComplete || !name.trim() || phone.trim().length < 7 || submissionState === 'submitting'}>{submissionState === 'submitting' ? 'Sending securely…' : 'Request My Reservation'}<ReservationIcon name="arrow"/></button><button className="reservation-copy" type="button" onClick={copySelection}>Copy request details</button>{submissionState === 'error' && <button className="reservation-copy" type="button" onClick={saveSelection}>{saved ? 'Saved on this device' : 'Save request on this device'}</button>}{saved && <button className="reservation-copy" type="button" onClick={clearStoredDetails}>Remove saved details from this device</button>}<p className={`reservation-notice is-${submissionState}`} role="status" aria-live="polite">{notice || 'Requests reach the café CRM as pending and require staff confirmation.'}</p></div>
          </form></div>
        </div>}
      </div>
    </section>
  </div>
}
