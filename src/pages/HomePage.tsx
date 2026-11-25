import { Component, Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Reveal } from '../components/Reveal'
import { GalleryDialog } from '../components/GalleryDialog'
import { ReservationDialog } from '../components/ReservationDialog'
import { cafe, reviewSummary } from '../data/cafe'
import { fullMenu } from '../data/fullMenu'
import { menuPhotoFor } from '../data/menuPhotos'
import { galleryPhotos } from '../data/gallery'
import { responsivePhotoSrcSet } from '../data/responsivePhoto'

const CinematicExperience = lazy(() => import('../components/cinematic/CinematicExperience').then((module) => ({ default: module.CinematicExperience })))

class SceneErrorBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch(error: Error) {
    console.error('[Mangosteen cinematic boundary]', error)
    this.props.onError()
  }
  render() { return this.state.failed ? <section className="cinema-static-fallback" id="top" aria-label="Mangosteen cinematic experience unavailable"/> : this.props.children }
}

const featuredDishes = [
  { category: 'Pizza & Pide', name: 'Margarita' },
  { category: 'Burger & sandwich', name: 'Veg Cheese Burger' },
  { category: 'Pasta', name: 'Pesto cream Pasta' },
  { category: 'Mocktail & Coolers', name: 'Virgin mojito', editorialLine: 'A cool pause between courses.' },
  { category: 'Desserts', name: 'Chocolate Cheesecake', editorialLine: 'The evening’s final note.' },
].map((reference) => ({
  ...reference,
  ...fullMenu.find((category) => category.name === reference.category)!.items.find((item) => item.name === reference.name)!,
}))

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
  const [featuredIndex, setFeaturedIndex] = useState(0)
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [reservationOpen, setReservationOpen] = useState(false)
  const [galleryIndex, setGalleryIndex] = useState(0)
  const [hasEntered, setHasEntered] = useState(false)
  const [mapReady, setMapReady] = useState(false)
  const menuToggleRef = useRef<HTMLButtonElement>(null)
  const mobileNavRef = useRef<HTMLElement>(null)
  const closeGallery = useCallback(() => setGalleryOpen(false), [])
  const openMenu = useCallback(() => {
    window.location.assign('/menu')
  }, [])
  const openFeaturedDish = () => {
    const { category, name } = featuredDishes[featuredIndex]
    window.location.assign(`/menu?category=${encodeURIComponent(category)}&dish=${encodeURIComponent(name)}`)
  }
  const openGallery = (index = 0) => { setGalleryIndex(index); setGalleryOpen(true) }
  const onSceneReady = useCallback(() => document.documentElement.classList.add('cinema-ready'), [])
  const onSceneError = useCallback(() => {
    document.documentElement.classList.add('scene-fallback')
    onSceneReady()
  }, [onSceneReady])

  useEffect(() => {
    if (!mobileMenuOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const focusable = mobileNavRef.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')
    focusable?.[0]?.focus()
    const handleNavigationKeys = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false)
        menuToggleRef.current?.focus()
        return
      }
      if (event.key !== 'Tab' || !focusable?.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    window.addEventListener('keydown', handleNavigationKeys)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleNavigationKeys)
    }
  }, [mobileMenuOpen])

  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 701px)')
    const closeAtDesktop = () => { if (desktop.matches) setMobileMenuOpen(false) }
    desktop.addEventListener('change', closeAtDesktop)
    return () => desktop.removeEventListener('change', closeAtDesktop)
  }, [])

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
    <a className="skip-link" href="#main-content">Skip to content</a>

    <div className="lux-shell">
      <header className={`lux-header${hasEntered ? ' is-entered' : ''}`}>
        <a className="lux-brand" href="#top" aria-label="Mangosteen Cafe home" onClick={() => setMobileMenuOpen(false)}><LeafMark/><span>MANGOSTEEN<small>CAFE · INDORE</small></span></a>
        <button ref={menuToggleRef} className="lux-menu-toggle" type="button" aria-label={mobileMenuOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={mobileMenuOpen} aria-controls="primary-navigation" onClick={() => setMobileMenuOpen((open) => !open)}><span/><span/></button>
        <nav ref={mobileNavRef} id="primary-navigation" className={mobileMenuOpen ? 'lux-nav is-open' : 'lux-nav'} aria-label="Main navigation">
          <a href="#top" onClick={() => setMobileMenuOpen(false)}>Experience</a>
          <button type="button" onClick={() => { setMobileMenuOpen(false); openMenu() }}>Menu</button>
          <a href="#story" onClick={() => setMobileMenuOpen(false)}>Our place</a>
          <a href="#gallery" onClick={() => setMobileMenuOpen(false)}>Gallery</a>
          <a href="#visit" onClick={() => setMobileMenuOpen(false)}>Find us</a>
          <button className="lux-nav-book" type="button" onClick={() => { setMobileMenuOpen(false); setReservationOpen(true) }}>Reserve a table <Arrow/></button>
        </nav>
      </header>

      <main id="main-content">
        <SceneErrorBoundary onError={onSceneError}><Suspense fallback={<section className="cinema-static-fallback" id="top"/>}><CinematicExperience onMenu={openMenu} onReserve={() => setReservationOpen(true)} onReady={onSceneReady} onFailure={onSceneError}/></Suspense></SceneErrorBoundary>

        <section className="lux-signatures" id="signatures" aria-labelledby="signatures-title">
          <figure className="lux-signatures-image">
            <Photo src={menuPhotoFor(featuredDishes[featuredIndex].category, featuredDishes[featuredIndex].name)!.src} alt={menuPhotoFor(featuredDishes[featuredIndex].category, featuredDishes[featuredIndex].name)!.alt}/>
            <figcaption>AN ILLUSTRATIVE DISH PORTRAIT <span>{String(featuredIndex + 1).padStart(2, '0')} / {String(featuredDishes.length).padStart(2, '0')}</span></figcaption>
          </figure>
          <div className="lux-signatures-panel">
            <p className="lux-overline">A FEW FAVOURITES</p>
            <h2 id="signatures-title">For the table.<br/><em>For the moment.</em></h2>
            <p className="lux-signatures-intro">A few favourites, from the first sip to the last bite. Choose what calls to you.</p>
            <div className="lux-signature-tabs" aria-label="Featured menu dishes">
              {featuredDishes.map((dish, index) => <button key={dish.name} type="button" className={featuredIndex === index ? 'is-active' : ''} aria-pressed={featuredIndex === index} onClick={() => setFeaturedIndex(index)}><span>{String(index + 1).padStart(2, '0')}</span>{dish.name}<i aria-hidden="true">↗</i></button>)}
            </div>
            <div className="lux-signature-detail" aria-live="polite">
              <span>{featuredDishes[featuredIndex].category.toUpperCase()}</span>
              <p>{featuredDishes[featuredIndex].editorialLine ?? featuredDishes[featuredIndex].description}</p>
              <div><strong>₹{featuredDishes[featuredIndex].price}</strong><button className="lux-signature-cta" type="button" onClick={openFeaturedDish}>Explore in the menu <Arrow/></button></div>
            </div>
            <p className="lux-signature-note">Dish photography is illustrative; Mangosteen's plating may differ. Prices are indicative.</p>
          </div>
        </section>

        <section className="lux-editorial" id="story" aria-labelledby="story-title">
          <div className="lux-editorial-copy"><Reveal>
            <p className="lux-overline">MANGOSTEEN</p>
            <h2 id="story-title">A place above<br/><em>the city.</em></h2>
            <p>A table. A little warmth. An evening that stays longer than expected.</p>
            <div className="lux-editorial-facts"><div><span>THE SETTING</span><strong>Open air · warm light</strong></div><div><span>THE MENU</span><strong>Indian · Italian · Asian</strong></div><div><span>FOR TWO</span><strong>{cafe.priceRange}</strong></div></div>
          </Reveal></div>
          <figure className="lux-editorial-image"><Photo src="/images/experience/mangosteen-interior-enhanced.jpg" alt="Mangosteen Café seating under woven pendant lights in the evening"/><figcaption>Inside Mangosteen <span>02 / 04</span></figcaption></figure>
        </section>

        <section className="lux-gallery" id="gallery" aria-labelledby="gallery-title">
          <div className="lux-gallery-heading"><Reveal><p className="lux-overline">IN ITS OWN LIGHT</p><h2 id="gallery-title">A place with<br/><em>its own tempo.</em></h2></Reveal><button className="lux-text-link" type="button" onClick={() => openGallery(0)}>View the photographs <Arrow/></button></div>
          <div className="lux-gallery-editorial">
            {galleryPhotos.slice(0, 4).map((photo, index) => index === 1 ? <CafeFilm key="cafe-film" /> : <button key={photo.src} type="button" className={`lux-gallery-item lux-gallery-item-${index + 1}`} onClick={() => openGallery(index)} aria-label={`View photo: ${photo.caption}`}><Photo src={photo.src} alt={photo.alt}/><span>{photo.caption}</span></button>)}
            <p className="lux-gallery-whisper">The first lamp.<br/>The last glass.</p>
          </div>
        </section>

        <section className="lux-review" aria-labelledby="review-title">
          <div className="lux-review-visual"><Photo src="/images/experience/mangosteen-table-enhanced.jpg" alt="Warmly lit dining area and wooden table at Mangosteen Café"/><span>AN EVENING AT MANGOSTEEN</span></div>
          <div className="lux-review-copy"><Reveal><p className="lux-overline">GOOGLE RATING</p><div className="lux-review-score"><div className="lux-rating-value"><strong>{cafe.rating}</strong><span>/ 5</span></div><div className="lux-review-meta"><span aria-label={`Rated ${cafe.rating} out of 5`}>★★★★★</span><small><b>{cafe.reviewCount}</b> reviews on Google</small></div></div><h2 id="review-title">What guests say.</h2><blockquote><p>“Amazing taste and very aesthetic ambiance. Loved the whole experience.”</p><cite>Guest review on Google</cite></blockquote><p>{reviewSummary}</p><a className="lux-text-link" href="https://www.google.com/search?q=Mangosteen+Cafe+Indore+reviews" target="_blank" rel="noreferrer">Read guest reviews <Arrow/></a></Reveal></div>
        </section>

        <section className="lux-visit" id="visit" aria-labelledby="visit-title">
          <Photo src="/images/experience/mangosteen-arrival-enhanced.jpg" alt="The Mangosteen Café exterior and illuminated sign at night" className="lux-visit-image"/><div className="lux-visit-shade"/>
          <div className="lux-visit-copy"><Reveal><p className="lux-overline">OLYMPUS · BICHOLI MARDANA</p><h2 id="visit-title">Stay for<br/><em>the evening.</em></h2><p>{cafe.address}</p><div className="lux-hours"><span>HOURS</span><strong>{cafe.hours}</strong></div><div className="lux-visit-actions"><button className="lux-button lux-button-gold" type="button" onClick={() => setReservationOpen(true)}>Reserve a table <Arrow/></button><a className="lux-order-link" href={cafe.directionsUrl} target="_blank" rel="noreferrer">Get directions <Arrow/></a></div></Reveal></div>
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
    {galleryOpen && <GalleryDialog initialIndex={galleryIndex} onClose={closeGallery}/>}
    {reservationOpen && <ReservationDialog onClose={() => setReservationOpen(false)}/>}
  </>
}
