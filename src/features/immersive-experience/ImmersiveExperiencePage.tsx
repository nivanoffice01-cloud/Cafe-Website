import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { GalleryDialog } from '../../components/GalleryDialog'
import { ReservationDialog } from '../../components/ReservationDialog'
import { cafe } from '../../data/cafe'
import { fullMenu } from '../../data/fullMenu'
import { galleryPhotos } from '../../data/gallery'
import { menuPhotoFor } from '../../data/menuPhotos'
import { SpatialEntrance } from './SpatialEntrance'
import { ViewpointExplorer } from './ViewpointExplorer'
import { atmosphere } from './data'
import './styles/immersive-experience.css'

const signatureRefs = [
  ['Pizza & Pide', 'Margarita'],
  ['Pasta', 'Pesto cream Pasta'],
  ['Burger & sandwich', 'Veg Cheese Burger'],
  ['Mocktail & Coolers', 'Virgin mojito'],
  ['Desserts', 'Chocolate Cheesecake'],
] as const

function LeafMark() { return <svg viewBox="0 0 38 38" aria-hidden="true"><path d="M29.8 7.8C19.1 7.5 10.2 10.4 8.1 18.1c-1.5 5.4 2.5 9.7 7.3 8.4 8-2.2 10.8-11.2 14.4-18.7Z" fill="none" stroke="currentColor" strokeWidth="1.3"/><path d="M10.1 28.8c4.1-6.4 8.9-10.6 15.7-14.8" fill="none" stroke="currentColor" strokeWidth="1.3"/></svg> }

