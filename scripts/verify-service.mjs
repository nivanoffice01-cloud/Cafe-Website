import { chromium, request } from 'playwright'
import assert from 'node:assert/strict'
const base='http://127.0.0.1:4188'
const api=await request.newContext({baseURL:base})
const login=await (await api.post('/api/auth/login',{data:{email:'owner@mangosteen.local',password:'Mangosteen@123'}})).json()
const headers={'X-CSRF-Token':login.csrfToken}
async function post(path,data) { const r=await api.post(path,{data,headers}); const body=await r.json(); assert(r.ok(),JSON.stringify(body));return body }
await post('/api/users',{name:'Browser Floor',email:'floor-browser@example.com',password:'FloorDemo@123',role:'Floor Staff'})
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'})
const errors=[]
async function loggedPage(email,password='Mangosteen@123') {
  const context=await browser.newContext({viewport:{width:1440,height:1000}})
  await context.addInitScript(()=>{
    window.__oscillators=0;window.__desktop=[];
    const AudioContext=window.AudioContext||window.webkitAudioContext;
    if(AudioContext){ const original=AudioContext.prototype.createOscillator; AudioContext.prototype.createOscillator=function(...args){window.__oscillators++;return original.apply(this,args)}; }
    window.Notification=class { static permission='granted';static async requestPermission(){return 'granted'};constructor(title,options){window.__desktop.push({title,...options})}close(){} };
  })
  const page=await context.newPage()
  page.on('pageerror',e=>errors.push(e.message))
  await page.goto(base)
  await page.locator('[name=email]').fill(email)
  await page.locator('[name=password]').fill(password)
  await page.locator('#login-form').evaluate(f=>f.requestSubmit())
  await page.waitForSelector('#service-alert-strip .service-live-strip')
  return page
}
try {
  const kitchen=await loggedPage('kitchen@mangosteen.local')
  await kitchen.waitForSelector('.kds-board')
  assert(await kitchen.locator('.ticket-delayed').count()>0)
  await kitchen.locator('[data-service-action=sound]').click()
  await kitchen.waitForFunction(()=>serviceSound && serviceAudio.state==='running')
  const initialOsc=await kitchen.evaluate(()=>window.__oscillators)
  const floor=await loggedPage('floor-browser@example.com','FloorDemo@123')
  await floor.waitForSelector('.service-ready-grid')
  assert.equal(await floor.locator('.nav-item').count(),1)
  await floor.locator('[data-service-action=sound]').click()
  await floor.locator('[data-service-action=desktop]').click()
  const initialFloorOsc=await floor.evaluate(()=>window.__oscillators)
  const order=await post('/api/orders',{table:'Table 4',items:[{menuItemId:1,quantity:2}]})
  await post(`/api/orders/${order.id}/send`,{})
  await kitchen.waitForSelector(`[data-service-order="${order.id}"]`,{timeout:15000})
  assert.equal(await kitchen.evaluate(()=>window.__oscillators),initialOsc+2)
  const ticket=kitchen.locator(`[data-service-order="${order.id}"]`)
  await ticket.locator('[data-action=kitchen-start]').click()
  await ticket.locator('[data-action=kitchen-ready]').waitFor()
  assert.equal(await kitchen.evaluate(()=>window.__oscillators),initialOsc+2)
  await kitchen.screenshot({path:'/tmp/mangosteen-kitchen-alerts.png'})
  await ticket.locator('[data-action=kitchen-ready]').click()
  const ready=floor.locator(`[data-service-order="${order.id}"]`)
  await ready.waitFor({timeout:15000})
  assert.equal(await floor.evaluate(()=>window.__oscillators),initialFloorOsc+3)
  assert.equal(await floor.evaluate(()=>window.__desktop.filter(n=>n.title==='Food ready to serve').length),1)
  const before=await floor.evaluate(()=>window.__oscillators)
  await floor.locator('[data-service-action=refresh]').click()
  assert.equal(await floor.evaluate(()=>window.__oscillators),before)
  await floor.screenshot({path:'/tmp/mangosteen-ready-service.png'})
  await floor.reload()
  await floor.waitForSelector(`[data-service-order="${order.id}"]`)
  assert.equal(await floor.evaluate(()=>window.__desktop.length),0)
  await ready.locator('[data-service-action=accept]').click()
  await floor.waitForFunction(id=>document.querySelector(`[data-service-order="${id}"]`)?.textContent.includes('Being served by Browser Floor'),order.id)
  await floor.setViewportSize({width:390,height:844})
  await floor.waitForFunction(()=>document.querySelector('.sidebar').getBoundingClientRect().right<=0)
  assert.equal(await floor.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false)
  await floor.screenshot({path:'/tmp/mangosteen-service-mobile.png'})
  await ready.locator('[data-service-action=served]').click()
  await ready.waitFor({state:'detached'})
  assert(!(await (await api.get('/api/service/alerts')).json()).orders.some(o=>o.id===order.id))
  await floor.route('**/api/service/alerts',route=>route.abort())
  await floor.locator('[data-service-action=refresh]').click()
  await floor.waitForFunction(()=>document.querySelector('#service-alert-strip').textContent.includes('disconnected'))
  await floor.unroute('**/api/service/alerts')
  await floor.locator('[data-service-action=refresh]').click()
  await floor.waitForFunction(()=>!document.querySelector('#service-alert-strip').textContent.includes('disconnected'))
  assert.deepEqual(errors,[])
  console.log('Browser passed: kitchen new-order chime, delayed highlighting, ready waiter chime/desktop notification, dedup after polling/reload, claim/served persistence, floor access, mobile, offline recovery.')
} finally { await browser.close();await api.dispose() }
