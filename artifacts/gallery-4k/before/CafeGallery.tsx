import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { GalleryGlassEntrance } from './GalleryGlassEntrance'
import { galleryPhoto } from './gallery-photos'
import { galleryCollection as photographs, galleryPreview } from './gallery-collection'
import './cafe-gallery.css'

function PhotoViewer({ index, onChange, onClose, pauseScroll, resumeScroll }: {
  index: number | null
  onChange: (index: number | null) => void
  onClose: () => void
  pauseScroll: () => void
  resumeScroll: () => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const close = useRef<HTMLButtonElement>(null), previousPhoto = useRef(index ?? 0)
  const collection = useRef<HTMLDivElement>(null), collectionScroll = useRef(0)
  const entry = index === null ? null : photographs[index]
  const photo = entry ? galleryPhoto(entry.key) : null
  useEffect(() => {
    const element = dialog.current!
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    pauseScroll()
    document.body.style.overflow = 'hidden'
    element.showModal()
    return () => {
      element.close()
      document.body.style.overflow = previousOverflow
      resumeScroll()
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true })
    }
  }, [pauseScroll, resumeScroll])
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (index === null) {
        if (collection.current) collection.current.scrollTop = collectionScroll.current
        const selected = dialog.current?.querySelector<HTMLButtonElement>(`[data-photo-index="${previousPhoto.current}"]`)
        selected?.focus({ preventScroll: true })
        if (selected && collection.current) {
          const rect = selected.getBoundingClientRect(), bounds = collection.current.getBoundingClientRect()
          if (rect.top < bounds.top || rect.bottom > bounds.bottom) selected.scrollIntoView({ block: 'nearest' })
        }
      }
      else { previousPhoto.current = index; close.current?.focus({ preventScroll: true }) }
    })
    return () => cancelAnimationFrame(frame)
  }, [index])
  const move = (direction: number) => { if (index !== null) onChange((index + direction + photographs.length) % photographs.length) }

  return <dialog ref={dialog} className={`cafe-gallery-viewer${index === null ? ' is-collection' : ''}`} aria-label="Mangosteen photo gallery" data-lenis-prevent
    onCancel={event => { event.preventDefault(); onClose() }}
    onClick={event => { if (event.target === event.currentTarget) onClose() }}
    onKeyDown={event => {
      if (index !== null && (event.key === 'ArrowRight' || event.key === 'ArrowLeft')) { event.preventDefault(); move(event.key === 'ArrowRight' ? 1 : -1) }
      if (event.key === 'Tab') {
        const controls = Array.from(event.currentTarget.querySelectorAll('button'))
        if (event.shiftKey && document.activeElement === controls[0]) { event.preventDefault(); controls.at(-1)?.focus() }
        else if (!event.shiftKey && document.activeElement === controls.at(-1)) { event.preventDefault(); controls[0]?.focus() }
      }
    }}>
    <div className="cafe-gallery-viewer-content">
      <div className="cafe-gallery-viewer-top"><span>MANGOSTEEN · INDORE</span><button ref={close} type="button" onClick={onClose} aria-label="Close photo gallery"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"><path d="m5 5 14 14M5 19 19 5"/></svg></button></div>
      {index === null ? <div ref={collection} className="cafe-gallery-collection" data-lenis-prevent>
        <header><span>OUR SPACES · {photographs.length} PHOTOGRAPHS</span><h2>Mangosteen, <em>in pictures.</em></h2><p>A little closer to our little world.</p></header>
        <div className="cafe-gallery-collection-grid">{photographs.map((item, i) => {
          const image = galleryPhoto(item.key)
          return <button type="button" key={item.key} data-photo-index={i} onClick={() => { collectionScroll.current = collection.current?.scrollTop ?? 0; onChange(i) }} aria-label={`Open photograph: ${item.title}`}>
            <span className="cafe-gallery-collection-image"><img src={image.src} srcSet={image.srcSet} sizes="(min-width: 1100px) 33vw, (min-width: 600px) 50vw, 100vw" width={image.width} height={image.height} alt={image.alt} style={{ objectPosition: item.position }} loading="lazy" decoding="async"/></span>
            <span className="cafe-gallery-collection-caption"><strong>{item.title}</strong><span>{item.detail} <span aria-hidden="true">↗</span></span></span>
          </button>
        })}</div>
      </div> : entry && photo && <>
        <figure className="cafe-gallery-viewer-image"><img key={entry.key} src={photo.src} srcSet={photo.srcSet} sizes="95vw" alt={photo.alt} decoding="async"/></figure>
        <div className="cafe-gallery-viewer-bottom"><div aria-live="polite" aria-atomic="true"><p>{entry.title}</p><span>{String(index + 1).padStart(2, '0')} / {String(photographs.length).padStart(2, '0')} · {entry.detail}</span></div><nav aria-label="Photo navigation"><button className="cafe-gallery-back" type="button" onClick={() => onChange(null)}>All images</button><button type="button" onClick={() => move(-1)} aria-label="Previous café photo">←</button><button type="button" onClick={() => move(1)} aria-label="Next café photo">→</button></nav></div>
      </>}
    </div>
  </dialog>
}

