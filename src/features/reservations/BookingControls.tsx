import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, KeyboardEvent } from 'react'
import type { SeatingZone } from '../../data/seating'
import { authenticPhoto } from '../supplied-frontend/authentic-photos'
import { ReservationIcon } from './ReservationIcon'

type VisitDate = { value: string; weekday: string; day: number; month: string }
type Picker = 'area' | 'date' | 'time' | 'guests'
type Props = {
  zone: SeatingZone; date: string; dates: VisitDate[]; time: string
  arrivalTimes: string[]; guests: number
  onZoneChange: (zone: SeatingZone) => void; onDateChange: (date: string) => void
  onTimeChange: (time: string) => void; onGuestsChange: (guests: number) => void
}
const names = { area: 'Choose your setting', date: 'Choose a date', time: 'Plan your arrival', guests: 'Your party' }
const fullDate = (value: string) => new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${value}T12:00:00`))

export function BookingControls({zone,date,dates,time,arrivalTimes,guests,onZoneChange,onDateChange,onTimeChange,onGuestsChange}: Props) {
  const id = useId()
  const [open, setOpen] = useState<Picker | null>(null)
  const [monthIndex, setMonthIndex] = useState(0)
  const [focusedDate, setFocusedDate] = useState(date)
  const dialog = useRef<HTMLDialogElement>(null)
  const triggers = useRef<Partial<Record<Picker, HTMLButtonElement | null>>>({})
  const months = useMemo(() => [...new Set(dates.map(d => d.value.slice(0,7)))], [dates])
  const selectedDate = dates.find(d => d.value === date) ?? dates[0]
  const month = months[monthIndex] ?? months[0]
  const [year, monthNumber] = month.split('-').map(Number)
  const leading = (new Date(year,monthNumber-1,1).getDay()+6)%7
  const days = new Date(year,monthNumber,0).getDate()
  const allowed = new Set(dates.map(d => d.value))
  const currentArea = authenticPhoto(zone === 'rooftop' ? 'rooftop-evening' : 'visit-interior')

  useEffect(() => {
    for (const key of ['rooftop-evening', 'visit-interior'] as const) {
      const image = new Image()
      image.src = authenticPhoto(key).src.replace('-960.webp', '-480.webp')
    }
  }, [])

  const show = (picker: Picker) => {
    if(picker === 'date') { setMonthIndex(Math.max(0,months.indexOf(date.slice(0,7)))); setFocusedDate(date) }
    setOpen(picker)
  }
  useLayoutEffect(() => {
    if(!open || !dialog.current) return
    const element=dialog.current, trigger=triggers.current[open]
    const position=()=>{
      const rect=trigger?.getBoundingClientRect()
      const width=open==='area'?370:open==='date'?352:310
      element.style.setProperty('--picker-width',`${width}px`)
      if(!rect)return
      const actualWidth=Math.min(width,innerWidth-32)
      const left=Math.max(16,Math.min(rect.left,innerWidth-actualWidth-16))
      const height=element.getBoundingClientRect().height
      let top=rect.bottom+12
      if(top+height>innerHeight-16 && rect.top-height-12>=88) top=rect.top-height-12
      else top=Math.min(top,innerHeight-height-16)
      element.style.setProperty('--picker-left',`${left}px`)
      element.style.setProperty('--picker-top',`${Math.max(88,top)}px`)
    }
    if(!element.open) element.showModal()
    position()
    const selected=element.querySelector<HTMLButtonElement>('button[aria-pressed="true"], button[data-initial-focus]')
    selected?.focus({preventScroll:true})
    const observer = new ResizeObserver(position)
    observer.observe(element)
    window.addEventListener('resize',position)
    return ()=>{observer.disconnect();window.removeEventListener('resize',position);if(element.open)element.close();trigger?.focus({preventScroll:true})}
  },[open])

  const changeMonth=(index:number)=>{
    setMonthIndex(index)
    const next=dates.find(d=>d.value.startsWith(months[index]))?.value ?? date
    setFocusedDate(next)
    requestAnimationFrame(()=>dialog.current?.querySelector<HTMLButtonElement>(`button[data-date="${next}"]`)?.focus())
  }
  const onKeyDown=(event:KeyboardEvent<HTMLDialogElement>)=>{
    // The native modal handles focus containment; stop the outer reservation's
    // Escape/Tab handler from closing the whole experience or moving focus out.
    event.stopPropagation()
    if(event.key==='Escape'){event.preventDefault();setOpen(null);return}
    if(event.key==='Tab'){
      const controls=[...(dialog.current?.querySelectorAll<HTMLButtonElement>('button:not([disabled])') ?? [])].filter(button=>button.tabIndex>=0&&button.getClientRects().length)
      const first=controls[0], last=controls[controls.length-1]
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus()}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus()}
      return
    }
    if(open!=='date')return
    const value=(event.target as HTMLElement).closest<HTMLButtonElement>('button[data-date]')?.dataset.date
    const step=({ArrowRight:1,ArrowLeft:-1,ArrowDown:7,ArrowUp:-7} as Record<string,number>)[event.key]
    if(!value||!step)return
    event.preventDefault()
    const next=dates[dates.findIndex(d=>d.value===value)+step]
    if(!next)return
    setFocusedDate(next.value);setMonthIndex(months.indexOf(next.value.slice(0,7)))
    requestAnimationFrame(()=>dialog.current?.querySelector<HTMLButtonElement>(`button[data-date="${next.value}"]`)?.focus())
  }
  const chevron=<svg className="booking-chevron" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"><path d="m5 7 5 5 5-5"/></svg>
  const trigger=(picker:Picker,label:string,accessibleName:string,value:string,icon:'calendar'|'clock'|'guests')=><div className="reservation-control" key={picker}>
    <span id={`${id}-${picker}-label`}>{label}</span>
    <button ref={node=>{triggers.current[picker]=node}} type="button" className="booking-trigger" aria-label={accessibleName} aria-describedby={`${id}-${picker}-value`} aria-haspopup="dialog" aria-expanded={open===picker} aria-controls={`${id}-picker`} onClick={()=>show(picker)}><ReservationIcon name={icon}/><span id={`${id}-${picker}-value`} key={value} className="booking-control-value">{value}</span>{chevron}</button>
  </div>

  return <div className="reservation-settings" aria-label="Plan your visit">
    <div className="reservation-control reservation-area-control"><span>Seating area</span><button ref={node=>{triggers.current.area=node}} type="button" className="booking-trigger booking-area-trigger" aria-label="Seating area" aria-describedby={`${id}-area-value`} aria-haspopup="dialog" aria-expanded={open==='area'} aria-controls={`${id}-picker`} onClick={()=>show('area')}><img src={currentArea.src} srcSet={currentArea.srcSet} sizes="32px" alt=""/><span key={zone} id={`${id}-area-value`} className="booking-control-value">{zone==='rooftop'?'The Rooftop':'Inside Mangosteen'}</span>{chevron}</button></div>
    {trigger('date','Date','Preferred date',`${selectedDate.weekday}, ${selectedDate.day} ${selectedDate.month}`,'calendar')}
    {trigger('time','Arrival time','Preferred arrival time',time,'clock')}
    {trigger('guests','Guests','Number of guests',`${guests} ${guests===1?'Guest':'Guests'}`,'guests')}

    <dialog ref={dialog} id={`${id}-picker`} className={`booking-picker booking-picker-${open ?? 'closed'}`} aria-labelledby={`${id}-picker-title`} style={{'--picker-width':'352px'} as CSSProperties} onKeyDown={onKeyDown} onCancel={event=>{event.preventDefault();event.stopPropagation();setOpen(null)}} onClose={()=>{if(!dialog.current?.open)setOpen(null)}} onPointerDown={event=>{if(event.target!==event.currentTarget)return;const r=event.currentTarget.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)setOpen(null)}}>
      <header className="booking-picker-heading"><div><p>MANGOSTEEN · YOUR VISIT</p><h3 id={`${id}-picker-title`}>{names[open??'area']}</h3></div><button type="button" className="booking-picker-close" onClick={()=>setOpen(null)} aria-label="Close booking picker">×</button></header>
      {open==='area'&&<div className="booking-area-options" role="group" aria-label="Seating area options">{(['rooftop','inside'] as const).map(area=>{
        const photo=authenticPhoto(area==='rooftop'?'rooftop-evening':'visit-interior')
        return <button key={area} type="button" aria-pressed={zone===area} onClick={()=>{if(area!==zone)onZoneChange(area);setOpen(null)}}><img src={photo.src} srcSet={photo.srcSet} sizes="86px" alt=""/><span><strong>{area==='rooftop'?'The Rooftop':'Inside Mangosteen'}</strong><small>{area==='rooftop'?'Rooftop seating':'Indoor seating'}</small></span><i aria-hidden="true">{zone===area&&<ReservationIcon name="check"/>}</i></button>
      })}<p>Choose an area to explore its seating plan.</p></div>}
      {open==='date'&&<div className="booking-calendar"><div className="booking-month"><button type="button" aria-label="Previous month" disabled={monthIndex===0} onClick={()=>changeMonth(monthIndex-1)}>‹</button><strong aria-live="polite">{new Intl.DateTimeFormat('en-IN',{month:'long',year:'numeric'}).format(new Date(year,monthNumber-1,1))}</strong><button type="button" aria-label="Next month" disabled={monthIndex===months.length-1} onClick={()=>changeMonth(monthIndex+1)}>›</button></div><div className="booking-calendar-grid" role="group" aria-label="Reservation dates">{['M','T','W','T','F','S','S'].map((day,i)=><span className="booking-weekday" aria-hidden="true" key={`weekday-${i}`}>{day}</span>)}{Array.from({length:leading},(_,i)=><span key={`empty-${i}`} aria-hidden="true"/>)}{Array.from({length:days},(_,i)=>{
        const day=i+1,value=`${month}-${String(day).padStart(2,'0')}`, enabled=allowed.has(value)
        return <button type="button" key={value} data-date={value} disabled={!enabled} tabIndex={value===focusedDate?0:-1} aria-label={fullDate(value)} aria-pressed={date===value} aria-current={dates[0].value===value?'date':undefined} onClick={()=>{if(value!==date)onDateChange(value);setOpen(null)}}>{day}</button>
      })}</div><p>Choose from the next {dates.length} days. Availability is confirmed by the café.</p></div>}
      {open==='time'&&<div className="booking-arrival"><p>When would you like to join us?</p><div role="group" aria-label="Arrival time options">{arrivalTimes.map(arrival=><button type="button" key={arrival} aria-pressed={time===arrival} onClick={()=>{if(arrival!==time)onTimeChange(arrival);setOpen(null)}}>{arrival}</button>)}</div><small>This is your preferred arrival time, subject to café confirmation.</small></div>}
      {open==='guests'&&<div className="booking-party"><p>How many guests are joining?</p><div className="booking-party-counter"><button type="button" disabled={guests===1} aria-label="Remove a guest" onClick={()=>onGuestsChange(guests-1)}>−</button><output aria-live="polite"><strong>{guests}</strong><span>{guests===1?'Guest':'Guests'}</span></output><button type="button" disabled={guests===6} aria-label="Add a guest" onClick={()=>onGuestsChange(guests+1)}>+</button></div><p>For 1–6 guests. Suitable seating updates as you choose.</p><button type="button" className="reservation-save" data-initial-focus onClick={()=>setOpen(null)}>Done <ReservationIcon name="check"/></button></div>}
    </dialog>
  </div>
}
