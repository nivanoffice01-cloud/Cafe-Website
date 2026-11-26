import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { fullMenu, fullMenuCount, type MenuItem } from '../data/fullMenu'
import { categoryBannerFor, hasDishPhoto, menuPhotoFor } from '../data/menuPhotos'
import { authenticPhoto } from '../features/supplied-frontend/authentic-photos'
import { orderTableFor } from '../data/seating'
import { submitGuestOrder, type GuestOrderReceipt } from '../lib/orders'

type Dish = MenuItem & { category: string }
type CartLine = Dish & { quantity: number }
type Screen = 'home' | 'categories' | 'category' | 'all' | 'search' | 'favourites' | 'selection'

const money = (value: number) => `₹${value.toLocaleString('en-IN')}`
const keyFor = (dish: Dish) => `${dish.category}|${dish.name}`
const slugify = (value: string) => value.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
const categoryFromSlug = (slug: string) => fullMenu.find((entry) => slugify(entry.name) === slug)
const requestKey = () => globalThis.crypto?.randomUUID?.() || `order-${Date.now()}-${Math.random().toString(16).slice(2)}`
const categoryCopy: Record<string, string> = {
  Shakes: 'Cold, creamy café favourites made for slow afternoons.', Juice: 'Fresh, bright pours for an easy start.',
  'Mocktail & Coolers': 'Layered, refreshing drinks for long evenings.', 'Iced Tea': 'Crisp, chilled tea with a fruit-forward finish.',
  Salad: 'Fresh, composed plates with vibrant ingredients.', 'Pizza & Pide': 'Handcrafted pizzas and pide made for sharing.',
  'Burger & sandwich': 'Comfort classics, stacked and served warm.', Breakfast: 'Relaxed morning plates and café favourites.',
  'Small Plates': 'Table-friendly bites for the first pour.', Pasta: 'Comforting bowls with generous sauces.',
  Desserts: 'A sweet final note for the table.', 'Main Course': 'Familiar favourites and hearty café plates.', Soup: 'Warm, restorative bowls to begin with.',
}

function LeafMark() { return <svg viewBox="0 0 52 38" aria-hidden="true"><path d="M25.5 26C13 24 7 17 7 7c11 0 18 4 20 13M27 22C28 10 35 4 46 3c0 11-5 19-18 23M26 20v14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> }
function Arrow({ left = false }: { left?: boolean }) { return <svg className={left ? 'is-left' : ''} viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h16M15 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function SearchIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.6"/><path d="m15.5 15.5 5 5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg> }
function Heart({ fill = false }: { fill?: boolean }) { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 5.7c-2.3-2.4-6.2-1.8-8.5 1-2.3-2.8-6.2-3.4-8.5-1-2.5 2.6-1.2 6.7.8 8.7L12 21l7.7-6.6c2-2 3.3-6.1.8-8.7Z" fill={fill ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.4"/></svg> }
function Fork() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3v7M9 3v7M6 7h3M7.5 10v11M15 3v18M15 3c4 2 4 7 0 9" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> }
function GridIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> }
function HomeIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 11 9-8 9 8v10h-6v-6H9v6H3Z"/></svg> }
function ListIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 6h14M7 12h14M7 18h14M3 6h.01M3 12h.01M3 18h.01" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> }

