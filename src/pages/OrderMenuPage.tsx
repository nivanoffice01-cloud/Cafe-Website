import { useEffect, useMemo, useState } from 'react'
import { fullMenu, type MenuItem, type MenuCategory } from '../data/fullMenu'
import { menuPhotoFor } from '../data/menuPhotos'
import { orderTableFor } from '../data/seating'
import {
  getGuestOrder,
  getTableService,
  getTableSession,
  requestTableService,
  submitGuestOrder,
  submitTableFeedback,
  type GuestOrderReceipt,
  type ServiceRequestReceipt,
  type TableSession,
} from '../lib/orders'
import { fallbackPublicMenu, getPublicMenu } from '../lib/menu'

type CartLine = MenuItem & { category: string; quantity: number }
type CheckoutStep = 'cart' | 'details'
type DietFilter = 'all' | 'veg' | 'non-veg'
type SelectedDish = { item: MenuItem; category: string }

const money = (value: number) => `₹${Number(value || 0).toLocaleString('en-IN')}`
const requestKey = () => globalThis.crypto?.randomUUID?.() || `order-${Date.now()}-${Math.random().toString(16).slice(2)}`
const isNonVeg = (item: MenuItem) => /chicken|fish|prawn|egg|pepperoni|mutton|lamb|meat|tuna/i.test(`${item.name} ${item.description || ''}`)
const preparationTime = (category: string) => /drink|cooler|shake|juice|tea/i.test(category) ? '5–10 min' : /dessert|salad|soup/i.test(category) ? '10–15 min' : '15–25 min'
const spiceLevel = (item: MenuItem) => /spicy|chilli|schezwan|peri peri|tikka|masala/i.test(`${item.name} ${item.description || ''}`) ? 'Medium spicy' : 'Mild'
const storedReceipt = () => {
  try { return JSON.parse(sessionStorage.getItem('mangosteen-active-order') || 'null') as GuestOrderReceipt | null } catch { return null }
}

function LeafMark() {
  return <svg viewBox="0 0 44 44" aria-hidden="true"><path d="M35 8C20 9 9 18 9 31c7 2 14 0 19-5 5-5 7-11 7-18Z" fill="none" stroke="currentColor" strokeWidth="1.5"/><path d="M11 31c7-6 13-11 23-21" fill="none" stroke="currentColor" strokeWidth="1.5"/></svg>
}

