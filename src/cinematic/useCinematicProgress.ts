import { useEffect, type RefObject } from 'react'
import type { CinematicSceneManifest } from './types'

const clamp = (value: number) => Math.min(1, Math.max(0, value))
const smoothstep = (value: number, from: number, to: number) => {
  const amount = clamp((value - from) / Math.max(.0001, to - from))
  return amount * amount * (3 - 2 * amount)
}

export function useCinematicProgress(root: RefObject<HTMLElement | null>, manifest: CinematicSceneManifest) {
  useEffect(() => {
    const scene = root.current
    if (!scene) return
    const reduced = matchMedia('(prefers-reduced-motion: reduce)')
    let target = 0
    let current = 0
    let frame = 0
    let visible = true
    let last = performance.now()

    const paint = (progress: number) => {
      scene.style.setProperty('--cinema-progress', String(progress))
      scene.style.setProperty('--cinema-intro-opacity', String(1 - smoothstep(progress, .12, .34)))
      scene.style.setProperty('--cinema-story-opacity', String(smoothstep(progress, .24, .43) * (1 - smoothstep(progress, .67, .84))))
      scene.style.setProperty('--cinema-threshold-opacity', String(smoothstep(progress, .76, .94)))
      scene.style.setProperty('--cinema-transition', String(smoothstep(progress, .84, 1)))
      scene.style.setProperty('--cinema-foreground-x', `${-18 - progress * 46}px`)
      scene.style.setProperty('--cinema-foreground-y', `${progress * -22}px`)
      scene.style.setProperty('--cinema-push', String(1 + progress * .095))
      const introActions = scene.querySelector<HTMLElement>('.cinema-intro > div')
      if (introActions) introActions.style.pointerEvents = progress < .34 ? 'auto' : 'none'
      window.dispatchEvent(new CustomEvent('mangosteen:cinematic-progress', { detail: { sceneId: manifest.id, progress } }))
    }

    const tick = (time: number) => {
      frame = 0
      if (!visible) return
      const delta = Math.min((time - last) / 1000, .05)
      last = time
      current = reduced.matches ? target : current + (target - current) * (1 - Math.exp(-5.4 * delta))
      paint(current)
      if (Math.abs(current - target) > .0005) frame = requestAnimationFrame(tick)
    }
    const measure = () => {
      const rect = scene.getBoundingClientRect()
      const distance = Math.max(1, scene.offsetHeight - innerHeight)
      target = clamp(-rect.top / distance)
      visible = rect.bottom > 0 && rect.top < innerHeight
      if (visible && !frame) { last = performance.now(); frame = requestAnimationFrame(tick) }
    }
    const visibility = () => { visible = !document.hidden; measure() }
    addEventListener('scroll', measure, { passive: true })
    addEventListener('resize', measure)
    document.addEventListener('visibilitychange', visibility)
    reduced.addEventListener('change', measure)
    measure()
    return () => {
      cancelAnimationFrame(frame)
      removeEventListener('scroll', measure)
      removeEventListener('resize', measure)
      document.removeEventListener('visibilitychange', visibility)
      reduced.removeEventListener('change', measure)
    }
  }, [manifest, root])
}
