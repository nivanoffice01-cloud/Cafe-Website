import { Component, Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent, ReactNode } from 'react'
import { Reveal } from '../components/Reveal'
import { FullMenuDialog } from '../components/FullMenuDialog'
import { GalleryDialog } from '../components/GalleryDialog'
import { ReservationDialog } from '../components/ReservationDialog'
import { cafe, reviewSummary } from '../data/cafe'
import { fullMenu } from '../data/fullMenu'
import { menuPhotoFor } from '../data/menuPhotos'
import { galleryPhotos } from '../data/gallery'
import { responsivePhotoSrcSet } from '../data/responsivePhoto'

const CinematicScene = lazy(() => import('../components/CinematicScene').then((module) => ({ default: module.CinematicScene })))

class SceneErrorBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch() { this.props.onError() }
  render() { return this.state.failed ? null : this.props.children }
}

const featuredDishes = [
  { category: 'Pizza & Pide', name: 'Margarita' },
  { category: 'Burger & sandwich', name: 'Veg Cheese Burger' },
  { category: 'Pasta', name: 'Pesto cream Pasta' },
  { category: 'Shakes', name: 'Oreo Shake', editorialLine: 'Oreo biscuit, milk, vanilla and honey.' },
  { category: 'Desserts', name: 'Chocolate Cheesecake', editorialLine: 'The evening’s final note.' },
].map((reference) => ({
  ...reference,
  ...fullMenu.find((category) => category.name === reference.category)!.items.find((item) => item.name === reference.name)!,
}))

const lifestyleMoments = [
  { title: 'Slow afternoons', note: 'A rooftop table, daylight and room to linger.', src: '/images/gallery/cafe-06.png', alt: 'Rattan chairs and a timber table on Mangosteen Café’s planted rooftop' },
  { title: 'Gather together', note: 'Long tables and an easy rhythm for shared meals.', src: '/images/gallery/cafe-07.jpg', alt: 'The light-filled interior dining room at Mangosteen Café' },
  { title: 'Golden hour', note: 'The rooftop changes as the last light settles in.', src: '/images/gallery/cafe-18.jpeg', alt: 'Rooftop tables surrounded by greenery at Mangosteen Café' },
  { title: 'Dinner after dark', note: 'Warm light, open air and an unhurried final course.', src: '/images/gallery/cafe-19.jpg', alt: 'Warm pendant lights above the evening dining room at Mangosteen Café' },
]

type Atmosphere = 'morning' | 'golden' | 'night'

const atmospheres: Record<Atmosphere, { label: string; note: string; image: string; alt: string }> = {
  morning: { label: 'Slow Morning', note: 'Coffee, soft daylight and room to pause.', image: '/images/gallery/cafe-14.png', alt: 'Mangosteen rooftop seating in soft daylight' },
  golden: { label: 'Golden Hour', note: 'The café in its warmest light.', image: '/images/highres/mangosteen_original_1_8k.jpg', alt: 'Mangosteen interior glowing beneath woven pendant lights' },
  night: { label: 'After Dark', note: 'Pendant light, open air and an unhurried evening.', image: '/images/experience/mangosteen-arrival-enhanced.jpg', alt: 'Mangosteen Café illuminated after dark' },
}

function LeafMark() {
  return <svg className="lux-leaf" viewBox="0 0 38 38" aria-hidden="true"><path d="M29.8 7.8C19.1 7.5 10.2 10.4 8.1 18.1c-1.5 5.4 2.5 9.7 7.3 8.4 8-2.2 10.8-11.2 14.4-18.7Z" fill="none" stroke="currentColor" strokeWidth="1.5"/><path d="M10.1 28.8c4.1-6.4 8.9-10.6 15.7-14.8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
}

function Arrow() { return <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3.5 10h12m-4.8-4.8 4.8 4.8-4.8 4.8" fill="none" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round"/></svg> }

