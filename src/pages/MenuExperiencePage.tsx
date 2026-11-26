import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { fullMenu, fullMenuCount, type MenuItem } from '../data/fullMenu'
import { authenticPhoto } from '../features/supplied-frontend/authentic-photos'
import { categoryPhoto, dishPhoto, landingCategories } from '../features/digital-menu/photography'
import { orderTableFor } from '../data/seating'
import { submitGuestOrder, type GuestOrderReceipt } from '../lib/orders'
import '../features/supplied-frontend/fonts.css'
import '../features/digital-menu/menu.css'

type Dish = MenuItem & { category: string }
type CartLine = Dish & { quantity: number }
type Screen = 'home' | 'categories' | 'category' | 'all' | 'search' | 'favourites' | 'selection'
const money = (value: number) => `₹${value.toLocaleString('en-IN')}`
const keyFor = (dish: Dish) => `${dish.category}|${dish.name}`
const slugify = (value: string) => value.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
const categoryFromSlug = (slug: string) => fullMenu.find(entry => slugify(entry.name) === slug)
const requestKey = () => globalThis.crypto?.randomUUID?.() || `order-${Date.now()}-${Math.random().toString(16).slice(2)}`

function Icon({ name, filled = false }: { name: string; filled?: boolean }) {
  const paths: Record<string, ReactNode> = {
    home: <path d="m3 10 9-7 9 7v11h-6v-7H9v7H3Z"/>,
    categories: <><rect x="3" y="3" width="7" height="7" rx=".7"/><rect x="14" y="3" width="7" height="7" rx=".7"/><rect x="3" y="14" width="7" height="7" rx=".7"/><rect x="14" y="14" width="7" height="7" rx=".7"/></>,
    search: <><circle cx="10.5" cy="10.5" r="7"/><path d="m16 16 5 5"/></>,
    favourites: <path fill={filled ? 'currentColor' : 'none'} d="M20.5 5.7c-2.3-2.4-6.2-1.8-8.5 1-2.3-2.8-6.2-3.4-8.5-1-2.5 2.6-1.2 6.7.8 8.7L12 21l7.7-6.6c2-2 3.3-6.1.8-8.7Z"/>,
    selection: <path d="M7 5h14M7 12h14M7 19h14M3 5h.1M3 12h.1M3 19h.1"/>,
    bag: <><path d="M5 7h14l2 14H3L5 7Z"/><path d="M9 9V5a3 3 0 0 1 6 0v4"/></>,
    menu: <path d="M3 6h18M3 12h18M3 18h18"/>,
    back: <path d="m11 4-8 8 8 8M3 12h18"/>,
    arrow: <path d="M3 12h18m-7-7 7 7-7 7"/>,
    close: <path d="m5 5 14 14M5 19 19 5"/>,
    leaf: <><path d="M4 20C4 7 13 3 21 3c0 10-4 18-15 15M4 20 17 7"/></>,
  }
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] || paths.leaf}</svg>
}

function MenuPhoto({ dish, category, className = '', priority = false }: { dish?: Dish; category?: string; className?: string; priority?: boolean }) {
  const photo = dish ? dishPhoto(dish) : categoryPhoto(category || '')
  const [failed, setFailed] = useState(false)
  useEffect(() => setFailed(false), [photo?.src])
  return <span className={`dm-photo ${className}${!photo || failed ? ' is-pending' : ''}`}>
    {photo && !failed ? <img src={photo.src} srcSet={photo.srcSet} sizes="(min-width: 900px) 25vw, 120px" width="400" height="400" alt={photo.alt} loading={priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : 'auto'} onError={() => setFailed(true)}/> : <><span className="dm-photo-monogram" aria-hidden="true">m.</span><small>Photo to follow</small></>}
  </span>
}