export default function ImmersiveExperiencePage() {
  const entranceRef = useRef<HTMLElement>(null)
  const [progress, setProgress] = useState(0)
  const [ready, setReady] = useState(false)
  const [reservationOpen, setReservationOpen] = useState(false)
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [galleryIndex, setGalleryIndex] = useState(0)
  const [mobileNav, setMobileNav] = useState(false)
  const [mood, setMood] = useState(2)

  const signatures = useMemo(() => signatureRefs.map(([category, name]) => {
    const dish = fullMenu.find((group) => group.name === category)?.items.find((item) => item.name === name)
    return dish ? { ...dish, category, photo: menuPhotoFor(category, name) } : null
  }).filter(Boolean) as Array<{ category: string; name: string; description: string; price: number; photo?: { src: string; alt: string } }>, [])

  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      const element = entranceRef.current
      if (!element) return
      const rect = element.getBoundingClientRect()
      const range = Math.max(element.offsetHeight - window.innerHeight, 1)
      setProgress(Math.max(0, Math.min(1, -rect.top / range)))
    }
    const request = () => { if (!frame) frame = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', request, { passive: true })
    window.addEventListener('resize', request)
    return () => { cancelAnimationFrame(frame); window.removeEventListener('scroll', request); window.removeEventListener('resize', request) }
  }, [])

  useEffect(() => {
    if (!mobileNav) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setMobileNav(false) }
    window.addEventListener('keydown', close)
    return () => { document.body.style.overflow = previous; window.removeEventListener('keydown', close) }
  }, [mobileNav])

  const completeEntrance = () => entranceRef.current?.nextElementSibling?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
  const openGallery = (index: number) => { setGalleryIndex(index); setGalleryOpen(true) }
  const onCanvasReady = useCallback(() => setReady(true), [])

  return <div className="mangosteen-immersive">
    <a className="mie-skip" href="#experience-main">Skip to the experience</a>
    <header className="mie-header">
      <a className="mie-brand" href="/" aria-label="Mangosteen home"><LeafMark/><span>MANGOSTEEN<small>CAFÉ · INDORE</small></span></a>
      <nav className={mobileNav ? 'is-open' : ''} aria-label="Experience navigation">
        <a href="#arrival" onClick={() => setMobileNav(false)}>Experience</a><a href="#explore" onClick={() => setMobileNav(false)}>Explore spaces</a><a href="/menu">Menu</a><a href="#gallery" onClick={() => setMobileNav(false)}>Gallery</a><a href="#visit" onClick={() => setMobileNav(false)}>Visit</a><button onClick={() => { setMobileNav(false); setReservationOpen(true) }}>Reserve</button>
      </nav>
      <div className="mie-header-actions"><a href="/menu">Menu</a><button className="mie-reserve" onClick={() => setReservationOpen(true)}>Reserve</button><button className="mie-nav-toggle" aria-label={mobileNav ? 'Close navigation' : 'Open navigation'} aria-expanded={mobileNav} onClick={() => setMobileNav((value) => !value)}><span/><span/></button></div>
    </header>

    <main id="experience-main">
      <section ref={entranceRef} id="arrival" className="mie-entrance" style={{ '--entrance-progress': progress } as React.CSSProperties}>
        <div className="mie-entrance-sticky">
          <SpatialEntrance progress={progress} onReady={onCanvasReady}/>
          <div className="mie-grain"/>
          <div className={`mie-arrival-copy${progress > .34 ? ' is-leaving' : ''}`}>
            <p>A LITTLE WORLD ABOVE THE CITY</p><h1>Don’t just visit.<br/><em>Step inside.</em></h1><span>A little world above the city.</span>
            <div><button onClick={completeEntrance}>View café photographs <b>→</b></button><a href="/menu">Explore the menu</a><button className="mie-quiet-action" onClick={() => setReservationOpen(true)}>Reserve a table</button></div>
          </div>
          <div className={`mie-welcome-copy${progress > .72 ? ' is-visible' : ''}`}><p>YOU’RE INSIDE</p><h2>Welcome to our<br/><em>little world.</em></h2><span>Find a corner, discover the atmosphere and make yourself at home.</span><button onClick={completeEntrance}>Begin exploring ↓</button></div>
          <button className="mie-skip-entrance" onClick={completeEntrance}>Skip entrance</button>
          <div className="mie-progress"><span style={{ transform: `scaleX(${progress})` }}/><small>{String(Math.round(progress * 100)).padStart(2, '0')} / 100</small></div>
          {!ready && <div className="mie-loading" aria-live="polite">Preparing the view</div>}
        </div>
      </section>

      <ViewpointExplorer />

      <section className="mie-story" id="story" aria-labelledby="mie-story-title">
        <div className="mie-story-type"><p>THE MANGOSTEEN STORY</p><h2 id="mie-story-title">A place above<br/><em>the city.</em></h2><span>A space to slow down, share something delicious and enjoy the moments in between.</span></div>
        <figure className="mie-story-main"><img src="/images/gallery/cafe-16.jpg" alt="Woven café seating and plants at Mangosteen" loading="lazy"/><figcaption>Where the city feels further away.</figcaption></figure>
        <figure className="mie-story-detail"><img src="/images/gallery/cafe-06.png" alt="Interior detail at Mangosteen Café" loading="lazy"/><figcaption>Natural textures · warm light</figcaption></figure>
        <span className="mie-story-word" aria-hidden="true">ABOVE</span>
      </section>

      <section className="mie-culinary" id="culinary" aria-labelledby="culinary-title">
        <div className="mie-section-heading mie-on-dark"><p>FROM THE KITCHEN</p><h2 id="culinary-title">Food that keeps<br/><em>the evening going.</em></h2><span>A short edit from the existing Mangosteen menu. Photography is illustrative where noted.</span></div>
        <div className="mie-dish-track">{signatures.map((dish, index) => <article className="mie-dish" key={dish.name}>
          <span>{String(index + 1).padStart(2, '0')} / {String(signatures.length).padStart(2, '0')}</span><img src={dish.photo?.src} alt={dish.photo?.alt ?? ''} loading="lazy"/><div><small>{dish.category.toUpperCase()}</small><h3>{dish.name}</h3><p>{dish.description}</p><strong>₹{dish.price}</strong><a href={`/menu?category=${encodeURIComponent(dish.category)}&dish=${encodeURIComponent(dish.name)}`}>View dish →</a></div>
        </article>)}</div>
        <a className="mie-menu-link" href="/menu">Explore all 131 dishes →</a>
      </section>

      <section className="mie-atmosphere" id="atmosphere" aria-labelledby="atmosphere-title">
        <div className="mie-atmosphere-image"><img key={atmosphere[mood].image} src={atmosphere[mood].image} alt={`${atmosphere[mood].label} at Mangosteen Café`} loading="lazy"/><div/></div>
        <div className="mie-atmosphere-copy"><p>THE ATMOSPHERE</p><h2 id="atmosphere-title">Every hour has<br/><em>its own light.</em></h2><blockquote>{atmosphere[mood].copy}</blockquote><div>{atmosphere.map((item, index) => <button key={item.label} className={index === mood ? 'is-active' : ''} onClick={() => setMood(index)}><span>{String(index + 1).padStart(2, '0')}</span>{item.label}</button>)}</div><small>Each mood uses a distinct photograph; no simulated day-to-night claim.</small></div>
      </section>

      <section className="mie-moments" aria-labelledby="moments-title"><div className="mie-section-heading"><p>MOMENTS AT MANGOSTEEN</p><h2 id="moments-title">Made for staying<br/><em>a little longer.</em></h2></div><div className="mie-moments-track">{galleryPhotos.map((photo, index) => <figure key={photo.src}><img src={photo.src} alt={photo.alt} loading="lazy"/><figcaption><span>{String(index + 1).padStart(2, '0')}</span>{photo.caption}</figcaption></figure>)}</div></section>

      <section className="mie-gallery" id="gallery" aria-labelledby="experience-gallery-title"><div className="mie-gallery-heading"><p>THE PHOTOGRAPHS</p><h2 id="experience-gallery-title">Inside, in<br/><em>its own light.</em></h2></div>{galleryPhotos.map((photo, index) => <button key={photo.src} onClick={() => openGallery(index)}><img src={photo.src} alt={photo.alt} loading="lazy"/><span>{photo.caption} · Open</span></button>)}</section>

      <section className="mie-closing" id="visit" aria-labelledby="closing-title"><img src="/images/experience/mangosteen-table.jpg" alt="A warmly lit Mangosteen table" loading="lazy"/><div className="mie-closing-shade"/><div className="mie-closing-copy"><p>MANGOSTEEN · INDORE</p><h2 id="closing-title">Your evening<br/><em>awaits.</em></h2><span>Find a moment worth staying for.</span><div><button onClick={() => setReservationOpen(true)}>Reserve a table →</button><a href="/menu">Explore the menu</a><a href={cafe.directionsUrl} target="_blank" rel="noreferrer">Get directions ↗</a></div></div><aside><small>FIND US</small><p>{cafe.address}</p><small>HOURS</small><p>{cafe.hours}</p></aside></section>
    </main>
    <footer className="mie-footer"><a className="mie-brand" href="/"><LeafMark/><span>MANGOSTEEN<small>CAFÉ · INDORE</small></span></a><span>A little world above the city.</span><a href="#arrival">Back to the entrance ↑</a></footer>
    {reservationOpen && <ReservationDialog onClose={() => setReservationOpen(false)}/>} {galleryOpen && <GalleryDialog initialIndex={galleryIndex} onClose={() => setGalleryOpen(false)}/>} 
  </div>
}
