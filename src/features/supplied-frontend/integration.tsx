import type { AnchorHTMLAttributes, MouseEvent } from 'react'
import { cafe } from '../../data/cafe'
import { dishDestination } from './verified-content'

export const reservationEvent = 'mangosteen:reserve'
export const marketingNavigationEvent = 'mangosteen:marketing-navigate'
export function openReservation() { window.dispatchEvent(new Event(reservationEvent)) }
export function useSavedLocation() { return { pathname: window.location.pathname, hash: window.location.hash } }

type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'className'> & {
  to: string; className?: string | ((state: { isActive: boolean }) => string)
}

export function SavedLink({ to, className, onClick, children, ...props }: LinkProps) {
  const href = to.startsWith('/menu/') ? dishDestination(to.split('/').pop() || '') : to
  const reserve = to.includes('/contact#book')
  const click = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event)
    if (reserve && !event.defaultPrevented && !event.metaKey && !event.ctrlKey && !event.shiftKey && event.button === 0) {
      event.preventDefault(); openReservation()
    } else if (!event.defaultPrevented && ['/', '/about', '/locations', '/contact'].includes(href) && !event.metaKey && !event.ctrlKey && !event.shiftKey && event.button === 0) {
      event.preventDefault(); window.dispatchEvent(new CustomEvent(marketingNavigationEvent, { detail: href }))
    }
  }
  return <a {...props} href={href} onClick={click} className={typeof className === 'function' ? className({ isActive: location.pathname === to }) : className}>{children}</a>
}
export const SavedNavLink = SavedLink

export function ReservationEntry() {
  return <div className="poster-card p-6 md:p-10">
    <p className="eyebrow text-accent-700">YOUR TABLE AT MANGOSTEEN</p>
    <h2 className="h-section mt-6">Make a little <span className="hand text-accent-600">time.</span></h2>
    <p className="mt-5 text-sm leading-[1.85] text-foreground-700">Choose your date, arrival time and preferred seating in our reservation form. Our team will confirm your request.</p>
    <button type="button" className="btn-poster btn-berry mt-7" onClick={openReservation}>Reserve a table</button>
  </div>
}
export function ContactEntry() {
  return <div className="poster-card p-6 md:p-10">
    <p className="eyebrow text-accent-700">COME FIND US</p>
    <p className="mt-5 text-sm leading-[1.85]">{cafe.address}</p>
    <p className="mt-4 text-sm">{cafe.hours}</p>
    <a href={cafe.directionsUrl} target="_blank" rel="noopener noreferrer" className="btn-poster btn-ink mt-7">Get directions <i className="ri-arrow-right-up-line" aria-hidden="true"/></a>
  </div>
}