function CategoryGlyph({ name }: { name: string }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.45, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  const art: Record<string, ReactNode> = {
    Shakes: <><path {...common} d="M11 5h12l-2 24H13L11 5Zm2 5h8M16 5l2-3"/></>,
    Juice: <><path {...common} d="M10 8h14l-2 21H12L10 8Zm2 6h10M16 8l5-6"/><circle {...common} cx="23" cy="5" r="3"/></>,
    'Mocktail & Coolers': <><path {...common} d="M8 6h20L18 18v11M13 29h10M11 10h14"/><path {...common} d="m22 7 5-5"/></>,
    'Iced Tea': <><path {...common} d="M10 7h14l-2 22H12L10 7Zm2 7h10M14 11l6 6M19 7l4-5"/></>,
    Salad: <><path {...common} d="M6 15h24c-1 9-5 14-12 14S7 24 6 15Z"/><path {...common} d="M11 12c1-5 5-7 7-3 2-5 7-3 7 2"/></>,
    'Pizza & Pide': <><path {...common} d="m18 4 12 25H6L18 4Zm-8 17h16"/><circle cx="17" cy="14" r="1.4" fill="currentColor"/><circle cx="21" cy="21" r="1.4" fill="currentColor"/></>,
    'Burger & sandwich': <><path {...common} d="M7 15c1-7 21-7 22 0H7Zm0 4h22M8 23h20c0 4-3 6-10 6S8 27 8 23Z"/></>,
    Breakfast: <><circle {...common} cx="18" cy="18" r="11"/><path {...common} d="M15 14c5-4 10 2 6 7-5 5-11-2-6-7Z"/><path {...common} d="M5 5v9M3 9h4M31 5v24"/></>,
    'Small Plates': <><ellipse {...common} cx="18" cy="23" rx="13" ry="6"/><path {...common} d="M8 21c3-6 7-7 10-2 4-6 8-3 10 2"/></>,
    Pasta: <><path {...common} d="M6 18h24c-1 8-5 11-12 11S7 26 6 18Z"/><path {...common} d="M11 14c1-5 4-7 7-3 2-5 7-3 7 3M14 5v5M20 4v6"/></>,
    Desserts: <><path {...common} d="m7 25 11-17 11 17H7Zm4-6h14M18 8V4M15 4h6"/></>,
    'Main Course': <><path {...common} d="M5 25h26M8 23a10 10 0 0 1 20 0M18 11V8M15 8h6"/></>,
    Soup: <><path {...common} d="M6 18h24c-2 8-6 11-12 11S8 26 6 18Zm-2 0h28M13 13c-3-4 3-5 0-9M20 13c-3-4 3-5 0-9"/></>,
  }
  return <svg viewBox="0 0 36 36" aria-hidden="true">{art[name] ?? <path {...common} d="M5 25h26M8 23a10 10 0 0 1 20 0M18 11V8M15 8h6"/>}</svg>
}

function Header({ back, search, table }: { back: () => void; search: () => void; table?: string }) {
  return <header className="bm-header mn-header"><button type="button" onClick={back} aria-label="Go back"><Arrow left/></button><div className="bm-brand"><LeafMark/><strong>MANGOSTEEN</strong><span>CAFÉ · INDORE{table ? ` · ${table}` : ''}</span></div><button type="button" onClick={search} aria-label="Search menu"><SearchIcon/></button></header>
}

function DishCard({ dish, count, favourite, onOpen, onAdd, onChange, onFavourite }: { dish: Dish; count: number; favourite: boolean; onOpen: () => void; onAdd: () => void; onChange: (amount: number) => void; onFavourite: () => void }) {
  const photo = menuPhotoFor(dish.category, dish.name)
  const specific = hasDishPhoto(dish.category, dish.name)
  return <article className="bm-dish-card mn-dish-card"><button className="bm-dish-open" type="button" onClick={onOpen}><span className={`bm-dish-image${specific ? '' : ' is-fallback'}`}>{photo && <img src={photo.src} alt={photo.alt} loading="lazy"/>}{!specific && <small>Photo pending</small>}</span><span className="bm-dish-copy"><strong>{dish.name}</strong>{dish.description && <small>{dish.description}</small>}<b>{money(dish.price)}</b></span></button><button className={`mn-favourite${favourite ? ' is-active' : ''}`} type="button" onClick={onFavourite} aria-label={`${favourite ? 'Remove' : 'Add'} ${dish.name} ${favourite ? 'from' : 'to'} favourites`}><Heart fill={favourite}/></button>{count ? <div className="bm-quantity"><button type="button" onClick={() => onChange(-1)} aria-label={`Remove one ${dish.name}`}>−</button><span>{count}</span><button type="button" onClick={() => onChange(1)} aria-label={`Add another ${dish.name}`}>+</button></div> : <button className="bm-add" type="button" onClick={onAdd} aria-label={`Add ${dish.name} to My List`}>+</button>}</article>
}

