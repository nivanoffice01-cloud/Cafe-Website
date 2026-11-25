export type GuestOrderItem = {
  category: string
  name: string
  quantity: number
  unitPrice: number
}

export type GuestOrder = {
  requestKey: string
  table: string
  tableAccessKey: string
  guestName: string
  phone: string
  notes: string
  items: GuestOrderItem[]
  payment: {
    status: 'Paid'
    method: 'UPI' | 'Card'
    reference: string
    mode: 'Demo'
  }
  website: string
}

export type PublicOrderStatus = 'Kitchen' | 'Preparing' | 'Ready' | 'Served' | 'Paid'

export type GuestOrderReceipt = {
  id: number
  reference: string
  publicToken: string
  status: PublicOrderStatus
  total: number
  subtotal: number
  serviceCharge: number
  tableLabel: string
  guestName: string
  paymentMethod: string
  prepaid: boolean
  paymentPreference: string
  billRequestedAt: string | null
  createdAt: string
  readyAt: string | null
  servedAt: string | null
  paidAt: string | null
  estimatedMinutes: number
  items: Array<{ name: string; quantity: number; lineTotal: number }>
}

const crmBaseUrl = (import.meta.env.VITE_CRM_API_URL || '/crm-api').replace(/\/$/, '')

export type TableSession = {
  table: { id: string; label: string; capacity: number; zoneName: string }
  wifi: { name: string; password: string; demo: boolean }
}

export type ServiceRequestReceipt = { token: string; status: 'Open' | 'Acknowledged'; acknowledgedAt: string | null }

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 12_000)
  try {
    const response = await fetch(`${crmBaseUrl}${path}`, { ...init, signal: controller.signal })
    const payload = await response.json().catch(() => ({})) as T & { error?: string }
    if (!response.ok) throw new Error(payload.error || 'The café could not receive this order right now.')
    return payload
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('The café did not respond in time. Please try again.')
    }
    throw error
  } finally {
    window.clearTimeout(timeout)
  }
}

export const getTableSession = (table: string, key: string) => requestJson<TableSession>(`/api/public/table?table=${encodeURIComponent(table)}&key=${encodeURIComponent(key)}`)

export async function submitGuestOrder(order: GuestOrder): Promise<GuestOrderReceipt> {
  const payload = await requestJson<GuestOrderReceipt>('/api/public/orders', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': order.requestKey }, body: JSON.stringify(order),
  })
  if (!payload.reference || !payload.id || !payload.publicToken) throw new Error('The café returned an incomplete order receipt.')
  return payload
}

export const getGuestOrder = (token: string) => requestJson<GuestOrderReceipt>(`/api/public/orders/${encodeURIComponent(token)}`)

export const requestTableService = (payload: { type: 'waiter'; table: string; tableAccessKey: string } | { type: 'bill'; orderToken: string; paymentPreference: string }) => requestJson<ServiceRequestReceipt>('/api/public/service-requests', {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
})

export const getTableService = (token: string) => requestJson<Pick<ServiceRequestReceipt, 'status' | 'acknowledgedAt'>>(`/api/public/service-requests/${encodeURIComponent(token)}`)

export const submitTableFeedback = (payload: { orderToken: string; rating: number; tags: string[]; message: string }) => requestJson<{ submitted: true; googleReviewUrl: string }>('/api/public/feedback', {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
})
