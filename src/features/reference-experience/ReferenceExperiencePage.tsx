import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, PointerEvent } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ReservationDialog } from '../../components/ReservationDialog'
import { cafe } from '../../data/cafe'
import { fullMenu, fullMenuCount } from '../../data/fullMenu'
import { menuPhotoFor } from '../../data/menuPhotos'
import './reference.css'

gsap.registerPlugin(ScrollTrigger)
const selections = [
  ['Pizza & Pide', 'Margarita'], ['Pasta', 'Pesto cream Pasta'], ['Burger & sandwich', 'Veg Cheese Burger'],
  ['Mocktail & Coolers', 'Virgin mojito'], ['Desserts', 'Chocolate Cheesecake'],
]
const dishes = selections.map(([category, name]) => {
  const item = fullMenu.find(c => c.name === category)?.items.find(i => i.name === name)
  if (!item) throw new Error(`Missing existing menu item: ${name}`)
  return { ...item, category, photo: menuPhotoFor(category, name)! }
})
const photographs = {
  dining: '/images/mobile/mangosteen_original_1_mobile.jpg',
  interior: '/reference-experience/dining-detail-960.jpg',
  room: '/images/gallery/cafe-07.jpg',
}
const money = (value: number) => `₹${value.toLocaleString('en-IN')}`
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

function RotatingTable({ active, onSelect }: { active: number; onSelect: (index: number) => void }) {
  const area = useRef<HTMLDivElement>(null)
  const wheel = useRef<HTMLDivElement>(null)
  const angle = useRef(0)
  const drag = useRef<{ angle: number; rotation: number; moved: boolean } | null>(null)
  const step = 360 / dishes.length
  useEffect(() => {
    const delta = ((-active * step - angle.current) % 360 + 540) % 360 - 180
    const target = angle.current + delta
    if (wheel.current) gsap.to(wheel.current, { rotation: target, overwrite: true, duration: reducedMotion() ? 0 : 1.15, ease: 'power3.out', onUpdate() { angle.current = Number(gsap.getProperty(wheel.current!, 'rotation')) } })
  }, [active, step])
  useEffect(() => () => { if (wheel.current) gsap.killTweensOf(wheel.current) }, [])
  function pointerAngle(event: PointerEvent) {
    const rect = wheel.current!.getBoundingClientRect()
    // Rotation keeps the bounding square centred at the same point.
    return Math.atan2(event.clientY - (rect.top + rect.height / 2), event.clientX - (rect.left + rect.width / 2)) * 180 / Math.PI
  }
  function down(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return
    gsap.killTweensOf(wheel.current)
    drag.current = { angle: pointerAngle(event), rotation: angle.current, moved: false }
    event.currentTarget.setPointerCapture(event.pointerId)
  }
  function move(event: PointerEvent<HTMLDivElement>) {
    if (!drag.current) return
    let delta = pointerAngle(event) - drag.current.angle
    delta = ((delta + 540) % 360) - 180
    if (Math.abs(delta) > 2) drag.current.moved = true
    angle.current = drag.current.rotation + delta
    gsap.set(wheel.current, { rotation: angle.current })
  }
  function up(event: PointerEvent<HTMLDivElement>) {
    if (!drag.current) return
    const moved = drag.current.moved
    drag.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    if (!moved) return
    const index = ((Math.round(-angle.current / step) % dishes.length) + dishes.length) % dishes.length
    onSelect(index)
    // Snap even when the gesture returns to the currently selected dish.
    const target = Math.round(angle.current / step) * step
    gsap.to(wheel.current, { rotation: target, overwrite: true, duration: reducedMotion() ? 0 : .8, ease: 'power3.out', onUpdate: () => { angle.current = Number(gsap.getProperty(wheel.current!, 'rotation')) } })
  }
  return <div className="ref-table-area" ref={area} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} aria-label="Rotating menu table">
    <div className="ref-table" ref={wheel}>
      <div className="ref-table-inlay" />
      {dishes.map((dish, i) => <div key={dish.name} className="ref-plate-position" style={{ '--angle': `${i * step}deg` } as CSSProperties}>
        <div className="ref-plate"><img draggable="false" src={dish.photo.src} alt={dish.photo.alt} fetchPriority={i === 0 ? 'high' : 'auto'} /></div>
      </div>)}
    </div>
  </div>
}

