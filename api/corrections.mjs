import { randomUUID } from 'node:crypto'
import { orderIsPaid } from './floor.mjs'

const paise = value => Math.round(Number(value) * 100)
const stamp = () => new Date().toISOString()
const fail = message => { throw Object.assign(new Error(message), { status: 409 }) }
const actor = user => ({ id: user.id, name: user.name })
export const correctionRoles = ['Owner', 'Manager', 'Cashier']
export const activeCorrection = (state, orderId) => (state.corrections || []).find(r => r.orderId === orderId &&
  (r.status === 'Pending' || (r.type === 'refund' && r.status === 'Approved')))

function amountInPaise(value) {
  if (!/^\d{1,8}(\.\d{1,2})?$/.test(String(value)) || paise(value) <= 0) fail('Enter a positive amount with at most two decimal places.')
  return paise(value)
}

function refundDetails(state, order, except) {
  const payments = (state.payments || []).filter(p => Number(p.orderId) === order.id && Number(p.amount) > 0)
  const settled = payments.reduce((sum, p) => sum + paise(p.amount), 0)
  const method = payments[0]?.method || order.paymentMethod
  const demo = order.paymentDemo === true || /^demo\b/i.test(method || '')
  const original = settled || paise(order.total)
  const used = (state.corrections || []).filter(r => r.id !== except && r.orderId === order.id && r.type === 'refund' && ['Approved','Refund recorded','Demo refund recorded'].includes(r.status))
    .reduce((sum, r) => sum + paise(r.amount), 0)
  return { method, demo, refundable: Math.max(0, original - used) }
}

function validate(state, order, record) {
  if (!order || order.status === 'Cancelled') fail('This order is no longer eligible for a correction.')
  if (record.type === 'refund') {
    if (!orderIsPaid(order)) fail('Only paid orders can be refunded.')
    const details = refundDetails(state, order, record.id)
    if (!details.method || paise(record.amount) > details.refundable) fail('Refund exceeds the remaining recorded payment or the payment method is missing.')
    return details
  }
  if (orderIsPaid(order)) fail('This order is paid. Request a refund instead.')
  if (record.type === 'cancel') {
    if (!['Draft','Kitchen','Preparing','Ready'].includes(order.status)) fail('Items can only be cancelled before the order is served.')
    const item = order.items.find(i => String(i.id) === record.itemId)
    if (!item || record.quantity > item.quantity) fail('The item quantity changed. Submit a fresh request.')
    return item
  }
  if (paise(record.amount) > paise(order.total)) fail('Discount exceeds the current bill.')
}

export function requestCorrection(state, body, user) {
  state.corrections ||= []
  const key = String(body.requestKey || '')
  if (key && !/^[\w-]{8,100}$/.test(key)) fail('Invalid request key.')
  const previous = key && state.corrections.find(r => r.requestKey === key && r.requestedBy.id === user.id)
  if (previous) return previous
  const orderId = Number(body.orderId)
  const order = state.orders.find(o => o.id === orderId)
  if (!order) fail('Order not found.')
  if (activeCorrection(state, orderId)) fail('Finish the current correction before starting another one on this order.')
  const type = String(body.type || '')
  const reason = String(body.reason || '').trim()
  if (!['cancel','discount','refund'].includes(type)) fail('Choose a correction type.')
  if (reason.length < 3 || reason.length > 300) fail('Enter a reason of 3–300 characters.')
  const record = { id:randomUUID(), requestKey:key, orderId, table:order.tableLabel || order.table, type, reason,
    status:'Pending', requestedAt:stamp(), requestedBy:actor(user), originalTotal:order.total }
  if (type === 'cancel') {
    record.itemId = String(body.itemId || '')
    record.quantity = Number(body.quantity)
    if (!Number.isSafeInteger(record.quantity) || record.quantity < 1) fail('Enter a whole item quantity of at least one.')
  } else record.amount = amountInPaise(body.amount) / 100
  const details = validate(state, order, record)
  if (type === 'cancel') record.itemName = details.name
  if (type === 'refund') { record.method = details.method; record.demo = details.demo }
  state.corrections.unshift(record)
  return record
}

