import { useEffect, useRef, useState } from 'react'
import { ReservationDialog } from '../../../components/ReservationDialog'
import { cafe } from '../../../data/cafe'
import { Photo } from '../components/Photo'
import { Navigation } from '../components/Navigation'
import { DiningTable } from '../sections/DiningTable'
import { GlassReveal } from '../sections/GlassReveal'
import { archPath, useMarketingMotion } from '../hooks/useMarketingMotion'
import { useMenuTransition } from '../hooks/useMenuTransition'
import '../styles/marketing.css'

const spaces = [
  { name: 'evening', title: 'Under woven light', note: 'MAIN DINING', alt: 'Mangosteen dining room with cane chairs, wood columns and pendant lighting' },
  { name: 'daylight', title: 'A room with character', note: 'THE CAFÉ', alt: 'Natural light across Mangosteen tables and exposed ceiling structure' },
  { name: 'rooftop', title: 'A little world above', note: 'THE ROOFTOP', alt: 'Mangosteen rooftop tables, plants and open views over Indore' },
]

export default function MarketingPage() {
  const root = useRef<HTMLDivElement>(null), gallery = useRef<HTMLDivElement>(null)
  const [reservation, setReservation] = useState(false), [lightbox, setLightbox] = useState<number | null>(null)
  const lightboxRef = useRef<HTMLDivElement>(null), lightboxClose = useRef<HTMLButtonElement>(null)
  const [map, setMap] = useState(false)
  const { curtain, navigate } = useMenuTransition()
  useMarketingMotion(root)
  useEffect(() => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
    if (!location.hash || navigation?.type === 'back_forward') return
    let alive = true
    document.fonts.ready.then(() => {
      if (!alive) return
      try { document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView({ behavior: 'instant' }) } catch { /* Ignore malformed fragments. */ }
    })
    return () => { alive = false }
  }, [])
  useEffect(() => {
    if (lightbox === null) return
    const previous = document.activeElement as HTMLElement | null, overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'; lightboxClose.current?.focus()
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setLightbox(null)
      if (event.key === 'ArrowRight') setLightbox(index => ((index ?? 0) + 1) % spaces.length)
      if (event.key === 'ArrowLeft') setLightbox(index => ((index ?? 0) + spaces.length - 1) % spaces.length)
      if (event.key === 'Tab') {
        const buttons = lightboxRef.current!.querySelectorAll('button'), first = buttons[0], last = buttons[buttons.length - 1]
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
      }
    }
    window.addEventListener('keydown', keyboard)
    return () => { document.body.style.overflow = overflow; window.removeEventListener('keydown', keyboard); previous?.focus({ preventScroll: true }) }
  }, [lightbox !== null])
  const reserve = () => setReservation(true)
  const browse = (direction: number) => gallery.current?.scrollBy({ left: direction * gallery.current.clientWidth * .75, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
  return <><div className="mg-site" ref={root} id="top">
    <a className="mg-skip" href="#story">Skip introduction</a>
    <Navigation reserve={reserve} menu={navigate}/>
    <main>
      <section className="mg-entrance" aria-labelledby="mg-title"><div className="mg-hero">
        <svg className="mg-mask-defs" width="0" height="0" aria-hidden="true"><defs><clipPath id="mg-arch-mask" clipPathUnits="objectBoundingBox"><path id="mg-arch-path" d={archPath(0, window.innerWidth < 900)}/></clipPath></defs></svg>
        <div className="mg-arch-photo"><picture><source media="(max-width: 600px) and (orientation: portrait)" srcSet="/marketing/arrival-portrait-640.webp 640w, /marketing/arrival-portrait-960.webp 960w" sizes="100vw"/><Photo name="arrival" alt="The illuminated handwritten Mangosteen sign, wooden facade and hanging rooftop greenery" priority sizes="(max-aspect-ratio: 16/9) 178vh, 100vw"/></picture></div>
        <svg className="mg-arch-stroke" viewBox="0 0 1 1" preserveAspectRatio="none" aria-hidden="true"><path id="mg-arch-outline" d={archPath(0, window.innerWidth < 900)} fill="none" stroke="#c5a572" strokeWidth="1" vectorEffect="non-scaling-stroke"/></svg>
        <div className="mg-hero-copy"><p className="mg-eyebrow mg-hero-support">MANGOSTEEN CAFÉ · INDORE</p><h1 id="mg-title"><span className="mg-hero-line"><span>Life tastes</span></span><span className="mg-hero-line"><span><em>better here.</em></span></span></h1><div className="mg-hero-support"><p>A little world above the city.</p><div className="mg-actions"><a className="mg-button" href="/menu" onClick={navigate}>Explore Menu <span aria-hidden="true">↗</span></a><button className="mg-button mg-button-outline" onClick={reserve}>Reserve a Table <span aria-hidden="true">↗</span></button></div></div></div>
        <div className="mg-scroll-note"><span>STAY A LITTLE</span><span>SCROLL TO DISCOVER ↓</span><span>22.7° N · INDORE</span></div><p className="mg-hero-caption">A familiar sign.<br/><em>A different pace.</em></p>
      </div></section>
      <section className="mg-story" id="story" aria-labelledby="mg-story-title"><p className="mg-eyebrow">THE MANGOSTEEN WAY</p><h2 id="mg-story-title"><span className="mg-story-line"><span>Good food.</span></span><span className="mg-story-line"><span>Good <em>company.</em></span></span><span className="mg-story-last"><span className="mg-story-photo"><Photo name="chair" alt="Cane-backed chair and wooden table in the café" sizes="(max-width: 899px) 24vw, 16vw"/></span><span className="mg-story-line"><span>Stay <em>awhile.</em></span></span></span></h2><div className="mg-story-foot"><span>01 / A PLACE TO PAUSE</span><p>Above the city, around a table.<br/>Moments worth staying for.</p></div></section>
      <section className="mg-food-story" aria-labelledby="mg-food-title"><p className="mg-eyebrow">FROM OUR TABLES</p><div className="mg-food-composition"><figure className="mg-orbit-plate"><Photo name="plate" alt="An overhead photograph of a shared plate on a Mangosteen wooden table" sizes="(max-width: 899px) 85vw, 45vw"/><figcaption>GOOD THINGS ARE BETTER SHARED</figcaption></figure><div className="mg-food-heading"><h2 id="mg-food-title"><span className="mg-line"><span>For the</span></span><span className="mg-line"><span>middle of</span></span><span className="mg-line"><span><em>the table.</em></span></span></h2><p>Something to share.<br/>Something to come back for.</p><a href="#menu-preview" className="mg-text-link">Find your next favourite <span aria-hidden="true">↓</span></a></div></div><span className="mg-food-edition">MANGOSTEEN · AT THE TABLE</span></section>
      <DiningTable menu={navigate}/>
      <section className="mg-spaces" id="cafe" aria-labelledby="mg-spaces-title"><div className="mg-section-top"><p className="mg-eyebrow">THE REAL MANGOSTEEN</p><span>02 / OUR SPACES</span></div><div className="mg-spaces-heading"><h2 id="mg-spaces-title">A little world.<br/><em>Entirely its own.</em></h2><p>Warm wood. Woven pendants.<br/>Greenery that reaches for the sky.</p></div><div className="mg-gallery-toolbar" id="gallery"><span>TAKE A LOOK AROUND</span><div><button onClick={() => browse(-1)} aria-label="Previous café photograph">←</button><button onClick={() => browse(1)} aria-label="Next café photograph">→</button></div></div><div className="mg-space-rail" ref={gallery}>{spaces.map((space, index) => <figure className="mg-space" key={space.name}><button className="mg-space-photo" onClick={() => setLightbox(index)} aria-label={`Enlarge ${space.title}`}><Photo name={space.name} alt={space.alt} sizes="(max-width: 899px) 82vw, 55vw"/><span>VIEW ↗</span></button><figcaption><span>{space.note}</span><h3>{space.title}</h3><b>0{index + 1}</b></figcaption></figure>)}</div></section>
      <GlassReveal/>
      <section className="mg-moments" aria-labelledby="mg-moments-title"><div className="mg-moments-copy"><p className="mg-eyebrow">MAKE YOURSELF AT HOME</p><h2 id="mg-moments-title">An afternoon.<br/>An evening.<br/><em>Your kind of time.</em></h2><p>Take the quiet corner.<br/>Gather around the table.<br/>Let the rooftop set the pace.</p><button className="mg-text-link" onClick={reserve}>Find your place <span aria-hidden="true">↗</span></button></div><figure className="mg-moment-tall"><Photo name="terrace" alt="Sunlight and tropical plants along the Mangosteen rooftop" sizes="(max-width: 899px) 70vw, 40vw"/><figcaption>ABOVE THE CITY</figcaption></figure><figure className="mg-moment-small"><Photo name="corner" alt="A quiet Mangosteen seating corner beneath warm pendant lamps" sizes="(max-width: 899px) 45vw, 25vw"/><figcaption>A LITTLE TIME FOR YOU</figcaption></figure></section>
      <section className="mg-closing" id="visit" aria-labelledby="mg-closing-title"><div className="mg-closing-circle" aria-hidden="true"/><div className="mg-closing-content"><p className="mg-eyebrow">THERE'S ALWAYS A REASON TO STAY</p><h2 id="mg-closing-title"><span className="mg-line"><span>Your table</span></span><span className="mg-line"><span><em>awaits.</em></span></span></h2><p>Make a little time for something wonderful.</p><div className="mg-actions"><button className="mg-button mg-button-dark" onClick={reserve}>Reserve a Table <span aria-hidden="true">↗</span></button><a className="mg-button mg-button-ink" href="/menu" onClick={navigate}>Explore Menu <span aria-hidden="true">↗</span></a></div><figure className="mg-closing-photo"><Photo name="night" alt="Mangosteen rooftop tables at blue hour" sizes="(max-width: 899px) 80vw, 40vw"/></figure></div></section>
    </main>
    <footer className="mg-footer"><div className="mg-footer-grid"><div><span className="mg-eyebrow">FIND MANGOSTEEN</span><p>{cafe.address}</p><a className="mg-text-link" href={cafe.directionsUrl} target="_blank" rel="noreferrer">Get directions <span aria-hidden="true">↗</span></a></div><div><span className="mg-eyebrow">COME BY</span><p>{cafe.hours}</p><a href={cafe.orderingUrl} target="_blank" rel="noreferrer">Mangosteen on Zomato ↗</a><button className="mg-map-toggle" onClick={() => setMap(!map)} aria-expanded={map}>{map ? 'Hide map −' : 'Show map ＋'}</button></div><div><span className="mg-eyebrow">A LITTLE MORE</span><a href="/menu" onClick={navigate}>The menu</a><a href="#gallery">Our spaces</a><button onClick={reserve}>Reserve a Table</button><a href={cafe.photoGalleryUrl} target="_blank" rel="noreferrer">Photo gallery ↗</a></div></div>{map && <iframe className="mg-map" src={cafe.mapEmbedUrl} title="Mangosteen Café location" loading="lazy" referrerPolicy="no-referrer-when-downgrade"/>}<div className="mg-footer-brand" aria-hidden="true">MANGOSTEEN</div><div className="mg-footer-bottom"><span>CAFÉ · INDORE</span><span>A LITTLE WORLD ABOVE THE CITY</span><a href="#top">BACK TO TOP ↑</a></div></footer>
    <div className="mg-route-curtain" ref={curtain} aria-hidden="true"><img src="/images/architectural/brand-lockup.png" alt=""/><span>A LITTLE WORLD ABOVE THE CITY</span></div>
    {lightbox !== null && <div className="mg-lightbox" role="dialog" aria-modal="true" aria-label="Café photograph" ref={lightboxRef}><button className="mg-lightbox-close" ref={lightboxClose} onClick={() => setLightbox(null)} aria-label="Close photograph">Close ×</button><Photo name={spaces[lightbox].name} alt={spaces[lightbox].alt} priority/><div><button onClick={() => setLightbox((lightbox + spaces.length - 1) % spaces.length)} aria-label="Previous photograph">←</button><p>{spaces[lightbox].title}</p><button onClick={() => setLightbox((lightbox + 1) % spaces.length)} aria-label="Next photograph">→</button></div></div>}
  </div>{reservation && <ReservationDialog onClose={() => setReservation(false)}/>}</>
}