function GlassRoom() {
  const frame = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const [clear, setClear] = useState(false)
  const [ready, setReady] = useState(false)
  const previous = useRef<{ x: number; y: number } | null>(null)
  useEffect(() => {
    const element = frame.current!, surface = canvas.current!, image = new Image()
    let disposed = false
    function paint() {
      if (disposed || !image.complete || !image.naturalWidth) return
      const width = element.clientWidth, height = element.clientHeight
      surface.width = width; surface.height = height
      const context = surface.getContext('2d')!
      const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight)
      const w = image.naturalWidth * scale, h = image.naturalHeight * scale
      context.globalCompositeOperation = 'source-over'
      context.filter = 'blur(16px) saturate(.6)'
      context.drawImage(image, (width - w) / 2 - 20, (height - h) / 2 - 20, w + 40, h + 40)
      context.filter = 'none'; context.fillStyle = 'rgba(174,183,178,.24)'; context.fillRect(0, 0, width, height)
      setReady(true)
    }
    image.onload = paint; image.src = photographs.room
    const observer = new ResizeObserver(paint); observer.observe(element)
    return () => { disposed = true; observer.disconnect(); image.onload = null }
  }, [])
  function wipe(event: PointerEvent<HTMLCanvasElement>) {
    if (event.pointerType !== 'mouse' && !event.buttons) return
    const rect = event.currentTarget.getBoundingClientRect(), ctx = event.currentTarget.getContext('2d')!
    const x = event.clientX - rect.left, y = event.clientY - rect.top
    ctx.globalCompositeOperation = 'destination-out'; ctx.fillStyle = '#000'; ctx.strokeStyle = '#000'; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = rect.width < 700 ? 95 : 145
    ctx.beginPath(); ctx.moveTo(previous.current?.x ?? x, previous.current?.y ?? y); ctx.lineTo(x, y); ctx.stroke()
    ctx.beginPath(); ctx.arc(x, y, ctx.lineWidth / 2, 0, Math.PI * 2); ctx.fill()
    previous.current = { x, y }
  }
  return <section id="ref-room" className="ref-glass" ref={frame} aria-label="Explore the Mangosteen dining room">
    <img src={photographs.room} alt="Mangosteen's actual dining room with cane chairs and warm pendant lights" loading="lazy" />
    <canvas ref={canvas} className={clear ? 'is-clear' : ''} style={{ opacity: ready && !clear ? 1 : 0 }} onPointerMove={wipe} onPointerDown={e => { previous.current = null; wipe(e) }} onPointerLeave={() => { previous.current = null }} aria-hidden="true" />
    <h2>Come <em>in.</em></h2>
    <button className="ref-pill ref-wipe-hint" onClick={() => setClear(c => !c)}>{clear ? 'Restore the glass' : 'Wipe the glass to look inside'} <span aria-hidden="true">↗</span></button>
  </section>
}

function VisitCard({ onReserve }: { onReserve: () => void }) {
  const card = useRef<HTMLButtonElement>(null)
  function tilt(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== 'mouse' || reducedMotion()) return
    const r = event.currentTarget.getBoundingClientRect()
    gsap.to(card.current, { rotateY: ((event.clientX - r.left) / r.width - .5) * 22, rotateX: -((event.clientY - r.top) / r.height - .5) * 18, duration: .65, ease: 'power2.out' })
  }
  return <div className="ref-card-stage" onPointerMove={tilt} onPointerLeave={() => gsap.to(card.current, { rotateX: 0, rotateY: 0, duration: .8 })}>
    <button ref={card} className="ref-visit-card" onClick={onReserve} aria-label="Plan your visit to Mangosteen">
      <span className="ref-card-brand">Mangosteen</span><span className="ref-card-place">CAFÉ · INDORE</span>
      <span className="ref-card-invitation">A little world<br/><em>above the city.</em></span><span className="ref-card-arrow" aria-hidden="true">↗</span>
    </button>
  </div>
}

