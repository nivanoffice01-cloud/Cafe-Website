import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { Photo } from '../components/Photo'

export function GlassReveal() {
  const canvas = useRef<HTMLCanvasElement>(null), container = useRef<HTMLElement>(null)
  const points = useRef<Array<[number, number]>>([]), last = useRef<[number, number] | null>(null)
  const redraw = useRef<() => void>(() => {})
  const [clear, setClear] = useState(false), [ready, setReady] = useState(false)
  useEffect(() => {
    const c = canvas.current!, ctx = c.getContext('2d'); if (!ctx) { setClear(true); return }
    const image = new Image(); let alive = true, observer: ResizeObserver | undefined
    const erase = (x: number, y: number) => {
      const radius = Math.max(35, c.width * .055)
      ctx.globalCompositeOperation = 'destination-out'
      const brush = ctx.createRadialGradient(x, y, 0, x, y, radius)
      brush.addColorStop(0, 'rgba(0,0,0,1)'); brush.addColorStop(.55, 'rgba(0,0,0,1)'); brush.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = brush; ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2)
      ctx.globalCompositeOperation = 'source-over'
    }
    const draw = () => {
      if (!alive || !image.complete || !image.naturalWidth) return
      const rect = c.getBoundingClientRect(), ratio = Math.min(devicePixelRatio, 1.5)
      c.width = Math.round(rect.width * ratio); c.height = Math.round(rect.height * ratio)
      const scale = Math.max(c.width / image.width, c.height / image.height)
      ctx.filter = `blur(${20 * ratio}px)`; ctx.drawImage(image, (c.width - image.width * scale) / 2, (c.height - image.height * scale) / 2, image.width * scale, image.height * scale); ctx.filter = 'none'
      ctx.fillStyle = 'rgba(205,219,194,.23)'; ctx.fillRect(0, 0, c.width, c.height)
      let seed = 68; const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296 }
      for (let i = 0; i < 440; i++) { const x = random() * c.width, y = random() * c.height, r = (1 + random() * 3) * ratio; ctx.beginPath(); ctx.ellipse(x, y, r * .65, r, -.2, 0, Math.PI * 2); ctx.fillStyle = 'rgba(22,38,23,.13)'; ctx.fill(); ctx.strokeStyle = 'rgba(255,255,240,.26)'; ctx.lineWidth = ratio * .45; ctx.stroke() }
      points.current.forEach(([x, y]) => erase(x * c.width, y * c.height))
      setReady(true)
    }
    redraw.current = draw
    image.onload = () => { draw(); observer = new ResizeObserver(draw); observer.observe(c) }
    const intersection = new IntersectionObserver(entries => { if (entries.some(e => e.isIntersecting)) { image.src = '/marketing/dining-1280.webp'; intersection.disconnect() } }, { rootMargin: '200px' })
    intersection.observe(container.current!)
    return () => { alive = false; image.onload = null; observer?.disconnect(); intersection.disconnect() }
  }, [])
  const wipe = (event: PointerEvent<HTMLCanvasElement>) => {
    if (clear || !ready) return
    if (event.pointerType === 'touch' && event.buttons === 0) return
    const c = canvas.current!, rect = c.getBoundingClientRect(), ctx = c.getContext('2d')!
    const x = (event.clientX - rect.left) / rect.width, y = (event.clientY - rect.top) / rect.height
    const previous = last.current ?? [x, y], steps = Math.max(1, Math.ceil(Math.hypot((x - previous[0]) * rect.width, (y - previous[1]) * rect.height) / 12))
    for (let i = 1; i <= steps; i++) {
      const px = previous[0] + (x - previous[0]) * i / steps, py = previous[1] + (y - previous[1]) * i / steps
      points.current.push([px, py]); const radius = Math.max(35, c.width * .055)
      ctx.globalCompositeOperation = 'destination-out'; const brush = ctx.createRadialGradient(px * c.width, py * c.height, 0, px * c.width, py * c.height, radius); brush.addColorStop(0, '#000'); brush.addColorStop(.55, '#000'); brush.addColorStop(1, 'transparent'); ctx.fillStyle = brush; ctx.fillRect(px * c.width - radius, py * c.height - radius, radius * 2, radius * 2)
    }
    ctx.globalCompositeOperation = 'source-over'; last.current = [x, y]
    // Keep normalized points bounded; the current canvas remains untouched.
    if (points.current.length > 3000) points.current = points.current.filter((_, index) => index % 2 === 0)
  }
  return <section className="mg-glass-section" ref={container} aria-labelledby="mg-glass-title"><div className="mg-glass-heading"><p className="mg-eyebrow">A CLOSER LOOK</p><h2 id="mg-glass-title">There's a place<br/><em>for you here.</em></h2><p>Wooden tables. Woven light.<br/>A little room to slow down.</p></div><div className={`mg-glass${clear ? ' is-clear' : ''}${ready ? ' is-ready' : ''}`}><Photo name="dining" alt="Mangosteen's long wooden dining table beneath woven pendant lights"/><canvas ref={canvas} aria-hidden="true" onPointerDown={event => { last.current = null; wipe(event) }} onPointerMove={wipe} onPointerLeave={() => { last.current = null }} onPointerUp={() => { last.current = null }} onPointerCancel={() => { last.current = null }}/><span className="mg-glass-hint">{clear ? 'THE LONG TABLE · MANGOSTEEN' : 'WIPE THE GLASS TO LOOK INSIDE'}</span></div><button className="mg-text-link" onClick={() => { if (clear) { points.current = []; redraw.current() } setClear(!clear) }}>{clear ? 'Restore the glass' : 'Reveal Café'} <span>↗</span></button></section>
}
