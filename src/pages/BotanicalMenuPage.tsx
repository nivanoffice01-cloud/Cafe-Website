import { useEffect, useMemo, useRef, useState } from 'react'
import { fullMenu, fullMenuCount, type MenuItem } from '../data/fullMenu'
import { hasDishPhoto, menuPhotoFor } from '../data/menuPhotos'
import { orderTableFor } from '../data/seating'
import { submitGuestOrder, type GuestOrderReceipt } from '../lib/orders'

type Dish = MenuItem & { category: string }
type CartLine = Dish & { quantity: number }

const money = (value: number) => `₹${value.toLocaleString('en-IN')}`
const keyFor = (dish: Dish) => `${dish.category}|${dish.name}`
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
function Cloche() { return <svg viewBox="0 0 36 36" aria-hidden="true"><path d="M5 24h26M8 22a10 10 0 0 1 20 0M18 10V7M15 7h6" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg> }
function Fork() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3v7M9 3v7M6 7h3M7.5 10v11M15 3v18M15 3c4 2 4 7 0 9" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> }
function Heart({ fill = false }: { fill?: boolean }) { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 5.7c-2.3-2.4-6.2-1.8-8.5 1-2.3-2.8-6.2-3.4-8.5-1-2.5 2.6-1.2 6.7.8 8.7L12 21l7.7-6.6c2-2 3.3-6.1.8-8.7Z" fill={fill ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.4"/></svg> }

function Header({ back, search, table }: { back: () => void; search: () => void; table?: string }) {
  return <header className="bm-header"><button type="button" onClick={back} aria-label="Go back"><Arrow left/></button><div className="bm-brand"><LeafMark/><strong>MANGOSTEEN</strong><span>CAFÉ · INDORE{table ? ` · ${table}` : ''}</span></div><button type="button" onClick={search} aria-label="Search menu"><SearchIcon/></button></header>
}

