import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent, type PointerEvent } from 'react'
import { gsap } from 'gsap'
import { fullMenu } from '../../../data/fullMenu'
import { menuPhotoFor } from '../../../data/menuPhotos'
import { motion } from '../config/motion'

const selections = [['Pizza & Pide', 'Margarita'], ['Pasta', 'Pesto cream Pasta'], ['Burger & sandwich', 'Veg Cheese Burger'], ['Mocktail & Coolers', 'Virgin mojito'], ['Desserts', 'Chocolate Cheesecake']]
const dishes = selections.flatMap(([category, name]) => {
  const dish = fullMenu.find(item => item.name === category)?.items.find(item => item.name === name)
  return dish ? [{ ...dish, category, photo: menuPhotoFor(category, name)! }] : []
})
const mod = (n: number, total: number) => ((n % total) + total) % total
const step = 360 / dishes.length
const anchor = () => window.innerWidth < 900 ? 270 : 180

export function DiningTable({ menu }: { menu: (event: MouseEvent<HTMLAnchorElement>) => void }) {
  const shell = useRef<HTMLDivElement>(null), wheel = useRef<HTMLDivElement>(null), text = useRef<HTMLDivElement>(null)
  const rotation = useRef({ angle: anchor() }), animation = useRef<gsap.core.Tween | null>(null)
  const suppressClickUntil = useRef(0)
  const activeRef = useRef(0), pending = useRef(0), textTween = useRef<gsap.core.Tween | null>(null)
  const drag = useRef<{ x: number; y: number; last: number; time: number; velocity: number; moved: boolean; touch: boolean } | null>(null)
  const [active, setActive] = useState(0)
  const [dragging, setDragging] = useState(false)
  const calm = () => window.matchMedia(motion.reduced).matches
  const announce = (index: number) => {
    pending.current = index
    if (index === activeRef.current || textTween.current?.isActive()) return
    if (calm()) { activeRef.current = index; setActive(index); return }
    textTween.current = gsap.to(text.current, { y: -12, opacity: 0, duration: .13, onComplete: () => {
      if (activeRef.current === pending.current) gsap.to(text.current, { y: 0, opacity: 1, duration: .2 })
      else { activeRef.current = pending.current; setActive(pending.current) }
    } })
  }
  const paint = () => {
    if (!wheel.current) return
    wheel.current.style.transform = `rotate(${rotation.current.angle}deg)`
    wheel.current.querySelectorAll<HTMLElement>('.mg-plate-art').forEach(el => { el.style.transform = `rotate(${-rotation.current.angle}deg)` })
    const index = mod(Math.round((anchor() - rotation.current.angle) / step), dishes.length)
    wheel.current.querySelectorAll<HTMLElement>('.mg-plate').forEach((el, i) => el.classList.toggle('is-front', i === index))
    announce(index)
  }
  const turn = (index: number) => {
    const desired = anchor() - index * step
    const target = desired + Math.round((rotation.current.angle - desired) / 360) * 360
    animation.current?.kill()
    animation.current = gsap.to(rotation.current, { angle: target, duration: calm() ? 0 : .9, ease: 'power3.out', onUpdate: paint, onComplete: () => announce(mod(index, dishes.length)) })
  }
  useEffect(() => {
    paint()
    const responsive = matchMedia('(max-width: 899px)')
    const reposition = () => { animation.current?.kill(); rotation.current.angle = anchor() - activeRef.current * step; paint() }
    responsive.addEventListener('change', reposition)
    return () => { responsive.removeEventListener('change', reposition); animation.current?.kill(); textTween.current?.kill(); gsap.killTweensOf(text.current) }
  }, []) // Mutable rotation is deliberately independent of React renders.
  useLayoutEffect(() => {
    const tween = gsap.fromTo(text.current, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: calm() ? 0 : .45, ease: motion.reveal })
    return () => { tween.kill() }
  }, [active])
  const pointerAngle = (x: number, y: number) => { const r = shell.current!.getBoundingClientRect(); return Math.atan2(y - r.y - r.height / 2, x - r.x - r.width / 2) * 180 / Math.PI }
  const down = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return
    animation.current?.kill()
    drag.current = { x: event.clientX, y: event.clientY, last: pointerAngle(event.clientX, event.clientY), time: performance.now(), velocity: 0, moved: false, touch: event.pointerType === 'touch' }
  }
  const move = (event: PointerEvent<HTMLDivElement>) => {
    const d = drag.current; if (!d) return
    const dx = event.clientX - d.x, dy = event.clientY - d.y
    if (!d.moved && Math.hypot(dx, dy) < 7) return
    if (!d.moved && d.touch && Math.abs(dy) > Math.abs(dx)) { drag.current = null; return }
    if (!d.moved) { event.currentTarget.setPointerCapture(event.pointerId); d.moved = true; setDragging(true) }
    const current = pointerAngle(event.clientX, event.clientY)
    const delta = d.touch ? dx * .32 : mod(current - d.last + 180, 360) - 180
    const now = performance.now()
    d.velocity = d.velocity * .4 + delta / Math.max(12, now - d.time) * .6
    rotation.current.angle += delta; d.last = current; d.time = now; d.x = event.clientX; d.y = event.clientY
    paint()
  }
  const up = () => {
    const d = drag.current; drag.current = null; setDragging(false)
    if (!d?.moved) return
    suppressClickUntil.current = performance.now() + 200
    const velocity = Math.max(-.6, Math.min(.6, d.velocity))
    const projected = rotation.current.angle + velocity * 180
    const index = Math.round((anchor() - projected) / step)
    turn(index)
  }
  const dish = dishes[active]
  return <section className="mg-table-section" id="menu-preview" aria-labelledby="mg-table-title">
    <div className="mg-table-copy"><p className="mg-eyebrow">THE MENU · AROUND THE TABLE</p><div className="mg-dish-copy" ref={text} aria-live="polite" aria-atomic="true"><span className="mg-dish-number">{String(active + 1).padStart(2, '0')} / {String(dishes.length).padStart(2, '0')}</span><h2 id="mg-table-title">{dish.name}</h2>{dish.description && <p>{dish.description}</p>}<strong>₹{dish.price.toLocaleString('en-IN')}</strong><a className="mg-text-link" href={`/menu?category=${encodeURIComponent(dish.category)}&dish=${encodeURIComponent(dish.name)}`} onClick={menu}>View dish <span>↗</span></a></div>
      <div className="mg-table-controls"><button onClick={() => turn(activeRef.current - 1)} aria-label="Previous dish">←</button><span>Drag to discover</span><button onClick={() => turn(activeRef.current + 1)} aria-label="Next dish">→</button></div>
      <a className="mg-button mg-button-outline" href="/menu" onClick={menu}>Explore Full Menu <span>↗</span></a><small className="mg-image-note">Illustrative menu photography. Actual presentation may differ.</small>
    </div>
    <div className={`mg-wheel-viewport${dragging ? ' is-dragging' : ''}`} role="group" aria-label="Rotating dining table. Drag or use left and right arrow keys." tabIndex={0} onKeyDown={event => { if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); turn(activeRef.current + (event.key === 'ArrowRight' ? 1 : -1)) } }} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
      <div className="mg-wheel-shell" ref={shell}><div className="mg-wheel" ref={wheel}>{dishes.map((item, index) => <button key={item.name} className={`mg-plate${index === active ? ' is-front' : ''}`} style={{ left: `${50 + 35 * Math.cos(index * step * Math.PI / 180)}%`, top: `${50 + 35 * Math.sin(index * step * Math.PI / 180)}%` }} aria-label={`Select ${item.name}`} aria-pressed={index === active} onClick={() => { if (performance.now() > suppressClickUntil.current) turn(index) }}><span className="mg-plate-art"><img src={item.photo.src} alt={item.photo.alt} loading="lazy" draggable="false"/></span></button>)}</div><div className="mg-wheel-centre" aria-hidden="true">M<span>AT THE TABLE</span></div></div>
    </div>
  </section>
}
