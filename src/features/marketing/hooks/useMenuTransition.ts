import { useEffect, useRef, type MouseEvent } from 'react'
import { gsap } from 'gsap'
import { motion } from '../config/motion'

// Marketing-only exit: QR entry and protected menu navigation remain native.
export function useMenuTransition() {
  const curtain = useRef<HTMLDivElement>(null)
  const running = useRef(false)
  const tween = useRef<gsap.core.Tween | null>(null)
  useEffect(() => {
    const restore = () => { running.current = false; tween.current?.kill(); if (curtain.current) gsap.set(curtain.current, { yPercent: 100, visibility: 'hidden' }) }
    window.addEventListener('pageshow', restore)
    return () => { window.removeEventListener('pageshow', restore); tween.current?.kill() }
  }, [])
  const navigate = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || window.matchMedia(motion.reduced).matches) return
    const destination = new URL(event.currentTarget.href)
    if (destination.origin !== location.origin || destination.searchParams.has('table')) return
    event.preventDefault()
    if (running.current || !curtain.current) return
    running.current = true
    // Warm the destination document while the brief exit plays; no synthetic loading pause.
    void fetch(destination.href, { priority: 'low' }).catch(() => {})
    gsap.set(curtain.current, { visibility: 'visible', yPercent: 100 })
    tween.current = gsap.to(curtain.current, { yPercent: 0, duration: motion.curtain, ease: motion.ease, onComplete: () => window.location.assign(destination.href) })
  }
  return { curtain, navigate }
}