function Modal({ title, kind, onClose, children }: { title: string; kind: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  useEffect(() => {
    const dialog = ref.current!
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const overflow = document.body.style.overflow
    dialog.showModal(); document.body.style.overflow = 'hidden'
    return () => {
      dialog.close(); document.body.style.overflow = overflow
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true })
    }
  }, [])
  return <dialog ref={ref} className={`dm-modal dm-${kind}`} aria-labelledby={title}
    onKeyDown={event => {
      if (event.key !== 'Tab') return
      const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), textarea:not(:disabled), [tabindex="0"]'))
      const first = controls[0], last = controls[controls.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
    }}
    onCancel={event => { event.preventDefault(); closeRef.current() }}
    onClick={event => { if (event.target === event.currentTarget) closeRef.current() }}>
    <div className="dm-modal-content"><button type="button" className="dm-close" aria-label={kind === 'sheet' ? 'Close dish details' : 'Close menu navigation'} onClick={onClose}><Icon name="close"/></button>{children}</div>
  </dialog>
}

function DishCard({ dish, count, favourite, onOpen, onAdd, onChange, onFavourite }: { dish: Dish; count: number; favourite: boolean; onOpen: () => void; onAdd: () => void; onChange: (amount: number) => void; onFavourite: () => void }) {
  return <article className="dm-dish" data-dish={keyFor(dish)}>
    <button className="dm-dish-open bm-dish-open" type="button" onClick={onOpen} aria-label={`View ${dish.name}`}><MenuPhoto dish={dish}/><span className="dm-dish-copy"><strong>{dish.name}</strong>{dish.description && <span className="dm-description">{dish.description}</span>}<b className="dm-price">{money(dish.price)}</b></span></button>
    <button className={`dm-heart${favourite ? ' is-saved' : ''}`} type="button" onClick={onFavourite} aria-pressed={favourite} aria-label={`${favourite ? 'Remove' : 'Add'} ${dish.name} ${favourite ? 'from' : 'to'} favourites`}><Icon name="favourites" filled={favourite}/></button>
    {count ? <div className="dm-quantity"><button type="button" onClick={() => onChange(-1)} aria-label={`Remove one ${dish.name}`}>−</button><output aria-label={`Quantity of ${dish.name}`}>{count}</output><button type="button" onClick={() => onChange(1)} aria-label={`Add another ${dish.name}`} disabled={count >= 10}>+</button></div> : <button className="dm-add" type="button" onClick={onAdd} aria-label={`Add ${dish.name} to My List`}>+</button>}
  </article>
}

const destinations = [
  ['home', 'Home', '/menu'], ['categories', 'Categories', '/menu/browse'], ['search', 'Search', '/menu/search'],
  ['favourites', 'Favourites', '/menu/favourites'], ['selection', 'My List', '/menu/selection'],
] as const

