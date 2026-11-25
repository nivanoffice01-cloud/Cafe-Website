import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties, PointerEvent } from 'react'
import gsap from 'gsap'
import { motion, reducedMotion, useEditorialMotion, useDishMotion, closeLayer } from './motion'
import { ReservationDialog } from '../../components/ReservationDialog'
import { cafe } from '../../data/cafe'
import { fullMenu, fullMenuCount } from '../../data/fullMenu'
import { menuPhotoFor } from '../../data/menuPhotos'
import './reference.css'

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

function RotatingTable({ active, onSelect }: { active: number; onSelect: (index: number) => void }) {
  const area = useRef<HTMLDivElement>(null)
  const wheel = useRef<HTMLDivElement>(null)
  const angle = useRef(0)
  const reported = useRef(active)
  const emission = useRef<number | null>(null)
  const select = useRef(onSelect)
  select.current = onSelect
  const drag = useRef<{ pointer: number; last: number; time: number; velocity: number; moved: boolean; startX: number; startY: number; axis: 'pending'|'horizontal' } | null>(null)
  const step = 360 / dishes.length
  function sync() {
    if (!wheel.current) return
    angle.current = Number(gsap.getProperty(wheel.current, 'rotation'))
    wheel.current.style.setProperty('--ref-rotation', `${angle.current}deg`)
    const index = ((Math.round(-angle.current / step) % dishes.length) + dishes.length) % dishes.length
    if (reported.current !== index) { reported.current = index; emission.current=index; select.current(index) }
  }
  function settle(target: number, duration: number) {
    gsap.to(wheel.current, { rotation: target, overwrite: true, duration: reducedMotion()?0:duration, ease:'power3.out', onUpdate:sync, onComplete:sync })
  }
  useEffect(() => {
    if(emission.current===active){emission.current=null;return}
    if(drag.current)return
    const delta = ((-active * step - angle.current) % 360 + 540) % 360 - 180
    settle(angle.current + delta, .95)
  }, [active])
  useEffect(() => {
    const target=wheel.current,query=window.matchMedia('(prefers-reduced-motion: reduce)')
    const update=()=>{if(query.matches){gsap.killTweensOf(target);settle(Math.round(angle.current/step)*step,0)}}
    query.addEventListener('change',update)
    return () => {query.removeEventListener('change',update);gsap.killTweensOf(target);drag.current=null}
  }, [])
  function pointerAngle(event: PointerEvent) {
    const rect = wheel.current!.getBoundingClientRect()
    return Math.atan2(event.clientY - (rect.top + rect.height / 2), event.clientX - (rect.left + rect.width / 2)) * 180 / Math.PI
  }
  function down(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return
    gsap.killTweensOf(wheel.current)
    drag.current = { pointer:event.pointerId,last:pointerAngle(event),time:performance.now(),velocity:0,moved:false,startX:event.clientX,startY:event.clientY,axis:event.pointerType==='mouse'?'horizontal':'pending' }
    event.currentTarget.setPointerCapture(event.pointerId)
    event.currentTarget.dataset.dragging='true'
  }
  function move(event: PointerEvent<HTMLDivElement>) {
    const state=drag.current
    if(!state || event.pointerId!==state.pointer) return
    if(state.axis==='pending') {
      const dx=Math.abs(event.clientX-state.startX),dy=Math.abs(event.clientY-state.startY)
      if(dy>dx && dy>8){cancel(event);return}
      if(dx<6) return
      state.axis='horizontal'
    }
    const now=performance.now(), next=pointerAngle(event)
    const delta=((next-state.last+540)%360)-180
    state.velocity=.65*state.velocity+.35*(delta/Math.max(8,now-state.time))
    state.last=next;state.time=now;state.moved ||= Math.abs(delta)>.3
    angle.current+=delta
    gsap.set(wheel.current,{rotation:angle.current});sync()
  }
  function release(event:PointerEvent<HTMLDivElement>) {
    const state=drag.current;drag.current=null
    delete event.currentTarget.dataset.dragging
    if(event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    return state
  }
  function up(event:PointerEvent<HTMLDivElement>) {
    const state=release(event)
    if(!state?.moved) return
    const velocity=performance.now()-state.time>100?0:state.velocity
    const coast=reducedMotion()?0:Math.max(-step*.8,Math.min(step*.8,velocity*160))
    settle(Math.round((angle.current+coast)/step)*step,.75+Math.min(.45,Math.abs(coast)/100))
  }
  function cancel(event:PointerEvent<HTMLDivElement>) { release(event);settle(Math.round(angle.current/step)*step,.4) }
  return <div className="ref-table-area" ref={area} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={cancel} aria-label="Rotating menu table" role="group" tabIndex={0} onKeyDown={event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();onSelect(event.key==='Home'?0:event.key==='End'?dishes.length-1:(active+(event.key==='ArrowRight'?1:dishes.length-1))%dishes.length)}}>
    <div className="ref-table" ref={wheel}>
      <div className="ref-table-inlay" />
      {dishes.map((dish, i) => <div key={dish.name} className={`ref-plate-position${i===active?' is-selected':''}`} style={{ '--angle': `${i * step}deg` } as CSSProperties}>
        <div className="ref-plate"><img draggable="false" src={dish.photo.src} alt={dish.photo.alt} fetchPriority={i === 0 ? 'high' : 'auto'} /></div>
      </div>)}
    </div>
  </div>
}

