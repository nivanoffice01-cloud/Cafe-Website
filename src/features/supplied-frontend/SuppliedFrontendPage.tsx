import { useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { ReservationDialog } from '../../components/ReservationDialog'
import { Home, Story, Locations, Contact, observeMotion, startScroll, stopScroll, resetScroll } from './SuppliedDesign'
import { openReservation, reservationEvent, marketingNavigationEvent } from './integration'
import './fonts.css'
import './icons.css'
import './supplied.css'
import './integration.css'

export default function SuppliedFrontendPage() {
  const scope = useRef<HTMLDivElement>(null)
  const [reservation, setReservation] = useState(false)
  const [route, setRoute] = useState(location.pathname)
  const page = route === '/about' ? <Story/> : route === '/locations' ? <Locations/> : route === '/contact' ? <Contact/> : <Home/>
  useEffect(() => {
    const positions = new Map<string, number>()
    let current = location.pathname, sequence = 0
    let transition: ReturnType<Document['startViewTransition']> | undefined
    let pendingFrame = 0
    const go = (destination: string, replace: boolean) => {
      if (!['/', '/about', '/locations', '/contact'].includes(destination)) { location.assign(destination); return }
      positions.set(current, window.scrollY)
      const token = ++sequence
      transition?.skipTransition()
      if (!replace) history.pushState(null, '', destination)
      const update = () => {
        if (token !== sequence) return
        current = destination
        flushSync(() => setRoute(destination))
        cancelAnimationFrame(pendingFrame)
        pendingFrame = requestAnimationFrame(() => { resetScroll(); window.scrollTo(0, replace ? positions.get(destination) || 0 : 0) })
      }
      if ('startViewTransition' in document && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
        document.documentElement.dataset.mangosteenTransition = 'true'
        transition = document.startViewTransition(update)
        void transition.finished.catch(() => {}).finally(() => { if (token === sequence) delete document.documentElement.dataset.mangosteenTransition })
      } else update()
    }
    const navigate = (event: Event) => go((event as CustomEvent<string>).detail, false)
    const back = () => go(location.pathname, true)
    // Ordinary anchors in the supplied story/hero also receive the same transition.
    const anchors = (event: globalThis.MouseEvent) => {
      if (event.defaultPrevented || event.button || event.metaKey || event.ctrlKey || event.shiftKey) return
      const link = (event.target as Element).closest<HTMLAnchorElement>('.saved-mangosteen a')
      if (!link || link.target === '_blank') return
      const url = new URL(link.href)
      if (url.origin === location.origin && !url.hash && ['/', '/about', '/locations', '/contact'].includes(url.pathname)) { event.preventDefault(); go(url.pathname, false) }
    }
    window.addEventListener(marketingNavigationEvent, navigate)
    window.addEventListener('popstate', back)
    document.addEventListener('click', anchors)
    return () => { sequence++; transition?.skipTransition(); cancelAnimationFrame(pendingFrame); delete document.documentElement.dataset.mangosteenTransition; window.removeEventListener(marketingNavigationEvent, navigate); window.removeEventListener('popstate', back); document.removeEventListener('click', anchors) }
  }, [])
  useEffect(() => {
    const root = scope.current!
    const cleanup = observeMotion(root)
    startScroll()
    const reserve = () => { stopScroll(); setReservation(true) }
    window.addEventListener(reservationEvent, reserve)
    // Saved hero/footer also contain ordinary anchors, alongside router-style links.
    const anchors = (event: globalThis.MouseEvent) => {
      const link = (event.target as Element).closest<HTMLAnchorElement>('a')
      if (!link || event.defaultPrevented || event.button || event.metaKey || event.ctrlKey || event.shiftKey) return
      const url = new URL(link.href, location.href)
      if (url.origin === location.origin && url.pathname === '/contact' && url.hash === '#book') {
        event.preventDefault(); openReservation()
      }
    }
    root.addEventListener('click', anchors)
    let menuOpen = false
    let priorOverflow = ''
    const toggle = root.querySelector<HTMLButtonElement>('button[aria-label="Toggle menu"]')
    const syncMenu = () => {
      const open = toggle?.getAttribute('aria-expanded') === 'true'
      if (open === menuOpen) return
      menuOpen = open
      if (open) { priorOverflow = document.body.style.overflow; document.body.style.overflow = 'hidden'; stopScroll() }
      else { document.body.style.overflow = priorOverflow; startScroll() }
    }
    const observer = new MutationObserver(syncMenu)
    if (toggle) observer.observe(toggle, { attributes: true, attributeFilter: ['aria-expanded'] })
    const keyboard = (event: KeyboardEvent) => {
      if (!menuOpen) return
      if (event.key === 'Escape') { event.preventDefault(); toggle?.click(); toggle?.focus() }
      if (event.key === 'Tab') {
        const controls = [...root.querySelectorAll<HTMLElement>('header a, header button')].filter(el => el.getClientRects().length)
        const first = controls[0], last = controls.at(-1)
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
      }
    }
    document.addEventListener('keydown', keyboard)
    return () => { cleanup(); stopScroll(); observer.disconnect(); if (menuOpen) document.body.style.overflow = priorOverflow; document.removeEventListener('keydown', keyboard); root.removeEventListener('click', anchors); window.removeEventListener(reservationEvent, reserve) }
  }, [route])
  useEffect(() => {
    if (!reservation) startScroll()
  }, [reservation])
  return <>
    <div ref={scope} className="saved-mangosteen motion-ready">{page}</div>
    {reservation && <ReservationDialog onClose={() => setReservation(false)}/>}
  </>
}