function OrderTracker({ receipt, setReceipt, tableSession, waiterRequest, requestWaiter }: {
  receipt: GuestOrderReceipt
  setReceipt: (receipt: GuestOrderReceipt | null) => void
  tableSession: TableSession | null
  waiterRequest: ServiceRequestReceipt | null
  requestWaiter: () => void
}) {
  const [paymentPreference, setPaymentPreference] = useState(receipt.paymentPreference || 'Cash at table')
  const [billStatus, setBillStatus] = useState(receipt.billRequestedAt ? 'sent' : '')
  const [rating, setRating] = useState(0)
  const [tags, setTags] = useState<string[]>([])
  const [message, setMessage] = useState('')
  const [reviewUrl, setReviewUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const stages = ['Kitchen', 'Preparing', 'Ready', 'Served'] as const
  const stageIndex = receipt.status === 'Paid' ? stages.length : Math.max(0, stages.indexOf(receipt.status as typeof stages[number]))
  const feedbackTags = ['Tasty food', 'Fast service', 'Great ambience', 'Friendly team']

  useEffect(() => {
    let stopped = false
    const refresh = async () => {
      try {
        const latest = await getGuestOrder(receipt.publicToken)
        if (!stopped) {
          const merged = { ...latest, publicToken: receipt.publicToken }
          setReceipt(merged)
          sessionStorage.setItem('mangosteen-active-order', JSON.stringify(merged))
        }
      } catch { /* Keep the last confirmed state during a brief network gap. */ }
    }
    const timer = window.setInterval(refresh, 6000)
    void refresh()
    return () => { stopped = true; window.clearInterval(timer) }
  }, [receipt.publicToken, setReceipt])

  const requestBill = async () => {
    setBusy(true); setError('')
    try {
      await requestTableService({ type: 'bill', orderToken: receipt.publicToken, paymentPreference })
      setBillStatus('sent')
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Could not request the bill.') }
    finally { setBusy(false) }
  }

  const submitFeedback = async () => {
    if (!rating) { setError('Please choose a star rating.'); return }
    setBusy(true); setError('')
    try {
      const result = await submitTableFeedback({ orderToken: receipt.publicToken, rating, tags, message })
      setReviewUrl(result.googleReviewUrl)
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Could not save your feedback.') }
    finally { setBusy(false) }
  }

  const toggleTag = (tag: string) => setTags((current) => current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag])

  return <main className="guest-order-hub">
    <header className="guest-order-topbar"><a className="order-brand" href="/"><LeafMark/><span>MANGOSTEEN<small>TABLE SERVICE · INDORE</small></span></a><strong>{receipt.tableLabel}</strong></header>
    <section className="tracking-hero">
      <div className="tracking-check">✓</div>
      <p className="order-kicker">ORDER {receipt.reference}</p>
      <h1>{receipt.status === 'Paid' ? 'Thank you for joining us.' : receipt.status === 'Ready' ? 'Your order is ready.' : 'We’re preparing your table.'}</h1>
      <p>Estimated preparation time: <strong>{receipt.estimatedMinutes} minutes</strong>. This page updates automatically.</p>
      <div className="order-progress">
        {stages.map((stage, index) => <div className={index <= stageIndex ? 'is-complete' : ''} key={stage}><i>{index < stageIndex || receipt.status === 'Paid' ? '✓' : index + 1}</i><span>{stage === 'Kitchen' ? 'Received' : stage}</span></div>)}
      </div>
    </section>

    <section className="guest-service-grid">
      <article className="guest-card order-summary-card"><div className="guest-card-heading"><div><p className="order-kicker">YOUR ORDER</p><h2>Table bill</h2></div><strong>{money(receipt.total)}</strong></div>{receipt.items.map((item) => <div className="guest-order-line" key={item.name}><span>{item.quantity}× {item.name}</span><strong>{money(item.lineTotal)}</strong></div>)}<div className="guest-total-line"><span>Service charge</span><strong>{money(receipt.serviceCharge)}</strong></div></article>

      <article className="guest-card service-card"><p className="order-kicker">TABLE SERVICE</p><h2>Need anything?</h2><button className="guest-action" type="button" onClick={requestWaiter} disabled={waiterRequest?.status === 'Open'}><span>⌁</span><span><strong>{waiterRequest?.status === 'Acknowledged' ? 'A team member is coming' : waiterRequest?.status === 'Open' ? 'Waiter notified' : 'Request a waiter'}</strong><small>{waiterRequest?.status === 'Open' ? 'Waiting for staff acknowledgement' : 'We’ll notify the floor team'}</small></span></button>{tableSession && <button className="guest-action" type="button" onClick={() => void navigator.clipboard?.writeText(tableSession.wifi.password)}><span>⌁</span><span><strong>{tableSession.wifi.name}</strong><small>Tap to copy Wi-Fi password{tableSession.wifi.demo ? ' · Demo credential' : ''}</small></span></button>}</article>

      <article className="guest-card bill-card"><p className="order-kicker">WHEN YOU’RE READY</p><h2>Request your bill</h2>{billStatus === 'sent' || receipt.billRequestedAt ? <div className="request-confirmed"><i>✓</i><div><strong>Bill request sent</strong><span>The team will help you settle via {receipt.paymentPreference || paymentPreference}.</span></div></div> : <><div className="payment-choice">{['Online payment (demo)', 'Cash at table', 'Pay at counter'].map((method) => <label className={paymentPreference === method ? 'is-selected' : ''} key={method}><input type="radio" name="bill-payment" checked={paymentPreference === method} onChange={() => setPaymentPreference(method)}/><span>{method}</span><i>✓</i></label>)}</div><button className="order-primary standalone" type="button" disabled={busy} onClick={requestBill}>{busy ? 'Sending…' : `Request bill · ${money(receipt.total)}`}</button></>}</article>

      <article className="guest-card feedback-card"><p className="order-kicker">YOUR EXPERIENCE</p><h2>How was your meal?</h2>{reviewUrl ? <div className="review-thankyou"><div className="tracking-check">✓</div><h3>Thank you for helping us improve.</h3><p>Your feedback is saved in Mangosteen CRM.</p><a href={reviewUrl} target="_blank" rel="noreferrer">Continue to Google Review</a></div> : <><div className="rating-stars" aria-label="Choose a rating">{[1,2,3,4,5].map((star) => <button type="button" className={star <= rating ? 'is-active' : ''} onClick={() => setRating(star)} aria-label={`${star} stars`} key={star}>★</button>)}</div><div className="feedback-tags">{feedbackTags.map((tag) => <button type="button" className={tags.includes(tag) ? 'is-active' : ''} onClick={() => toggleTag(tag)} key={tag}>{tag}</button>)}</div><textarea value={message} onChange={(event) => setMessage(event.target.value)} maxLength={500} placeholder="Anything else you’d like us to know?"/><button className="order-primary standalone" type="button" disabled={busy} onClick={submitFeedback}>{busy ? 'Saving…' : 'Submit feedback'}</button></>}</article>
    </section>
    {error && <p className="order-error guest-error" role="alert">{error}</p>}
    <button className="start-another" type="button" onClick={() => { sessionStorage.removeItem('mangosteen-active-order'); setReceipt(null) }}>Add another order</button>
  </main>
}

export function OrderMenuPage() {
  const params = useMemo(() => new URLSearchParams(window.location.search), [])
  const tableCode = params.get('table') || ''
  const tableAccessKey = params.get('key') || ''
  const table = useMemo(() => orderTableFor(tableCode), [tableCode])
  const [menuCatalog, setMenuCatalog] = useState<MenuCategory[]>(fallbackPublicMenu)
  const [tableSession, setTableSession] = useState<TableSession | null>(null)
  const [sessionError, setSessionError] = useState('')
  const [category, setCategory] = useState(fullMenu[0].name)
  const [query, setQuery] = useState('')
  const [diet, setDiet] = useState<DietFilter>('all')
  const [cart, setCart] = useState<CartLine[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [step, setStep] = useState<CheckoutStep>('cart')
  const [guestName, setGuestName] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [receipt, setReceipt] = useState<GuestOrderReceipt | null>(storedReceipt)
  const [selectedDish, setSelectedDish] = useState<SelectedDish | null>(null)
  const [waiterRequest, setWaiterRequest] = useState<ServiceRequestReceipt | null>(null)

  useEffect(() => {
    if (!tableCode || !tableAccessKey) return
    getTableSession(tableCode, tableAccessKey).then(setTableSession).catch((requestError) => setSessionError(requestError instanceof Error ? requestError.message : 'This table QR is not valid.'))
  }, [tableAccessKey, tableCode])

  useEffect(() => {
    let stopped = false
    const refreshMenu = () => getPublicMenu().then((result) => { if (!stopped) setMenuCatalog(result.categories) }).catch(() => undefined)
    void refreshMenu()
    const timer = window.setInterval(refreshMenu, 15_000)
    return () => { stopped = true; window.clearInterval(timer) }
  }, [])

  useEffect(() => {
    if (!waiterRequest?.token || waiterRequest.status === 'Acknowledged') return
    const timer = window.setInterval(() => getTableService(waiterRequest.token).then((latest) => setWaiterRequest((current) => current ? { ...current, ...latest } : current)).catch(() => undefined), 5000)
    return () => window.clearInterval(timer)
  }, [waiterRequest?.status, waiterRequest?.token])

  const visibleCategories = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const categories = needle ? menuCatalog : menuCatalog.filter((entry) => entry.name === category)
    return categories.map((entry) => ({ ...entry, items: entry.items.filter((item) => {
      const matchesSearch = !needle || `${item.name} ${item.description || ''} ${entry.name}`.toLowerCase().includes(needle)
      const nonVeg = isNonVeg(item)
      return matchesSearch && (diet === 'all' || (diet === 'non-veg' ? nonVeg : !nonVeg))
    }) })).filter((entry) => entry.items.length)
  }, [category, diet, menuCatalog, query])

  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const serviceCharge = Math.round(subtotal * 0.05)
  const total = subtotal + serviceCharge
  const menuCount = menuCatalog.reduce((sum, entry) => sum + entry.items.length, 0)
  const canOrder = Boolean(table && tableSession)

  const addItem = (item: MenuItem, itemCategory: string) => setCart((current) => {
    const match = current.find((line) => line.name === item.name && line.category === itemCategory)
    if (match) return current.map((line) => line === match ? { ...line, quantity: Math.min(10, line.quantity + 1) } : line)
    return [...current, { ...item, category: itemCategory, quantity: 1 }]
  })

  const changeQuantity = (line: CartLine, change: number) => setCart((current) => current.flatMap((item) => {
    if (item.name !== line.name || item.category !== line.category) return [item]
    const quantity = item.quantity + change
    return quantity > 0 ? [{ ...item, quantity: Math.min(10, quantity) }] : []
  }))

  const quantityFor = (name: string, itemCategory: string) => cart.find((line) => line.name === name && line.category === itemCategory)?.quantity || 0
  const requestWaiter = async () => {
    if (!canOrder) { setSessionError('Scan the QR fixed to your table to request service.'); return }
    try { setWaiterRequest(await requestTableService({ type: 'waiter', table: table!.id, tableAccessKey })) }
    catch (requestError) { setSessionError(requestError instanceof Error ? requestError.message : 'Could not notify the waiter.') }
  }

  const placeOrder = async () => {
    if (!canOrder) { setError('Scan the QR fixed to your table before placing an order.'); return }
    if (guestName.trim().length < 2) { setStep('details'); setError('Please enter the guest name for this table.'); return }
    setSubmitting(true); setError('')
    try {
      const result = await submitGuestOrder({ requestKey: requestKey(), table: table!.id, tableAccessKey, guestName: guestName.trim(), phone: phone.trim(), notes: notes.trim(), items: cart.map((item) => ({ category: item.category, name: item.name, quantity: item.quantity, unitPrice: item.price })), website: '' })
      sessionStorage.setItem('mangosteen-active-order', JSON.stringify(result))
      setReceipt(result); setCart([]); setCartOpen(false)
    } catch (submissionError) { setError(submissionError instanceof Error ? submissionError.message : 'The order could not be placed.') }
    finally { setSubmitting(false) }
  }

  if (receipt) return <OrderTracker receipt={receipt} setReceipt={setReceipt} tableSession={tableSession} waiterRequest={waiterRequest} requestWaiter={() => void requestWaiter()}/>

  return <div className="order-menu-shell">
    <header className="order-menu-header"><a className="order-brand" href="/" aria-label="Mangosteen Cafe home"><LeafMark/><span>MANGOSTEEN<small>TABLE MENU · INDORE</small></span></a><div className={`order-table-button${canOrder ? '' : ' is-missing'}`}><span>{canOrder ? 'Serving' : 'Explore'}</span><strong>{canOrder ? tableSession!.table.label : 'Menu'}</strong></div></header>

    <section className={`order-menu-intro${canOrder ? ' has-table' : ' is-preview'}`}><div className="order-menu-intro-copy"><p className="order-kicker">{canOrder ? `${tableSession!.table.label.toUpperCase()} · DINE-IN MENU` : 'MANGOSTEEN MENU'}</p><h1>Order from<br/><em>your table.</em></h1><p>{canOrder ? 'Browse the menu, place your order and follow it from the kitchen to your table.' : 'Explore the menu. Scan the dedicated QR printed on your table to order.'}</p><div className="order-menu-intro-actions"><a href="#order-menu-content">View the menu</a><span>{menuCount} dishes · {menuCatalog.length} sections</span></div></div><div className="order-menu-visual"><img className="order-menu-visual-main" src="/images/menu-ai/pizza-pide.webp" alt="" fetchPriority="high"/><img className="order-menu-visual-accent" src="/images/menu-ai/mocktails.webp" alt=""/><div className="order-menu-table-card"><small>{canOrder ? 'ORDERING FOR' : 'MENU PREVIEW'}</small><strong>{tableSession?.table.label ?? 'Mangosteen'}</strong><span>{canOrder ? `${tableSession!.table.zoneName} · ${tableSession!.table.capacity} seats` : `${menuCount} dishes · ${menuCatalog.length} chapters`}</span></div></div></section>

    {canOrder && <section className="table-quick-services"><div><p className="order-kicker">AT YOUR TABLE</p><h2>How can we help?</h2></div><button type="button" onClick={() => void requestWaiter()} disabled={waiterRequest?.status === 'Open'}><span>⌁</span><span><strong>{waiterRequest?.status === 'Acknowledged' ? 'Team member coming' : waiterRequest?.status === 'Open' ? 'Waiter notified' : 'Request waiter'}</strong><small>Notify the floor team</small></span></button><button type="button" onClick={() => void navigator.clipboard?.writeText(tableSession!.wifi.password)}><span>⌁</span><span><strong>Guest Wi-Fi</strong><small>Tap to copy password</small></span></button></section>}
    {!canOrder && <div className="order-table-warning"><strong>{sessionError ? 'QR not verified' : 'Menu preview'}</strong><span>{sessionError || 'To place an order or request service, scan the dedicated QR printed on your physical table.'}</span></div>}

    <div className="order-menu-tools" id="order-menu-start"><label className="order-search"><span>⌕</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by dish or ingredient" aria-label="Search menu"/>{query && <button type="button" onClick={() => setQuery('')}>×</button>}</label><div className="order-filter-row"><nav className="order-categories" aria-label="Menu categories">{menuCatalog.map((entry) => <button key={entry.name} type="button" className={entry.name === category && !query ? 'is-active' : ''} onClick={() => { setCategory(entry.name); setQuery('') }}>{entry.name}</button>)}</nav><div className="order-diet-filter">{([['all','All'],['veg','Veg'],['non-veg','Non-veg']] as const).map(([value,label]) => <button key={value} type="button" className={diet === value ? 'is-active' : ''} onClick={() => setDiet(value)}>{label}</button>)}</div></div></div>

    <main className="order-menu-content" id="order-menu-content">{visibleCategories.map((entry) => <section className="order-category" key={entry.name}><header><div><p>MENU</p><h2>{entry.name}</h2></div><span>{entry.items.length} dishes</span></header><div className="order-dish-grid">{entry.items.map((item) => { const photo = menuPhotoFor(entry.name,item.name); const quantity = quantityFor(item.name,entry.name); const nonVeg = isNonVeg(item); const unavailable = item.available === false; return <article className={`order-dish-card${photo ? ' has-photo' : ''}${unavailable ? ' is-unavailable' : ''}`} key={`${entry.name}-${item.name}`}><button className="dish-detail-hit" type="button" aria-label={`View ${item.name} details`} onClick={() => setSelectedDish({ item, category: entry.name })}/>{photo && <img src={photo.src} alt={photo.alt} loading="lazy"/>}<div className="order-dish-copy"><div className="order-dish-type"><i className={nonVeg ? 'non-veg' : 'veg'}/><span>{nonVeg ? 'Non-veg' : 'Veg'} · {preparationTime(entry.name)}</span></div><h3>{item.name}</h3>{unavailable && <span className="dish-unavailable">Unavailable today</span>}{item.description && <p>{item.description}</p>}<button className="dish-more" type="button" onClick={() => setSelectedDish({ item, category: entry.name })}>View details</button></div><div className="order-dish-actions"><strong>{money(item.price)}</strong>{canOrder && (unavailable ? <button className="order-add" type="button" disabled>Unavailable</button> : quantity ? <div className="order-quantity"><button type="button" onClick={() => changeQuantity({ ...item, category: entry.name, quantity },-1)}>−</button><span>{quantity}</span><button type="button" onClick={() => addItem(item,entry.name)}>+</button></div> : <button className="order-add" type="button" onClick={() => addItem(item,entry.name)}>Add <span>+</span></button>)}</div></article>})}</div></section>)}{!visibleCategories.length && <div className="order-empty"><h2>Nothing here yet</h2><p>Try another section, filter or search term.</p><button type="button" onClick={() => { setQuery(''); setDiet('all') }}>Reset filters</button></div>}<p className="order-menu-disclaimer">Live prices and availability are managed by Mangosteen Café. A 5% service charge is shown at checkout.</p></main>

    {itemCount > 0 && <button className="order-cart-bar" type="button" onClick={() => { setStep('cart'); setError(''); setCartOpen(true) }}><span><i>{itemCount}</i><span>View order</span></span><strong>{money(total)}</strong></button>}

    {selectedDish && <div className="order-sheet-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedDish(null) }}><section className="dish-detail-modal" role="dialog" aria-modal="true"><button className="dish-detail-close" type="button" onClick={() => setSelectedDish(null)}>×</button>{menuPhotoFor(selectedDish.category,selectedDish.item.name) && <img src={menuPhotoFor(selectedDish.category,selectedDish.item.name)!.src} alt=""/>}<div className="dish-detail-copy"><p className="order-kicker">{selectedDish.category}</p><h2>{selectedDish.item.name}</h2>{selectedDish.item.available === false && <span className="dish-unavailable">Unavailable today</span>}<p>{selectedDish.item.description || 'Prepared fresh by the Mangosteen kitchen.'}</p><div className="dish-facts"><span><small>Preparation</small><strong>{preparationTime(selectedDish.category)}</strong></span><span><small>Spice</small><strong>{spiceLevel(selectedDish.item)}</strong></span><span><small>Price</small><strong>{money(selectedDish.item.price)}</strong></span></div>{canOrder && selectedDish.item.available !== false && <button className="order-primary standalone" type="button" onClick={() => { addItem(selectedDish.item,selectedDish.category); setSelectedDish(null) }}>Add to order · {money(selectedDish.item.price)}</button>}</div></section></div>}

    {cartOpen && <div className="order-sheet-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !submitting) setCartOpen(false) }}><section className="order-sheet" role="dialog" aria-modal="true"><header><div><p className="order-kicker">{step === 'cart' ? 'YOUR TABLE' : 'ORDER DETAILS'}</p><h2>{step === 'cart' ? 'Review your order' : 'Who should we serve?'}</h2></div><button type="button" onClick={() => setCartOpen(false)}>×</button></header><div className="order-sheet-body">{step === 'cart' ? <><div className="order-cart-lines">{cart.map((line) => <div className="order-cart-line" key={`${line.category}-${line.name}`}><div><strong>{line.name}</strong><span>{line.category} · {money(line.price)}</span></div><div className="order-quantity"><button type="button" onClick={() => changeQuantity(line,-1)}>−</button><span>{line.quantity}</span><button type="button" onClick={() => changeQuantity(line,1)}>+</button></div><strong>{money(line.price*line.quantity)}</strong></div>)}</div><label className="order-note"><span>Kitchen note <small>Optional</small></span><textarea value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={300} placeholder="Less spicy, allergy note, serve together…"/></label></> : <div className="order-details-form"><div className="order-locked-table"><span>Table from QR</span><strong>{tableSession?.table.label}</strong><small>{tableSession?.table.zoneName} · {tableSession?.table.capacity} seats</small></div><label><span>Guest name</span><input value={guestName} onChange={(event) => setGuestName(event.target.value)} maxLength={60} placeholder="Name for the order"/></label><label><span>Mobile number <small>Optional</small></span><input value={phone} onChange={(event) => setPhone(event.target.value)} maxLength={20} inputMode="tel" placeholder="For order updates"/></label><div className="order-privacy-note">Your details are used only for this table order and the café CRM.</div></div>}{error && <p className="order-error" role="alert">{error}</p>}</div><footer><div className="order-totals"><span>Subtotal <strong>{money(subtotal)}</strong></span><span>Service charge (5%) <strong>{money(serviceCharge)}</strong></span><span>Total <strong>{money(total)}</strong></span></div><div className="order-sheet-actions">{step === 'details' && <button type="button" onClick={() => setStep('cart')}>Back</button>}<button className="order-primary" type="button" disabled={!cart.length || submitting} onClick={() => { setError(''); if (step === 'cart') setStep('details'); else void placeOrder() }}>{submitting ? 'Sending to kitchen…' : step === 'details' ? `Place order · ${money(total)}` : 'Continue'}</button></div></footer></section></div>}
  </div>
}