function dateValue(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` }
type Selection = { date: string; time: string; guests: number }

export default function ReferenceExperiencePage() {
  const root = useRef<HTMLElement>(null)
  const closeNav = useRef<HTMLButtonElement>(null)
  const openNav = useRef<HTMLButtonElement>(null)
  const [active, setActive] = useState(0)
  const [descriptions, setDescriptions] = useState(true)
  const [navigation, setNavigation] = useState(false)
  const [reservation, setReservation] = useState(false)
  const [selection, setSelection] = useState<Selection>(() => ({ date: dateValue(new Date()), time: '7:00 PM', guests: 2 }))
  const [dates] = useState(() => Array.from({ length: 6 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() + i); return d }))
  const dish = dishes[active]
  useEffect(() => {
    const previousTitle = document.title
    document.title = 'Mangosteen · A seat at our table'
    const ctx = gsap.context(() => {
      if (reducedMotion()) return
      gsap.from('.ref-hero-copy > *', { y: 22, opacity: 0, stagger: .09, duration: .85, ease: 'power3.out' })
      gsap.utils.toArray<HTMLElement>('.ref-reveal').forEach(el => gsap.fromTo(el, { y: 32, opacity: 0, filter: 'blur(8px)' }, { y: 0, opacity: 1, filter: 'blur(0px)', duration: 1.05, ease: 'power2.out', scrollTrigger: { trigger: el, start: 'top 92%', toggleActions: 'play none none reverse' } }))
      gsap.utils.toArray<HTMLElement>('.ref-story-line').forEach(el => gsap.fromTo(el, { opacity: .18, filter: 'blur(7px)' }, { opacity: 1, filter: 'blur(0px)', scrollTrigger: { trigger: el, start: 'top 88%', end: 'top 56%', scrub: .6 } }))
      gsap.to('.ref-photo-inset', { yPercent: -20, rotation: -4, ease: 'none', scrollTrigger: { trigger: '.ref-cafe-photo', start: 'top bottom', end: 'bottom top', scrub: .9 } })
    }, root)
    return () => { ctx.revert(); document.title = previousTitle }
  }, [])
  useEffect(() => {
    if (!navigation) return
    const old = document.body.style.overflow; document.body.style.overflow = 'hidden'; closeNav.current?.focus()
    function keys(event: KeyboardEvent) {
      if (event.key === 'Escape') setNavigation(false)
      if (event.key !== 'Tab') return
      const items = Array.from(document.querySelectorAll<HTMLElement>('.ref-mobile-nav button, .ref-mobile-nav a[href]'))
      if (event.shiftKey && document.activeElement === items[0]) { event.preventDefault(); items.at(-1)?.focus() }
      if (!event.shiftKey && document.activeElement === items.at(-1)) { event.preventDefault(); items[0]?.focus() }
    }
    window.addEventListener('keydown', keys)
    return () => { document.body.style.overflow = old; window.removeEventListener('keydown', keys); openNav.current?.focus() }
  }, [navigation])
  function reserve() { setNavigation(false); setReservation(true) }
  function navigate(event: React.MouseEvent<HTMLAnchorElement>, target: string) {
    event.preventDefault(); setNavigation(false)
    requestAnimationFrame(() => { document.getElementById(target)?.scrollIntoView({ behavior: reducedMotion() ? 'instant' : 'smooth' }); history.replaceState(null, '', `#${target}`) })
  }
  return <>
    <main className="ref-experience" ref={root} inert={navigation || reservation ? true : undefined}>
      <a href="#ref-menu" className="ref-skip">Skip to the food</a>
      <header className="ref-header">
        <a className="ref-wordmark" href="/" aria-label="Mangosteen homepage">Mangosteen</a>
        <nav aria-label="Main navigation"><a href="/menu">Menu</a><a href="#ref-room" onClick={e => navigate(e, 'ref-room')}>The café</a><a href="#ref-gather" onClick={e => navigate(e, 'ref-gather')}>Gather together</a><a href="#ref-visit" onClick={e => navigate(e, 'ref-visit')}>Visit us</a></nav>
        <button className="ref-pill ref-solid" onClick={reserve}>Book a table</button>
        <button className="ref-nav-toggle" aria-label="Open navigation" aria-expanded={navigation} onClick={() => setNavigation(true)} ref={openNav}>☰</button>
      </header>
      <section className="ref-hero" aria-label="Explore the menu on a rotating table">
        <RotatingTable active={active} onSelect={setActive}/>
        <div className="ref-hero-copy">
          <div className="ref-course-label"><span>Dish {active + 1} of {dishes.length}</span><div className="ref-course-tabs">{dishes.map((d, i) => <button key={d.name} aria-label={`Show ${d.name}`} aria-pressed={active === i} onClick={() => setActive(i)}><span className={i <= active ? 'is-lit' : ''}/></button>)}</div></div>
          <h1 key={dish.name}>{dish.name === 'Margarita' ? <>Margarita,<br/><em>basil & mozzarella.</em></> : dish.name === 'Pesto cream Pasta' ? <>Pesto cream<br/><em>Pasta.</em></> : <>{dish.name}</>}</h1>
          <p className="ref-dish-description" aria-live="polite">{descriptions ? dish.description || `From our ${dish.category.toLowerCase()} menu.` : dish.category}</p>
          <div className="ref-hero-actions"><button role="switch" aria-checked={descriptions} className="ref-switch" onClick={() => setDescriptions(d => !d)}><span/>Dish details</button><a href="/menu" className="ref-pill">Explore the menu</a><span>{money(dish.price)}</span></div>
          <small className="ref-photo-disclosure">Illustrative food photography · View the menu for dish details.</small>
        </div>
        <div className="ref-drag-controls"><button className="ref-pill" aria-label="Previous dish" onClick={() => setActive(a => (a + dishes.length - 1) % dishes.length)}>←</button><span>Drag the table to turn it</span><button className="ref-pill" aria-label="Next dish" onClick={() => setActive(a => (a + 1) % dishes.length)}>→</button></div>
      </section>
      <section className="ref-story ref-container">
        <h2><span className="ref-story-line">One table,</span> <em className="ref-story-line">good company,</em><br/><span className="ref-story-line">and an evening</span> <em className="ref-story-line">of your own.</em></h2>
        <div className="ref-story-footer ref-reveal"><div><p>Mangosteen Café</p><span>A little world above the city · Indore</span></div><a className="ref-pill" href="#ref-room" onClick={e => navigate(e, 'ref-room')}>See the café</a></div>
      </section>
      <section className="ref-menu-section" id="ref-menu"><div className="ref-container ref-menu-grid">
        <div className="ref-menu-intro"><h2 className="ref-reveal">At the <em>table.</em></h2><p>Pizza, pasta, something sweet. Start with what you love, then find something new.</p><p className="ref-menu-count">{fullMenuCount}<span>dishes · {fullMenu.length} categories</span></p><button role="switch" aria-checked={descriptions} className="ref-switch" onClick={() => setDescriptions(d => !d)}><span/>Dish details</button><a href="/menu" className="ref-pill ref-solid">Explore the full menu</a></div>
        <div className="ref-menu-list">{dishes.map((d, i) => <a href={`/menu?category=${encodeURIComponent(d.category)}`} className="ref-menu-row ref-reveal" key={d.name}><span className="ref-roman">{['I','II','III','IV','V'][i]}</span><div><h3>{d.name}</h3><p>{descriptions ? d.description || d.category : d.category}</p></div><span className="ref-price">{money(d.price)}</span><img src={d.photo.src} alt="" loading="lazy"/></a>)}<a href="/menu" className="ref-menu-all">All {fullMenuCount} dishes <span>↗</span></a></div>
      </div></section>
      <section className="ref-cafe-photo"><img className="ref-cafe-background" src={photographs.dining} srcSet={`${photographs.dining} 960w, /reference-experience/dining-1920.jpg 1920w`} sizes="100vw" alt="Warm wooden tables and pendant lights inside Mangosteen Café" loading="lazy"/><img className="ref-photo-inset" src={photographs.interior} alt="Another view of the café's dining space" loading="lazy"/><div className="ref-photo-copy ref-container"><h2 className="ref-reveal">A place to linger.<br/><em>A table to come back to.</em></h2><p>Warm lights, cane chairs and room for a long conversation.</p><a href="#ref-room" onClick={e => navigate(e, 'ref-room')} className="ref-pill">Step inside</a></div></section>
      <GlassRoom/>
      <section className="ref-room-invite ref-container"><h2 className="ref-reveal">Above the city.<br/><em>Stay a little longer.</em></h2><p className="ref-reveal">{cafe.hours}.<br/>Bicholi Mardana, Indore.</p><button className="ref-pill ref-solid ref-reveal" onClick={reserve}>Book a table</button></section>
      <section className="ref-occasions ref-container" id="ref-gather">
        <article><div className="ref-gather-photo"><img src="/images/gallery/cafe-19.jpg" alt="Seating at Mangosteen Café" loading="lazy"/></div><div className="ref-article-title"><h2>Gather <em>together.</em></h2><button className="ref-pill" onClick={reserve}>Enquire</button></div><p>Bring your favourite people. Choose your preferred seating and send the café a reservation request.</p><div className="ref-tags"><span>Good company</span><span>Shared plates</span><span>Long evenings</span></div></article>
        <article><VisitCard onReserve={reserve}/><div className="ref-article-title"><h2>Make an <em>evening.</em></h2><button className="ref-pill ref-solid" onClick={reserve}>Plan a visit</button></div><p>An invitation to slow down, order something good and spend a little more time together.</p><div className="ref-tags"><a href="/menu">Explore the menu</a><a href={cafe.directionsUrl} target="_blank" rel="noreferrer">Get directions ↗</a></div></article>
      </section>
      <section className="ref-book" id="ref-book"><div className="ref-container ref-book-grid"><div><h2 className="ref-reveal">Book <em>a table.</em></h2><p>Pick an evening and a place at the table. Your request goes to the café for confirmation.</p></div><form className="ref-book-form" onSubmit={e => { e.preventDefault(); reserve() }}>
        <fieldset><legend>Guests</legend><div className="ref-option-row">{[1,2,3,4,5,6].map(n => <button type="button" aria-pressed={selection.guests === n} onClick={() => setSelection(s => ({ ...s, guests: n }))} key={n}>{n}</button>)}</div></fieldset>
        <fieldset><legend>Date</legend><div className="ref-option-row ref-date-row">{dates.map(d => <button type="button" key={dateValue(d)} aria-pressed={selection.date === dateValue(d)} onClick={() => setSelection(s => ({ ...s, date: dateValue(d) }))}><small>{d.toLocaleDateString('en-IN', { weekday: 'short' })}</small>{d.getDate()}</button>)}</div></fieldset>
        <fieldset><legend>Arrival time</legend><div className="ref-option-row ref-times">{['5:00 PM','6:00 PM','7:00 PM','8:00 PM','9:00 PM'].map(t => <button key={t} type="button" aria-pressed={selection.time === t} onClick={() => setSelection(s => ({ ...s, time: t }))}>{t}</button>)}</div></fieldset>
        <button className="ref-pill ref-solid ref-book-submit" type="submit">Choose your seating</button><p className="ref-book-note">{selection.guests} guests · {selection.time}. Seating preferences are requests, not confirmed availability.</p>
      </form></div></section>
      <footer id="ref-visit" className="ref-footer ref-container"><div className="ref-footer-grid"><div><h3>Visit</h3><p>{cafe.address}</p><a href={cafe.directionsUrl} target="_blank" rel="noreferrer">Get directions ↗</a></div><div><h3>Hours</h3><p>{cafe.hours}</p><button onClick={reserve}>Reserve a table</button></div><div><h3>Explore</h3><a href="/menu">Menu</a><a href="#ref-room" onClick={e => navigate(e, 'ref-room')}>The café</a><a href="#ref-gather" onClick={e => navigate(e, 'ref-gather')}>Gather together</a></div><div><h3>Find us</h3><a href={cafe.photoGalleryUrl} target="_blank" rel="noreferrer">Café photographs ↗</a><a href={cafe.orderingUrl} target="_blank" rel="noreferrer">Order on Zomato ↗</a></div></div><a href="/" className="ref-footer-brand ref-reveal">Mangosteen</a><div className="ref-footer-bottom"><span>© {new Date().getFullYear()} Mangosteen Café · Indore</span><a href="/menu">Menu & dish details</a></div></footer>
    </main>
    {navigation && <div className="ref-mobile-nav" role="dialog" aria-modal="true" aria-label="Website navigation"><div><a href="/" className="ref-wordmark">Mangosteen</a><button ref={closeNav} className="ref-nav-toggle" onClick={() => setNavigation(false)} aria-label="Close navigation">×</button></div><nav><a href="/menu">Menu</a><a href="#ref-room" onClick={e => navigate(e, 'ref-room')}>The café</a><a href="#ref-gather" onClick={e => navigate(e, 'ref-gather')}>Gather together</a><a href="#ref-visit" onClick={e => navigate(e, 'ref-visit')}>Visit us</a><button onClick={reserve}>Reservations</button></nav><button className="ref-pill ref-solid" onClick={reserve}>Book a table</button><p>Bicholi Mardana, Indore · {cafe.hours}</p><div className="ref-nav-plates">{dishes.slice(0,3).map(d => <img key={d.name} src={d.photo.src} alt={d.photo.alt}/>)}</div></div>}
    {reservation && <ReservationDialog initialSelection={selection} onClose={() => setReservation(false)}/>}
  </>
}
