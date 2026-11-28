import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import vm from 'node:vm'
import * as crypto from 'node:crypto'
import { dayInIndia } from './floor.mjs'

test('hosted routes authenticate, persist visits and validate conflicts and stale edits', async () => {
  const blobs = new Map()
  const blob = {
    get: async path => blobs.has(path) ? { stream: new Response(blobs.get(path)).body } : null,
    put: async (path, value, options) => {
      if (!options.allowOverwrite && blobs.has(path)) throw new Error('Blob already exists')
      blobs.set(path, value)
    },
  }
  const env = {}, messages = []
  let providerStatus = 200
  const context = vm.createContext({ console: { error() {} }, Request, Response, Headers, URL, Buffer, AbortSignal, process: { env },
    fetch: async (url, options) => {
      const payload = JSON.parse(options.body)
      messages.push({ url, payload })
      const reference = payload.template.components[0].parameters[4].text
      const id = Number(reference.slice(3))
      const stored = JSON.parse(blobs.get('mangosteen-crm/production-state-v1.json'))
      assert.equal(stored.reservations.find(r => r.id === id).status, 'Confirmed')
      return Response.json(providerStatus === 200 ? { messages:[{ id:'wamid.test-confirmation' }] } : { error:{ code:132001 } }, { status:providerStatus })
    },
  })
  const cache = new Map()
  async function load(id) {
    if (cache.has(id)) return cache.get(id)
    let module
    if (id === '@vercel/blob' || id === 'node:crypto') {
      const exports = id === '@vercel/blob' ? blob : crypto
      module = new vm.SyntheticModule(Object.keys(exports), function () { for (const [key, value] of Object.entries(exports)) this.setExport(key, value) }, { context, identifier: id })
    } else module = new vm.SourceTextModule(await readFile(new URL(id), 'utf8'), { context, identifier: id })
    cache.set(id, module)
    await module.link((specifier, source) => load(specifier.startsWith('.') ? new URL(specifier, source.identifier).href : specifier))
    return module
  }
  const module = await load(new URL('./index.mjs', import.meta.url).href)
  await module.evaluate()
  const handle = module.namespace.default.fetch
  let cookie = ''
  async function request(path, body, authenticated = true) {
    const response = await handle(new Request(`https://demo.local/api${path}`, { method: body ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json', ...(authenticated ? { Cookie: cookie } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) }))
    return { code: response.status, payload: await response.json(), cookie: response.headers.get('set-cookie') }
  }
  const login = await request('/auth/login', { email: 'owner@mangosteen.local', password: 'Mangosteen@123' })
  cookie = login.cookie.split(';')[0]
  assert.equal((await request('/tables/R1', { action: 'seat', name: 'Denied', guests: 2 }, false)).code, 401)
  const body = { name: 'Hosted Guest', phone: '9876543210', date: dayInIndia(), time: '19:00', guests: 2, tableId: 'R1', status: 'Confirmed' }
  const created = await request('/reservations', body)
  assert.equal(created.code, 200)
  assert.equal((await request('/reservations', body)).code, 409)
  assert.equal((await request(`/reservations/${created.payload.id}/status`, { status: 'Checked in' })).code, 200)
  let bootstrap = (await request('/bootstrap')).payload
  assert.equal(bootstrap.tables.find(t => t.id === 'R1').session.name, 'Hosted Guest')
  assert.equal((await request('/tables/R1', { action: 'checkout' })).code, 200)
  assert.equal((await request('/tables/R1', { action: 'available' })).code, 200)
  assert.equal((await request('/tables/R3', { action: 'seat', name: 'Party One', guests: 2 })).code, 200)
  assert.equal((await request('/tables/R3', { action: 'seat', name: 'Party Two', guests: 2 })).code, 409)
  const editable = await request('/reservations', { ...body, tableId: 'R2', status: 'Pending' })
  assert.equal((await request(`/reservations/${editable.payload.id}/edit`, { ...body, tableId: 'R2', revision: 999 })).code, 409)
  bootstrap = (await request('/bootstrap')).payload
  assert.equal(bootstrap.tables.find(t => t.id === 'R3').status, 'Occupied')
  assert.equal(bootstrap.reservations.find(r => r.id === created.payload.id).status, 'Completed')
  assert.equal((await request('/waitlist', { name:'No Access',guests:2,estimatedWait:15 }, false)).code,401)
  const waiting = await request('/waitlist', { name:'Hosted Walkin',guests:2,estimatedWait:15,requestKey:'hosted-walkin-123' })
  assert.equal(waiting.code,200)
  assert.equal((await request('/bootstrap')).payload.waitlist.length,1)
  assert.equal((await request(`/waitlist/${waiting.payload.id}`,{action:'seat',tableId:'R3'})).code,409)
  assert.equal((await request('/bootstrap')).payload.waitlist[0].status,'Waiting')
  assert.equal((await request(`/waitlist/${waiting.payload.id}`,{action:'seat',tableId:'G1'})).code,200)
  bootstrap=(await request('/bootstrap')).payload
  assert.equal(bootstrap.waitlist[0].status,'Seated')
  assert.equal(bootstrap.tables.find(t=>t.id==='G1').session.waitlistId,waiting.payload.id)
  const ownerCookie=cookie
  const draft=await request('/orders',{table:'Table 4',items:[{menuItemId:1,quantity:1}]})
  const orderId=draft.payload.id
  assert.equal((await request(`/orders/${orderId}/status`,{status:'Ready'})).code,409)

  const managerLogin = await request('/auth/login', { email:'manager@mangosteen.local', password:'Mangosteen@123' })
  const managerCookie = managerLogin.cookie.split(';')[0]
  const tomorrow = new Date(Date.parse(`${dayInIndia()}T00:00:00Z`) + 86400000).toISOString().slice(0, 10)
  const website = { name:'WhatsApp Guest', phone:'09876543210', date:tomorrow, time:'19:00', guests:2,
    table:'Railside 01', area:'Rooftop', seats:['1','2'], requestKey:'whatsapp-test-1', whatsappConsent:true }
  const booking = await request('/public/reservations', website, false)
  const bookingPath = `/reservations/${booking.payload.id}`
  assert.equal(booking.payload.status, 'Pending')
  assert.equal(messages.length, 0)
  assert.equal((await request(`${bookingPath}/whatsapp-confirmation`, {})).code, 409)
  cookie = managerCookie
  const setupRequired = await request(`${bookingPath}/status`, { status:'Confirmed', revision:1 })
  assert.equal(setupRequired.payload.whatsappConfirmation.status, 'not_configured')
  assert.equal(messages.length, 0)
  Object.assign(env, { MANGOSTEEN_WHATSAPP_PHONE_ID:'123456', MANGOSTEEN_WHATSAPP_TOKEN:'mock-token', MANGOSTEEN_WHATSAPP_RESERVATION_TEMPLATE:'reservation_confirmed' })
  providerStatus = 400
  assert.equal((await request(`${bookingPath}/whatsapp-confirmation`, {})).payload.whatsappConfirmation.status, 'failed')
  providerStatus = 200
  assert.equal((await request(`${bookingPath}/whatsapp-confirmation`, {})).payload.whatsappConfirmation.status, 'submitted')
  assert.equal((await request(`${bookingPath}/whatsapp-confirmation`, {})).payload.whatsappConfirmation.status, 'submitted')
  assert.equal((await request(`${bookingPath}/status`, { status:'Confirmed', revision:1 })).code, 409)
  assert.equal(messages.length, 2)
  assert.equal(messages[1].url, 'https://graph.facebook.com/v25.0/123456/messages')
  assert.equal(messages[1].payload.to, '919876543210')
  assert.equal(messages[1].payload.template.name, 'reservation_confirmed')
  assert.equal(messages[1].payload.template.components[0].parameters[4].text, booking.payload.reference)
  assert.equal((await request('/bootstrap')).payload.reservations.find(r => r.id === booking.payload.id).whatsappConfirmation.status, 'submitted')
  const noOptIn = await request('/public/reservations', { ...website, requestKey:'whatsapp-test-2',
    whatsappConsent:false, consent:true, table:'Railside 02' }, false)
  assert.equal((await request(`/reservations/${noOptIn.payload.id}/status`, { status:'Confirmed', revision:1 })).payload.whatsappConfirmation.status, 'no_consent')
  const automatic = await request('/public/reservations', { ...website, requestKey:'whatsapp-test-3', table:'Railside 03' }, false)
  assert.equal((await request(`/reservations/${automatic.payload.id}/status`, { status:'Confirmed', revision:1 })).payload.whatsappConfirmation.status, 'submitted')
  assert.equal(messages.length, 3)
  cookie = ownerCookie
  const order = await request('/orders', { table:'Correction test', items:[{menuItemId:1,quantity:2}] })
  await request(`/orders/${order.payload.id}/send`, {})
  const sold = (await request('/bootstrap')).payload.orders.find(o => o.id === order.payload.id)
  const cancellation = await request('/corrections', { orderId:sold.id, type:'cancel', itemId:sold.items[0].id, quantity:1, reason:'Guest changed order' })
  assert.equal(cancellation.code, 201)
  assert.equal((await request(`/corrections/${cancellation.payload.id}/approve`, {})).code, 409)
  assert.equal((await request(`/orders/${sold.id}/pay`, {method:'UPI'})).code, 409)
  cookie = managerCookie
  assert.equal((await request(`/corrections/${cancellation.payload.id}/approve`, {})).code, 200)
  assert((await request('/service/alerts')).payload.cancellations.some(c => c.orderId === sold.id))
  assert.equal((await request(`/orders/${sold.id}/pay`, {method:'UPI',expectedTotal:360})).code, 409)
  cookie = ownerCookie
  const discount = await request('/corrections', {orderId:sold.id,type:'discount',amount:'10.50',reason:'Service recovery'})
  cookie = managerCookie
  assert.equal((await request(`/corrections/${discount.payload.id}/approve`, {})).code, 200)
  assert.equal((await request(`/orders/${sold.id}/pay`, {method:'UPI',expectedTotal:169.50})).payload.amount,169.50)
  cookie = ownerCookie
  const refund = await request('/corrections', {orderId:sold.id,type:'refund',amount:'60.25',reason:'Refund agreed with guest'})
  assert.equal((await request(`/corrections/${refund.payload.id}/record`, {confirmed:true,reference:'TEST-1'})).code,409)
  cookie = managerCookie
  assert.equal((await request(`/corrections/${refund.payload.id}/approve`, {})).code,200)
  assert.equal((await request('/bootstrap')).payload.refunds.length,0)
  assert.equal((await request(`/corrections/${refund.payload.id}/record`, {confirmed:true})).code,409)
  const record = {confirmed:true,reference:'TEST-REF-001'}
  assert.equal((await request(`/corrections/${refund.payload.id}/record`, record)).code,200)
  assert.equal((await request(`/corrections/${refund.payload.id}/record`, record)).code,200)
  const after = (await request('/bootstrap')).payload
  assert.equal(after.refunds.length,1)
  assert.equal(after.refunds[0].amount,60.25)
  assert.equal(after.orders.find(o=>o.id===sold.id).total,169.50)
  assert.equal((await request('/corrections', {orderId:sold.id,type:'refund',amount:'110',reason:'Exceeds recorded payment'})).code,409)
  assert.equal((await request(`/orders/${orderId}/send`,{})).code,200)
  const kitchenLogin=await request('/auth/login',{email:'kitchen@mangosteen.local',password:'Mangosteen@123'})
  cookie=kitchenLogin.cookie.split(';')[0]
  assert.equal((await request('/service/alerts')).code,200)
  assert.equal((await request(`/orders/${orderId}/status`,{status:'Preparing'})).code,200)
  assert.equal((await request(`/orders/${orderId}/status`,{status:'Ready'})).code,200)
  assert.equal((await request(`/service/orders/${orderId}/accept`,{})).code,403)
  cookie=ownerCookie
  assert.equal((await request('/users',{name:'Floor QA',email:'floorqa@example.com',role:'Floor Staff',password:'FloorDemo@123'})).code,201)
  const floorLogin=await request('/auth/login',{email:'floorqa@example.com',password:'FloorDemo@123'})
  cookie=floorLogin.cookie.split(';')[0]
  const floorBootstrap=(await request('/bootstrap')).payload
  assert.equal(floorBootstrap.customers.length,0)
  assert(floorBootstrap.service.orders.some(o=>o.id===orderId))
  assert.equal((await request('/export/customers.csv')).code,403)
  assert.equal((await request('/service/settings',{prepMinutes:10,readyMinutes:4})).code,403)
  assert.equal((await request(`/service/orders/${orderId}/accept`,{})).code,200)
  assert.equal((await request(`/service/orders/${orderId}/served`,{})).code,200)
  assert(!(await request('/service/alerts')).payload.orders.some(o=>o.id===orderId))
  cookie=ownerCookie
  assert.equal((await request(`/orders/${orderId}/status`,{status:'Ready'})).code,409)
})
