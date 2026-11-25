import { useEffect, useMemo, useRef, useState } from 'react'
import { fullMenu, fullMenuCount, type MenuItem } from '../data/fullMenu'
import { menuPhotoFor } from '../data/menuPhotos'
import { responsivePhotoSrcSet } from '../data/responsivePhoto'

type Props = { onClose: () => void; initialSelection?: { category: string; name: string } | null }
type SelectedDish = MenuItem & { category: string }

const defaultDish: SelectedDish = { category: fullMenu[0].name, ...fullMenu[0].items[0] }

const categoryNotes: Record<string, string> = {
  'Small Plates': 'For the first pour, and the stories that follow.',
  'Pizza & Pide': 'A warm centrepiece for the table.',
  Pasta: 'Comfort, served slowly.',
  Desserts: 'Save a little space for this.',
  Shakes: 'Something cool to linger over.',
  'Mocktail & Coolers': 'A toast to the evening.',
}

export function FullMenuDialog({ onClose, initialSelection }: Props) {
  const initialDish = initialSelection
    ? (() => { const category = fullMenu.find((entry) => entry.name === initialSelection.category); const item = category?.items.find((entry) => entry.name === initialSelection.name); return item ? { category: category!.name, ...item } : defaultDish })()
    : defaultDish
  const [selectedCategory, setSelectedCategory] = useState(initialDish.category)
  const [query, setQuery] = useState('')
  const [selectedDish, setSelectedDish] = useState<SelectedDish>(initialDish)
  const [expandedPhoto, setExpandedPhoto] = useState<string | null>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const before = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      if (event.key === 'Tab') {
        const dialog = document.querySelector<HTMLElement>('.full-menu-dialog')
        const focusable = dialog?.querySelectorAll<HTMLElement>('button, input, a[href]')
        if (!focusable?.length) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      before?.focus()
    }
  }, [onClose])

  const filteredCategories = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return fullMenu.filter((category) => category.name === selectedCategory)
    return fullMenu.map((category) => ({
      ...category,
      items: category.items.filter((item) => `${item.name} ${item.description ?? ''} ${category.name}`.toLowerCase().includes(normalized)),
    })).filter((category) => category.items.length > 0)
  }, [query, selectedCategory])

  const chooseCategory = (name: string) => {
    setSelectedCategory(name)
    setQuery('')
    setExpandedPhoto(null)
    const category = fullMenu.find((entry) => entry.name === name)
    const first = category?.items[0]
    if (first) setSelectedDish({ category: name, ...first })
    searchRef.current?.blur()
  }
  const searchMenu = (value: string) => {
    setQuery(value)
    setExpandedPhoto(null)
    const normalized = value.trim().toLowerCase()
    if (!normalized) return
    for (const category of fullMenu) {
      const match = category.items.find((item) => `${item.name} ${item.description ?? ''} ${category.name}`.toLowerCase().includes(normalized))
      if (match) {
        setSelectedDish({ category: category.name, ...match })
        return
      }
    }
  }

  const selectedPhoto = menuPhotoFor(selectedDish.category, selectedDish.name)

  return (
    <div className="menu-dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="full-menu-dialog" role="dialog" aria-modal="true" aria-labelledby="full-menu-heading">
        <header className="menu-dialog-header">
          <a className="menu-dialog-brand" href="#top" onClick={onClose}>MANGOSTEEN <span>CAFE · INDORE</span></a>
          <div className="menu-dialog-heading">
            <p className="section-index">AN EVENING AT MANGOSTEEN</p>
            <h2 id="full-menu-heading">The evening <em>menu.</em></h2>
            <p>{fullMenuCount} dishes · 13 chapters</p>
          </div>
          <button ref={closeRef} type="button" className="menu-close" onClick={onClose} aria-label="Close menu"><span>Close</span><i aria-hidden="true">×</i></button>
        </header>

        <div className="menu-dialog-body">
          <div className="menu-book-pages">
            <div className="menu-toolbar">
              <p className="menu-category-label">Explore the categories</p>
              <label className="menu-category-select">
                <span className="visually-hidden">Choose a menu category</span>
                <select value={selectedCategory} onChange={(event) => chooseCategory(event.target.value)}>
                  {fullMenu.map((category) => <option key={category.name} value={category.name}>{category.name} · {category.items.length} items</option>)}
                </select>
              </label>
              <div className="menu-category-nav" aria-label="Menu categories">
                {fullMenu.map((category, index) => (
                  <button
                    key={category.name}
                    type="button"
                    className={!query && selectedCategory === category.name ? 'is-current' : ''}
                    aria-pressed={!query && selectedCategory === category.name}
                    onClick={() => chooseCategory(category.name)}
                  >
                    <span>{String(index + 1).padStart(2, '0')}</span>{category.name}
                  </button>
                ))}
              </div>
              <label className="menu-search">
                <span className="visually-hidden">Search all menu items</span>
                <svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="8.6" cy="8.6" r="5.2" fill="none" stroke="currentColor" strokeWidth="1.4"/><path d="m12.5 12.5 4 4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
                <input ref={searchRef} type="search" value={query} onChange={(event) => searchMenu(event.target.value)} placeholder="Find a dish" />
                {query && <button type="button" onClick={() => setQuery('')} aria-label="Clear search">×</button>}
              </label>
            </div>

            <div className="menu-dish-scroll" aria-live="polite">
              {filteredCategories.length ? filteredCategories.map((category) => (
                <section key={category.name} className="menu-category-page" aria-label={category.name}>
                  <div className="menu-page-heading"><span>{category.name}</span><small>{category.items.length} items</small></div>
                  {!query && <p className="menu-chapter-note">{categoryNotes[category.name] ?? 'Take your time. There is always room for one more.'}</p>}
                  <div className="menu-dish-list">
                    {category.items.map((item) => {
                      const photo = menuPhotoFor(category.name, item.name)
                      const photoKey = `${category.name}|${item.name}`
                      const content = <>
                        {photo && <img className="menu-dish-thumb" src={photo.src} alt="" loading="lazy" decoding="async" />}
                        <span className="menu-dish-copy"><strong>{item.name}</strong>{item.description && <small>{item.description}</small>}</span>
                        <span className="menu-dish-price">₹{item.price}</span>
                      </>
                      return <div key={`${category.name}-${item.name}`}>
                        <button
                          type="button"
                          className={`menu-dish-row menu-dish-row-desktop${selectedDish.name === item.name && selectedDish.category === category.name ? ' is-active' : ''}`}
                          onClick={() => { setSelectedCategory(category.name); setSelectedDish({ category: category.name, ...item }) }}
                          aria-label={`View ${item.name} details, ₹${item.price}`}
                        >{content}</button>
                        {photo ? <>
                          <button
                            type="button"
                            className="menu-dish-row menu-dish-row-mobile menu-dish-photo-trigger"
                            aria-expanded={expandedPhoto === photoKey}
                            aria-label={`${expandedPhoto === photoKey ? 'Hide' : 'View'} illustrative photo of ${item.name}`}
                            onClick={() => setExpandedPhoto(expandedPhoto === photoKey ? null : photoKey)}
                          >{content}<span className="menu-dish-photo-cue" aria-hidden="true">{expandedPhoto === photoKey ? '−' : '+'}</span></button>
                          {expandedPhoto === photoKey && <figure className="menu-dish-mobile-photo"><img src={photo.src} alt={photo.alt} decoding="async" /><figcaption>Illustrative photo · Mangosteen serving may differ</figcaption></figure>}
                        </> : <div className="menu-dish-row menu-dish-row-mobile">{content}</div>}
                      </div>
                    })}
                  </div>
                </section>
              )) : <p className="menu-no-results">Nothing found for “{query}”. Try another dish.</p>}
              <p className="menu-price-note">Indicative prices from a public listing, updated October 2026. Please confirm current prices with the cafe.</p>
            </div>
          </div>

          <aside className="menu-food-side" aria-label="Selected dish and photography">
            <img className="menu-food-photo" key={selectedPhoto?.src ?? 'cafe-photo'} src={selectedPhoto?.src ?? '/images/highres/mangosteen_original_2_8k.jpg'} srcSet={selectedPhoto ? undefined : responsivePhotoSrcSet('/images/highres/mangosteen_original_2_8k.jpg')} sizes="(max-width: 1100px) 36vw, 33vw" alt={selectedPhoto?.alt ?? 'A plated dish photographed at Mangosteen Café'} decoding="async" />
            <div className="menu-food-caption">
              <p>{selectedDish.category.toUpperCase()} · FROM THE MENU</p>
              <h3>{selectedDish.name}</h3>
              {selectedDish.description && <span className="menu-food-description">{selectedDish.description}</span>}
              <span>₹{selectedDish.price}</span>
            </div>
            <p className="menu-photo-note">{selectedPhoto ? 'Illustrative food photo; presentation at Mangosteen may differ.' : 'Photographed at Mangosteen Café. This is not the selected dish.'}</p>
          </aside>
        </div>
      </section>
    </div>
  )
}
