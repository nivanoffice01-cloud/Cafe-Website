import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { PizzaStage, opening, type Direction } from './stage'
import './lab.css'

gsap.registerPlugin(ScrollTrigger)

const chapters = [
  { n: 'I', name: 'Dough', title: ['Soft, rested,', 'stretched by hand.'], text: 'A raised edge, a tender centre. The quiet before everything.', side: 'l' },
  { n: 'II', name: 'Pomodoro', title: ['Tomato, ladled', 'in one slow spiral.'], text: 'Bright, glossy and barely cooked, so the oven can finish the thought.', side: 'r' },
  { n: 'III', name: 'Mozzarella', title: ['Milk-white,', 'torn, let fall.'], text: 'Each piece finds its own place. No two pizzas land the same way.', side: 'l' },
  { n: 'IV', name: 'Fire', title: ['Then the oven', 'takes over.'], text: 'The rim blisters. The sauce deepens. The cheese gives in.', side: 'r' },
  { n: 'V', name: 'Basilico', title: ['Basil, only', 'at the very end.'], text: 'Laid on while the heat is still rising.', side: 'l' },
] as const

const Split = ({ lines }: { lines: readonly string[] }) => <>{lines.map(l => <span className="cvl-line" key={l}><span>{l}</span></span>)}</>