export function CafeGallery({ pauseScroll, resumeScroll }: { pauseScroll: () => void; resumeScroll: () => void }) {
  const [active, setActive] = useState<number | null>(null)
  const [viewerOpen, setViewerOpen] = useState(false)
  const openPhoto = (index: number | null) => { setActive(index); setViewerOpen(true) }
  const spaces = useRef<HTMLDivElement>(null), viewport = useRef<HTMLDivElement>(null), track = useRef<HTMLDivElement>(null)
  const bar = useRef<HTMLSpanElement>(null), position = useRef<HTMLSpanElement>(null)
  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger)
    const element = spaces.current!, window = viewport.current!, rail = track.current!
    const update = (progress: number) => {
      const tile = Math.round(progress * galleryPreview.length)
      if (bar.current) bar.current.style.transform = `scaleX(${(1 + progress * galleryPreview.length) / (galleryPreview.length + 1)})`
      if (position.current) position.current.textContent = tile === galleryPreview.length ? 'VIEW ALL' : `${String(tile + 1).padStart(2, '0')} / ${String(galleryPreview.length).padStart(2, '0')}`
    }
    update(0)
    const nativeScroll = () => update(window.scrollLeft / Math.max(1, window.scrollWidth - window.clientWidth))
    window.addEventListener('scroll', nativeScroll, { passive: true })
    const media = gsap.matchMedia()
    media.add('(min-width: 1024px) and (pointer: fine) and (prefers-reduced-motion: no-preference)', () => {
      element.classList.add('is-scroll-driven')
      const distance = () => Math.max(0, rail.scrollWidth - window.clientWidth)
      const travel = gsap.to(rail, {
        x: () => -distance(), ease: 'none',
        scrollTrigger: { id: 'mangosteen-cafe-gallery', trigger: element, pin: true, start: 'top 90px', end: () => `+=${Math.max(distance(), 1000)}`, scrub: .65, invalidateOnRefresh: true, anticipatePin: 1, onUpdate: self => update(self.progress) },
      })
      rail.querySelectorAll<HTMLElement>('.cafe-gallery-photo img').forEach(image => {
        gsap.fromTo(image, { xPercent: -1.5 }, { xPercent: 1.5, ease: 'none', scrollTrigger: { trigger: image.closest('.cafe-gallery-photo'), containerAnimation: travel, start: 'left right', end: 'right left', scrub: true } })
      })
      const focus = (event: FocusEvent) => {
        const tile = (event.target as HTMLElement).closest<HTMLElement>('.cafe-gallery-photo')
        if (!tile || !travel.scrollTrigger) return
        const rect = tile.getBoundingClientRect(), bounds = window.getBoundingClientRect()
        if (rect.left < bounds.left - 2 || rect.right > bounds.right + 2) {
          const fraction = Math.min(1, tile.offsetLeft / Math.max(1, distance()))
          travel.scrollTrigger.scroll(travel.scrollTrigger.start + fraction * (travel.scrollTrigger.end - travel.scrollTrigger.start))
          travel.progress(fraction); window.scrollLeft = 0
        }
      }
      rail.addEventListener('focusin', focus)
      return () => { element.classList.remove('is-scroll-driven'); rail.removeEventListener('focusin', focus); window.scrollLeft = 0 }
    })
    let refreshFrame = 0, lastDocumentHeight = 0
    const resize = new ResizeObserver(() => {
      if (!element.classList.contains('is-scroll-driven')) { nativeScroll(); return }
      // Existing sections above us establish their sticky heights after mounting.
      // Refresh only when that document geometry actually changes.
      const height = document.documentElement.scrollHeight
      if (Math.abs(height - lastDocumentHeight) < 2) return
      lastDocumentHeight = height
      cancelAnimationFrame(refreshFrame)
      refreshFrame = requestAnimationFrame(() => {
        ScrollTrigger.sort(); ScrollTrigger.refresh()
        lastDocumentHeight = document.documentElement.scrollHeight
      })
    })
    resize.observe(window)
    resize.observe(document.body)
    return () => { cancelAnimationFrame(refreshFrame); resize.disconnect(); window.removeEventListener('scroll', nativeScroll); media.revert() }
  }, [])
  const explore = () => spaces.current?.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
  return <section id="cafe-gallery" className="cafe-gallery wrap" aria-labelledby="cafe-gallery-title">
    <div className="cafe-gallery-header">
      <div data-m="up"><span className="sticker text-foreground-700">A LOOK INSIDE</span><h2 id="cafe-gallery-title" className="h-section">There's more to <span className="hand text-accent-600">discover.</span></h2></div>
      <p data-m="up">Through the glass, into our little world.</p>
    </div>
    <GalleryGlassEntrance onExplore={explore}/>
    <div ref={spaces} className="cafe-gallery-spaces" id="cafe-spaces">
      <div className="cafe-spaces-heading"><div><span className="cafe-spaces-label">OUR SPACES</span><h3>The café, <em>in focus.</em></h3></div><span>Six glimpses. More to discover.</span></div>
      <div ref={viewport} className="cafe-spaces-window" role="region" aria-label="Café photographs. Swipe or use arrow keys to explore." tabIndex={0}
        onKeyDown={event => {
          if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
          event.preventDefault()
          const buttons = Array.from(event.currentTarget.querySelectorAll('button'))
          const current = buttons.indexOf(document.activeElement as HTMLButtonElement)
          const next = buttons[Math.max(0, Math.min(buttons.length - 1, current + (event.key === 'ArrowRight' ? 1 : -1)))]
          next?.focus({ preventScroll: true })
          if (next && !spaces.current?.classList.contains('is-scroll-driven')) event.currentTarget.scrollTo({ left: next.offsetLeft, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
        }}>
        <div ref={track} className="cafe-gallery-track">
          {galleryPreview.map((entry, index) => {
            const photo = galleryPhoto(entry.key)
            return <button key={entry.key} type="button" className="cafe-gallery-photo" onClick={() => openPhoto(index)} aria-label={`View café photo: ${entry.title}`} aria-haspopup="dialog">
              <img src={photo.src} srcSet={photo.srcSet} sizes={photo.gallerySizes} style={{ objectPosition: entry.position }} alt={photo.alt} width={photo.width} height={photo.height} loading="lazy" decoding="async"/>
              <span className="cafe-gallery-caption"><span>{String(index + 1).padStart(2, '0')} · {entry.detail}</span><strong>{entry.title}</strong></span>
              <span className="cafe-gallery-expand" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M14 4h6v6M20 4l-7 7M10 20H4v-6m0 6 7-7"/></svg></span>
            </button>
          })}
          <button type="button" className="cafe-gallery-photo cafe-gallery-more" onClick={() => openPhoto(null)} aria-label="View all images" aria-haspopup="dialog">
            <span className="cafe-gallery-more-label">THE COMPLETE COLLECTION</span>
            <strong>More of <em>Mangosteen.</em></strong>
            <span className="cafe-gallery-more-description">Explore all {photographs.length} photographs of our spaces.</span>
            <span className="cafe-gallery-more-action">View all images <span aria-hidden="true">↗</span></span>
            <span className="cafe-gallery-more-continue">Or keep scrolling to continue your visit <span aria-hidden="true">↓</span></span>
          </button>
        </div>
      </div>
      <div className="cafe-spaces-progress"><span ref={position}>01 / {String(galleryPreview.length).padStart(2, '0')}</span><div aria-hidden="true"><span ref={bar}/></div><p>Scroll or swipe to explore</p></div>
    </div>
    {viewerOpen && <PhotoViewer index={active} onChange={setActive} onClose={() => setViewerOpen(false)} pauseScroll={pauseScroll} resumeScroll={resumeScroll}/>}
  </section>
}