function Photo({ src, alt, className = '', sizes = '(max-width: 700px) 100vw, 70vw' }: { src: string; alt: string; className?: string; sizes?: string }) {
  return <img className={`lux-photo ${className}`} src={src} srcSet={responsivePhotoSrcSet(src)} sizes={sizes} alt={alt} loading="lazy" decoding="async" />
}

function CafeFilm() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) video.pause()
    }, { threshold: .15 })
    observer.observe(video)
    return () => { observer.disconnect(); video.pause() }
  }, [])
  const toggle = async () => {
    const video = videoRef.current
    if (!video) return
    if (!video.paused) { video.pause(); return }
    try { await video.play() } catch { setPlaying(false) }
  }
  return <div className="lux-gallery-item lux-gallery-item-2 lux-gallery-film">
    <video ref={videoRef} src="/media/mangosteen-evening.mp4" poster="/images/experience/mangosteen-evening-poster.jpg" muted playsInline loop preload="none" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} aria-label="A short film of guests and food at Mangosteen Café" />
    <span>The café in motion</span>
    <button type="button" onClick={toggle} aria-label={playing ? 'Pause café film' : 'Play café film'} aria-pressed={playing}>{playing ? 'Pause' : 'Play film'}</button>
  </div>
}

export function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuSelection, setMenuSelection] = useState<{ category: string; name: string } | null>(null)
  const [featuredIndex, setFeaturedIndex] = useState(0)
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [reservationOpen, setReservationOpen] = useState(false)
  const [galleryIndex, setGalleryIndex] = useState(0)
  const [sceneReady, setSceneReady] = useState(false)
  const [showBrandReveal, setShowBrandReveal] = useState(true)
  const [hasEntered, setHasEntered] = useState(false)
  const [mapReady, setMapReady] = useState(false)
  const [atmosphere, setAtmosphere] = useState<Atmosphere>(() => {
    const hour = new Date().getHours()
    return hour >= 7 && hour < 15 ? 'morning' : hour >= 15 && hour < 19 ? 'golden' : 'night'
  })
  const [canRenderScene, setCanRenderScene] = useState(() => window.matchMedia('(min-width: 701px)').matches)
  const closeMenu = useCallback(() => setMenuOpen(false), [])
  const closeGallery = useCallback(() => setGalleryOpen(false), [])
  const openMenu = useCallback(() => {
    setMenuSelection(null)
    setMenuOpen(true)
  }, [])
  const takeSeat = useCallback(() => {
    if (!canRenderScene || !sceneReady || document.documentElement.classList.contains('scene-fallback') || window.matchMedia('(prefers-reduced-motion: reduce)').matches) openMenu()
    else window.dispatchEvent(new Event('mangosteen:take-seat'))
  }, [canRenderScene, openMenu, sceneReady])
  const openFeaturedDish = () => {
    const { category, name } = featuredDishes[featuredIndex]
    setMenuSelection({ category, name })
    setMenuOpen(true)
  }
  const openGallery = (index = 0) => { setGalleryIndex(index); setGalleryOpen(true) }
  const onSceneReady = useCallback(() => {
    setSceneReady(true)
  }, [])
  const onSceneError = useCallback(() => {
    document.documentElement.classList.add('scene-fallback')
    onSceneReady()
  }, [onSceneReady])
  const moveHeroDepth = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'touch') return
    const rect = event.currentTarget.getBoundingClientRect()
    event.currentTarget.style.setProperty('--pointer-x', String((event.clientX - rect.left) / rect.width - .5))
    event.currentTarget.style.setProperty('--pointer-y', String((event.clientY - rect.top) / rect.height - .5))
  }
  const resetHeroDepth = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.currentTarget.style.setProperty('--pointer-x', '0')
    event.currentTarget.style.setProperty('--pointer-y', '0')
  }

  useEffect(() => {
    const revealTimer = window.setTimeout(() => setShowBrandReveal(false), 1450)
    return () => window.clearTimeout(revealTimer)
  }, [])

  useEffect(() => {
    const media = window.matchMedia('(min-width: 701px)')
    const update = () => setCanRenderScene(media.matches)
    media.addEventListener('change', update)
    if (!media.matches) onSceneReady()
    return () => media.removeEventListener('change', update)
  }, [onSceneReady])

  useEffect(() => {
    const mobile = window.matchMedia('(max-width: 700px)')
    let frame = 0
    const smoothstep = (value: number, from: number, to: number) => {
      const amount = Math.min(1, Math.max(0, (value - from) / (to - from)))
      return amount * amount * (3 - 2 * amount)
    }
    const updateMobileFilm = () => {
      frame = 0
      if (!mobile.matches) return
      const journey = document.getElementById('cinematic-journey')
      const section = journey?.parentElement
      if (!journey || !section) return
      const span = Math.max(1, section.offsetHeight - window.innerHeight)
      const progress = Math.min(1, Math.max(0, (window.scrollY - section.offsetTop) / span))
      const firstCut = .76 * (1 - smoothstep(Math.abs(progress - .4), 0, .032))
      const secondCut = .76 * (1 - smoothstep(Math.abs(progress - .7), 0, .032))
      const openingDarkness = .28 * (1 - smoothstep(progress, .01, .18))
      journey.style.setProperty('--film-curtain', String(Math.max(firstCut, secondCut, openingDarkness)))
      journey.style.setProperty('--film-opening-opacity', String(1 - smoothstep(progress, .08, .24)))
      journey.style.setProperty('--film-roof-opacity', String(smoothstep(progress, .18, .26) * (1 - smoothstep(progress, .34, .4))))
      journey.style.setProperty('--film-interior-opacity', String(smoothstep(progress, .45, .52) * (1 - smoothstep(progress, .63, .69))))
      journey.style.setProperty('--film-table-opacity', String(smoothstep(progress, .74, .81) * (1 - smoothstep(progress, .84, .9))))
      journey.style.setProperty('--film-seat-opacity', String(smoothstep(progress, .88, .96)))
      journey.style.setProperty('--film-progress', String(progress))
      journey.style.setProperty('--film-mobile-exterior-opacity', String(1 - smoothstep(progress, .37, .43)))
      journey.style.setProperty('--film-mobile-interior-opacity', String(smoothstep(progress, .37, .43) * (1 - smoothstep(progress, .67, .73))))
      journey.style.setProperty('--film-mobile-table-opacity', String(smoothstep(progress, .67, .73)))
      journey.style.setProperty('--film-mobile-shift', `${Math.round(progress * -14)}px`)
      journey.style.setProperty('--film-mobile-scale', String(1 + Math.min(progress, .4) * .05))
      const seatButton = journey.querySelector<HTMLElement>('.film-seat-invite')
      const enterButton = journey.querySelector<HTMLElement>('.film-opening button')
      if (seatButton) seatButton.style.pointerEvents = progress > .82 ? 'auto' : 'none'
      if (enterButton) enterButton.style.pointerEvents = progress < .2 ? 'auto' : 'none'
    }
    const queueMobileFilmUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(updateMobileFilm)
    }
    updateMobileFilm()
    window.addEventListener('scroll', queueMobileFilmUpdate, { passive: true })
    window.addEventListener('resize', queueMobileFilmUpdate)
    mobile.addEventListener('change', queueMobileFilmUpdate)
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', queueMobileFilmUpdate)
      window.removeEventListener('resize', queueMobileFilmUpdate)
      mobile.removeEventListener('change', queueMobileFilmUpdate)
    }
  }, [])

  useEffect(() => {
    if (!mobileMenuOpen) return
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setMobileMenuOpen(false) }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [mobileMenuOpen])

  useEffect(() => {
    const updateNavigation = () => {
      const journey = document.getElementById('cinematic-journey')
      const next = window.scrollY > (journey?.parentElement?.offsetHeight ?? window.innerHeight) * 0.88
      setHasEntered((current) => current === next ? current : next)
    }
    updateNavigation()
    window.addEventListener('scroll', updateNavigation, { passive: true })
    return () => window.removeEventListener('scroll', updateNavigation)
  }, [])

  return <>
    {showBrandReveal && <div className="brand-reveal" aria-hidden="true"><LeafMark/><span className="brand-reveal-name">MANGOSTEEN</span><span className="brand-reveal-place">CAFE · INDORE</span></div>}
    <a className="skip-link" href="#main-content">Skip to content</a>

    <div className="lux-shell">
      <header className={`lux-header${hasEntered ? ' is-entered' : ''}`}>
        <a className="lux-brand" href="#top" aria-label="Mangosteen Cafe home" onClick={() => setMobileMenuOpen(false)}><LeafMark/><span>MANGOSTEEN<small>CAFE · INDORE</small></span></a>
        <button className="lux-menu-toggle" type="button" aria-label={mobileMenuOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={mobileMenuOpen} onClick={() => setMobileMenuOpen((open) => !open)}><span/><span/></button>
        <nav className={mobileMenuOpen ? 'lux-nav is-open' : 'lux-nav'} aria-label="Main navigation">
          <a href="#top" onClick={() => setMobileMenuOpen(false)}>Experience</a>
          <button type="button" onClick={() => { setMobileMenuOpen(false); openMenu() }}>Menu</button>
          <a href="#story" onClick={() => setMobileMenuOpen(false)}>Our place</a>
          <a href="#gallery" onClick={() => setMobileMenuOpen(false)}>Gallery</a>
          <a href="#visit" onClick={() => setMobileMenuOpen(false)}>Find us</a>
          <button className="lux-nav-book" type="button" onClick={() => { setMobileMenuOpen(false); setReservationOpen(true) }}>Reserve a table <Arrow/></button>
        </nav>
      </header>

      <main id="main-content">
        <section className="film-journey" id="top" aria-labelledby="film-title">
          <div className="film-sticky" id="cinematic-journey" data-atmosphere={atmosphere} onPointerMove={moveHeroDepth} onPointerLeave={resetHeroDepth}>
            <img className="film-fallback-photo" src="/images/experience/mangosteen-arrival-enhanced.jpg" alt="" aria-hidden="true" fetchPriority="high"/>
            {canRenderScene && <SceneErrorBoundary onError={onSceneError}><Suspense fallback={null}><CinematicScene menuOpen={menuOpen} onOpenMenu={() => { setMenuSelection(null); setMenuOpen(true) }} onReady={onSceneReady} /></Suspense></SceneErrorBoundary>}
            <div className="film-mobile-scene" aria-hidden="true">
              <img className="film-mobile-exterior-backdrop" src="/images/mobile/mangosteen-arrival-mobile.jpg" alt="" fetchPriority="high" />
              <img className="film-mobile-exterior" src="/images/mobile/mangosteen-arrival-mobile.jpg" alt="" fetchPriority="high" />
              <img className="film-mobile-interior" src="/images/mobile/mangosteen-interior-mobile.jpg" alt="" loading="lazy" />
              <img className="film-mobile-table" src="/images/mobile/mangosteen-table-mobile.jpg" alt="" loading="lazy" />
            </div>
            <img key={atmosphere} className="film-atmosphere-photo" src={atmospheres[atmosphere].image} srcSet={responsivePhotoSrcSet(atmospheres[atmosphere].image)} sizes="100vw" alt={atmospheres[atmosphere].alt} fetchPriority="high" />
            <div className="film-giant-word" aria-hidden="true">MANGOSTEEN</div>
            <div className="film-botanical-depth" aria-hidden="true"><img src="/images/gallery/cafe-06.png" alt="" /></div>
            <img className="film-food-reveal" alt="" aria-hidden="true" decoding="async" />
            <div className="film-curtain" aria-hidden="true"/>
            <span className="film-first-light" aria-hidden="true"/>
            <div className="film-opening">
              <p>A ROOFTOP ESCAPE · INDORE</p>
              <h1 id="film-title">Above the city.<br/><em>Beyond the ordinary.</em></h1>
              <span className="film-opening-line">Good food. Golden evenings. Moments worth staying for.</span>
              <div className="film-opening-actions"><button type="button" onClick={openMenu}>Explore the Menu</button><button type="button" onClick={() => setReservationOpen(true)}>Reserve a Table</button></div>
            </div>
            <div className="film-atmosphere" aria-label="Choose the café atmosphere"><span>{atmospheres[atmosphere].note}</span><div>{(Object.keys(atmospheres) as Atmosphere[]).map((mode) => <button key={mode} type="button" aria-pressed={atmosphere === mode} className={atmosphere === mode ? 'is-active' : ''} onClick={() => setAtmosphere(mode)}>{atmospheres[mode].label}</button>)}</div></div>
            <nav className="film-shortcuts" aria-label="Quick actions"><a href="#signatures">Skip intro</a><button type="button" onClick={openMenu}>Menu</button><button type="button" onClick={() => setReservationOpen(true)}>Reserve</button></nav>
            <div className="film-rooftop-copy" aria-hidden="true"><span>01 / ARRIVAL</span><p>The evening begins<br/><em>at Mangosteen.</em></p></div>
            <div className="film-interior-copy" aria-hidden="true"><span>02 / INSIDE</span><p>Come a little<br/><em>closer.</em></p></div>
            <div className="film-table-copy" aria-hidden="true"><span>03 / YOUR TABLE</span><p>A place is waiting.</p></div>
            <button className="film-seat-invite" type="button" onClick={takeSeat}><span>Take your seat</span><small>DISCOVER THE MENU</small></button>
            <div className="film-progress" aria-hidden="true"><span>THE EVENING</span><i/><span>SCROLL TO ENTER</span></div>
          </div>
        </section>

        <section className="lux-signatures" id="signatures" aria-labelledby="signatures-title">
          <figure className="lux-signatures-image">
            <Photo src={menuPhotoFor(featuredDishes[featuredIndex].category, featuredDishes[featuredIndex].name)!.src} alt={menuPhotoFor(featuredDishes[featuredIndex].category, featuredDishes[featuredIndex].name)!.alt}/>
            <figcaption>AN ILLUSTRATIVE DISH PORTRAIT <span>{String(featuredIndex + 1).padStart(2, '0')} / {String(featuredDishes.length).padStart(2, '0')}</span></figcaption>
          </figure>
          <div className="lux-signatures-panel">
            <p className="lux-overline">SIGNATURES FROM THE MENU</p>
            <h2 id="signatures-title">Food that brings<br/><em>you back.</em></h2>
            <p className="lux-signatures-intro">A few favourites, from the first sip to the last bite. Choose what calls to you.</p>
            <div className="lux-signature-tabs" aria-label="Featured menu dishes">
              {featuredDishes.map((dish, index) => <button key={dish.name} type="button" className={featuredIndex === index ? 'is-active' : ''} aria-pressed={featuredIndex === index} onClick={() => setFeaturedIndex(index)}><span>{String(index + 1).padStart(2, '0')}</span>{dish.name}<i aria-hidden="true">↗</i></button>)}
            </div>
            <div className="lux-signature-detail" aria-live="polite">
              <span>{featuredDishes[featuredIndex].category.toUpperCase()}</span>
              <p>{featuredDishes[featuredIndex].editorialLine ?? featuredDishes[featuredIndex].description}</p>
              <div><strong>₹{featuredDishes[featuredIndex].price}</strong><button className="lux-signature-cta" type="button" onClick={openFeaturedDish}>Explore in the menu <Arrow/></button></div>
            </div>
            <div className="lux-ingredient-notes" aria-label="Selected dish ingredients">{featuredDishes[featuredIndex].description?.split(',').slice(0, 4).map((ingredient) => <span key={ingredient}>{ingredient.trim()}</span>)}</div>
            <p className="lux-signature-note">Dish photography is illustrative; Mangosteen's plating may differ. Prices are indicative.</p>
          </div>
        </section>

        <section className="lux-editorial" id="story" aria-labelledby="story-title">
          <div className="lux-editorial-copy"><Reveal>
            <p className="lux-overline">THE MANGOSTEEN EXPERIENCE</p>
            <h2 id="story-title">More than a café,<br/><em>it's an evening experience.</em></h2>
            <p>A table. A little warmth. An evening that stays longer than expected.</p>
            <div className="lux-editorial-facts"><div><span>THE SETTING</span><strong>Open air · warm light</strong></div><div><span>THE MENU</span><strong>Indian · Italian · Asian</strong></div><div><span>FOR TWO</span><strong>{cafe.priceRange}</strong></div></div>
          </Reveal></div>
          <div className="lux-experience-collage" aria-label="Scenes from Mangosteen Café">
            <figure className="lux-collage-main"><Photo src="/images/experience/mangosteen-interior-enhanced.jpg" alt="Mangosteen Café seating under woven pendant lights in the evening"/><figcaption>Inside Mangosteen · after dark</figcaption></figure>
            <figure className="lux-collage-secondary"><Photo src="/images/gallery/cafe-06.png" alt="Rattan seating on the planted rooftop in daylight"/><figcaption>Slow afternoon light</figcaption></figure>
            <figure className="lux-collage-detail"><Photo src="/images/experience/mangosteen-table-dish.jpg" alt="A prepared Mangosteen table with a plated dish"/><figcaption>The table, ready</figcaption></figure>
            <span className="lux-collage-script">A little world above the city.</span>
          </div>
        </section>

        <section className="lux-moments" aria-labelledby="moments-title">
          <div className="lux-moments-intro"><Reveal><p className="lux-overline">THE HOURS BETWEEN</p><h2 id="moments-title">Come for a meal.<br/><em>Stay for the feeling.</em></h2><p>Different tables, different light, the same easy pace. Mangosteen moves from bright afternoons to evenings under warm lamps.</p></Reveal></div>
          <div className="lux-moments-grid">
            {lifestyleMoments.map((moment, index) => <figure className={`lux-moment lux-moment-${index + 1}`} key={moment.title}><Photo src={moment.src} alt={moment.alt} sizes="(max-width: 700px) 92vw, 44vw"/><figcaption><span>{String(index + 1).padStart(2, '0')}</span><div><strong>{moment.title}</strong><p>{moment.note}</p></div></figcaption></figure>)}
          </div>
        </section>

        <section className="lux-gallery" id="gallery" aria-labelledby="gallery-title">
          <div className="lux-gallery-heading"><Reveal><p className="lux-overline">IN ITS OWN LIGHT</p><h2 id="gallery-title">A place with<br/><em>its own tempo.</em></h2></Reveal><button className="lux-text-link" type="button" onClick={() => openGallery(0)}>View the photographs <Arrow/></button></div>
          <div className="lux-gallery-editorial">
            {galleryPhotos.slice(0, 4).map((photo, index) => index === 1 ? <CafeFilm key="cafe-film" /> : <button key={photo.src} type="button" className={`lux-gallery-item lux-gallery-item-${index + 1}`} onClick={() => openGallery(index)} aria-label={`View photo: ${photo.caption}`}><Photo src={photo.src} alt={photo.alt}/><span>{photo.caption}</span></button>)}
            <p className="lux-gallery-whisper">The first lamp.<br/>The last glass.</p>
          </div>
        </section>

        <section className="lux-review" aria-labelledby="review-title">
          <div className="lux-review-visual"><Photo src="/images/gallery/cafe-16.jpg" alt="The planted rooftop dining area at Mangosteen Café after dark"/><span>THE ROOFTOP · AFTER DARK</span></div>
          <div className="lux-review-copy"><Reveal><p className="lux-overline">CURRENT PUBLIC RATING</p><div className="lux-review-score"><div className="lux-rating-value"><strong>{cafe.rating}</strong><span>/ 5</span></div><div className="lux-review-meta"><span aria-label={`Rated ${cafe.rating} out of 5`}>★★★★★</span><small><b>{cafe.reviewCount}</b> {cafe.ratingSource}</small></div></div><h2 id="review-title">In their own words.</h2><p className="lux-review-context">{reviewSummary}</p><div className="lux-review-topics" aria-label="Public review categories"><span>Ambience</span><span>Food</span><span>Service</span></div><a className="lux-text-link" href={cafe.reviewsUrl} target="_blank" rel="noreferrer">Read verified public reviews <Arrow/></a><small className="lux-rating-updated">Public listing checked 24 November 2026. Ratings can change.</small></Reveal></div>
        </section>

        <section className="lux-visit" id="visit" aria-labelledby="visit-title">
          <Photo src="/images/experience/mangosteen-arrival-enhanced.jpg" alt="The Mangosteen Café exterior and illuminated sign at night" className="lux-visit-image"/><div className="lux-visit-shade"/>
          <div className="lux-visit-copy"><Reveal><p className="lux-overline">OLYMPUS · BICHOLI MARDANA</p><h2 id="visit-title">Your evening<br/><em>awaits.</em></h2><p>{cafe.address}</p><div className="lux-hours"><span>HOURS</span><strong>{cafe.hours}</strong></div><div className="lux-visit-actions"><button className="lux-button lux-button-gold" type="button" onClick={() => setReservationOpen(true)}>Reserve a table <Arrow/></button><button className="lux-order-link" type="button" onClick={openMenu}>Explore the menu</button><a className="lux-order-link" href={cafe.directionsUrl} target="_blank" rel="noreferrer">Get directions <Arrow/></a></div></Reveal></div>
          <div className="lux-visit-map" aria-label="Mangosteen Café location preview">
            <div className="lux-visit-map-heading"><span>FIND MANGOSTEEN</span><span>INDORE · INDIA</span></div>
            <div className={`lux-visit-map-frame${mapReady ? ' is-ready' : ''}`}>
              <div className="lux-visit-map-poster" aria-hidden="true"><span>OLYMPUS · INDORE</span><strong>Mangosteen Café</strong><small>Bicholi Mardana, Madhya Pradesh</small></div>
              <iframe src={cafe.mapEmbedUrl} title="Map showing Mangosteen Café in Indore" loading="lazy" referrerPolicy="no-referrer-when-downgrade" tabIndex={-1} onLoad={() => setMapReady(true)}/>
              <a href={cafe.directionsUrl} target="_blank" rel="noreferrer" aria-label="Open Mangosteen Café in Google Maps"/>
            </div>
            <p>Olympus, Bicholi Mardana <a href={cafe.directionsUrl} target="_blank" rel="noreferrer">Open in Google Maps ↗</a></p>
          </div>
        </section>
      </main>

      <footer className="lux-footer"><a className="lux-brand" href="#top"><LeafMark/><span>MANGOSTEEN<small>CAFE · INDORE</small></span></a><span>Made for long evenings.</span><button type="button" onClick={() => openGallery(0)}>Cafe photo gallery</button><a href="#top" className="lux-back-top">Back to top ↑</a></footer>
      <div className="lux-mobile-quick"><a href="/menu">Menu</a><button type="button" onClick={() => setReservationOpen(true)}>Reserve</button></div>
    </div>
    {menuOpen && <FullMenuDialog onClose={closeMenu} initialSelection={menuSelection}/>}
    {galleryOpen && <GalleryDialog initialIndex={galleryIndex} onClose={closeGallery}/>}
    {reservationOpen && <ReservationDialog onClose={() => setReservationOpen(false)}/>}
  </>
}
