import { useMemo, useState } from 'react'
import { fullMenu, fullMenuCount, type MenuItem } from '../data/fullMenu'
import { menuPhotoFor } from '../data/menuPhotos'
import { orderTableFor } from '../data/seating'
import { submitGuestOrder, type GuestOrderReceipt } from '../lib/orders'

type CartLine = MenuItem & { category: string; quantity: number }
type CheckoutStep = 'cart' | 'details' | 'payment'

const money = (value: number) => `₹${value.toLocaleString('en-IN')}`
const requestKey = () => globalThis.crypto?.randomUUID?.() || `order-${Date.now()}-${Math.random().toString(16).slice(2)}`

function LeafMark() {
  return <svg viewBox="0 0 44 44" aria-hidden="true"><path d="M35 8C20 9 9 18 9 31c7 2 14 0 19-5 5-5 7-11 7-18Z" fill="none" stroke="currentColor" strokeWidth="1.5"/><path d="M11 31c7-6 13-11 23-21" fill="none" stroke="currentColor" strokeWidth="1.5"/></svg>
}

export function OrderMenuPage() {
  const params = useMemo(() => new URLSearchParams(window.location.search), [])
  const table = useMemo(() => orderTableFor(params.get('table')), [params])
  const [category, setCategory] = useState(fullMenu[0].name)
  const [query, setQuery] = useState('')
  const [cart, setCart] = useState<CartLine[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [step, setStep] = useState<CheckoutStep>('cart')
  const [guestName, setGuestName] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'demo-upi' | 'demo-card'>('demo-upi')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [receipt, setReceipt] = useState<GuestOrderReceipt | null>(null)

  const visibleCategories = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return fullMenu.filter((entry) => entry.name === category)
    return fullMenu.map((entry) => ({
      ...entry,
      items: entry.items.filter((item) => `${item.name} ${item.description || ''} ${entry.name}`.toLowerCase().includes(needle)),
    })).filter((entry) => entry.items.length)
  }, [category, query])

  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const serviceCharge = Math.round(subtotal * 0.05)
  const total = subtotal + serviceCharge

  const addItem = (item: MenuItem, itemCategory: string) => {
    setCart((current) => {
      const match = current.find((line) => line.name === item.name && line.category === itemCategory)
      if (match) return current.map((line) => line === match ? { ...line, quantity: Math.min(10, line.quantity + 1) } : line)
      return [...current, { ...item, category: itemCategory, quantity: 1 }]
    })
  }

  const changeQuantity = (line: CartLine, change: number) => {
    setCart((current) => current.flatMap((item) => {
      if (item.name !== line.name || item.category !== line.category) return [item]
      const quantity = item.quantity + change
      return quantity > 0 ? [{ ...item, quantity: Math.min(10, quantity) }] : []
    }))
  }

  const quantityFor = (name: string, itemCategory: string) => cart.find((line) => line.name === name && line.category === itemCategory)?.quantity || 0

  const openCart = () => {
    setStep('cart')
    setError('')
    setCartOpen(true)
  }

  const placeOrder = async () => {
    if (!table) { setError('Scan the QR fixed to your table before placing an order.'); return }
    if (guestName.trim().length < 2) { setStep('details'); setError('Please enter the guest name for this table.'); return }
    setSubmitting(true)
    setError('')
    try {
      const result = await submitGuestOrder({
        requestKey: requestKey(), table: table.id, guestName: guestName.trim(), phone: phone.trim(), notes: notes.trim(), paymentMethod,
        items: cart.map((item) => ({ category: item.category, name: item.name, quantity: item.quantity, unitPrice: item.price })),
        website: '',
      })
      setReceipt(result)
      setCart([])
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'The order could not be placed.')
    } finally {
      setSubmitting(false)
    }
  }

  if (receipt) return <main className="order-success">
    <div className="order-success-mark">✓</div>
    <p className="order-kicker">ORDER RECEIVED</p>
    <h1>Your table is in the kitchen queue.</h1>
    <p>The café CRM received <strong>{receipt.reference}</strong> for <strong>{table?.label}</strong>. A team member can now follow it through preparation.</p>
    <div className="order-success-ticket"><span>Demo payment</span><strong>{receipt.paymentLabel}</strong><span>Total</span><strong>{money(receipt.total)}</strong></div>
    <div className="demo-notice"><strong>Demonstration only</strong><span>No money was transferred and no payment details were collected.</span></div>
    <button type="button" onClick={() => { setReceipt(null); setCartOpen(false); setGuestName(''); setPhone(''); setNotes('') }}>Start another order</button>
    <a href="/">Return to Mangosteen</a>
  </main>

  return <div className="order-menu-shell">
    <header className="order-menu-header">
      <a className="order-brand" href="/" aria-label="Mangosteen Cafe home"><LeafMark/><span>MANGOSTEEN<small>TABLE MENU · INDORE</small></span></a>
      <div className={`order-table-button${table ? '' : ' is-missing'}`}><span>{table ? 'Serving' : 'Preview'}</span><strong>{table ? `${table.label} · ${table.id}` : 'No table QR'}</strong></div>
    </header>

    <section className={`order-menu-intro${table ? ' has-table' : ' is-preview'}`}>
      <div className="order-menu-intro-copy">
        <p className="order-kicker">{table ? `${table.label.toUpperCase()} · YOUR EVENING` : 'THE MANGOSTEEN MENU'}</p>
        <h1>Choose slowly.<br/><em>Stay a while.</em></h1>
        <p>{table ? 'Explore the menu, add what feels right, and send everything straight to the kitchen when you are ready.' : 'A table-side look at the Mangosteen menu. Scan the dedicated QR at your table when you are ready to order.'}</p>
        <div className="order-menu-intro-actions"><a href="#order-menu-content">Explore the menu</a><span>{fullMenuCount} dishes · 13 chapters</span></div>
      </div>
      <div className="order-menu-visual">
        <img className="order-menu-visual-main" src="/images/menu-ai/pizza-pide.webp" alt="" fetchPriority="high" decoding="async"/>
        <img className="order-menu-visual-accent" src="/images/menu-ai/mocktails.webp" alt="" fetchPriority="high" decoding="async"/>
        <div className="order-menu-table-card"><small>{table ? 'ORDERING FOR' : 'MENU PREVIEW'}</small><strong>{table?.label ?? 'Mangosteen'}</strong><span>{table ? `${table.zoneName} · ${table.capacity} seats` : `${fullMenuCount} dishes · 13 chapters`}</span></div>
      </div>
    </section>

    {!table && <div className="order-table-warning"><strong>Menu preview</strong><span>To place an order, scan the dedicated QR printed on your physical table. The table number is locked into that QR.</span></div>}

    <div className="order-menu-tools" id="order-menu-start">
      <label className="order-search"><span aria-hidden="true">⌕</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search dishes or ingredients" aria-label="Search menu"/>{query && <button type="button" onClick={() => setQuery('')} aria-label="Clear search">×</button>}</label>
      {!query && <nav className="order-categories" aria-label="Menu categories">{fullMenu.map((entry) => <button key={entry.name} type="button" className={entry.name === category ? 'is-active' : ''} onClick={() => setCategory(entry.name)}>{entry.name}</button>)}</nav>}
    </div>

    <main className="order-menu-content" id="order-menu-content">
      {visibleCategories.map((entry) => <section className="order-category" key={entry.name}>
        <header><div><p>FROM THE KITCHEN</p><h2>{entry.name}</h2></div><span>{entry.items.length} items</span></header>
        <div className="order-dish-grid">{entry.items.map((item) => {
          const photo = menuPhotoFor(entry.name, item.name)
          const quantity = quantityFor(item.name, entry.name)
          const likelyNonVeg = /chicken|fish|prawn|egg|pepperoni/i.test(`${item.name} ${item.description || ''}`)
          return <article className={`order-dish-card${photo ? ' has-photo' : ''}`} key={`${entry.name}-${item.name}`}>
            {photo && <img src={photo.src} alt={photo.alt} loading="lazy" decoding="async"/>}
            <div className="order-dish-copy"><div className="order-dish-type"><i className={likelyNonVeg ? 'non-veg' : 'veg'}/><span>{likelyNonVeg ? 'Non-veg' : 'Veg'}</span></div><h3>{item.name}</h3>{item.description && <p>{item.description}</p>}<strong>{money(item.price)}</strong></div>
            {quantity ? <div className="order-quantity" aria-label={`${item.name} quantity`}><button type="button" onClick={() => changeQuantity({ ...item, category: entry.name, quantity }, -1)} aria-label={`Remove one ${item.name}`}>−</button><span>{quantity}</span><button type="button" onClick={() => addItem(item, entry.name)} aria-label={`Add another ${item.name}`}>+</button></div> : <button className="order-add" type="button" disabled={!table} onClick={() => addItem(item, entry.name)}>{table ? <>Add <span>+</span></> : 'Scan table QR'}</button>}
          </article>
        })}</div>
      </section>)}
      {!visibleCategories.length && <div className="order-empty"><h2>No dishes found</h2><p>Try a category or a different ingredient.</p><button type="button" onClick={() => setQuery('')}>Clear search</button></div>}
      <p className="order-menu-disclaimer">Demo menu. Prices and availability should be confirmed by Mangosteen Café before public use. A 5% demo service charge is shown at checkout.</p>
    </main>

    {itemCount > 0 && <button className="order-cart-bar" type="button" onClick={openCart}><span><i>{itemCount}</i><span>View order</span></span><strong>{money(total)}</strong></button>}

    {cartOpen && <div className="order-sheet-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !submitting) setCartOpen(false) }}>
      <section className="order-sheet" role="dialog" aria-modal="true" aria-labelledby="order-sheet-title">
        <header><div><p className="order-kicker">{step === 'cart' ? 'YOUR TABLE' : step === 'details' ? 'ORDER DETAILS' : 'DEMO CHECKOUT'}</p><h2 id="order-sheet-title">{step === 'cart' ? 'Review your order' : step === 'details' ? 'Who should we serve?' : 'Choose a demo payment'}</h2></div><button type="button" onClick={() => setCartOpen(false)} aria-label="Close order">×</button></header>
        <div className="order-sheet-body">
          {step === 'cart' && <>
            <div className="order-cart-lines">{cart.map((line) => <div className="order-cart-line" key={`${line.category}-${line.name}`}><div><strong>{line.name}</strong><span>{line.category} · {money(line.price)}</span></div><div className="order-quantity"><button type="button" onClick={() => changeQuantity(line, -1)}>−</button><span>{line.quantity}</span><button type="button" onClick={() => changeQuantity(line, 1)}>+</button></div><strong>{money(line.price * line.quantity)}</strong></div>)}</div>
            <label className="order-note"><span>Kitchen note <small>Optional</small></span><textarea value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={300} placeholder="Less spicy, allergy note, serve together…"/></label>
          </>}
          {step === 'details' && <div className="order-details-form"><div className="order-locked-table"><span>Table from QR</span><strong>{table?.label} · {table?.id}</strong><small>{table?.zoneName} · {table?.capacity} seats</small></div><label><span>Guest name</span><input value={guestName} onChange={(event) => setGuestName(event.target.value)} maxLength={60} autoComplete="name" placeholder="Name for the order"/></label><label><span>Mobile number <small>Optional for this demo</small></span><input value={phone} onChange={(event) => setPhone(event.target.value)} maxLength={20} inputMode="tel" autoComplete="tel" placeholder="For order updates"/></label><div className="order-privacy-note">Your details are used only for this demo order and the café CRM.</div></div>}
          {step === 'payment' && <div className="demo-payment"><div className="demo-notice"><strong>Demo payment—no money will move</strong><span>Do not enter a real card number, UPI PIN, OTP or bank information.</span></div><label className={paymentMethod === 'demo-upi' ? 'is-selected' : ''}><input type="radio" name="payment" checked={paymentMethod === 'demo-upi'} onChange={() => setPaymentMethod('demo-upi')}/><span className="payment-icon">UPI</span><span><strong>Demo UPI</strong><small>Simulated instant payment</small></span><i>✓</i></label><label className={paymentMethod === 'demo-card' ? 'is-selected' : ''}><input type="radio" name="payment" checked={paymentMethod === 'demo-card'} onChange={() => setPaymentMethod('demo-card')}/><span className="payment-icon">••••</span><span><strong>Demo card</strong><small>No card details required</small></span><i>✓</i></label></div>}
          {error && <p className="order-error" role="alert">{error}</p>}
        </div>
        <footer><div className="order-totals"><span>Subtotal <strong>{money(subtotal)}</strong></span><span>Demo service charge (5%) <strong>{money(serviceCharge)}</strong></span><span>Total <strong>{money(total)}</strong></span></div><div className="order-sheet-actions">{step !== 'cart' && <button type="button" onClick={() => { setError(''); setStep(step === 'payment' ? 'details' : 'cart') }}>Back</button>}<button className="order-primary" type="button" disabled={!cart.length || submitting} onClick={() => { setError(''); if (step === 'cart') setStep('details'); else if (step === 'details') { if (guestName.trim().length < 2) setError('Please enter the guest name for this table.'); else setStep('payment') } else void placeOrder() }}>{submitting ? 'Sending to the kitchen…' : step === 'payment' ? `Pay ${money(total)} & place order` : 'Continue'}</button></div></footer>
      </section>
    </div>}
  </div>
}
