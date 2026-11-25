import { useLayoutEffect, type RefObject } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { motion } from '../config/motion'

gsap.registerPlugin(ScrollTrigger)

// The image stays still. Only the SVG mask's normalized control points change.
export function archPath(progress: number, mobile: boolean) {
  const p = Math.max(0, Math.min(1, progress))
  const left = (mobile ? .045 : .235) * (1 - p)
  const top = .13 * (1 - p)
  const shoulder = top + (mobile ? .27 : .38) * (1 - p)
  return `M${left},1 L${left},${shoulder} C${left},${top + (shoulder - top) * .44} ${.5 - (.5 - left) * .56},${top} .5,${top} C${.5 + (.5 - left) * .56},${top} ${1 - left},${top + (shoulder - top) * .44} ${1 - left},${shoulder} L${1 - left},1 Z`
}

export function useMarketingMotion(root: RefObject<HTMLDivElement | null>) {
  useLayoutEffect(() => {
    if (!root.current) return
    const media = gsap.matchMedia()
    const context = gsap.context(() => {
      media.add({ desktop: motion.desktop, mobile: '(max-width: 899px)', reduced: motion.reduced }, match => {
        const { mobile, reduced } = match.conditions!
        const scope = root.current!
        const q = gsap.utils.selector(scope)
        const clip = scope.querySelector('#mg-arch-path')!
        const outline = scope.querySelector('#mg-arch-outline')!
        const setMask = (p: number) => { const d = archPath(p, mobile); clip.setAttribute('d', d); outline.setAttribute('d', d) }
        setMask(0)
        if (reduced) return
        const entrance = gsap.timeline({ defaults: { ease: motion.reveal } })
        entrance.from(q('.mg-header'), { y: -16, opacity: 0, duration: .65 })
          .from(q('.mg-hero-line > span'), { yPercent: 105, duration: motion.enter, stagger: .14 }, .12)
          .from(q('.mg-hero-support'), { y: 12, opacity: 0, duration: .7 }, .45)
        const state = { p: 0 }
        gsap.timeline({ scrollTrigger: { trigger: q('.mg-entrance')[0], start: 'top top', end: 'bottom bottom', scrub: motion.scrub, invalidateOnRefresh: true } })
          .to(state, { p: 1, duration: 1, ease: 'none', onUpdate: () => setMask(state.p) }, 0)
          .to(q('.mg-hero-copy'), { yPercent: -22, opacity: 0, duration: .65, ease: 'none' }, .15)
          .to(q('.mg-hero-caption'), { opacity: 1, y: 0, duration: .2 }, .75)
        const story = gsap.timeline({ scrollTrigger: { trigger: q('.mg-story')[0], start: 'top 85%', end: 'bottom 60%', scrub: .7 } })
        story.from(q('.mg-story-line > span'), { yPercent: 105, stagger: .16, duration: 1, ease: motion.reveal })
          .from(q('.mg-story-photo'), { clipPath: 'inset(100% 0 0 0)', rotate: -6, duration: .8 }, .1)
        gsap.fromTo(q('.mg-orbit-plate'), { y: mobile ? 40 : 100, rotate: -12 }, { y: mobile ? -20 : -80, rotate: 6, ease: 'none', scrollTrigger: { trigger: q('.mg-food-story')[0], start: 'top bottom', end: 'bottom top', scrub: .8 } })
        gsap.from(q('.mg-food-heading .mg-line > span'), { yPercent: 110, stagger: .12, duration: 1, ease: motion.reveal, scrollTrigger: { trigger: q('.mg-food-heading')[0], start: 'top 85%', toggleActions: 'play none none reverse' } })
        scope.querySelectorAll<HTMLElement>('.mg-space').forEach((item, i) => {
          gsap.from(item.querySelector('.mg-space-photo'), { clipPath: 'inset(0 0 100% 0)', duration: 1.15, ease: motion.reveal, scrollTrigger: { trigger: item, start: 'top 88%', toggleActions: 'play none none reverse' } })
          gsap.fromTo(item.querySelector('img'), { yPercent: -4 }, { yPercent: 4, ease: 'none', scrollTrigger: { trigger: item, start: 'top bottom', end: 'bottom top', scrub: .8 } })
          gsap.from(item.querySelector('figcaption'), { y: 18, opacity: 0, duration: .7, delay: i % 2 * .08, scrollTrigger: { trigger: item, start: 'top 70%', toggleActions: 'play none none reverse' } })
        })
        gsap.fromTo(q('.mg-moment-tall'), { y: mobile ? 25 : 70, rotate: -3 }, { y: -25, rotate: 0, ease: 'none', scrollTrigger: { trigger: q('.mg-moments')[0], start: 'top bottom', end: 'bottom top', scrub: .8 } })
        gsap.fromTo(q('.mg-moment-small'), { y: -30 }, { y: 40, ease: 'none', scrollTrigger: { trigger: q('.mg-moments')[0], start: 'top bottom', end: 'bottom top', scrub: .9 } })
        gsap.timeline({ scrollTrigger: { trigger: q('.mg-closing')[0], start: 'top 90%', end: 'top 10%', scrub: .6 } })
          .fromTo(q('.mg-closing-circle'), { clipPath: 'circle(15% at 50% 100%)' }, { clipPath: 'circle(105% at 50% 100%)', ease: 'none', duration: 1 })
          .from(q('.mg-closing .mg-line > span'), { yPercent: 110, duration: .5, stagger: .1 }, .35)
        const refresh = () => ScrollTrigger.refresh()
        document.fonts.ready.then(() => { if (root.current) refresh() })
      })
    }, root)
    return () => { media.revert(); context.revert() }
  }, [root])
}
