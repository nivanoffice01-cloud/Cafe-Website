import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { gsap } from 'gsap'
import { motion } from '../config/motion'

type Props = { reserve: () => void; menu: (event: MouseEvent<HTMLAnchorElement>) => void }
export function Navigation({ reserve, menu }: Props) {
  const [open, setOpen] = useState(false)
  const panel = useRef<HTMLDivElement>(null)
  const toggle = useRef<HTMLButtonElement>(null)
  const close = useRef<HTMLButtonElement>(null)
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
      if (event.key === 'Escape') setOpen(false)
      if (event.key !== 'Tab') return
      const items = panel.current!.querySelectorAll<HTMLElement>('a,button')
      const first = items[0], last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    window.addEventListener('keydown', keyboard)
    return () => { context.revert(); window.removeEventListener('keydown', keyboard); document.body.style.overflow = previous; toggle.current?.focus({ preventScroll: true }) }
  }, [open])
  const jump = () => setOpen(false)
  return <>
    <header className="mg-header">
      <a className="mg-logo" href="#top" aria-label="Mangosteen Café home"><img src="/images/architectural/brand-lockup.png" width="2172" height="724" alt="Mangosteen"/></a>
      <nav className="mg-desktop-nav" aria-label="Main navigation"><a href="/menu" onClick={menu}>Menu</a><a href="#cafe">The Café</a><a href="#gallery">Gallery</a><a href="#visit">Visit</a><button onClick={reserve}>Reserve a Table <span>↗</span></button></nav>
      <button className="mg-nav-toggle" ref={toggle} onClick={() => setOpen(true)} aria-expanded={open} aria-controls="mg-navigation" aria-label="Open navigation">Menu <span>＋</span></button>
    </header>
    {open && <div className="mg-navigation" id="mg-navigation" role="dialog" aria-modal="true" aria-label="Navigation" ref={panel}><button className="mg-nav-close" ref={close} onClick={() => setOpen(false)} aria-label="Close navigation">Close ×</button><p className="mg-eyebrow">A LITTLE WORLD ABOVE THE CITY</p><nav><a className="mg-nav-link" href="/menu" onClick={menu}>The menu <em>01</em></a><a className="mg-nav-link" href="#cafe" onClick={jump}>The café <em>02</em></a><a className="mg-nav-link" href="#gallery" onClick={jump}>Our spaces <em>03</em></a><a className="mg-nav-link" href="#visit" onClick={jump}>Visit us <em>04</em></a><button className="mg-nav-link" onClick={() => { setOpen(false); reserve() }}>Reserve a table <em>↗</em></button></nav><span>INDORE · MANGOSTEEN CAFÉ</span></div>}
  </>
}