export function BotanicalMenuPage() {
  const params = useMemo(() => new URLSearchParams(window.location.search), [])
  const table = useMemo(() => orderTableFor(params.get('table')), [params])
  const requested = params.get('category')
  const [category, setCategory] = useState<string | null>(fullMenu.some((entry) => entry.name === requested) ? requested : null)
  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [dishOpen, setDishOpen] = useState<Dish | null>(() => {
    const categoryName = params.get('category')
    const dishName = params.get('dish')
    const item = fullMenu.find((entry) => entry.name === categoryName)?.items.find((entry) => entry.name === dishName)
    return item && categoryName ? { ...item, category: categoryName } : null
  })
  const [feature, setFeature] = useState(0)
  const [cart, setCart] = useState<CartLine[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [guestName, setGuestName] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [receipt, setReceipt] = useState<GuestOrderReceipt | null>(null)
  const [favourites, setFavourites] = useState<string[]>(() => { try { return JSON.parse(localStorage.getItem('mangosteen-menu-favourites') || '[]') as string[] } catch { return [] } })
  const browse = useRef<HTMLElement>(null)

  const dishes = useMemo(() => fullMenu.flatMap((entry) => entry.items.map((item) => ({ ...item, category: entry.name }))), [])
  const active = fullMenu.find((entry) => entry.name === category)
  const featured = useMemo(() => [['Pizza & Pide','Margarita'],['Pasta','Pesto cream Pasta'],['Burger & sandwich','Veg Cheese Burger'],['Mocktail & Coolers','Virgin mojito'],['Desserts','Chocolate Cheesecake']].flatMap(([cat, name]) => { const item = fullMenu.find((entry) => entry.name === cat)?.items.find((entry) => entry.name === name); return item ? [{ ...item, category: cat }] : [] }), [])
  const results = useMemo(() => { const needle = query.trim().toLowerCase(); return needle ? dishes.filter((dish) => `${dish.name} ${dish.description || ''} ${dish.category}`.toLowerCase().includes(needle)) : [] }, [dishes, query])
  const itemCount = cart.reduce((sum, line) => sum + line.quantity, 0)
  const subtotal = cart.reduce((sum, line) => sum + line.price * line.quantity, 0)
  const total = subtotal + Math.round(subtotal * .05)

  useEffect(() => { localStorage.setItem('mangosteen-menu-favourites', JSON.stringify(favourites)) }, [favourites])
  useEffect(() => { const old = document.body.style.overflow; if (searchOpen || dishOpen || cartOpen) document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = old } }, [cartOpen, dishOpen, searchOpen])
  const chooseCategory = (name: string) => { setCategory(name); const url = new URL(window.location.href); url.searchParams.set('category', name); history.replaceState({}, '', url); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const back = () => { if (!category) { window.location.href = '/'; return } setCategory(null); const url = new URL(window.location.href); url.searchParams.delete('category'); history.replaceState({}, '', url) }
  const add = (dish: Dish) => setCart((current) => { const found = current.find((line) => keyFor(line) === keyFor(dish)); return found ? current.map((line) => line === found ? { ...line, quantity: Math.min(10, line.quantity + 1) } : line) : [...current, { ...dish, quantity: 1 }] })
  const change = (line: CartLine, amount: number) => setCart((current) => current.flatMap((item) => keyFor(item) !== keyFor(line) ? [item] : item.quantity + amount > 0 ? [{ ...item, quantity: item.quantity + amount }] : []))
  const quantity = (dish: Dish) => cart.find((line) => keyFor(line) === keyFor(dish))?.quantity || 0
  const toggleFavourite = (dish: Dish) => setFavourites((current) => current.includes(keyFor(dish)) ? current.filter((key) => key !== keyFor(dish)) : [...current, keyFor(dish)])
  const placeOrder = async () => {
    if (!table) { setError('Scan the dedicated QR fixed to your table before placing an order.'); return }
    if (guestName.trim().length < 2) { setError('Please enter the guest name for this table.'); return }
    setSubmitting(true); setError('')
    try { const result = await submitGuestOrder({ requestKey: requestKey(), table: table.id, guestName: guestName.trim(), phone: phone.trim(), notes: notes.trim(), paymentMethod: 'demo-upi', items: cart.map((item) => ({ category: item.category, name: item.name, quantity: item.quantity, unitPrice: item.price })), website: '' }); setReceipt(result); setCart([]); setCartOpen(false) }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'The order could not be placed.') } finally { setSubmitting(false) }
  }

  if (receipt) return <main className="order-success"><div className="order-success-mark">✓</div><p className="order-kicker">ORDER RECEIVED</p><h1>Your table is in the kitchen queue.</h1><p>The café CRM received <strong>{receipt.reference}</strong> for <strong>{table?.label}</strong>.</p><div className="order-success-ticket"><span>Demo payment</span><strong>{receipt.paymentLabel}</strong><span>Total</span><strong>{money(receipt.total)}</strong></div><div className="demo-notice"><strong>Demonstration only</strong><span>No money was transferred and no payment details were collected.</span></div><button type="button" onClick={() => setReceipt(null)}>Start another order</button><a href="/">Return to Mangosteen</a></main>

  return <div className={`bm-shell ${category ? 'is-detail' : 'is-landing'}`}>
    {!category ? <><section className="bm-landing"><Header back={back} search={() => setSearchOpen(true)} table={table?.label}/><img className="bm-hero-photo" src="/images/experience/mangosteen-table-enhanced.jpg" alt="Warmly lit table inside Mangosteen Café" fetchPriority="high"/><img className="bm-botanical" src="/images/menu-ui/bougainvillea-botanical-v1.png" alt="" aria-hidden="true"/><div className="bm-hero-copy"><p>OUR MENU</p><h1>A little taste of <em>something<br/>extraordinary.</em></h1><span>From comfort classics to café favourites, explore a menu crafted with fresh ingredients and care.</span><button type="button" onClick={() => browse.current?.scrollIntoView({ behavior: 'smooth' })}><Fork/>Explore the Menu <Arrow/></button></div><div className="bm-discovery"><button type="button" onClick={() => browse.current?.scrollIntoView({ behavior: 'smooth' })}><LeafMark/><span>{fullMenuCount} Dishes</span></button><button type="button" disabled title="Chef recommendations are not configured"><Cloche/><span>Chef's Picks</span></button><button type="button" disabled title="Popularity data is not configured"><Cloche/><span>Popular</span></button><button type="button" onClick={() => { setQuery('__favourites__'); setSearchOpen(true) }}><Heart/><span>Favourites</span></button></div></section>
      <section className="bm-browse" ref={browse}><img className="bm-paper-edge" src="/images/menu-ui/torn-paper-v1.png" alt=""/><h2>Browse by Category</h2><div className="bm-category-rail"><button className="is-active" type="button" onClick={() => chooseCategory('Pizza & Pide')}><Cloche/><span>All</span></button>{fullMenu.map((entry) => <button type="button" key={entry.name} onClick={() => chooseCategory(entry.name)}><Cloche/><span>{entry.name.replace(' & Pide','').replace(' & sandwich','s')}</span></button>)}</div><div className="bm-feature-wrap">{featured.map((dish, index) => { const photo = menuPhotoFor(dish.category, dish.name); return <article className={`bm-feature${index === feature ? ' is-current' : ''}`} key={keyFor(dish)}>{photo && <img src={photo.src} alt={photo.alt}/>}<div><span>FEATURED</span><h3>{dish.name}</h3>{dish.description && <p>{dish.description}</p>}<strong>{money(dish.price)}</strong></div><button type="button" onClick={() => setDishOpen(dish)} aria-label={`View ${dish.name}`}><Arrow/></button></article>})}<div className="bm-dots">{featured.map((dish, index) => <button type="button" key={dish.name} className={feature === index ? 'is-active' : ''} onClick={() => setFeature(index)} aria-label={`Show ${dish.name}`}/>)}</div></div></section></> : <><Header back={back} search={() => setSearchOpen(true)} table={table?.label}/>{active && <main className="bm-detail"><section className="bm-category-hero"><img src={menuPhotoFor(active.name, active.items[0].name)?.src} alt="" fetchPriority="high"/><div><p>THE MENU</p><h1>{active.name}</h1><span>{categoryCopy[active.name]}</span></div></section><div className="bm-detail-meta"><strong>{active.items.length} {active.items.length === 1 ? 'dish' : 'dishes'}</strong><span>Dietary filters are hidden until café-verified data is available.</span></div><section className="bm-dish-list">{active.items.map((item) => { const dish = { ...item, category: active.name }; const photo = menuPhotoFor(active.name, item.name); const specific = hasDishPhoto(active.name, item.name); const count = quantity(dish); return <article className="bm-dish-card" key={item.name}><button className="bm-dish-open" type="button" onClick={() => setDishOpen(dish)}><span className={`bm-dish-image${specific ? '' : ' is-fallback'}`}>{photo && <img src={photo.src} alt={specific ? photo.alt : ''} loading="lazy"/>}{!specific && <small>Category image</small>}</span><span className="bm-dish-copy"><strong>{item.name}</strong>{item.description && <small>{item.description}</small>}<b>{money(item.price)}</b></span></button>{table && (count ? <div className="bm-quantity"><button type="button" onClick={() => change({ ...dish, quantity: count }, -1)}>−</button><span>{count}</span><button type="button" onClick={() => add(dish)}>+</button></div> : <button className="bm-add" type="button" onClick={() => add(dish)} aria-label={`Add ${item.name}`}>+</button>)}</article>})}</section></main>}</>}

    {itemCount > 0 && <button className="bm-cart-bar" type="button" onClick={() => setCartOpen(true)}><span><i>{itemCount}</i><b>{itemCount} {itemCount === 1 ? 'item' : 'items'} <small>|</small> {money(total)}</b></span><strong>View Cart <Arrow/></strong></button>}
    {searchOpen && <div className="bm-search" role="dialog" aria-modal="true" aria-label="Search menu"><header><button type="button" onClick={() => { setSearchOpen(false); setQuery('') }}><Arrow left/></button><label><SearchIcon/><input autoFocus type="search" value={query === '__favourites__' ? '' : query} onChange={(event) => setQuery(event.target.value)} placeholder="Search dishes or ingredients"/><button type="button" onClick={() => setQuery('')}>×</button></label></header><div>{(query === '__favourites__' ? dishes.filter((dish) => favourites.includes(keyFor(dish))) : results).map((dish) => { const photo = menuPhotoFor(dish.category, dish.name); return <button type="button" key={keyFor(dish)} onClick={() => { setDishOpen(dish); setSearchOpen(false) }}>{photo && <img src={photo.src} alt=""/>}<span><small>{dish.category}</small><strong>{dish.name}</strong><b>{money(dish.price)}</b></span></button>})}{query && query !== '__favourites__' && !results.length && <p>No dishes match “{query}”.</p>}{query === '__favourites__' && !favourites.length && <p>Save dishes with the heart button and they will appear here.</p>}</div></div>}
    {dishOpen && <div className="bm-sheet-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setDishOpen(null) }}><section className="bm-dish-sheet" role="dialog" aria-modal="true" aria-labelledby="bm-dish-title"><button className="bm-sheet-close" type="button" onClick={() => setDishOpen(null)}>×</button>{menuPhotoFor(dishOpen.category, dishOpen.name) && <img src={menuPhotoFor(dishOpen.category, dishOpen.name)!.src} alt={menuPhotoFor(dishOpen.category, dishOpen.name)!.alt}/>}<div><small>{dishOpen.category}</small><h2 id="bm-dish-title">{dishOpen.name}</h2>{dishOpen.description && <p>{dishOpen.description}</p>}<strong>{money(dishOpen.price)}</strong><div className="bm-sheet-actions"><button type="button" onClick={() => toggleFavourite(dishOpen)}><Heart fill={favourites.includes(keyFor(dishOpen))}/>{favourites.includes(keyFor(dishOpen)) ? 'Saved' : 'Favourite'}</button>{table && <button type="button" onClick={() => { add(dishOpen); setDishOpen(null) }}>Add to cart</button>}</div><p className="bm-photo-note">{hasDishPhoto(dishOpen.category, dishOpen.name) ? 'Illustrative photograph; café presentation may differ.' : 'Category image shown. Individual dish photography is not yet available.'}</p></div></section></div>}
    {cartOpen && <div className="bm-sheet-backdrop"><section className="bm-cart-sheet" role="dialog" aria-modal="true" aria-labelledby="bm-cart-title"><header><div><small>{table ? table.label : 'MENU PREVIEW'}</small><h2 id="bm-cart-title">Your order</h2></div><button type="button" onClick={() => setCartOpen(false)}>×</button></header><div className="bm-cart-lines">{cart.map((line) => <div key={keyFor(line)}><span><strong>{line.name}</strong><small>{line.category} · {money(line.price)}</small></span><div className="bm-quantity"><button type="button" onClick={() => change(line, -1)}>−</button><span>{line.quantity}</span><button type="button" onClick={() => add(line)}>+</button></div></div>)}</div><label>Guest name<input value={guestName} onChange={(event) => setGuestName(event.target.value)} placeholder="Name for this order"/></label><label>Mobile number <small>Optional</small><input value={phone} onChange={(event) => setPhone(event.target.value)} inputMode="tel" placeholder="For order updates"/></label><label>Kitchen note <small>Optional</small><textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Less spicy, allergy note…"/></label>{!table && <p className="bm-cart-warning">Scan the QR fixed to your table to place this order.</p>}{error && <p className="order-error">{error}</p>}<footer><span>Estimated total <strong>{money(total)}</strong><small>Includes 5% demo service charge</small></span><button type="button" disabled={!table || submitting} onClick={() => void placeOrder()}>{submitting ? 'Sending…' : 'Demo pay & place order'}</button></footer></section></div>}
  </div>
}
