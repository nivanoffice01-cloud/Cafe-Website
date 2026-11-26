import { useId, useMemo, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { seatingPlans, type SeatingZone } from '../../data/seating'
import { chairPositions, visualSeatingGroups } from './layout'
import { ReservationIcon } from './ReservationIcon'

type Props = {
  zone: SeatingZone; guests: number; selectedSeats: string[]; activeId?: string
  onSelectGroup: (id: string) => void; onToggleSeat: (id: string, seat: string) => void
}

export function SeatingMap({ zone, guests, selectedSeats, activeId, onSelectGroup, onToggleSeat }: Props) {
  const id = useId().replace(/:/g, '')
  const groups = useMemo(() => visualSeatingGroups(zone), [zone])
  const [zoom, setZoom] = useState(1)
  const activate = (event: KeyboardEvent<SVGGElement>, action: () => void) => {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); action() }
  }
  return <div className="reservation-plan">
    <div className="reservation-plan-toolbar"><span><ReservationIcon name="leaf"/>{seatingPlans[zone].name}</span><span>Illustrated seating plan</span></div>
    <div className="reservation-map-canvas"><div className="reservation-map-scroll" tabIndex={zoom > 1 ? 0 : undefined} aria-label="Seating map. Zoom in to explore; scroll to pan.">
      <svg key={zone} className="reservation-seat-map" style={{ width: `${zoom * 100}%` }} viewBox="0 0 1040 580" role="group" aria-label={`${seatingPlans[zone].name} schematic seating map`}>
        <defs>
          <pattern id={`${id}-wood`} patternUnits="userSpaceOnUse" width="256" height="180"><image href="/images/reservation/walnut-v1.webp" width="256" height="180" preserveAspectRatio="none"/></pattern>
          <pattern id={`${id}-floor`} patternUnits="userSpaceOnUse" width="320" height="96"><rect width="320" height="96" fill={`url(#${id}-wood)`}/><path d="M0 0h320M0 48h320M160 0v48M40 48v48" stroke="#281d13" strokeWidth="2" opacity=".55"/></pattern>
          <linearGradient id={`${id}-light`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#f9d59c" stopOpacity=".14"/><stop offset="1" stopColor="#121b12" stopOpacity=".6"/></linearGradient>
          <linearGradient id={`${id}-sofa`} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#b3936c"/><stop offset="1" stopColor="#5f4b35"/></linearGradient>
          <filter id={`${id}-shadow`} x="-50%" y="-70%" width="200%" height="240%"><feDropShadow dx="2" dy="7" stdDeviation="6" floodColor="#110e08" floodOpacity=".48"/></filter>
        </defs>
        <g aria-hidden="true" pointerEvents="none">
          <rect width="1040" height="580" fill={`url(#${id}-floor)`}/>
          <rect width="1040" height="580" fill={`url(#${id}-light)`}/>
          <path d="M35 580V30H1005V580" fill="none" stroke="#191f13" strokeWidth="24"/>
          <path d="M48 32H994" stroke="#d6b980" strokeWidth="2" opacity=".6"/>
          {[100,250,400,550,700,850].map(x => <path key={x} d={`M${x} 18v26`} stroke="#b69b6d" strokeWidth="3"/>)}
          {[0,1,2,3,4,5,6].map(i => <image key={`top-${i}`} href="/images/reservation/palm-v1.webp" x={i * 152 - 60} y={-66 - (i % 2) * 12} width="190" height="190" opacity=".96"/>)}
          {[0,1,2].map(i => <g key={`edges-${i}`}><image href="/images/reservation/palm-v1.webp" x="-89" y={150 + i * 180} width="180" height="180"/><image href="/images/reservation/palm-v1.webp" x="950" y={130 + i * 180} width="180" height="180"/></g>)}
          <rect x="380" y="550" width="280" height="30" rx="5" fill="#1a291f"/>
          <text x="520" y="570" textAnchor="middle" fill="#f1e7d5" fontSize="12" letterSpacing="2">{seatingPlans[zone].entry}</text>
        </g>
        {groups.map(group => {
          const small = group.capacity < guests, active = group.id === activeId
          const chairs = chairPositions(group)
          return <g key={group.id} transform={`translate(${group.x} ${group.y}) rotate(${group.rotation})`} className={`reservation-furniture${small ? ' is-small' : ''}${active ? ' is-active' : ''}`} data-table-id={group.id}>
            {chairs.map((chair, i) => {
              const seat = group.seats[i], selected = selectedSeats.includes(seat)
              return <g key={seat} role="button" tabIndex={small ? -1 : 0} aria-disabled={small} aria-pressed={selected} aria-label={`${group.label}, seat ${i + 1}${small ? ', too small for your party' : ''}`} className={`reservation-chair${selected ? ' is-selected' : ''}`} onClick={() => !small && onToggleSeat(group.id, seat)} onKeyDown={e => activate(e, () => !small && onToggleSeat(group.id, seat))} transform={`translate(${chair.x} ${chair.y})`}>
                <rect className="reservation-chair-focus" x="-29" y="-29" width="58" height="58" rx="12" fill="transparent"/>
                {group.furniture === 'lounge' && i < group.capacity / 2 ? <g filter={`url(#${id}-shadow)`}><rect x="-25" y="-23" width="50" height="46" rx="9" fill={`url(#${id}-sofa)`} stroke="#c2a983" strokeWidth="2"/><path d="M-20-12h40M-20-12v27h40v-27" fill="none" stroke="#5b4433" strokeWidth="2" opacity=".6"/></g> : <image href="/images/reservation/cane-chair-v1.webp" x="-25" y="-25" width="50" height="50" transform={`rotate(${chair.rotation})`}/>}
                {selected && <g aria-hidden="true"><circle r="12" fill="#203b28" stroke="#e8cf9a" strokeWidth="1.5"/><path d="M-5 0l3 3 7-7" stroke="#fff7e7" strokeWidth="2" fill="none"/></g>}
              </g>
            })}
            <g role="button" tabIndex={small ? -1 : 0} aria-disabled={small} aria-pressed={active} aria-label={`${group.accessibilityLabel}${small ? ', too small for your party' : ', select preferred seats'}`} className="reservation-table" onClick={() => !small && onSelectGroup(group.id)} onKeyDown={e => activate(e, () => !small && onSelectGroup(group.id))}>
              <title>{group.accessibilityLabel}</title>
              <rect className="reservation-table-ring" x={-group.width / 2 - 8} y={-group.height / 2 - 8} width={group.width + 16} height={group.height + 16} rx={group.furniture === 'round' ? 60 : 17} fill="none" stroke="#e3c385" strokeWidth="3"/>
              <rect x={-group.width / 2} y={-group.height / 2 + 5} width={group.width} height={group.height} rx={group.furniture === 'round' ? 50 : 9} fill="#49331d"/>
              <rect x={-group.width / 2} y={-group.height / 2} width={group.width} height={group.height} rx={group.furniture === 'round' ? 50 : 9} fill={`url(#${id}-wood)`} stroke="#c79a62" strokeWidth="2" filter={`url(#${id}-shadow)`}/>
              <rect x={-group.width / 2} y={-group.height / 2} width={group.width} height={group.height} rx={group.furniture === 'round' ? 50 : 9} fill="#1b150e" opacity=".32"/>
              <text y="-4" textAnchor="middle" fill="#fff4de" fontSize={group.capacity === 2 ? 12 : 16} fontWeight="600">{group.label}</text>
              <text y="18" textAnchor="middle" fill="#fff4de" fontSize="12">{group.capacity} seats</text>
            </g>
          </g>
        })}
      </svg>
    </div>
    <div className="reservation-map-controls" role="group" aria-label="Map zoom"><button type="button" aria-label="Zoom out seating map" disabled={zoom <= 1} onClick={() => setZoom(v => Math.max(1, v - .4))}>−</button><button type="button" aria-label="Zoom in seating map" disabled={zoom >= 1.8} onClick={() => setZoom(v => Math.min(1.8, v + .4))}>+</button><button type="button" onClick={() => setZoom(1)} aria-label="Reset seating map zoom">Reset</button></div></div>
    <details className="reservation-table-list"><summary>Prefer a list? Choose your seating group <span aria-hidden="true">↓</span></summary><div>{groups.map(group => <button key={group.id} type="button" disabled={group.capacity < guests} aria-pressed={activeId === group.id} onClick={() => onSelectGroup(group.id)}><span>{group.label}</span><small>{group.capacity} seats{group.capacity < guests ? ' · Too small' : ''}</small></button>)}</div></details>
  </div>
}