function GlassRoom() {
  const frame = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const mask = useRef<HTMLCanvasElement | null>(null)
  const repaint = useRef<()=>void>(()=>{})
  const [clear, setClear] = useState(false)
  const [ready, setReady] = useState(false)
  const previous = useRef<{ x: number; y: number } | null>(null)
  useEffect(() => {
    const element=frame.current!,surface=canvas.current!,image=new Image()
    let disposed=false
    mask.current=document.createElement('canvas')
    function paint() {
      if(disposed || !image.complete || !image.naturalWidth || !mask.current)return
      const width=element.clientWidth,height=element.clientHeight,old=document.createElement('canvas')
      old.width=mask.current.width;old.height=mask.current.height
      old.getContext('2d')!.drawImage(mask.current,0,0)
      surface.width=width;surface.height=height;mask.current.width=width;mask.current.height=height
      if(old.width&&old.height)mask.current.getContext('2d')!.drawImage(old,0,0,width,height)
      const context=surface.getContext('2d')!,scale=Math.max(width/image.naturalWidth,height/image.naturalHeight)
      const w=image.naturalWidth*scale,h=image.naturalHeight*scale
      context.filter='blur(16px) saturate(.6)'
      context.drawImage(image,(width-w)/2-20,(height-h)/2-20,w+40,h+40)
      context.filter='none';context.fillStyle='rgba(174,183,178,.24)';context.fillRect(0,0,width,height)
      // Static condensation texture: drawn once, no hidden continuous render loop.
      let seed=27;const random=()=>{seed=(seed*16807)%2147483647;return seed/2147483647}
      for(let i=0;i<Math.min(350,width*height/4500);i++){
        const x=random()*width,y=random()*height,r=1+random()*3.5
        const shine=context.createRadialGradient(x-r*.3,y-r*.3,0,x,y,r)
        shine.addColorStop(0,'rgba(255,255,255,.26)');shine.addColorStop(.48,'rgba(255,255,255,.025)');shine.addColorStop(.8,'rgba(20,30,25,.15)');shine.addColorStop(1,'rgba(255,255,255,.08)')
        context.fillStyle=shine;context.beginPath();context.ellipse(x,y,r,r*1.25,0,0,Math.PI*2);context.fill()
      }
      const reflection=context.createLinearGradient(0,0,width,height)
      reflection.addColorStop(0,'#ffffff00');reflection.addColorStop(.4,'#ffffff0c');reflection.addColorStop(.49,'#ffffff00');context.fillStyle=reflection;context.fillRect(0,0,width,height)
      context.globalCompositeOperation='destination-out';context.drawImage(mask.current,0,0)
      context.globalCompositeOperation='source-over';setReady(true)
    }
    repaint.current=paint;image.onload=paint;image.src=photographs.room
    const observer=new ResizeObserver(paint);observer.observe(element)
    return()=>{disposed=true;observer.disconnect();image.onload=null;mask.current=null}
  },[])
  function wipe(event:PointerEvent<HTMLCanvasElement>) {
    if(event.pointerType!=='mouse'&&!event.buttons)return
    const surface=event.currentTarget,rect=surface.getBoundingClientRect(),ctx=surface.getContext('2d')!,m=mask.current?.getContext('2d')
    if(!m)return
    const point={x:event.clientX-rect.left,y:event.clientY-rect.top},from=previous.current??point,r=rect.width<700?48:73
    const steps=Math.max(1,Math.ceil(Math.hypot(point.x-from.x,point.y-from.y)/(r*.25)))
    for(let i=1;i<=steps;i++){
      const x=from.x+(point.x-from.x)*i/steps,y=from.y+(point.y-from.y)*i/steps
      for(const context of [ctx,m]){
        context.save();context.globalCompositeOperation=context===ctx?'destination-out':'source-over'
        const brush=context.createRadialGradient(x,y,0,x,y,r)
        brush.addColorStop(0,'#000');brush.addColorStop(.65,'#000');brush.addColorStop(1,'#0000')
        context.fillStyle=brush;context.fillRect(x-r,y-r,r*2,r*2);context.restore()
      }
    }
    previous.current=point
  }
  function toggle(){
    if(clear && mask.current){mask.current.getContext('2d')!.clearRect(0,0,mask.current.width,mask.current.height);repaint.current()}
    setClear(c=>!c)
  }
  return <section id="ref-room" className="ref-glass" ref={frame} aria-label="Explore the Mangosteen dining room">
    <img src={photographs.room} alt="Mangosteen's actual dining room with cane chairs and warm pendant lights" loading="lazy" />
    <canvas ref={canvas} className={clear?'is-clear':''} style={{opacity:ready&&!clear?1:0}} onPointerMove={wipe} onPointerDown={e=>{previous.current=null;e.currentTarget.setPointerCapture(e.pointerId);wipe(e)}} onPointerUp={e=>{previous.current=null;if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId)}} onPointerCancel={()=>{previous.current=null}} onPointerLeave={()=>{previous.current=null}} aria-hidden="true" />
    <h2>Come <em>in.</em></h2>
    <button className="ref-pill ref-wipe-hint" onClick={toggle} aria-label={clear?'Restore the glass':'Reveal café'}>{clear?'Restore the glass':'Wipe the glass to look inside'} <span aria-hidden="true">↗</span></button>
  </section>
}