export default function ClaudeVfxLabPage() {
  const root = useRef<HTMLElement>(null), canvas = useRef<HTMLCanvasElement>(null)
  const [progress, setProgress] = useState(0), [ready, setReady] = useState(false), [failed, setFailed] = useState(false)

  useEffect(() => {
    const el = root.current!, calm = matchMedia('(prefers-reduced-motion: reduce)').matches
    document.documentElement.classList.add('cvl-page'); const title = document.title; document.title = 'The Margherita · Mangosteen Café'
    let stage: PizzaStage | undefined, alive = true, mm: gsap.MatchMedia | undefined
    try { stage = new PizzaStage(canvas.current!, calm, innerWidth < 820) } catch { setFailed(true); setReady(true) }

    const direct = (mobile: boolean) => {
      const d: Direction = stage?.dir ?? { ...opening }
      Object.assign(d, opening, mobile ? { dist: 5.7, elev: 31, shiftY: .13 } : {})
      const q = gsap.utils.selector(el), side = mobile ? 0 : .21, up = mobile ? .13 : .0
      const tl = gsap.timeline({ defaults: { ease: 'sine.inOut' }, scrollTrigger: { trigger: el, start: 'top top', end: 'bottom bottom', scrub: calm ? true : 1.1 } })
      const show = (c: string, at: number, out: number) => {
        tl.fromTo(q(`${c} .cvl-line > span`), { yPercent: 150, rotate: 3 }, { yPercent: 0, rotate: 0, duration: .42, stagger: .08, ease: 'power3.out' }, at)
          .fromTo(q(`${c} .cvl-fade`), { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: .36, stagger: .06, ease: 'power2.out' }, at + .12)
          
        if (out) tl.fromTo(q(`${c} .cvl-num`), { autoAlpha: 0, x: 40 }, { autoAlpha: 1, x: 0, duration: .5, ease: 'power2.out' }, at).to(q(`${c} .cvl-line > span`), { yPercent: -150, duration: .34, stagger: .05, ease: 'power2.in' }, out).to(q(`${c} .cvl-fade, ${c} .cvl-num`), { autoAlpha: 0, y: -24, duration: .28, ease: 'power2.in' }, out)
      }
      // prologue: the finished dish comes apart
      tl.to(d, { drift: 10, duration: 10.4, ease: 'none' }, 0)
        .to(q('.cvl-title-l'), { xPercent: -24, autoAlpha: 0, duration: .9, ease: 'power1.in' }, .15).to(q('.cvl-title-r'), { xPercent: 24, autoAlpha: 0, duration: .9, ease: 'power1.in' }, .15)
        .to(q('.cvl-hero .cvl-out'), { autoAlpha: 0, y: -30, duration: .45 }, .1)
        .to(d, { mozz: -1, tom: -1, basil: -1, duration: 1.25, ease: 'power1.inOut' }, .2)
        .to(d, { steam: 0, loose: 0, duration: .7 }, .3)
        .to(d, { sauce: 0, duration: 1.0 }, .55).to(d, { bake: 0, duration: .85 }, .4)
        .to(d, { elev: 62, azim: -8, dist: mobile ? 6.1 : 5.1, shiftX: side, shiftY: -up, spin: -.05, lift: 0, tiltX: 0, duration: 1.4 }, .25)
        .to(d, { rise: .62, duration: 1 }, .6).to(d, { table: 1, duration: .9 }, .75).to(d, { flour: 1, duration: .6 }, 1.05)
      show('.cvl-c0', 1.45, 2.45)
      tl.to(d, { spin: .28, elev: 52, duration: 1.1 }, 1.7)
        // sauce
        .to(d, { elev: 70, dist: mobile ? 5.9 : 4.7, shiftX: -side, azim: 6, duration: .95 }, 2.5).to(d, { flour: .3, duration: .6 }, 2.55)
        .to(d, { sauce: 1, duration: 1.35, ease: 'power1.inOut' }, 2.75).to(d, { spin: .75, duration: 1.5 }, 2.6)
      show('.cvl-c1', 2.95, 3.95)
      // mozzarella + tomato: suspended, then released
      tl.to(d, { elev: 30, dist: mobile ? 6.1 : 5.0, shiftX: side, shiftY: mobile ? -.06 : .11, azim: -10, duration: 1.0 }, 4.0)
        .to(d, { mozz: 0, duration: .75, ease: 'power2.out' }, 3.95).to(d, { tom: 0, duration: .75, ease: 'power2.out' }, 4.1)
        .to(d, { spin: .35, duration: 2.0 }, 4.1).to(d, { flour: 0, duration: .5 }, 4)
        .to(d, { mozz: 1, duration: 1.05, ease: 'none' }, 4.85).to(d, { tom: 1, duration: .85, ease: 'none' }, 5.1)
        .to(d, { elev: 46, duration: 1.0 }, 5.0)
      show('.cvl-c2', 4.4, 5.65)
      // fire
      tl.to(d, { elev: 22, azim: 16, dist: mobile ? 5.6 : 4.9, shiftX: -side * .95, shiftY: mobile ? -.10 : .04, duration: .8 }, 5.8)
        .to(d, { heat: 1, duration: .6 }, 5.95).to(q('.cvl-fire'), { autoAlpha: 1, duration: .6 }, 5.95).to(q('.cvl-shafts'), { autoAlpha: 0, duration: .5 }, 5.9).to(q('.cvl-shafts'), { autoAlpha: 1, duration: .6 }, 7.35)
        .to(d, { bake: 1, rise: 1.12, duration: 1.15, ease: 'power1.inOut' }, 6.15).to(d, { steam: .8, duration: .8 }, 6.5)
        .to(d, { heat: 0, rise: 1, duration: .6 }, 7.3).to(q('.cvl-fire'), { autoAlpha: 0, duration: .6 }, 7.3)
      show('.cvl-c3', 6.42, 7.25)
      // basil
      tl.to(d, { elev: 38, azim: -12, dist: mobile ? 5.9 : 4.6, shiftX: side, shiftY: mobile ? -.08 : .09, duration: .9 }, 7.35)
        .to(d, { basil: 0, duration: .55, ease: 'power2.out' }, 7.35).to(d, { basil: 1, duration: .95, ease: 'none' }, 7.85).to(d, { loose: 1, duration: .6 }, 7.6)
      show('.cvl-c4', 7.6, 8.55)
      // finale
      tl.to(d, { elev: 40, azim: 0, dist: mobile ? 6.1 : 5.15, shiftX: 0, shiftY: mobile ? .09 : .10, spin: .12, steam: .55, duration: 1.0 }, 8.65)
        .to(d, { slice: .78, duration: 1.15, ease: 'power1.inOut' }, 9.05)
      show('.cvl-end', 9.2, 0)
      tl.to(q('.cvl-rail i'), { scaleY: 1, duration: 10.4, ease: 'none' }, 0)
      return () => { tl.scrollTrigger?.kill(); tl.kill() }
    }

    const start = () => {
      if (!alive) return
      mm = gsap.matchMedia(el); mm.add({ m: '(max-width: 819px)', d: '(min-width: 820px)' }, c => direct(!!c.conditions?.m))
      setReady(true); ScrollTrigger.refresh()
      if (!calm) gsap.from(el.querySelectorAll('.cvl-hero .cvl-line > span'), { yPercent: 115, rotate: 4, duration: 1.5, stagger: .12, ease: 'power4.out', delay: .35, clearProps: 'all' })
    }
    const handle = window as unknown as { __cvl?: PizzaStage }
    if (stage) { handle.__cvl = import.meta.env.DEV ? stage : undefined; stage.load(p => alive && setProgress(p)).then(start).catch(() => { if (alive) { setFailed(true); start() } }) } else start()
    return () => { alive = false; mm?.revert(); stage?.dispose(); delete handle.__cvl; document.documentElement.classList.remove('cvl-page'); document.title = title }
  }, [])

  return <main className={`cvl${ready ? ' is-ready' : ''}`} ref={root}>
    <div className="cvl-stage">
      <div className="cvl-bg" aria-hidden="true" /><div className="cvl-fire" aria-hidden="true" />
      <section className="cvl-hero">
        <p className="cvl-kicker cvl-out">Mangosteen Café <span>Indore</span></p>
        <h1 aria-label="The Margherita"><span className="cvl-title-l"><span className="cvl-line"><span>The</span></span></span><span className="cvl-title-r"><span className="cvl-line"><span>Margherita</span></span></span></h1>
      </section>
      <canvas ref={canvas} className="cvl-canvas" aria-hidden="true" />
      <div className="cvl-shafts" aria-hidden="true" /><div className="cvl-vignette" aria-hidden="true" /><div className="cvl-grain" aria-hidden="true" />
      <div className="cvl-hero cvl-hero-foot"><p className="cvl-out">Four ingredients. One fire.<br />Watch it come together.</p><p className="cvl-scroll cvl-out">Scroll <i /></p></div>
      {chapters.map((c, i) => <section key={c.n} className={`cvl-chapter cvl-c${i} is-${c.side}`}>
        <span className="cvl-num" aria-hidden="true">{c.n}</span>
        <div><p className="cvl-label cvl-fade">{c.name}</p><h2><Split lines={c.title} /></h2><p className="cvl-copy cvl-fade">{c.text}</p></div>
      </section>)}
      <section className="cvl-end"><h2><Split lines={['Take the', 'first slice.']} /></h2><div className="cvl-fade"><a href="/menu">See the menu</a></div><a className="cvl-credit cvl-fade" href="/claude-vfx/credits.txt">Photography credits</a></section>
      <header className="cvl-head"><a href="/">Mangosteen</a><span>Pizza study</span></header>
      <div className="cvl-rail" aria-hidden="true"><i /></div>
      {failed && <p className="cvl-fail">This experience needs WebGL, which is unavailable in this browser.</p>}
      <div className="cvl-load" aria-hidden={ready}><p>Mangosteen</p><i style={{ transform: `scaleX(${progress})` }} /></div>
    </div>
  </main>
}