export function MenuExperiencePage() {
  const initialUrl = useMemo(() => new URL(window.location.href), [])
  const table = useMemo(() => orderTableFor(initialUrl.searchParams.get('table')), [initialUrl])
  const [path, setPath] = useState(window.location.pathname.replace(/\/$/, '') || '/menu')
  const [query, setQuery] = useState('')
  const [dishOpen, setDishOpen] = useState<Dish | null>(() => {
    const categoryName = initialUrl.searchParams.get('category'); const dishName = initialUrl.searchParams.get('dish')
    const item = fullMenu.find((entry) => entry.name === categoryName)?.items.find((entry) => entry.name === dishName)
    return item && categoryName ? { ...item, category: categoryName } : null
  })
  const [feature, setFeature] = useState(0)
  const [cart, setCart] = useState<CartLine[]>(() => { try { return JSON.parse(localStorage.getItem('mangosteen-menu-selection') || '[]') as CartLine[] } catch { return [] } })
  const [favourites, setFavourites] = useState<string[]>(() => { try { return JSON.parse(localStorage.getItem('mangosteen-menu-favourites') || '[]') as string[] } catch { return [] } })
  const [guestName, setGuestName] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [receipt, setReceipt] = useState<GuestOrderReceipt | null>(null)
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const scrollPositions = useRef<Record<string, number>>({})

  const allDishes = useMemo(() => fullMenu.flatMap((entry) => entry.items.map((item) => ({ ...item, category: entry.name }))), [])
  const featured = useMemo(() => [['Pizza & Pide','Margarita'],['Pasta','Pesto cream Pasta'],['Burger & sandwich','Veg Cheese Burger'],['Mocktail & Coolers','Virgin mojito'],['Desserts','Chocolate Cheesecake']].flatMap(([cat, name]) => { const item = fullMenu.find((entry) => entry.name === cat)?.items.find((entry) => entry.name === name); return item ? [{ ...item, category: cat }] : [] }), [])
  const categorySlug = path.startsWith('/menu/category/') ? decodeURIComponent(path.split('/').pop() || '') : ''
  const activeCategory = categoryFromSlug(categorySlug) ?? (initialUrl.searchParams.get('category') ? fullMenu.find((entry) => entry.name === initialUrl.searchParams.get('category')) : undefined)
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
    if (replace) history.replaceState({}, '', next); else history.pushState({}, '', next)
    setPath(nextPath)
    setQuery('')
    window.requestAnimationFrame(() => window.scrollTo({ top: scrollPositions.current[nextPath] || 0, behavior: 'auto' }))
  }
  const goBack = () => {
    if (screen === 'category' || screen === 'all') navigate('/menu/browse')
    else if (history.length > 1) history.back()
    else navigate('/menu', true)
  }
  const chooseCategory = (name: string) => navigate(`/menu/category/${slugify(name)}`)
  const add = (dish: Dish) => setCart((current) => { const found = current.find((line) => keyFor(line) === keyFor(dish)); return found ? current.map((line) => line === found ? { ...line, quantity: Math.min(10, line.quantity + 1) } : line) : [...current, { ...dish, quantity: 1 }] })
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
  useEffect(() => { const onPop = () => { const nextPath = window.location.pathname.replace(/\/$/, '') || '/menu'; setPath(nextPath); setQuery(''); window.requestAnimationFrame(() => window.scrollTo({ top: scrollPositions.current[nextPath] || 0, behavior: 'auto' })) }; addEventListener('popstate', onPop); return () => removeEventListener('popstate', onPop) }, [])
  useEffect(() => { if (screen === 'category' && activeCategory) tabRefs.current[activeCategory.name]?.scrollIntoView({ block: 'nearest', inline: 'center' }) }, [activeCategory, screen])
  useEffect(() => { const old = document.body.style.overflow; if (dishOpen) document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = old } }, [dishOpen])

  if (receipt) return <main className="order-success"><div className="order-success-mark">✓</div><p className="order-kicker">ORDER RECEIVED</p><h1>Your table is in the kitchen queue.</h1><p>The café CRM received <strong>{receipt.reference}</strong> for <strong>{table?.label}</strong>.</p><div className="order-success-ticket"><span>Demo payment</span><strong>{receipt.paymentLabel}</strong><span>Total</span><strong>{money(receipt.total)}</strong></div><div className="demo-notice"><strong>Demonstration only</strong><span>No money was transferred and no payment details were collected.</span></div><button type="button" onClick={() => { setReceipt(null); navigate('/menu') }}>Return to menu</button></main>

  const renderDishList = (items: Dish[]) => <section className="bm-dish-list mn-dish-list">{items.map((dish) => <DishCard key={keyFor(dish)} dish={dish} count={quantity(dish)} favourite={favourites.includes(keyFor(dish))} onOpen={() => setDishOpen(dish)} onAdd={() => add(dish)} onChange={(amount) => change({ ...dish, quantity: quantity(dish) }, amount)} onFavourite={() => toggleFavourite(dish)}/>)}</section>

  return <div className={`bm-shell mn-shell is-${screen}`}>
    {screen === 'home' && <><section className="bm-landing mn-landing"><Header back={() => { window.location.href = '/' }} search={() => navigate('/menu/search')} table={table?.label}/><img className="bm-hero-photo" src={authenticPhoto('menu-interior').src} srcSet={authenticPhoto('menu-interior').srcSet} sizes={authenticPhoto('menu-interior').sizes} alt={authenticPhoto('menu-interior').alt} fetchPriority="high"/><img className="bm-botanical" src="/images/menu-ui/bougainvillea-botanical-v1.png" alt="" aria-hidden="true"/><div className="bm-hero-copy"><p>OUR MENU</p><h1>A little taste of <em>something<br/>extraordinary.</em></h1><span>From comfort classics to café favourites, explore a menu crafted with fresh ingredients and care.</span><button type="button" onClick={() => navigate('/menu/browse')}><Fork/>Explore the Menu <Arrow/></button></div><div className="bm-discovery"><button type="button" onClick={() => navigate('/menu/browse')}><LeafMark/><span>{fullMenuCount} Dishes</span></button><button type="button" disabled title="Chef recommendations are not configured"><CategoryGlyph name="Main Course"/><span>Chef's Picks</span></button><button type="button" disabled title="Popularity data is not configured"><CategoryGlyph name="Breakfast"/><span>Popular</span></button><button type="button" onClick={() => navigate('/menu/favourites')}><Heart/><span>Favourites</span></button></div></section><section className="bm-browse"><img className="bm-paper-edge" src="/images/menu-ui/torn-paper-v1.png" alt=""/><h2>Browse by Category</h2><div className="bm-category-rail"><button className="is-active" type="button" onClick={() => navigate('/menu/browse')}><GridIcon/><span>All</span></button>{fullMenu.map((entry) => <button type="button" key={entry.name} onClick={() => chooseCategory(entry.name)}><CategoryGlyph name={entry.name}/><span>{entry.name.replace(' & Pide','').replace(' & sandwich','s')}</span></button>)}</div><div className="bm-feature-wrap">{featured.map((dish, index) => { const photo = menuPhotoFor(dish.category, dish.name); return <article className={`bm-feature${index === feature ? ' is-current' : ''}`} key={keyFor(dish)}>{photo && <img src={photo.src} alt={photo.alt}/>}<div><span>FEATURED</span><h3>{dish.name}</h3>{dish.description && <p>{dish.description}</p>}<strong>{money(dish.price)}</strong></div><button type="button" onClick={() => setDishOpen(dish)} aria-label={`View ${dish.name}`}><Arrow/></button></article>})}<div className="bm-dots">{featured.map((dish, index) => <button type="button" key={dish.name} className={feature === index ? 'is-active' : ''} onClick={() => setFeature(index)} aria-label={`Show ${dish.name}`}/>)}</div></div></section></>}

    {screen === 'categories' && <main className="mn-screen mn-categories"><Header back={goBack} search={() => navigate('/menu/search')} table={table?.label}/><div className="mn-selector-heading"><p>THE MANGOSTEEN MENU</p><h1>What are you<br/><em>craving today?</em></h1></div><label className="mn-search-field"><SearchIcon/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find your favourite dish..." aria-label="Search all dishes"/><button type="button" onClick={() => setQuery('')} aria-label="Clear search">{query ? '×' : ''}</button></label>{query ? <div className="mn-inline-results">{results.length ? results.slice(0, 12).map((dish) => <button type="button" key={keyFor(dish)} onClick={() => setDishOpen(dish)}><span><small>{dish.category}</small><strong>{dish.name}</strong></span><b>{money(dish.price)}</b></button>) : <p>No dishes match “{query}”.</p>}</div> : <div className="mn-category-grid"><button type="button" onClick={() => navigate('/menu/all')}><GridIcon/><strong>All Dishes</strong><small>{fullMenuCount}</small></button>{fullMenu.map((entry) => <button type="button" key={entry.name} onClick={() => chooseCategory(entry.name)}><CategoryGlyph name={entry.name}/><strong>{entry.name}</strong><small>{entry.items.length}</small></button>)}<button type="button" onClick={() => navigate('/menu/favourites')}><Heart/><strong>Favourites</strong><small>{favourites.length}</small></button></div>}</main>}

    {screen === 'category' && activeCategory && <main className="bm-detail mn-screen mn-category-detail"><Header back={() => navigate('/menu/browse')} search={() => navigate('/menu/search')} table={table?.label}/><nav className="mn-category-tabs" aria-label="Menu categories"><button type="button" onClick={() => navigate('/menu/browse')} aria-label="Open category grid"><GridIcon/></button>{fullMenu.map((entry) => <button ref={(node) => { tabRefs.current[entry.name] = node }} type="button" key={entry.name} className={entry.name === activeCategory.name ? 'is-active' : ''} onClick={() => chooseCategory(entry.name)}>{entry.name}</button>)}</nav><section className="bm-category-hero mn-category-hero"><img src={categoryBannerFor(activeCategory.name)?.src} alt={categoryBannerFor(activeCategory.name)?.alt || activeCategory.name} fetchPriority="high"/><div><p>THE MENU</p><h1>{activeCategory.name}</h1><span>{categoryCopy[activeCategory.name]}</span></div></section><div className="bm-detail-meta mn-detail-meta"><strong>{activeCategory.items.length} {activeCategory.items.length === 1 ? 'dish' : 'dishes'}</strong><span>Prices shown are indicative.</span></div>{renderDishList(activeCategory.items.map((item) => ({ ...item, category: activeCategory.name })))}</main>}

    {screen === 'all' && <main className="mn-screen mn-list-screen"><Header back={() => navigate('/menu/browse')} search={() => navigate('/menu/search')} table={table?.label}/><div className="mn-list-heading"><p>THE COMPLETE MENU</p><h1>All <em>{fullMenuCount} dishes.</em></h1></div>{renderDishList(allDishes)}</main>}

    {screen === 'search' && <main className="mn-screen mn-list-screen"><Header back={goBack} search={() => undefined} table={table?.label}/><div className="mn-list-heading"><p>SEARCH THE MENU</p><h1>Find your <em>favourite.</em></h1></div><label className="mn-search-field"><SearchIcon/><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find your favourite dish..." aria-label="Search all dishes"/><button type="button" onClick={() => setQuery('')} aria-label="Clear search">{query ? '×' : ''}</button></label>{query ? results.length ? renderDishList(results) : <div className="mn-empty"><SearchIcon/><h2>No dishes found</h2><p>Try another dish, ingredient or category.</p></div> : <div className="mn-empty"><SearchIcon/><h2>What sounds good?</h2><p>Search all {fullMenuCount} dishes by name, description or category.</p></div>}</main>}

    {screen === 'favourites' && <main className="mn-screen mn-list-screen"><Header back={goBack} search={() => navigate('/menu/search')} table={table?.label}/><div className="mn-list-heading"><p>SAVED FOR LATER</p><h1>Your <em>favourites.</em></h1></div>{favouriteDishes.length ? renderDishList(favouriteDishes) : <div className="mn-empty"><Heart/><h2>Nothing saved yet</h2><p>Tap the heart on a dish to keep it close.</p><button type="button" onClick={() => navigate('/menu/browse')}>Browse categories</button></div>}</main>}

    {screen === 'selection' && <main className="mn-screen mn-list-screen mn-selection"><Header back={goBack} search={() => navigate('/menu/search')} table={table?.label}/><div className="mn-list-heading"><p>{table ? table.label.toUpperCase() : 'YOUR SHORTLIST'}</p><h1>My <em>List.</em></h1></div>{cart.length ? <><div className="mn-selection-lines">{cart.map((line) => <article key={keyFor(line)}><div><strong>{line.name}</strong><small>{line.category} · {money(line.price)}</small><button className="mn-remove" type="button" onClick={() => remove(line)}>Remove</button></div><div className="bm-quantity"><button type="button" onClick={() => change(line,-1)} aria-label={`Remove one ${line.name}`}>−</button><span>{line.quantity}</span><button type="button" onClick={() => add(line)} aria-label={`Add another ${line.name}`}>+</button></div><b>{money(line.price * line.quantity)}</b></article>)}</div><div className="mn-selection-summary"><button type="button" onClick={() => setCart([])}>Clear list</button><span>Estimated total <strong>{money(total)}</strong><small>{table ? 'Includes 5% demo service charge' : 'Show this shortlist to café staff'}</small></span></div>{table && <div className="mn-order-form"><label>Guest name<input value={guestName} onChange={(event) => setGuestName(event.target.value)} placeholder="Name for this order"/></label><label>Mobile number <small>Optional</small><input value={phone} onChange={(event) => setPhone(event.target.value)} inputMode="tel" placeholder="For order updates"/></label><label>Kitchen note <small>Optional</small><textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Less spicy, allergy note…"/></label>{error && <p className="order-error">{error}</p>}<button type="button" disabled={submitting} onClick={() => void placeOrder()}>{submitting ? 'Sending…' : 'Demo pay & place order'}</button></div>}</> : <div className="mn-empty"><ListIcon/><h2>Your list is empty</h2><p>Add dishes while browsing, then return here to review them.</p><button type="button" onClick={() => navigate('/menu/browse')}>Browse categories</button></div>}</main>}

    <nav className="mn-bottom-nav" aria-label="Menu navigation">{([['home','Home',<HomeIcon/>,'/menu'],['categories','Categories',<GridIcon/>,'/menu/browse'],['search','Search',<SearchIcon/>,'/menu/search'],['favourites','Favourites',<Heart/>,'/menu/favourites'],['selection','My List',<ListIcon/>,'/menu/selection']] as const).map(([id,label,icon,target]) => <button type="button" key={id} className={screen === id || (id === 'categories' && (screen === 'category' || screen === 'all')) ? 'is-active' : ''} onClick={() => navigate(target)}><span>{icon}{id === 'selection' && itemCount > 0 && <i>{itemCount}</i>}</span><small>{label}</small></button>)}</nav>

    {dishOpen && <div className="bm-sheet-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setDishOpen(null) }}><section className="bm-dish-sheet" role="dialog" aria-modal="true" aria-labelledby="mn-dish-title"><button className="bm-sheet-close" type="button" onClick={() => setDishOpen(null)} aria-label="Close dish details">×</button>{menuPhotoFor(dishOpen.category,dishOpen.name) && <img src={menuPhotoFor(dishOpen.category,dishOpen.name)!.src} alt={menuPhotoFor(dishOpen.category,dishOpen.name)!.alt}/>}<div><small>{dishOpen.category}</small><h2 id="mn-dish-title">{dishOpen.name}</h2>{dishOpen.description && <p>{dishOpen.description}</p>}<strong>{money(dishOpen.price)}</strong><div className="bm-sheet-actions"><button type="button" onClick={() => toggleFavourite(dishOpen)}><Heart fill={favourites.includes(keyFor(dishOpen))}/>{favourites.includes(keyFor(dishOpen)) ? 'Saved' : 'Favourite'}</button><button type="button" onClick={() => { add(dishOpen); setDishOpen(null) }}>Add to My List</button></div><p className="bm-photo-note">{hasDishPhoto(dishOpen.category,dishOpen.name) ? 'Temporary illustrative photograph. A genuine Mangosteen photograph is still required.' : 'Temporary category illustration. A genuine photograph of this dish is still required.'}</p></div></section></div>}
  </div>
}
