import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { gsap } from 'gsap'
import { motion } from '../config/motion'

type Props = { reserve: () => void; menu: (event: MouseEvent<HTMLAnchorElement>) => void }
export function Navigation({ reserve, menu }: Props) {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const sentinel = useRef<HTMLSpanElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const toggle = useRef<HTMLButtonElement>(null)
  const close = useRef<HTMLButtonElement>(null)
  const closing = useRef<gsap.core.Tween | null>(null)
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setScrolled(!entry.isIntersecting))
    if (sentinel.current) observer.observe(sentinel.current)
    const restore = () => setOpen(false)
    window.addEventListener('pageshow', restore)
    return () => { observer.disconnect(); window.removeEventListener('pageshow', restore) }
  }, [])
  const dismiss = (after?: () => void) => {
    closing.current?.kill()
    if (window.matchMedia(motion.reduced).matches) { setOpen(false); after?.(); return }
    gsap.killTweensOf(panel.current)
    closing.current = gsap.to(panel.current, { clipPath: 'inset(0 0 100% 0)', duration: .25, ease: motion.ease, onComplete: () => { setOpen(false); after?.() } })
  }
  const scrollToSection = (event: MouseEvent<HTMLAnchorElement>, fromDrawer = false) => {
    const target = document.querySelector(event.currentTarget.hash)
    if (!target) return
    event.preventDefault()
    const go = () => { target.scrollIntoView({ behavior: matchMedia(motion.reduced).matches ? 'instant' : 'smooth' }); history.replaceState(history.state, '', event.currentTarget?.hash || `#${target.id}`) }
    if (fromDrawer) dismiss(go); else go()
  }
  useEffect(() => {
    if (!open || !panel.current) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'; close.current?.focus()
    const context = gsap.context(() => {
      if (window.matchMedia(motion.reduced).matches) return
      gsap.from(panel.current, { clipPath: 'inset(0 0 100% 0)', duration: .5, ease: motion.ease })
      gsap.from(panel.current!.querySelectorAll('.mg-nav-link'), { y: 28, opacity: 0, stagger: .06, duration: .45, delay: .12 })
    }, panel)
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === 'Escape') dismiss()
      if (event.key !== 'Tab') return
      const items = panel.current!.querySelectorAll<HTMLElement>('a,button')
      const first = items[0], last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    window.addEventListener('keydown', keyboard)
    return () => { closing.current?.kill(); context.revert(); window.removeEventListener('keydown', keyboard); document.body.style.overflow = previous; toggle.current?.focus({ preventScroll: true }) }
  }, [open])
  return <>
    <span className="mg-header-sentinel" ref={sentinel} aria-hidden="true"/>
    <header className={`mg-header${scrolled ? ' is-scrolled' : ''}`}>
      <a className="mg-logo" href="#top" aria-label="Mangosteen Café home"><img src="/images/architectural/brand-lockup.png" width="2172" height="724" alt="Mangosteen"/></a>
      <nav className="mg-desktop-nav" aria-label="Main navigation"><a href="/menu" onClick={menu}>Menu</a><a href="#cafe" onClick={event => scrollToSection(event)}>The Café</a><a href="#gallery" onClick={event => scrollToSection(event)}>Gallery</a><a href="#visit" onClick={event => scrollToSection(event)}>Visit</a><button onClick={reserve}>Reserve a Table <span aria-hidden="true">↗</span></button></nav>
      <button className="mg-nav-toggle" ref={toggle} onClick={() => setOpen(true)} aria-expanded={open} aria-controls="mg-navigation" aria-label="Open navigation">Menu <span aria-hidden="true">＋</span></button>
    </header>
    {open && <div className="mg-navigation" id="mg-navigation" role="dialog" aria-modal="true" aria-label="Navigation" ref={panel}><button className="mg-nav-close" ref={close} onClick={() => dismiss()} aria-label="Close navigation">Close ×</button><p className="mg-eyebrow">A LITTLE WORLD ABOVE THE CITY</p><nav><a className="mg-nav-link" href="/menu" onClick={menu}>The menu <em>01</em></a><a className="mg-nav-link" href="#cafe" onClick={event => scrollToSection(event, true)}>The café <em>02</em></a><a className="mg-nav-link" href="#gallery" onClick={event => scrollToSection(event, true)}>Our spaces <em>03</em></a><a className="mg-nav-link" href="#visit" onClick={event => scrollToSection(event, true)}>Visit us <em>04</em></a><button className="mg-nav-link" onClick={() => dismiss(reserve)}>Reserve a table <em>↗</em></button></nav><span>INDORE · MANGOSTEEN CAFÉ</span></div>}
  </>
}