export function MenuExperiencePage() {
  const initialUrl = useMemo(() => new URL(window.location.href), [])
  const table = useMemo(() => orderTableFor(initialUrl.searchParams.get('table')), [initialUrl])
  const [path, setPath] = useState(() => {
    const current = window.location.pathname.replace(/\/$/, '') || '/menu'
    const linkedCategory = fullMenu.find(entry => entry.name === initialUrl.searchParams.get('category'))
    if ((current === '/menu' || current === '/m') && linkedCategory) return `/menu/category/${slugify(linkedCategory.name)}`
    return (current === '/menu' || current === '/m') && table ? '/menu/browse' : current
  })
  const [query, setQuery] = useState('')
  const [dishOpen, setDishOpen] = useState<Dish | null>(() => {
    const categoryName = initialUrl.searchParams.get('category'); const dishName = initialUrl.searchParams.get('dish')
    const item = fullMenu.find((entry) => entry.name === categoryName)?.items.find((entry) => entry.name === dishName)
    return item && categoryName ? { ...item, category: categoryName } : null
  })
  const [drawer, setDrawer] = useState(false)
  const [announcement, setAnnouncement] = useState('')
  const [cart, setCart] = useState<CartLine[]>(() => { try { return JSON.parse(localStorage.getItem('mangosteen-menu-selection') || '[]') as CartLine[] } catch { return [] } })
  const [favourites, setFavourites] = useState<string[]>(() => { try { return JSON.parse(localStorage.getItem('mangosteen-menu-favourites') || '[]') as string[] } catch { return [] } })
  const [guestName, setGuestName] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [receipt, setReceipt] = useState<GuestOrderReceipt | null>(null)
  const currentPath = useRef(path)
  const pendingScroll = useRef<number | null>(null)
  const heading = useRef<HTMLHeadingElement>(null)
  const scrollPositions = useRef<Record<string, number>>({})

  const allDishes = useMemo(() => fullMenu.flatMap((entry) => entry.items.map((item) => ({ ...item, category: entry.name }))), [])
  const categorySlug = path.startsWith('/menu/category/') ? decodeURIComponent(path.split('/').pop() || '') : ''
  const activeCategory = categoryFromSlug(categorySlug)
  const screen: Screen = activeCategory ? 'category' : path === '/menu/browse' ? 'categories' : path === '/menu/all' ? 'all' : path === '/menu/search' ? 'search' : path === '/menu/favourites' ? 'favourites' : path === '/menu/selection' ? 'selection' : 'home'
  const normalizedQuery = query.trim().toLowerCase()
  const results = useMemo(() => normalizedQuery ? allDishes.filter((dish) => `${dish.name} ${dish.description || ''} ${dish.category}`.toLowerCase().includes(normalizedQuery)) : [], [allDishes, normalizedQuery])
  const favouriteDishes = useMemo(() => allDishes.filter((dish) => favourites.includes(keyFor(dish))), [allDishes, favourites])
  const itemCount = cart.reduce((sum, line) => sum + line.quantity, 0)
  const subtotal = cart.reduce((sum, line) => sum + line.price * line.quantity, 0)
  const total = subtotal + Math.round(subtotal * .05)

  const withTable = (nextPath: string) => table ? `${nextPath}?table=${encodeURIComponent(table.id)}` : nextPath
  const navigate = (nextPath: string, replace = false) => {
    scrollPositions.current[path] = window.scrollY
    const next = withTable(nextPath)
    if (nextPath === path) { setDrawer(false); return }
    if (replace) history.replaceState({ menu: true }, '', next); else history.pushState({ menu: true, from: path }, '', next)
    currentPath.current = nextPath
    pendingScroll.current = scrollPositions.current[nextPath] || 0
    setPath(nextPath)
    setDrawer(false)
    setDishOpen(null)
    setQuery('')
    setReceipt(null)
  }
  const goBack = () => {
    if (history.state?.from) history.back()
    else navigate(screen === 'category' || screen === 'all' ? '/menu/browse' : '/menu', true)
  }
  const chooseCategory = (name: string) => navigate(`/menu/category/${slugify(name)}`)
  const add = (dish: Dish) => { setAnnouncement(`${dish.name} added to My List`); setCart((current) => { const found = current.find((line) => keyFor(line) === keyFor(dish)); return found ? current.map((line) => line === found ? { ...line, quantity: Math.min(10, line.quantity + 1) } : line) : [...current, { ...dish, quantity: 1 }] }) }
  const change = (line: CartLine, amount: number) => setCart((current) => current.flatMap((item) => keyFor(item) !== keyFor(line) ? [item] : item.quantity + amount > 0 ? [{ ...item, quantity: Math.min(10, item.quantity + amount) }] : []))
  const remove = (line: CartLine) => setCart((current) => current.filter((item) => keyFor(item) !== keyFor(line)))
  const quantity = (dish: Dish) => cart.find((line) => keyFor(line) === keyFor(dish))?.quantity || 0
  const toggleFavourite = (dish: Dish) => setFavourites((current) => current.includes(keyFor(dish)) ? current.filter((key) => key !== keyFor(dish)) : [...current, keyFor(dish)])
  const placeOrder = async () => {
    if (!table) { setError('This is a personal shortlist. Scan the dedicated QR fixed to your table to send an order.'); return }
    if (guestName.trim().length < 2) { setError('Please enter the guest name for this table.'); return }
    setSubmitting(true); setError('')
    try { const result = await submitGuestOrder({ requestKey: requestKey(), table: table.id, guestName: guestName.trim(), phone: phone.trim(), notes: notes.trim(), paymentMethod: 'demo-upi', items: cart.map((item) => ({ category: item.category, name: item.name, quantity: item.quantity, unitPrice: item.price })), website: '' }); setReceipt(result); setCart([]) }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'The order could not be placed.') } finally { setSubmitting(false) }
  }

  useEffect(() => { localStorage.setItem('mangosteen-menu-favourites', JSON.stringify(favourites)) }, [favourites])
  useEffect(() => { localStorage.setItem('mangosteen-menu-selection', JSON.stringify(cart)) }, [cart])
  useEffect(() => {
    // Canonicalise QR aliases and old ?category=&dish= links without losing table context.
    const previousRestoration = history.scrollRestoration
    history.scrollRestoration = 'manual'
    history.replaceState({ ...history.state, menu: true }, '', withTable(path))
    const onPop = () => {
      scrollPositions.current[currentPath.current] = window.scrollY
      const nextPath = window.location.pathname.replace(/\/$/, '') || '/menu'
      currentPath.current = nextPath
      pendingScroll.current = scrollPositions.current[nextPath] || 0
      setPath(nextPath); setQuery(''); setDishOpen(null); setDrawer(false)
    }
    addEventListener('popstate', onPop)
    return () => { removeEventListener('popstate', onPop); history.scrollRestoration = previousRestoration }
  }, [])
  useLayoutEffect(() => {
    if (pendingScroll.current === null) return
    window.scrollTo({ top: pendingScroll.current, behavior: 'instant' })
    pendingScroll.current = null
  }, [path])
  useEffect(() => { if (screen !== 'search') heading.current?.focus({ preventScroll: true }) }, [path, screen])
  useEffect(() => {
    const title = document.title
    document.title = `${activeCategory?.name || 'Digital menu'} · Mangosteen Café Indore`
    return () => { document.title = title }
  }, [activeCategory])

  const navActive = (id: string) => screen === id || (id === 'categories' && (screen === 'category' || screen === 'all'))
  const navItems = () => destinations.map(([id, label, target]) => <button type="button" key={id} className={navActive(id) ? 'is-active' : ''} aria-current={navActive(id) ? 'page' : undefined} onClick={() => navigate(target)}><span><Icon name={id}/>{id === 'selection' && itemCount > 0 && <i aria-hidden="true">{itemCount}</i>}</span><small>{label}</small></button>)
  const header = <header className="dm-header">
    <button type="button" className="dm-header-start" onClick={screen === 'category' || screen === 'all' ? goBack : () => setDrawer(true)} aria-label={screen === 'category' || screen === 'all' ? 'Go back' : 'Open menu navigation'} aria-haspopup={screen === 'category' || screen === 'all' ? undefined : 'dialog'}><Icon name={screen === 'category' || screen === 'all' ? 'back' : 'menu'}/></button>
    <button type="button" className="dm-brand bm-brand" onClick={() => navigate('/menu')} aria-label="Mangosteen menu home"><strong>MANGOSTEEN</strong><span>CAFÉ · INDORE</span></button>
    <nav className="dm-desktop-nav" aria-label="Desktop menu navigation">{navItems()}</nav>
    <div className="dm-header-actions"><button type="button" onClick={() => navigate('/menu/favourites')} aria-label="Open favourites"><Icon name="favourites"/></button><button type="button" onClick={() => navigate('/menu/selection')} aria-label={`My List, ${itemCount} items`}><Icon name="bag"/>{itemCount > 0 && <i aria-hidden="true">{itemCount}</i>}</button></div>
    {table && <span className="dm-table-context">Ordering for {table.label}</span>}
  </header>
  const renderDishList = (items: Dish[]) => <section className="dm-dishes" aria-label="Dishes">{items.map(dish => <DishCard key={keyFor(dish)} dish={dish} count={quantity(dish)} favourite={favourites.includes(keyFor(dish))} onOpen={() => setDishOpen(dish)} onAdd={() => add(dish)} onChange={amount => change({ ...dish, quantity: quantity(dish) }, amount)} onFavourite={() => toggleFavourite(dish)}/>)}</section>
  const empty = (icon: string, title: string, copy: string) => <div className="dm-empty"><Icon name={icon}/><h2>{title}</h2><p>{copy}</p><button className="dm-primary" type="button" onClick={() => navigate('/menu/browse')}>Explore Menu <Icon name="arrow"/></button></div>
  const food = authenticPhoto('story-food')

  if (receipt) return <div className="dm-menu dm-receipt">{header}<main><div className="dm-receipt-mark" aria-hidden="true">✓</div><p className="dm-eyebrow">ORDER RECEIVED</p><h1>Your table is in the kitchen queue.</h1><p>The café CRM received <strong>{receipt.reference}</strong> for <strong>{table?.label}</strong>.</p><dl><dt>Demo payment</dt><dd>{receipt.paymentLabel}</dd><dt>Total</dt><dd>{money(receipt.total)}</dd></dl><p><strong>Demonstration only.</strong> No money was transferred and no payment details were collected.</p><button className="dm-primary" type="button" onClick={() => { setReceipt(null); navigate('/menu/browse') }}>Return to menu</button></main></div>

  return <div id="digital-menu" className={`dm-menu is-${screen}`}>
    <a className="dm-skip" href="#menu-content">Skip to menu content</a>
    {header}
    <main id="menu-content" className="dm-content" key={path}>
      {screen === 'home' && <>
        <section className="dm-hero">
          <img className="dm-hero-photo" src={food.src} srcSet={food.srcSet} sizes="(min-width: 900px) 70vw, 100vw" alt={food.alt} width="1920" height="1280" fetchPriority="high"/>
          <div className="dm-hero-copy"><p className="dm-eyebrow">THE DIGITAL MENU</p><h1 ref={heading} tabIndex={-1}>A little taste of<br/><em>something<br/><span>extraordinary.</span></em></h1><p>From comfort classics to café favourites, explore a menu crafted with fresh ingredients and care.</p><button className="dm-primary dm-gold" type="button" onClick={() => document.getElementById('browse-categories')?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' })}>Explore the Menu <Icon name="arrow"/></button></div>
          <svg className="dm-curve" viewBox="0 0 1000 100" preserveAspectRatio="none" aria-hidden="true"><path d="M0 15Q250 125 500 65T1000 25V100H0Z"/></svg>
        </section>
        <section className="dm-browse" id="browse-categories"><p className="dm-eyebrow">DISCOVER YOUR NEXT FAVOURITE</p><h2>Browse by <em>Category</em></h2><div className="dm-category-circles">{landingCategories.filter(([name]) => fullMenu.some(entry => entry.name === name)).map(([name, label]) => <button type="button" key={name} onClick={() => chooseCategory(name)} aria-label={`Browse ${name}`}><MenuPhoto category={name}/><strong>{label}</strong></button>)}</div><button className="dm-view-all" type="button" onClick={() => navigate('/menu/browse')}>View All Categories <Icon name="arrow"/></button></section>
        <section className="dm-home-dishes"><div><p className="dm-eyebrow">A PLACE TO BEGIN</p><h2>From the <em>menu.</em></h2><p>Start with these dishes, or explore all {fullMenuCount} dishes.</p></div>{renderDishList(['Margarita', 'Veg Cheese Burger', 'Pesto cream Pasta'].flatMap(name => allDishes.find(dish => dish.name === name) || []))}</section>
      </>}
      {screen === 'categories' && <section className="dm-categories-page"><div className="dm-page-title"><h1 ref={heading} tabIndex={-1}><em>All Categories</em></h1><p>{fullMenu.length} categories · {fullMenuCount} dishes</p></div><div className="dm-category-banners">{fullMenu.map(entry => <button className="dm-category-banner" key={entry.name} type="button" onClick={() => chooseCategory(entry.name)}><MenuPhoto category={entry.name}/><span className="dm-banner-copy"><strong>{entry.name}</strong><small>{entry.items.length} dishes to explore</small></span><span className="dm-circle-arrow"><Icon name="arrow"/></span></button>)}</div><button className="dm-primary dm-gold" type="button" onClick={() => navigate('/menu/all')}>Explore all {fullMenuCount} dishes <Icon name="arrow"/></button></section>}
      {screen === 'category' && activeCategory && <>
        <section className="dm-category-hero"><MenuPhoto category={activeCategory.name} priority/><div><p className="dm-eyebrow">THE MANGOSTEEN MENU</p><h1 ref={heading} tabIndex={-1}>{activeCategory.name}</h1><p>{activeCategory.items.length} dishes. Find something you love.</p></div></section>
        <div className="dm-filter-bar"><span className="dm-filter-selected">All {activeCategory.name}</span><button type="button" onClick={() => navigate('/menu/browse')}><Icon name="categories"/>Change category</button><button type="button" className="dm-filter-search" onClick={() => navigate('/menu/search')} aria-label="Search menu"><Icon name="search"/></button></div>
        {renderDishList(activeCategory.items.map(item => ({ ...item, category: activeCategory.name })))}<p className="dm-pricing-note">Prices shown are indicative. Please confirm current prices with the café.</p>
      </>}
      {screen === 'all' && <><div className="dm-page-title"><p className="dm-eyebrow">THE COMPLETE MENU</p><h1 ref={heading} tabIndex={-1}>All <em>{fullMenuCount} dishes.</em></h1></div>{renderDishList(allDishes)}</>}
      {screen === 'search' && <><div className="dm-page-title"><p className="dm-eyebrow">SEARCH THE MENU</p><h1 ref={heading} tabIndex={-1}>Find your <em>favourite.</em></h1></div><div className="dm-search-wrap"><label className="dm-search"><Icon name="search"/><input autoFocus value={query} onChange={event => setQuery(event.target.value)} placeholder="Dish, ingredient or category" aria-label="Search all dishes" type="search"/><button type="button" onClick={() => setQuery('')} aria-label="Clear search" disabled={!query}><Icon name="close"/></button></label><p role="status">{query ? `${results.length} ${results.length === 1 ? 'dish' : 'dishes'} found` : `Search all ${fullMenuCount} dishes`}</p></div>{query ? results.length ? renderDishList(results) : empty('search', 'No dishes found', 'Try another dish, ingredient or category.') : empty('search', 'What sounds good?', 'Search by dish name, description or category.')}</>}
      {screen === 'favourites' && <><div className="dm-page-title"><p className="dm-eyebrow">SAVED FOR LATER</p><h1 ref={heading} tabIndex={-1}>Your <em>favourites.</em></h1><p>Saved on this device, ready when you are.</p></div>{favouriteDishes.length ? renderDishList(favouriteDishes) : empty('favourites', 'Nothing saved yet', 'Tap the heart on a dish to keep it close.')}</>}
      {screen === 'selection' && <><div className="dm-page-title"><p className="dm-eyebrow">{table ? table.label.toUpperCase() : 'YOUR SHORTLIST'}</p><h1 ref={heading} tabIndex={-1}>My <em>List.</em></h1><p>{table ? 'Review your dishes before sending your demo order.' : 'A personal shortlist to share with café staff.'}</p></div>{cart.length ? <div className="dm-selection-layout"><section><div className="dm-selection-lines">{cart.map(line => <article key={keyFor(line)}><button type="button" className="dm-list-photo" onClick={() => setDishOpen(line)} aria-label={`View ${line.name}`}><MenuPhoto dish={line}/></button><div><strong>{line.name}</strong><small>{line.category}</small><b className="dm-price">{money(line.price * line.quantity)}</b><button className="dm-remove" type="button" onClick={() => remove(line)} aria-label={`Remove ${line.name} from My List`}>Remove</button></div><div className="dm-quantity"><button type="button" onClick={() => change(line, -1)} aria-label={`Remove one ${line.name}`}>−</button><output>{line.quantity}</output><button type="button" onClick={() => add(line)} disabled={line.quantity >= 10} aria-label={`Add another ${line.name}`}>+</button></div></article>)}</div><button className="dm-text-button" type="button" onClick={() => setCart([])}>Clear list</button></section><aside className="dm-order-summary"><h2>Your <em>selection.</em></h2><dl><dt>{itemCount} {itemCount === 1 ? 'item' : 'items'}</dt><dd>{money(subtotal)}</dd><dt>5% demo service charge</dt><dd>{money(Math.round(subtotal * .05))}</dd><dt>Estimated total</dt><dd className="dm-price">{money(total)}</dd></dl><p>{table ? 'Demo payment only. No money is collected.' : 'Show this shortlist to café staff. Prices are indicative.'}</p>{table && <form className="dm-order-form" onSubmit={event => { event.preventDefault(); void placeOrder() }}><label>Guest name<input required minLength={2} autoComplete="name" value={guestName} onChange={event => setGuestName(event.target.value)} placeholder="Name for this order"/></label><label>Mobile number <small>Optional</small><input type="tel" autoComplete="tel" value={phone} onChange={event => setPhone(event.target.value)} placeholder="For order updates"/></label><label>Kitchen note <small>Optional</small><textarea value={notes} onChange={event => setNotes(event.target.value)} placeholder="Less spicy, allergy note…"/></label>{error && <p className="dm-error" role="alert">{error}</p>}<button className="dm-primary" type="submit" disabled={submitting}>{submitting ? 'Sending…' : 'Demo pay & place order'}</button></form>}</aside></div> : empty('selection', 'Your list is empty', 'Add dishes while browsing, then return here to review them.')}</>}
    </main>
    {itemCount > 0 && screen !== 'selection' && <button className="dm-selection-peek" type="button" onClick={() => navigate('/menu/selection')} aria-label={`View My List, ${itemCount} items, ${money(subtotal)} before service charge`}><Icon name="bag"/><span>{itemCount} {itemCount === 1 ? 'item' : 'items'} <strong>{money(subtotal)}</strong></span><span>My List <Icon name="arrow"/></span></button>}
    <nav className="dm-bottom-nav mn-bottom-nav" aria-label="Menu navigation">{navItems()}</nav>
    <p className="dm-announcement" role="status" aria-live="polite">{announcement}</p>
    {drawer && <Modal title="dm-drawer-title" kind="drawer" onClose={() => setDrawer(false)}><p className="dm-eyebrow">MANGOSTEEN · CAFÉ INDORE</p><h2 id="dm-drawer-title">At your <em>table.</em></h2><nav aria-label="Menu drawer navigation">{navItems()}</nav><a href="/">Back to Mangosteen <Icon name="arrow"/></a>{table && <p className="dm-drawer-table">Ordering for {table.label}</p>}</Modal>}
    {dishOpen && <Modal title="dm-dish-title" kind="sheet" onClose={() => setDishOpen(null)}><MenuPhoto dish={dishOpen} priority/><div className="dm-sheet-copy"><p className="dm-eyebrow">{dishOpen.category}</p><h2 id="dm-dish-title">{dishOpen.name}</h2><strong className="dm-price">{money(dishOpen.price)}</strong>{dishOpen.description && <p>{dishOpen.description}</p>}<div className="dm-sheet-actions"><button type="button" className="dm-save" aria-pressed={favourites.includes(keyFor(dishOpen))} onClick={() => toggleFavourite(dishOpen)}><Icon name="favourites" filled={favourites.includes(keyFor(dishOpen))}/>{favourites.includes(keyFor(dishOpen)) ? 'Saved' : 'Favourite'}</button><button type="button" className="dm-primary" onClick={() => { add(dishOpen); setDishOpen(null) }}>Add to My List</button></div>{!dishPhoto(dishOpen) && <p className="dm-photo-note">A verified photograph of this dish is not yet available.</p>}</div></Modal>}
  </div>
}
