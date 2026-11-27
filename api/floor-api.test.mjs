import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import vm from 'node:vm'
import * as crypto from 'node:crypto'
import { dayInIndia } from './floor.mjs'

test('hosted routes authenticate, persist visits and validate conflicts and stale edits', async () => {
  let stored = null, version = 0
  class BlobPreconditionFailedError extends Error {}
  const blob = {
    BlobPreconditionFailedError,
    get: async () => stored ? { stream: new Response(stored).body, blob: { etag: String(version) } } : null,
    put: async (path, value, options) => {
      if (options.ifMatch && options.ifMatch !== String(version)) throw new BlobPreconditionFailedError()
      stored = value; version++
      return { etag: String(version) }
    },
  }
  const context = vm.createContext({ console: { error() {} }, Request, Response, Headers, URL, Buffer })
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
})
