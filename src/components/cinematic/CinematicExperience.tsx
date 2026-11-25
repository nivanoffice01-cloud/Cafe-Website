import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { arrivalScene } from '../../cinematic/scenes'
import type { CinematicProgressDetail } from '../../cinematic/types'
import { useCinematicProgress } from '../../cinematic/useCinematicProgress'
import { useRegisteredSequence } from '../../cinematic/useRegisteredSequence'
import { CinematicCanvas } from './CinematicCanvas'
import { FrameSequence } from './FrameSequence'

type Props = { onMenu: () => void; onReserve: () => void; onReady: () => void; onFailure: () => void }

const chapterCopy = [
  ['The Arrival', 'A little world', 'above the city.'],
  ['The Threshold', 'Crossing into', 'Mangosteen.'],
  ['The Walkthrough', 'Inside, time', 'slows down.'],
  ['The Ritual', 'Coffee, poured', 'in motion.'],
  ['The Table', 'Food that brings', 'you back.'],
  ['The Pour', 'An evening,', 'brightened.'],
  ['The Transformation', 'Day slips', 'into night.'],
  ['The Invitation', 'Your evening', 'awaits.'],
] as const

function AssetPreloader() {
  useEffect(() => {
    const load = () => { const image = new Image(); image.decoding = 'async'; image.src = arrivalScene.transitionPoster || '' }
    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(load, { timeout: 1800 })
      return () => window.cancelIdleCallback(id)
    }
    const timer = globalThis.setTimeout(load, 900)
    return () => globalThis.clearTimeout(timer)
  }, [])
  return null
}

export function CinematicExperience({ onMenu, onReserve, onReady, onFailure }: Props) {
  const root = useRef<HTMLElement>(null)
  const ready = useRef(false)
  const registeredSequence = useRegisteredSequence(arrivalScene.id)
  const interiorSequence = useRegisteredSequence('interior')
  const walkthroughSequence = useRegisteredSequence('walkthrough')
  const coffeeSequence = useRegisteredSequence('coffee')
  const pizzaSequence = useRegisteredSequence('pizza')
  const mocktailSequence = useRegisteredSequence('mocktail')
  const dayNightSequence = useRegisteredSequence('day-night')
  const closingSequence = useRegisteredSequence('closing')
  const { enabledSequences, sequenceRanges, totalScroll } = useMemo(() => {
    const sequences = [
      ['arrival', registeredSequence],
      ['interior', interiorSequence],
      ['walkthrough', walkthroughSequence],
      ['coffee', coffeeSequence],
      ['pizza', pizzaSequence],
      ['mocktail', mocktailSequence],
      ['day-night', dayNightSequence],
      ['closing', closingSequence],
    ] as const
    const enabled = sequences.filter((entry) => entry[1])
    const scroll = enabled.reduce((sum, entry) => sum + (entry[1]?.scrollLengthVh ?? 0), 0) || arrivalScene.scrollLengthVh
    let elapsed = 0
    const ranges = enabled.map(([id, config]) => {
      const start = elapsed / scroll
      elapsed += config?.scrollLengthVh ?? 0
      return { id, config, range: [start, elapsed / scroll] as const }
    })
    return { enabledSequences: enabled, sequenceRanges: ranges, totalScroll: scroll }
  }, [registeredSequence, interiorSequence, walkthroughSequence, coffeeSequence, pizzaSequence, mocktailSequence, dayNightSequence, closingSequence])
  const [activeChapter, setActiveChapter] = useState(1)
  useCinematicProgress(root, arrivalScene)
  useEffect(() => {
    const update = (event: Event) => {
      const detail = (event as CustomEvent<CinematicProgressDetail>).detail
      if (detail.sceneId !== arrivalScene.id || !Number.isFinite(detail.progress)) return
      const rangeIndex = sequenceRanges.findIndex(({ range }) => detail.progress <= range[1] + .0001)
      const chapter = sequenceRanges.length
        ? Math.max(1, Math.min(chapterCopy.length, rangeIndex >= 0 ? rangeIndex + 1 : chapterCopy.length))
        : 1
      setActiveChapter(chapter)
    }
    addEventListener('mangosteen:cinematic-progress', update)
    return () => removeEventListener('mangosteen:cinematic-progress', update)
  }, [sequenceRanges])
  const notifyReady = useCallback(() => { if (!ready.current) { ready.current = true; onReady() } }, [onReady])
  const enter = () => window.scrollTo({ top: innerHeight * 1.05, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
  const copy = chapterCopy[activeChapter - 1] ?? chapterCopy[0]
  return <section ref={root} className={`cinema-experience${registeredSequence ? ' has-sequence' : ''}${enabledSequences.length > 1 ? ' has-production-sequences' : ''}`} id="top" aria-labelledby="cinema-title" style={{ '--cinema-scroll-vh': `${totalScroll}svh` } as CSSProperties}>
    <AssetPreloader/>
    <div className="cinema-stage" id="cinematic-journey">
      <picture className="cinema-poster"><source media="(max-width:700px)" srcSet={arrivalScene.mobilePoster}/><img src={arrivalScene.poster} alt="Mangosteen Café exterior and illuminated sign at night" fetchPriority="high" decoding="async" onLoad={notifyReady}/></picture>
      {sequenceRanges.map(({ id, config, range }) => <FrameSequence key={id} config={config} sceneId={arrivalScene.id} className={`is-${id}`} progressRange={range}/>)}
      <CinematicCanvas manifest={arrivalScene} onReady={notifyReady} onFailure={onFailure}/>
      <div className="cinema-depth-foreground" aria-hidden="true"/>
      {!interiorSequence && arrivalScene.transitionPoster && <img className="cinema-transition-plate" src={arrivalScene.transitionPoster} alt="" aria-hidden="true" loading="lazy" decoding="async"/>}
      <div className="cinema-atmosphere" aria-hidden="true"><i/><i/><i/></div>
      <div className="cinema-grade" aria-hidden="true"/>

      <div className="cinema-intro">
        <p>{arrivalScene.copy.eyebrow}</p>
        <h1 id="cinema-title">{arrivalScene.copy.brand}</h1>
        <h2>Above the city.<br/><em>Beyond the ordinary.</em></h2>
        <span>{arrivalScene.copy.supporting}</span>
        <div><button type="button" onClick={onMenu}>Explore the Menu</button><button type="button" onClick={onReserve}>Reserve a Table</button></div>
      </div>

      <div className="cinema-story" aria-hidden="true"><span>CHAPTER {String(activeChapter).padStart(2, '0')} · {copy[0].toUpperCase()}</span><p>{copy[1]}<br/><em>{copy[2]}</em></p></div>
      <div className="cinema-threshold" aria-hidden="true"><span>THE THRESHOLD</span><p>Some places are meant<br/>to be experienced.</p></div>

      <nav className="cinema-quick" aria-label="Cinematic experience actions"><button type="button" onClick={enter}>Enter Experience</button><a href="#signatures">Skip Experience</a></nav>
      <div className="cinema-progress" aria-hidden="true"><span>{String(activeChapter).padStart(2, '0')} / 08</span><i/><span>SCROLL TO ENTER</span></div>
    </div>
  </section>
}
