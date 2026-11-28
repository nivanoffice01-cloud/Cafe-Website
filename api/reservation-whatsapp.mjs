import { createHash } from 'node:crypto'

export function whatsappConfig(env = process.env) {
  const phoneId = env.MANGOSTEEN_WHATSAPP_PHONE_ID?.trim()
  const token = env.MANGOSTEEN_WHATSAPP_TOKEN?.trim()
  const name = env.MANGOSTEEN_WHATSAPP_RESERVATION_TEMPLATE?.trim()
  const language = env.MANGOSTEEN_WHATSAPP_TEMPLATE_LANGUAGE?.trim() || 'en'
  const version = env.MANGOSTEEN_WHATSAPP_GRAPH_VERSION?.trim() || 'v25.0'
  return phoneId && /^\d+$/.test(phoneId) && token && name && /^[a-z0-9_]+$/.test(name)
    && /^[a-z]{2,3}(?:_[A-Z]{2})?$/.test(language) && /^v\d+\.0$/.test(version)
    ? { phoneId, token, name, language, version } : null
}

function recipient(phone) {
  if (!/^\+?[0-9 ()-]+$/.test(phone)) return ''
  let digits = phone.replace(/\D/g, '')
  if (phone.startsWith('+')) return /^[1-9]\d{7,14}$/.test(digits) ? digits : ''
  if (digits.startsWith('00')) {
    digits = digits.slice(2)
    return /^[1-9]\d{7,14}$/.test(digits) ? digits : ''
  }
  return /^(?:0|91)?[6-9]\d{9}$/.test(digits) ? `91${digits.slice(-10)}` : ''
}

export function prepareConfirmation(reservation, config) {
  const prior = reservation.whatsappConfirmation
  if (prior && !['not_configured', 'no_consent', 'invalid_phone', 'failed'].includes(prior.status)) return null
  const to = recipient(reservation.phone)
  const status = !reservation.whatsappConsent ? 'no_consent' : !to ? 'invalid_phone' : !config ? 'not_configured' : 'sending'
  reservation.whatsappConfirmation = {
    status, at: new Date().toISOString(), attempt: (prior?.attempt || 0) + Number(status === 'sending'),
  }
  if (status !== 'sending') return null
  const key = createHash('sha256').update(JSON.stringify([reservation.id, reservation.createdAt, reservation.whatsappConfirmation.attempt])).digest('hex')
  return { key: `reservation-whatsapp:${key}`, to }
}

export async function sendConfirmation(reservation, to, config) {
  const { name, language, phoneId, token, version } = config
  const date = new Intl.DateTimeFormat('en-IN', { dateStyle:'medium', timeZone:'Asia/Kolkata' }).format(new Date(`${reservation.date}T12:00:00+05:30`))
  const time = new Intl.DateTimeFormat('en-IN', { hour:'numeric', minute:'2-digit', hour12:true, timeZone:'Asia/Kolkata' }).format(new Date(`${reservation.date}T${reservation.time}:00+05:30`))
  const params = [reservation.name, date, time, String(reservation.guests), `MG-${String(reservation.id).padStart(6, '0')}`]
  try {
    const response = await fetch(`https://graph.facebook.com/${version}/${phoneId}/messages`, {
      method:'POST',
      headers:{ Authorization:`Bearer ${token}`, 'Content-Type':'application/json' },
      body: JSON.stringify({
        messaging_product:'whatsapp', to, type:'template',
        template:{ name, language:{ code:language },
          components:[{ type:'body', parameters:params.map(text => ({ type:'text', text:text.replace(/\s+/g, ' ').trim() })) }] },
      }),
      signal: AbortSignal.timeout(6000),
    })
    const result = await response.json().catch(() => ({}))
    const messageId = result.messages?.[0]?.id
    if (response.ok && typeof messageId === 'string' && messageId) return { status:'submitted', messageId }
    if (response.status >= 400 && response.status < 500 && result.error) return { status:'failed' }
  } catch { /* A timeout can occur after Meta accepted the request. */ }
  return { status:'unverified' }
}
