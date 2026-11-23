export type GuestOrderItem = {
  category: string
  name: string
  quantity: number
  unitPrice: number
}

export type GuestOrder = {
  requestKey: string
  table: string
  guestName: string
  phone: string
  notes: string
  paymentMethod: 'demo-upi' | 'demo-card'
  items: GuestOrderItem[]
  website: string
}

export type GuestOrderReceipt = {
  id: number
  reference: string
  status: 'Kitchen'
  total: number
  paymentLabel: string
}

const crmBaseUrl = (import.meta.env.VITE_CRM_API_URL || '/crm-api').replace(/\/$/, '')

export async function submitGuestOrder(order: GuestOrder): Promise<GuestOrderReceipt> {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 12_000)
  try {
    const response = await fetch(`${crmBaseUrl}/api/public/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': order.requestKey,
      },
      body: JSON.stringify(order),
      signal: controller.signal,
    })
    const payload = await response.json().catch(() => ({})) as Partial<GuestOrderReceipt> & { error?: string }
    if (!response.ok) throw new Error(payload.error || 'The café could not receive this order right now.')
    if (!payload.reference || !payload.id) throw new Error('The café returned an incomplete order receipt.')
    return payload as GuestOrderReceipt
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('The café did not respond in time. Your order was not placed.')
    }
    throw error
  } finally {
    window.clearTimeout(timeout)
  }
}
