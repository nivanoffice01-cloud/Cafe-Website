export const motion = { fast: .18, exit: .24, reveal: .72, entrance: 1.1, stagger: .075, ease: 'power3.out', travel: 'power2.inOut', cover: .32, uncover: .42 } as const
export const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