export function reviewCorrection(state, id, action, body, user) {
  const record = (state.corrections || []).find(r => r.id === id)
  if (!record) fail('Correction request not found.')
  const order = state.orders.find(o => o.id === record.orderId)
  if (action === 'record') {
    if (['Refund recorded','Demo refund recorded'].includes(record.status)) return record
    if (record.type !== 'refund' || record.status !== 'Approved') fail('A manager must approve the refund before it can be recorded.')
    const details = validate(state, order, record)
    if (details.method !== record.method || details.demo !== record.demo) fail('The payment details changed. Review the refund with a manager.')
    const reference = String(body.reference || '').trim()
    if (!record.demo && record.method !== 'Cash' && (reference.length < 3 || reference.length > 100)) fail('Enter the completed refund reference.')
    if (!record.demo && record.method !== 'Cash' && state.corrections.some(r => r.status === 'Refund recorded' && r.method === record.method && r.reference?.toLowerCase() === reference.toLowerCase())) fail('This refund reference has already been recorded.')
    if (body.confirmed !== true) fail('Confirm the refund has been handled.')
    return Object.assign(record, { status:record.demo ? 'Demo refund recorded' : 'Refund recorded',
      reference:reference.slice(0,100), recordedAt:stamp(), recordedBy:actor(user) })
  }
  if (!['approve','reject'].includes(action) || record.status !== 'Pending') fail('This request has already been reviewed.')
  if (record.requestedBy.id === user.id && action === 'approve') fail('Ask another manager or owner to approve your request.')
  const reviewNote = String(body.note || '').trim().slice(0,300)
  if (action === 'reject' && reviewNote.length < 3) fail('Enter a reason for rejecting the request.')
  if (action === 'approve') {
    const details = validate(state, order, record)
    if (paise(order.total) !== paise(record.originalTotal)) fail('The bill changed. Reject this request and submit a fresh one.')
    if (record.type === 'refund') {
      record.method = details.method
      record.demo = details.demo
    } else if (record.type === 'discount') {
      order.discountAmount = (paise(order.discountAmount || 0) + paise(record.amount)) / 100
      order.total = (paise(order.total) - paise(record.amount)) / 100
    } else {
      record.sentToKitchen = Boolean(order.sentAt)
      order.cancelledItems ||= []
      order.cancelledItems.push({ name:details.name, quantity:record.quantity })
      const previousSubtotal = paise(order.subtotal)
      details.quantity -= record.quantity
      details.lineTotal = paise(details.unitPrice * details.quantity) / 100
      order.items = order.items.filter(i => i.quantity > 0)
      const subtotal = order.items.reduce((sum,i) => sum + paise(i.unitPrice * i.quantity), 0)
      const charge = paise(order.serviceCharge || 0)
      const originalCharge = order.correctionChargeBasis ||= { charge, subtotal:previousSubtotal }
      const newCharge = order.tableCode && originalCharge.charge > 0
        ? Math.round(subtotal / 2000) * 100
        : originalCharge.subtotal > 0 ? Math.round(originalCharge.charge * subtotal / originalCharge.subtotal) : 0
      const discount = Math.min(paise(order.discountAmount || 0), subtotal + newCharge)
      Object.assign(order, { subtotal:subtotal/100, serviceCharge:newCharge/100,
        discountAmount:discount/100, total:(subtotal+newCharge-discount)/100 })
      if (!order.items.length) order.status = 'Cancelled'
    }
    record.updatedTotal = order.total
  }
  return Object.assign(record, { status:action === 'approve' ? 'Approved' : 'Rejected', reviewNote, reviewedAt:stamp(), reviewedBy:actor(user) })
}

export function kitchenCorrections(state, role, clock = Date.now()) {
  if (!['Owner','Manager','Kitchen'].includes(role)) return []
  return (state.corrections || []).filter(r => r.type === 'cancel' && r.status === 'Approved' && r.sentToKitchen && clock - Date.parse(r.reviewedAt) <= 900000)
    .slice(0, 8).map(({ id,orderId,table,itemName,quantity,reviewedAt }) => ({ id,orderId,table,itemName,quantity,reviewedAt }))
}