function VisitCard({ onReserve }: { onReserve: () => void }) {
  const card = useRef<HTMLButtonElement>(null)
  useEffect(()=>{const target=card.current;return()=>{gsap.killTweensOf(target)}},[])
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
  const [currentSection,setCurrentSection]=useState('')
  useEffect(()=>{
    const observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting)setCurrentSection(entry.target.id)},{rootMargin:'-15% 0px -45% 0px'})
    root.current?.querySelectorAll('.ref-hero, #ref-room, #ref-gather, #ref-visit').forEach(el=>observer.observe(el))
    return()=>observer.disconnect()
  },[])
  const [descriptions, setDescriptions] = useState(true)
  const [navigation, setNavigation] = useState(false)
  const [reservation, setReservation] = useState(false)
  const [selection, setSelection] = useState<Selection>(() => ({ date: dateValue(new Date()), time: '7:00 PM', guests: 2 }))
  const [dates] = useState(() => Array.from({ length: 6 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() + i); return d }))
  useEditorialMotion(root)
  const {displayed,element:dishElement}=useDishMotion(active)
  const dish = dishes[displayed]
  const navLayer=useRef<HTMLDivElement>(null)
  const reservationLayer=useRef<HTMLDivElement>(null)
  const closeNavigation=useCallback(()=>closeLayer(navLayer.current,()=>setNavigation(false)),[])
  const closeReservation=useCallback(()=>closeLayer(reservationLayer.current,()=>setReservation(false)),[])
  useLayoutEffect(()=>{
    if(!reservation || !reservationLayer.current) return
    const context=gsap.context(()=>{if(reducedMotion())return;gsap.timeline().from('.reservation-backdrop',{opacity:0,duration:.3},0).from('.reservation-dialog',{y:24,opacity:0,duration:.55,ease:motion.ease},0).from('.reservation-header, .reservation-field',{y:10,opacity:0,duration:.35,stagger:.04},.12)},reservationLayer)
    return ()=>context.revert()
  },[reservation])
  useEffect(() => {
    const previousTitle = document.title
    document.title = 'Mangosteen · A seat at our table'
    return () => { document.title = previousTitle }
  }, [])
  useEffect(() => {
    if (!navigation) return
    const old = document.body.style.overflow; document.body.style.overflow = 'hidden'; closeNav.current?.focus()
    const context=gsap.context(()=>{if(reducedMotion())return;gsap.timeline().from(navLayer.current,{xPercent:100,duration:.42,ease:motion.ease},0).from('.ref-mobile-nav nav > *',{y:22,opacity:0,stagger:motion.stagger,duration:.45},.09)},navLayer)
    function keys(event: KeyboardEvent) {
      if (event.key === 'Escape') closeNavigation()
      if (event.key !== 'Tab') return
      const items = Array.from(document.querySelectorAll<HTMLElement>('.ref-mobile-nav button, .ref-mobile-nav a[href]'))
      if (event.shiftKey && document.activeElement === items[0]) { event.preventDefault(); items.at(-1)?.focus() }
      if (!event.shiftKey && document.activeElement === items.at(-1)) { event.preventDefault(); items[0]?.focus() }
    }
    window.addEventListener('keydown', keys)
    return () => { context.revert();gsap.killTweensOf(navLayer.current);document.body.style.overflow = old; window.removeEventListener('keydown', keys); openNav.current?.focus() }
  }, [navigation,closeNavigation])
  function reserve() {
    if(navigation)closeLayer(navLayer.current,()=>{setNavigation(false);setReservation(true)})
    else setReservation(true)
  }
  function navigate(event: React.MouseEvent<HTMLAnchorElement>, target: string) {
    event.preventDefault()
    const travel=()=>{setNavigation(false);requestAnimationFrame(() => { document.getElementById(target)?.scrollIntoView({ behavior: reducedMotion() ? 'instant' : 'smooth' }); history.replaceState(history.state, '', `#${target}`) })}
    if(navigation)closeLayer(navLayer.current,travel);else travel()
  }
  return <>
    <main className="ref-experience" ref={root} inert={navigation || reservation ? true : undefined}>
      <a href="#ref-menu" className="ref-skip">Skip to the food</a>
      <header className="ref-header">
        <a className="ref-wordmark" href="/" aria-label="Mangosteen homepage">Mangosteen</a>
        <nav aria-label="Main navigation"><a href="/menu">Menu</a><a href="#ref-room" aria-current={currentSection === 'ref-room' ? 'location' : undefined} onClick={e => navigate(e, 'ref-room')}>The café</a><a href="#ref-gather" aria-current={currentSection === 'ref-gather' ? 'location' : undefined} onClick={e => navigate(e, 'ref-gather')}>Gather together</a><a href="#ref-visit" aria-current={currentSection === 'ref-visit' ? 'location' : undefined} onClick={e => navigate(e, 'ref-visit')}>Visit us</a></nav>
        <button className="ref-pill ref-solid" onClick={reserve}>Book a table</button>
        <button className="ref-nav-toggle" aria-label="Open navigation" aria-expanded={navigation} onClick={() => setNavigation(true)} ref={openNav}>☰</button>
      </header>
      <section className="ref-hero" aria-label="Explore the menu on a rotating table">
        <RotatingTable active={active} onSelect={setActive}/>
        <div className="ref-hero-copy">
          <div className="ref-course-label"><span>Dish {displayed + 1} of {dishes.length}</span><div className="ref-course-tabs">{dishes.map((d, i) => <button key={d.name} aria-label={`Show ${d.name}`} aria-pressed={active === i} onClick={() => setActive(i)}><span className={i <= active ? 'is-lit' : ''}/></button>)}</div></div>
          <div className="ref-dish-motion" ref={dishElement}><h1>{dish.name === 'Margarita' ? <>Margarita,<br/><em>basil & mozzarella.</em></> : dish.name === 'Pesto cream Pasta' ? <>Pesto cream<br/><em>Pasta.</em></> : <>{dish.name}</>}</h1>
          <p className="ref-dish-description" aria-live="polite">{descriptions ? dish.description || `From our ${dish.category.toLowerCase()} menu.` : dish.category}</p></div>
          <div className="ref-hero-actions"><button role="switch" aria-checked={descriptions} className="ref-switch" onClick={() => setDescriptions(d => !d)}><span/>Dish details</button><a href="/menu" className="ref-pill">Explore the menu</a><span>{money(dishes[active].price)}</span></div>
          <small className="ref-photo-disclosure">Illustrative food photography · View the menu for dish details.</small>
        </div>
        <div className="ref-drag-controls"><button className="ref-pill" aria-label="Previous dish" onClick={() => setActive(a => (a + dishes.length - 1) % dishes.length)}>←</button><span>Drag the table to turn it</span><button className="ref-pill" aria-label="Next dish" onClick={() => setActive(a => (a + 1) % dishes.length)}>→</button></div>
      </section>
      <section className="ref-story ref-container">
        <h2><span className="ref-story-line">One table,</span> <em className="ref-story-line">good company,</em><br/><span className="ref-story-line">and an evening</span> <em className="ref-story-line">of your own.</em></h2>
        <div className="ref-story-footer ref-reveal"><div><p>Mangosteen Café</p><span>A little world above the city · Indore</span></div><a className="ref-pill" href="#ref-room" aria-current={currentSection === 'ref-room' ? 'location' : undefined} onClick={e => navigate(e, 'ref-room')}>See the café</a></div>
      </section>
      <section className="ref-menu-section" id="ref-menu"><div className="ref-container ref-menu-grid">
        <div className="ref-menu-intro"><h2 className="ref-reveal">At the <em>table.</em></h2><p>Pizza, pasta, something sweet. Start with what you love, then find something new.</p><p className="ref-menu-count">{fullMenuCount}<span>dishes · {fullMenu.length} categories</span></p><button role="switch" aria-checked={descriptions} className="ref-switch" onClick={() => setDescriptions(d => !d)}><span/>Dish details</button><a href="/menu" className="ref-pill ref-solid">Explore the full menu</a></div>
        <div className="ref-menu-list">{dishes.map((d, i) => <a href={`/menu?category=${encodeURIComponent(d.category)}`} className="ref-menu-row ref-reveal" key={d.name}><span className="ref-roman">{['I','II','III','IV','V'][i]}</span><div><h3>{d.name}</h3><p>{descriptions ? d.description || d.category : d.category}</p></div><span className="ref-price">{money(d.price)}</span><img src={d.photo.src} alt="" loading="lazy"/></a>)}<a href="/menu" className="ref-menu-all">All {fullMenuCount} dishes <span>↗</span></a></div>
      </div></section>
      <section className="ref-cafe-photo"><img className="ref-cafe-background" src={photographs.dining} srcSet={`${photographs.dining} 960w, /reference-experience/dining-1920.jpg 1920w`} sizes="100vw" alt="Warm wooden tables and pendant lights inside Mangosteen Café" loading="lazy"/><img className="ref-photo-inset" src={photographs.interior} alt="Another view of the café's dining space" loading="lazy"/><div className="ref-photo-copy ref-container"><h2 className="ref-reveal">A place to linger.<br/><em>A table to come back to.</em></h2><p>Warm lights, cane chairs and room for a long conversation.</p><a href="#ref-room" aria-current={currentSection === 'ref-room' ? 'location' : undefined} onClick={e => navigate(e, 'ref-room')} className="ref-pill">Step inside</a></div></section>
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
      <footer id="ref-visit" className="ref-footer ref-container"><div className="ref-footer-grid"><div><h3>Visit</h3><p>{cafe.address}</p><a href={cafe.directionsUrl} target="_blank" rel="noreferrer">Get directions ↗</a></div><div><h3>Hours</h3><p>{cafe.hours}</p><button onClick={reserve}>Reserve a table</button></div><div><h3>Explore</h3><a href="/menu">Menu</a><a href="#ref-room" aria-current={currentSection === 'ref-room' ? 'location' : undefined} onClick={e => navigate(e, 'ref-room')}>The café</a><a href="#ref-gather" aria-current={currentSection === 'ref-gather' ? 'location' : undefined} onClick={e => navigate(e, 'ref-gather')}>Gather together</a></div><div><h3>Find us</h3><a href={cafe.photoGalleryUrl} target="_blank" rel="noreferrer">Café photographs ↗</a><a href={cafe.orderingUrl} target="_blank" rel="noreferrer">Order on Zomato ↗</a></div></div><a href="/" className="ref-footer-brand ref-reveal">Mangosteen</a><div className="ref-footer-bottom"><span>© {new Date().getFullYear()} Mangosteen Café · Indore</span><a href="/menu">Menu & dish details</a></div></footer>
    </main>
    {navigation && <div className="ref-mobile-nav" ref={navLayer} role="dialog" aria-modal="true" aria-label="Website navigation"><div><a href="/" className="ref-wordmark">Mangosteen</a><button ref={closeNav} className="ref-nav-toggle" onClick={closeNavigation} aria-label="Close navigation">×</button></div><nav><a href="/menu">Menu</a><a href="#ref-room" aria-current={currentSection === 'ref-room' ? 'location' : undefined} onClick={e => navigate(e, 'ref-room')}>The café</a><a href="#ref-gather" aria-current={currentSection === 'ref-gather' ? 'location' : undefined} onClick={e => navigate(e, 'ref-gather')}>Gather together</a><a href="#ref-visit" aria-current={currentSection === 'ref-visit' ? 'location' : undefined} onClick={e => navigate(e, 'ref-visit')}>Visit us</a><button onClick={reserve}>Reservations</button></nav><button className="ref-pill ref-solid" onClick={reserve}>Book a table</button><p>Bicholi Mardana, Indore · {cafe.hours}</p><div className="ref-nav-plates">{dishes.slice(0,3).map(d => <img key={d.name} src={d.photo.src} alt={d.photo.alt}/>)}</div></div>}
    {reservation && <div className="ref-reservation-motion" ref={reservationLayer}><ReservationDialog initialSelection={selection} onClose={closeReservation}/></div>}
  </>
}
