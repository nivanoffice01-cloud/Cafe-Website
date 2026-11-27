import { useEffect, useRef, useState, type ReactNode } from 'react'

type Category = readonly [name: string, label: string]
const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches

/** Native touch scrolling; pointer dragging adds the same affordance for a mouse. */
export function CategoryGallery({ categories, photo, onChoose, onExplore }: {
  categories: readonly Category[]
  photo: (name: string) => ReactNode
  onChoose: (name: string) => void
  onExplore: () => void
}) {
  const rail = useRef<HTMLDivElement>(null)
  const drag = useRef<{ id: number; x: number; scroll: number; moved: boolean } | null>(null)
  const suppressClick = useRef(false)
  const [position, setPosition] = useState({ start: 1, end: 6, progress: 0, visible: 1 })

  useEffect(() => {
    const element = rail.current!
    const measure = () => {
      const first = element.firstElementChild as HTMLElement | null
      if (!first) return
      const step = first.getBoundingClientRect().width + parseFloat(getComputedStyle(element).columnGap)
      const maximum = element.scrollWidth - element.clientWidth
      const start = Math.min(categories.length, Math.round(element.scrollLeft / step) + 1)
      setPosition({ start, end: Math.min(categories.length, start + Math.round(element.clientWidth / step) - 1), progress: maximum > 0 ? element.scrollLeft / maximum : 0, visible: element.clientWidth / element.scrollWidth })
    }
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    element.addEventListener('scroll', measure, { passive: true })
    measure()
    return () => { observer.disconnect(); element.removeEventListener('scroll', measure) }
  }, [categories.length])

  const move = (direction: number) => {
    const element = rail.current!
    element.scrollBy({ left: direction * element.clientWidth * .85, behavior: reducedMotion() ? 'instant' : 'smooth' })
  }
  const stopDrag = (id: number) => {
    const current = drag.current
    if (!current || current.id !== id) return
    suppressClick.current = current.moved
    drag.current = null
    const element = rail.current!
    element.classList.remove('is-dragging')
    if (element.hasPointerCapture(id)) element.releasePointerCapture(id)
    // Let native scroll snapping settle the closest category after dragging.
    if (current.moved) element.scrollBy({ left: 0, behavior: 'instant' })
  }

  return <div className="dm-gallery" role="region" aria-roledescription="carousel" aria-label="Culinary categories">
    <div className="dm-category-circles" ref={rail} tabIndex={0} aria-label="Swipe or drag to explore all categories"
      onPointerDown={event => {
        suppressClick.current = false
        if (event.pointerType !== 'mouse' || event.button !== 0) return
        drag.current = { id: event.pointerId, x: event.clientX, scroll: event.currentTarget.scrollLeft, moved: false }
      }}
      onPointerMove={event => {
        const current = drag.current
        if (!current || current.id !== event.pointerId) return
        if (event.buttons === 0) { stopDrag(event.pointerId); return }
        const distance = event.clientX - current.x
        if (!current.moved && Math.abs(distance) < 6) return
        current.moved = true
        if (!event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.setPointerCapture(event.pointerId)
        event.currentTarget.classList.add('is-dragging')
        event.currentTarget.scrollLeft = current.scroll - distance
      }}
      onPointerUp={event => stopDrag(event.pointerId)}
      onPointerCancel={event => stopDrag(event.pointerId)}
      onLostPointerCapture={event => stopDrag(event.pointerId)}
      onClickCapture={event => { if (suppressClick.current) { event.preventDefault(); event.stopPropagation(); suppressClick.current = false } }}
      onKeyDown={event => {
        if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
        event.preventDefault()
        const buttons = Array.from(event.currentTarget.querySelectorAll('button'))
        const index = buttons.indexOf(document.activeElement as HTMLButtonElement)
        const next = buttons[Math.max(0, Math.min(buttons.length - 1, index + (event.key === 'ArrowRight' ? 1 : -1)))]
        next?.focus({ preventScroll: true })
        next?.scrollIntoView({ behavior: reducedMotion() ? 'instant' : 'smooth', inline: 'nearest', block: 'nearest' })
      }}>
      {categories.map(([name, label]) => <button type="button" key={name} onClick={() => onChoose(name)} aria-label={`Browse ${name}`}>
        {photo(name)}<strong>{label}</strong>
      </button>)}
    </div>
    <div className="dm-gallery-footer">
      <span className="dm-gallery-count">{String(position.start).padStart(2, '0')} — {String(position.end).padStart(2, '0')} <span>/ {categories.length}</span></span>
      <div className="dm-gallery-progress" aria-hidden="true"><span style={{ width: `${position.visible * 100}%`, left: `${position.progress * (1 - position.visible) * 100}%` }}/></div>
      <div className="dm-gallery-arrows">
        <button type="button" aria-label="Previous categories" disabled={position.progress < .005} onClick={() => move(-1)}><span aria-hidden="true">←</span></button>
        <button type="button" aria-label="Next categories" disabled={position.progress > .995} onClick={() => move(1)}><span aria-hidden="true">→</span></button>
      </div>
    </div>
    <button className="dm-explore-categories" type="button" onClick={onExplore}>Explore All {categories.length} Categories <span aria-hidden="true">↗</span></button>
  </div>
}

export function CategoryNavigation({ categories, active, onChoose, onSearch }: {
  categories: readonly { name: string }[]
  active: string
  onChoose: (name: string) => void
  onSearch: () => void
}) {
  const rail = useRef<HTMLElement>(null)
  useEffect(() => {
    const element = rail.current!
    const selected = element.querySelector<HTMLElement>('[aria-current="page"]')
    if (selected) element.scrollLeft = selected.offsetLeft - element.offsetLeft - 12
  }, [active])
  return <div className="dm-category-navigation">
    <nav ref={rail} aria-label="Switch menu category">{categories.map(category => <button key={category.name} type="button" aria-current={category.name === active ? 'page' : undefined} onClick={() => onChoose(category.name)}>{category.name}</button>)}</nav>
    <button className="dm-category-search" type="button" onClick={onSearch} aria-label="Search menu"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><circle cx="10" cy="10" r="6.5"/><path d="m15 15 6 6"/></svg></button>
  </div>
}
