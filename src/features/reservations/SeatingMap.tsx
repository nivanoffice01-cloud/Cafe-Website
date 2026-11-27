import { useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { gsap } from 'gsap'
import { seatingPlans, type SeatingZone } from '../../data/seating'
import { chairPositions, visualSeatingGroups } from './layout'
import { ReservationIcon } from './ReservationIcon'

type Props = {
  zone: SeatingZone; guests: number; selectedSeats: string[]; activeId?: string
  onSelectGroup: (id: string) => void; onToggleSeat: (id: string, seat: string) => void
}

// Decorative perimeter planting only. These do not alter seating coordinates,
// introduce inventory, or claim surveyed architectural/plant positions.
const planting: Record<SeatingZone, { x: number; y: number; size: number; rotation: number; asset: string }[]> = {
  rooftop: [
    { x: 40, y: 52, size: 86, rotation: -12, asset: 'planter-areca-v3' },
    { x: 707, y: 25, size: 47, rotation: 38, asset: 'planter-leafy-v3' },
    { x: 1012, y: 195, size: 72, rotation: 76, asset: 'planter-palm-v2' },
    { x: 27, y: 338, size: 63, rotation: -28, asset: 'planter-leafy-v3' },
    { x: 80, y: 551, size: 56, rotation: 120, asset: 'planter-broadleaf-v2' },
    { x: 990, y: 530, size: 92, rotation: 160, asset: 'planter-areca-v3' },
  ],
  inside: [
    { x: 37, y: 39, size: 68, rotation: -28, asset: 'planter-leafy-v3' },
    { x: 1005, y: 133, size: 75, rotation: 110, asset: 'planter-areca-v3' },
    { x: 30, y: 421, size: 57, rotation: 40, asset: 'planter-broadleaf-v2' },
    { x: 990, y: 542, size: 62, rotation: -72, asset: 'planter-leafy-v3' },
  ],
}

export function SeatingMap({ zone, guests, selectedSeats, activeId, onSelectGroup, onToggleSeat }: Props) {
  const id = useId().replace(/:/g, '')
  const root = useRef<HTMLDivElement>(null)
  const groups = useMemo(() => visualSeatingGroups(zone), [zone])
  const [zoom, setZoom] = useState(1)
  const [overview, setOverview] = useState(false)
  const [hoveredId, setHoveredId] = useState<string>()
  const hovered = groups.find(group => group.id === hoveredId)
  const activate = (event: KeyboardEvent<SVGGElement>, action: () => void) => {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); action() }
  }

  useLayoutEffect(() => {
    const media = gsap.matchMedia()
    const context = gsap.context(() => {
      media.add('(prefers-reduced-motion: no-preference)', () => {
        const timeline = gsap.timeline({ defaults: { ease: 'power2.out' } })
        timeline.from('.reservation-floor', { opacity: 0, duration: .5 })
          .from('.reservation-furniture', { opacity: 0, duration: .5, stagger: .025, clearProps: 'opacity' }, .12)
          .from('.reservation-plant-art', { opacity: 0, scale: .96, transformOrigin: '50% 50%', duration: .7, stagger: .025, clearProps: 'transform,opacity' }, .2)
        const photo = root.current?.closest('.reservation-content')?.querySelector('.reservation-area-photo')
        if (photo) timeline.fromTo(photo, { opacity: .3, clipPath: 'inset(0% 0% 5% 0%)' }, { opacity: 1, clipPath: 'inset(0% 0% 0% 0%)', duration: .6, clearProps: 'opacity,clipPath' }, 0)
        return () => { timeline.kill() }
      })
    }, root)
    return () => { media.revert(); context.revert() }
  }, [zone])

  useLayoutEffect(() => {
    if (!activeId || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const preview = root.current?.closest('.reservation-content')?.querySelector('.reservation-preview-copy')
    if (!preview) return
    const context = gsap.context(() => {
      gsap.fromTo(preview.querySelector('h3'), { y: 8, opacity: .2, clipPath: 'inset(0 0 18% 0)' }, { y: 0, opacity: 1, clipPath: 'inset(0)', duration: .4, ease: 'power2.out', clearProps: 'transform,opacity,clipPath' })
      gsap.fromTo(preview.querySelector('.reservation-preview-meta'), { opacity: .25 }, { opacity: 1, duration: .45, clearProps: 'opacity' })
    })
    return () => context.revert()
  }, [activeId, zone])

  useLayoutEffect(() => {
    setZoom(1); setOverview(false); setHoveredId(undefined)
    root.current?.querySelector('.reservation-map-scroll')?.scrollTo({ left: 0 })
  }, [zone])

  useLayoutEffect(() => {
    const scroller = root.current?.querySelector<HTMLElement>('.reservation-map-scroll')
    const svg = root.current?.querySelector<SVGSVGElement>('.reservation-seat-map')
    const group = groups.find(item => item.id === activeId)
    if (!scroller || !svg || !group || scroller.scrollWidth <= scroller.clientWidth) return
    scroller.scrollTo({ left: group.x / 1040 * svg.getBoundingClientRect().width - scroller.clientWidth / 2, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
  }, [activeId, groups, zoom, overview])

  return <div ref={root} className={`reservation-plan${overview ? ' is-overview' : ''}`} data-area={zone}>
    <div className="reservation-plan-toolbar"><span><ReservationIcon name="leaf"/>{seatingPlans[zone].name}</span><span>{hovered ? `${hovered.label} · ${hovered.capacity} seats` : 'Illustrated seating plan'}</span></div>
    <p className="reservation-map-hint">{overview ? 'Full plan · choose Explore for larger controls' : 'Swipe to explore · tap a table or individual chair'}</p>
    <div className="reservation-map-canvas"><div className="reservation-map-scroll" role="region" tabIndex={0} aria-label="Seating map. Swipe or use arrow keys to pan; use the table list below as an alternative.">
      <svg key={zone} className="reservation-seat-map" style={{ width: `${zoom * 100}%`, minWidth: `calc(var(--reservation-map-min-width, 0px) * ${zoom})` }} viewBox="0 0 1040 580" role="group" aria-label={`${seatingPlans[zone].name} schematic seating map`}>
        <defs>
          <pattern id={`${id}-floor`} patternUnits="userSpaceOnUse" width={zone === 'rooftop' ? 240 : 260} height={zone === 'rooftop' ? 240 : 260}><image href={`/images/reservation/${zone === 'rooftop' ? 'rooftop-stone-v2' : 'inside-tile-v2'}.webp`} width={zone === 'rooftop' ? 240 : 260} height={zone === 'rooftop' ? 240 : 260}/></pattern>
          <radialGradient id={`${id}-light`} cx="18%" cy="0%" r="95%"><stop stopColor="#f7d3a0" stopOpacity=".2"/><stop offset=".5" stopColor="#f7d3a0" stopOpacity=".025"/><stop offset="1" stopColor="#19291d" stopOpacity=".17"/></radialGradient>
          <linearGradient id={`${id}-edge`} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#1b2922" stopOpacity=".2"/><stop offset=".24" stopColor="#1b2922" stopOpacity="0"/><stop offset="1" stopColor="#1b2922" stopOpacity=".08"/></linearGradient>
          <filter id={`${id}-table-shadow`} x="-35%" y="-55%" width="170%" height="210%"><feDropShadow dx=".5" dy="1" stdDeviation=".8" floodColor="#1a2018" floodOpacity=".3"/><feDropShadow dx="1.5" dy="5" stdDeviation="3" floodColor="#1a2018" floodOpacity=".18"/></filter>
          <filter id={`${id}-chair-shadow`} x="-40%" y="-45%" width="180%" height="190%"><feDropShadow dx="1" dy="2.5" stdDeviation="1.7" floodColor="#182016" floodOpacity=".24"/></filter>
          <filter id={`${id}-plant-shadow`} x="-50%" y="-50%" width="200%" height="210%"><feDropShadow dx="3" dy="6" stdDeviation="4" floodColor="#152016" floodOpacity=".3"/></filter>
        </defs>
        <g className="reservation-floor" aria-hidden="true" pointerEvents="none">
          <rect width="1040" height="580" fill={`url(#${id}-floor)`}/>
          <rect width="1040" height="580" fill="#eee8d9" opacity=".14"/>
          <rect width="1040" height="580" fill={`url(#${id}-light)`}/>
          <rect width="1040" height="580" fill={`url(#${id}-edge)`}/>
          <path d="M24 580V24H1016V580" fill="none" stroke="#515a4d" strokeWidth="6" opacity=".65"/>
          <path d="M30 25H1010" stroke="#ddd8c7" strokeWidth="1" opacity=".65"/>
          <rect x="390" y="552" width="260" height="26" rx="13" fill="#f4efdf" opacity=".88"/>
          <text x="520" y="569" textAnchor="middle" fill="#2e3e31" fontSize="9" letterSpacing="2.5">{seatingPlans[zone].entry}</text>
        </g>
        <g aria-hidden="true" pointerEvents="none">{planting[zone].map((plant, i) => <g key={i} className="reservation-plant" transform={`translate(${plant.x} ${plant.y}) rotate(${plant.rotation})`}><image className="reservation-plant-art" href={`/images/reservation/${plant.asset}.webp`} x={-plant.size / 2} y={-plant.size / 2} width={plant.size} height={plant.size} filter={`url(#${id}-plant-shadow)`}/></g>)}</g>
        {groups.map(group => {
          const small = group.capacity < guests, active = group.id === activeId
          const chairs = chairPositions(group)
          return <g key={group.id} transform={`translate(${group.x} ${group.y}) rotate(${group.rotation})`} className={`reservation-furniture${small ? ' is-small' : ''}${active ? ' is-active' : ''}`} data-table-id={group.id}>
            {chairs.map((chair, i) => {
              const seat = group.seats[i], selected = selectedSeats.includes(seat)
              return <g key={seat} role="button" tabIndex={small ? -1 : 0} aria-disabled={small} aria-pressed={selected} aria-label={`${group.label}, seat ${i + 1}${small ? ', too small for your party' : ''}`} className={`reservation-chair${selected ? ' is-selected' : ''}`} onClick={() => !small && onToggleSeat(group.id, seat)} onKeyDown={e => activate(e, () => !small && onToggleSeat(group.id, seat))} transform={`translate(${chair.x} ${chair.y})`}>
                <rect className="reservation-chair-focus" x="-29" y="-29" width="58" height="58" rx="12" fill="transparent"/>
                <image href="/images/reservation/cane-chair-v3.webp" x="-25" y="-25" width="50" height="50" transform={`rotate(${chair.rotation})`} filter={`url(#${id}-chair-shadow)`}/>
                {selected && <g className="reservation-seat-check" transform="translate(0 10)" aria-hidden="true"><circle r="8" fill="#274432" stroke="#f1e5c9" strokeWidth="1"/><path d="M-3.5 0l2.2 2.2 4.8-4.8" stroke="#fff7e7" strokeWidth="1.4" fill="none"/></g>}
              </g>
            })}
            <g role="button" tabIndex={small ? -1 : 0} aria-disabled={small} aria-pressed={active} aria-label={`${group.accessibilityLabel}${small ? ', too small for your party' : ', select preferred seats'}`} className="reservation-table" onMouseEnter={() => setHoveredId(group.id)} onMouseLeave={() => setHoveredId(undefined)} onFocus={() => setHoveredId(group.id)} onBlur={() => setHoveredId(undefined)} onClick={() => !small && onSelectGroup(group.id)} onKeyDown={e => activate(e, () => !small && onSelectGroup(group.id))}>
              <title>{group.accessibilityLabel}</title>
              <rect className="reservation-table-ring" x={-group.width / 2 - 5} y={-group.height / 2 - 5} width={group.width + 10} height={group.height + 10} rx="8" fill="none" stroke="#244631" strokeWidth="2"/>
              <image className="reservation-table-surface" href={`/images/reservation/${group.capacity === 2 ? 'table-square-v3' : 'table-long-v3'}.webp`} x={-group.width / 2} y={-group.height / 2} width={group.width} height={group.height} preserveAspectRatio="none" filter={`url(#${id}-table-shadow)`}/>
              <g className="reservation-table-marker"><circle r="12" fill="#f9f2e4" stroke="#52664b" strokeWidth=".6"/><text y="3.5" textAnchor="middle" fill="#304b35" fontSize="11" fontWeight="500">{group.id}</text></g>
            </g>
          </g>
        })}
      </svg>
    </div>
    <div className="reservation-map-controls" role="group" aria-label="Map zoom"><button className="reservation-map-overview" type="button" aria-pressed={overview} onClick={() => { setOverview(value => !value); setZoom(1) }}>{overview ? 'Explore' : 'Fit plan'}</button><button type="button" aria-label="Zoom out seating map" disabled={zoom <= 1} onClick={() => setZoom(v => Math.max(1, v - .4))}>−</button><button type="button" aria-label="Zoom in seating map" disabled={zoom >= 1.8} onClick={() => setZoom(v => Math.min(1.8, v + .4))}>+</button><button type="button" onClick={() => setZoom(1)} aria-label="Reset seating map zoom">Reset</button></div></div>
    <details className="reservation-table-list"><summary>Prefer a list? Choose your seating group <span aria-hidden="true">↓</span></summary><div>{groups.map(group => <button key={group.id} type="button" disabled={group.capacity < guests} aria-pressed={activeId === group.id} onClick={() => onSelectGroup(group.id)}><span>{group.label}</span><small>{group.capacity} seats{group.capacity < guests ? ' · Too small' : ''}</small></button>)}</div></details>
  </div>
}
