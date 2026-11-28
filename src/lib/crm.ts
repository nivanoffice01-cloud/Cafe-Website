export type WebsiteReservation = {
  requestKey: string
  name: string
  phone: string
  email: string
  date: string
  time: string
  guests: number
  area: string
  table: string
  seats: string[]
  occasion: string
  specialRequests: string
  consent: boolean
  whatsappConsent: boolean
  website: string
}

export type ReservationReceipt = {
  id: number
  reference: string
  status: 'Pending'
}

const crmBaseUrl = (import.meta.env.VITE_CRM_API_URL || '/crm-api').replace(/\/$/, '')

export async function submitWebsiteReservation(reservation: WebsiteReservation): Promise<ReservationReceipt> {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 12_000)
  try {
    const response = await fetch(`${crmBaseUrl}/api/public/reservations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': reservation.requestKey,
      },
      body: JSON.stringify(reservation),
      signal: controller.signal,
    })
    const payload = await response.json().catch(() => ({})) as Partial<ReservationReceipt> & { error?: string }
    if (!response.ok) throw new Error(payload.error || 'The café could not receive this request right now.')
    if (!payload.reference || !payload.id) throw new Error('The café returned an incomplete reservation receipt.')
    return payload as ReservationReceipt
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('The CRM did not respond in time. Your request has not been sent.')
    }
    throw error
  } finally {
    window.clearTimeout(timeout)
  }
}
