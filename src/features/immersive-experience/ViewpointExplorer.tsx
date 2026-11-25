import { useRef, useState } from 'react'
import { viewpoints } from './data'

type Mode = 'spaces' | 'look' | 'map'

export function ViewpointExplorer() {
  const [active, setActive] = useState(1)
  const [mode, setMode] = useState<Mode>('spaces')
  const [look, setLook] = useState({ x: 50, y: 50 })
  const dragging = useRef(false)
  const point = viewpoints[active]

  const moveLook = (clientX: number, clientY: number, target: HTMLElement) => {
    const box = target.getBoundingClientRect()
    setLook({ x: Math.max(42, Math.min(58, ((clientX - box.left) / box.width) * 100)), y: Math.max(44, Math.min(56, ((clientY - box.top) / box.height) * 100)) })
  }

  return <section className="mie-explorer" id="explore" aria-labelledby="explore-title">
    <div className="mie-section-heading">
      <p>EXPLORE MANGOSTEEN</p>
      <h2 id="explore-title">Find your <em>corner.</em></h2>
      <span>Four genuine photographed viewpoints. Look Around is intentionally limited to the image coverage.</span>
    </div>
    <div className="mie-mode-switch" role="tablist" aria-label="Exploration mode">
      {([['spaces', 'Explore spaces'], ['look', 'Look around'], ['map', 'Overview']] as const).map(([value, label]) => <button key={value} role="tab" aria-selected={mode === value} onClick={() => setMode(value)}>{label}</button>)}
    </div>
    {mode !== 'map' ? <div className={`mie-viewpoint${mode === 'look' ? ' is-look' : ''}`} onPointerDown={(event) => { if (mode === 'look') { dragging.current = true; event.currentTarget.setPointerCapture(event.pointerId) } }} onPointerMove={(event) => { if (mode === 'look' && dragging.current) moveLook(event.clientX, event.clientY, event.currentTarget) }} onPointerUp={() => { dragging.current = false }}>
      <img src={point.image} alt={`${point.name}: ${point.description}`} style={{ objectPosition: `${look.x}% ${look.y}%` }} loading="lazy" decoding="async" draggable={false}/>
      <div className="mie-viewpoint-shade" />
      <div className="mie-viewpoint-location"><small>YOU ARE EXPLORING</small><strong>{point.name}</strong><span>{point.zone}</span></div>
      {mode === 'look' && <div className="mie-drag-cue">Drag to look · limited photographic view</div>}
      {mode === 'spaces' && viewpoints.map((item, index) => index !== active && <button key={item.id} className="mie-hotspot" style={{ left: `${item.position.x}%`, top: `${item.position.y}%` }} aria-label={`Move to ${item.name}`} onClick={() => setActive(index)}><i/><span>{item.name}</span></button>)}
    </div> : <div className="mie-map" aria-label="Schematic photographic viewpoint overview">
      <div className="mie-map-plan"><span className="mie-map-outline mie-map-indoor">INDOOR SEATING</span><span className="mie-map-outline mie-map-dining">DINING</span><span className="mie-map-outline mie-map-entry">ENTRANCE</span>{viewpoints.map((item, index) => <button key={item.id} className={index === active ? 'is-active' : ''} style={{ left: `${item.position.x}%`, top: `${item.position.y}%` }} onClick={() => { setActive(index); setMode('spaces') }}><i/>{item.name}</button>)}</div>
      <p>This is a schematic navigation overview based on photographed zones—not an architectural floor plan or table-booking map.</p>
    </div>}
    <div className="mie-viewpoint-strip">{viewpoints.map((item, index) => <button key={item.id} className={index === active ? 'is-active' : ''} onClick={() => setActive(index)}><span>{String(index + 1).padStart(2, '0')}</span>{item.name}</button>)}</div>
  </section>
}
