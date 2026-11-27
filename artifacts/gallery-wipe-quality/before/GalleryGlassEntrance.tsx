import { useCallback, useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { authenticPhoto } from './authentic-photos'
import { attachCondensation } from './gallery-condensation'

// In-memory only: survives SPA navigation and scrolling, resets on a new document visit.
let uncoveredThisVisit = false

export function GalleryGlassEntrance({ onExplore }: { onExplore: () => void }) {
  const frame = useRef<HTMLDivElement>(null), image = useRef<HTMLImageElement>(null), canvas = useRef<HTMLCanvasElement>(null)
  const [revealed, setRevealed] = useState(() => uncoveredThisVisit || matchMedia('(prefers-reduced-motion: reduce)').matches)
  const revealedRef = useRef(revealed)
  const initiallyRevealed = useRef(revealed)
  const [ready, setReady] = useState(false)
  const photo = authenticPhoto('story-dining')
  const reveal = useCallback(() => {
    if (revealedRef.current) return
    uncoveredThisVisit = true; revealedRef.current = true; setRevealed(true)
  }, [])
  useEffect(() => {
    const preference = matchMedia('(prefers-reduced-motion: reduce)')
    const change = () => {
      if (!preference.matches) return
      reveal()
      const welcome = frame.current?.querySelector('.cafe-glass-welcome')
      gsap.killTweensOf([canvas.current, image.current, welcome])
      gsap.set(canvas.current, { opacity: 0 }); gsap.set(image.current, { scale: 1 })
      if (welcome) gsap.set(welcome, { opacity: 1, y: 0 })
    }
    preference.addEventListener('change', change)
    const cleanup = attachCondensation({ canvas: canvas.current!, image: image.current!, frame: frame.current!, isRevealed: () => revealedRef.current, onReady: () => setReady(true), onReveal: reveal })
    return () => { preference.removeEventListener('change', change); cleanup() }
  }, [reveal])
  useEffect(() => {
    if (!revealed) return
    uncoveredThisVisit = true
    if (initiallyRevealed.current) return
    const root = frame.current!
    const context = gsap.context(() => {
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
      gsap.timeline()
        .to(canvas.current, { opacity: 0, duration: 1.05, ease: 'power2.inOut' }, 0)
        .fromTo(image.current, { scale: 1.025 }, { scale: 1, duration: 1.5, ease: 'power2.out' }, 0)
        .fromTo('.cafe-glass-welcome', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: .85, ease: 'power2.out' }, .35)
    }, root)
    return () => context.revert()
  }, [revealed])
  return <div className="cafe-glass-entrance">
    <div ref={frame} className={`cafe-glass${ready ? ' is-ready' : ''}${revealed ? ' is-revealed' : ''}`} data-revealed={revealed} data-cleared="0">
      <img ref={image} className="cafe-glass-photo" src={photo.src} srcSet={photo.srcSet} sizes="(min-width: 1600px) 1500px, 100vw" alt={photo.alt} width="960" height="1109" loading="lazy" decoding="async"/>
      <canvas ref={canvas} aria-hidden="true"/>
      <div className="cafe-glass-hint" aria-hidden={revealed}>
        <svg className="cafe-glass-gesture" viewBox="0 0 86 32" fill="none" aria-hidden="true"><path d="M13 17h59m-5-5 5 5-5 5M18 12l-5 5 5 5" stroke="currentColor" strokeWidth="1"/><circle cx="38" cy="17" r="6" fill="currentColor"/></svg>
        <p>Wipe to uncover Mangosteen.</p>
        <span>Look a little closer.</span>
      </div>
      <div className="cafe-glass-welcome" aria-hidden={!revealed} inert={!revealed}>
        <p className="cafe-glass-welcome-label">MANGOSTEEN · INDORE</p>
        <h3>Welcome to <em>Mangosteen.</em></h3>
        <p>A little world above the city.</p>
        <button type="button" onClick={onExplore}>Explore our spaces <span aria-hidden="true">↓</span></button>
      </div>
    </div>
    <div className="cafe-glass-actions"><p>{revealed ? 'THE LONG TABLE · MANGOSTEEN' : <><span className="cafe-glass-cursor-hint">Move your cursor across the glass.</span><span className="cafe-glass-touch-hint">Swipe across the glass. Scroll vertically to explore.</span></>}</p><button type="button" onClick={revealed ? onExplore : reveal}>{revealed ? 'Explore photographs' : 'Reveal photo'} <span aria-hidden="true">↘</span></button></div>
  </div>
}
