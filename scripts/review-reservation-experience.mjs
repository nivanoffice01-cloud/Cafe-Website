// Reservation UI verification, recordings and screenshots; disposable CRM only.
import { chromium } from 'playwright'
import { spawn, execFileSync } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'

const base = process.env.REVIEW_URL || 'http://127.0.0.1:5173'
const dir = 'artifacts/reservation-redesign'
await mkdir(`${dir}/recordings`, { recursive: true })
const fixture = spawn('python3', ['-u', '-c', `
import sys, tempfile, signal
from pathlib import Path
from http.server import ThreadingHTTPServer
sys.path.insert(0, 'CRM')
import server as crm
with tempfile.TemporaryDirectory(prefix='mangosteen-reservation-review-') as tmp:
    crm.DATA_DIR = Path(tmp) / 'data'
    crm.DB_PATH = crm.DATA_DIR / 'test.sqlite3'
    crm.BACKUP_DIR = Path(tmp) / 'backups'
    crm.init_database()
    server = ThreadingHTTPServer(('127.0.0.1', 0), crm.CRMHandler)
    signal.signal(signal.SIGTERM, lambda *_: sys.exit(0))
    print('READY:' + str(server.server_address[1]), flush=True)
    server.serve_forever()
`], { stdio: ['ignore', 'pipe', 'pipe'] })
let fixtureLogs = ''
fixture.stderr.on('data', d => { fixtureLogs += d })
const port = await new Promise((resolve, reject) => {
  let output = ''
  fixture.stdout.on('data', d => { output += d; const m = output.match(/READY:(\d+)/); if (m) resolve(m[1]) })
  fixture.on('exit', code => reject(new Error(`CRM fixture exited ${code}: ${fixtureLogs}`)))
})
const report = { checks: [], errors: [], consoleErrors: [], viewports: [], submissions: [], performance: {}, protectedFiles: {} }
const mark = text => { report.checks.push(text); console.log('PASS', text) }
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const routeFixture = async context => context.route('**/crm-api/**', async route => {
  const request = route.request(), url = new URL(request.url())
  const response = await context.request.fetch(`http://127.0.0.1:${port}${url.pathname.replace('/crm-api', '')}`, { method: request.method(), headers: request.headers(), data: request.postData() })
  await route.fulfill({ response })
})
const ready = async page => {
  await page.getByRole('dialog').waitFor()
  await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].filter(i => i.complete || i.loading !== 'lazy').map(i => i.decode().catch(() => {}))) })
  await page.waitForTimeout(600)
}
const fullShot = async (page, name) => {
  const old = page.viewportSize()
  const height = await page.locator('.reservation-backdrop').evaluate(e => e.scrollHeight)
  await page.setViewportSize({ width: old.width, height: Math.max(old.height, height) })
  await page.locator('.reservation-backdrop').evaluate(e => e.scrollTo(0, 0))
  await page.waitForTimeout(200)
  await page.screenshot({ path: `${dir}/after/${name}.jpg`, quality: 90 })
  await page.setViewportSize(old)
}
try {
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 }, timezoneId: 'Asia/Kolkata' })
  context.on('page', p => { p.on('pageerror', e => report.errors.push(e.message)); p.on('console', m => { if (m.type() === 'error') report.consoleErrors.push(m.text()) }) })
  await routeFixture(context)
  const page = await context.newPage()
  await page.goto(`${base}/contact#book`); await ready(page)
  const mapping = await page.evaluate(async () => {
    const { visualSeatingGroups } = await import('/src/features/reservations/layout.ts')
    return [...visualSeatingGroups('rooftop'), ...visualSeatingGroups('inside')]
  })
  const backend = JSON.parse(execFileSync('python3', ['-c', "import sys,json;sys.path.insert(0,'CRM');import server;print(json.dumps(server.PUBLIC_SEATING))"], { encoding: 'utf8' }))
  for (const group of mapping) {
    const area = group.zone === 'rooftop' ? 'The rooftop' : 'Inside Mangosteen'
    assert.deepEqual(backend[area][group.label], [group.id, group.capacity])
    assert.equal(group.seats.length, group.capacity)
    assert.deepEqual(group.seats, Array.from({ length: group.capacity }, (_, i) => `${group.id}-${i + 1}`))
  }
  await writeFile(`${dir}/seating-identifier-mapping.json`, JSON.stringify(mapping, null, 2))
  mark('All 15 seating groups and 54 seat IDs match the unchanged CRM allow-list')
  for (const zone of ['rooftop', 'inside']) {
    await page.getByLabel('Seating area', { exact: true }).selectOption(zone)
    const groups = mapping.filter(g => g.zone === zone)
    assert.equal(await page.locator('.reservation-furniture').count(), groups.length)
    assert.equal(await page.locator('.reservation-chair').count(), groups.reduce((n, g) => n + g.capacity, 0))
    await page.getByLabel('Number of guests').selectOption('6')
    for (const group of groups) {
      const table = page.locator(`.reservation-furniture[data-table-id="${group.id}"] .reservation-table`)
      assert.equal(await table.getAttribute('aria-disabled'), String(group.capacity < 6))
    }
    await page.locator('.reservation-table[aria-disabled=false]').click()
    assert.equal(await page.locator('.reservation-chair[aria-pressed=true]').count(), 6)
    await page.getByLabel('Number of guests').selectOption('4')
    assert.equal(await page.locator('.reservation-chair[aria-pressed=true]').count(), 0)
    await page.locator(`.reservation-furniture[data-table-id="${zone === 'rooftop' ? 'G2' : 'D2'}"] .reservation-table`).click()
    assert.equal(await page.locator('.reservation-chair[aria-pressed=true]').count(), 4)
    await fullShot(page, zone === 'rooftop' ? 'desktop-rooftop-full' : 'desktop-inside-full')
  }
  mark('Both maps retain exact chair counts; capacity filtering and selection reset work')
  const date = await page.getByLabel('Preferred date').locator('option').nth(3).getAttribute('value')
  await page.getByLabel('Preferred date').selectOption(date)
  await page.getByLabel('Preferred arrival time').selectOption('8:00 PM')
  await page.getByRole('button', { name: 'Continue to Details', exact: true }).click()
  await page.getByPlaceholder('Guest name').fill('Reservation Review Guest')
  await page.getByPlaceholder('+91', { exact: true }).fill('9876543210')
  await page.getByRole('button', { name: 'Change seats or arrival' }).click()
  assert.equal(await page.getByLabel('Preferred date').inputValue(), date)
  assert.equal(await page.getByLabel('Preferred arrival time').inputValue(), '8:00 PM')
  assert.equal(await page.locator('.reservation-chair[aria-pressed=true]').count(), 4)
  await page.getByRole('button', { name: 'Continue to Details', exact: true }).click()
  assert.equal(await page.getByPlaceholder('Guest name').inputValue(), 'Reservation Review Guest')
  await page.getByPlaceholder('+91', { exact: true }).fill('invalid!')
  assert.equal(await page.getByPlaceholder('+91', { exact: true }).evaluate(e => e.checkValidity()), false)
  await page.getByPlaceholder('+91', { exact: true }).fill('+91 (98765) 43210')
  assert.equal(await page.getByPlaceholder('+91', { exact: true }).evaluate(e => e.checkValidity()), true)
  await page.getByPlaceholder('Optional', { exact: true }).fill('not-email')
  assert.equal(await page.getByPlaceholder('Optional', { exact: true }).evaluate(e => e.checkValidity()), false)
  await page.getByPlaceholder('Optional', { exact: true }).fill('review@example.com')
  await fullShot(page, 'desktop-guest-details-full')
  const sent = page.waitForRequest(r => r.url().includes('/api/public/reservations') && r.method() === 'POST')
  await page.getByRole('button', { name: 'Request My Reservation', exact: true }).click()
  const payload = (await sent).postDataJSON()
  assert.equal(payload.table, 'Dining 02'); assert.equal(payload.area, 'Inside Mangosteen')
  assert.deepEqual(payload.seats, ['D2-1', 'D2-2', 'D2-3', 'D2-4'])
  assert.equal(payload.time, '20:00'); assert.equal(payload.consent, false)
  await page.locator('.reservation-confirmation').waitFor(); await page.waitForTimeout(500)
  await fullShot(page, 'desktop-confirmation-full')
  report.submissions.push({ area: payload.area, table: payload.table, seats: payload.seats, date: payload.date, time: payload.time, reference: await page.locator('.reservation-receipt strong').innerText(), status: 'Pending' })
  mark('Date/time/guest details survive back navigation; native phone/email validation and exact pending CRM payload verified')
  await page.keyboard.press('Escape'); await page.getByRole('dialog').waitFor({ state: 'detached' })
  assert.notEqual(await page.evaluate(() => document.body.style.overflow), 'hidden')
  assert.equal(await page.locator('.saved-mangosteen.motion-ready').evaluate(e => e.inert), false)
  mark('Escape closes the full-screen experience and restores background scrolling and interactivity')
  for (const [width, height] of [[320,568],[360,800],[390,844],[430,932],[768,1024],[1024,768],[1440,900],[1920,1080]]) {
    await page.setViewportSize({ width, height }); await page.goto(`${base}/contact#book`); await page.reload(); await ready(page)
    const metrics = await page.locator('.reservation-backdrop').evaluate(e => ({ width: innerWidth, height: innerHeight, scrollWidth: e.scrollWidth, documentWidth: document.documentElement.scrollWidth }))
    assert.ok(metrics.scrollWidth <= width && metrics.documentWidth <= width)
    assert.equal(await page.getByLabel('Preferred date').locator('option').count(), 14)
    assert.equal(await page.getByLabel('Preferred arrival time').locator('option').count(), 5)
    const table = page.locator('.reservation-furniture[data-table-id="R1"] .reservation-table')
    await table.focus(); await page.keyboard.press('Enter')
    assert.equal(await page.locator('.reservation-chair[aria-pressed=true]').count(), 2)
    await page.locator('.reservation-seat-preferences button').first().click()
    assert.equal(await page.locator('.reservation-chair[aria-pressed=true]').count(), 1)
    await page.locator('.reservation-seat-preferences button').first().click()
    await page.getByRole('button', { name: width <= 600 ? 'Continue' : 'Continue to Details', exact: true }).click()
    await page.getByRole('button', { name: 'Change seats or arrival' }).click()
    await page.locator('.reservation-table-list summary').click()
    await page.locator('.reservation-table-list button').filter({ hasText: 'Garden 01' }).click()
    assert.equal(await page.locator('.reservation-furniture[data-table-id="G1"] .reservation-table').getAttribute('aria-pressed'), 'true')
    await page.getByRole('button', { name: 'Zoom in seating map' }).click()
    assert.equal(await page.locator('.reservation-seat-map').evaluate(e => e.style.width), '140%')
    await page.getByRole('button', { name: 'Reset seating map zoom' }).click()
    if (width === 390) {
      await page.locator('.reservation-table-list summary').click()
      await fullShot(page, 'mobile-rooftop-full')
      await page.getByLabel('Seating area', { exact: true }).selectOption('inside')
      await page.locator('.reservation-furniture[data-table-id="D2"] .reservation-table').click()
      await fullShot(page, 'mobile-inside-full')
      await page.getByRole('button', { name: 'Continue', exact: true }).click()
      await fullShot(page, 'mobile-guest-details-full')
      await page.getByPlaceholder('Guest name').fill('Mobile Reservation Review')
      await page.getByPlaceholder('+91', { exact: true }).fill('9876543210')
      await page.getByRole('button', { name: 'Request My Reservation', exact: true }).click()
      await page.locator('.reservation-confirmation').waitFor(); await page.waitForTimeout(500)
      await fullShot(page, 'mobile-confirmation-full')
    }
    if (width === 768) await fullShot(page, 'tablet-full')
    report.viewports.push(metrics)
  }
  mark('320–1920px: no page overflow; SVG keyboard activation, individual seats, list alternative, zoom and back navigation work')
  await page.setViewportSize({width:390,height:844});await page.goto(`${base}/contact#book`);await ready(page)
  const nav = page.locator('.reservation-site-navigation')
  await nav.getByRole('button',{name:'Toggle menu'}).click()
  assert.equal(await page.locator('.reservation-backdrop').evaluate(e=>getComputedStyle(e).overflowY),'hidden')
  await page.keyboard.press('Escape');assert.equal(await page.getByRole('dialog').count(),1)
  assert.equal(await nav.getByRole('button',{name:'Toggle menu'}).getAttribute('aria-expanded'),'false')
  const last = page.getByRole('button',{name:'Continue',exact:true})
  await page.locator('.reservation-furniture[data-table-id="R1"] .reservation-table').click()
  await last.focus();await page.keyboard.press('Tab')
  assert.equal(await page.evaluate(()=>document.activeElement?.getAttribute('aria-label')),'Mangosteen Café — home')
  mark('Mobile menu Escape/scroll lock and reservation Tab focus loop verified')
  await context.close()

  // Motion recordings submit to the same disposable backend; no production data.
  for (const mode of ['desktop','mobile']) {
    const size = mode === 'desktop' ? {width:1440,height:1000} : {width:390,height:844}
    const ctx = await browser.newContext({viewport:size,recordVideo:{dir:`${dir}/recordings`,size},isMobile:mode==='mobile',hasTouch:mode==='mobile',timezoneId:'Asia/Kolkata'})
    await routeFixture(ctx)
    const p=await ctx.newPage(), video=p.video()
    await p.goto(base);await p.locator('.saved-mangosteen.motion-ready').waitFor();await p.waitForTimeout(1200)
    await p.getByRole('link',{name:/Reserve a table/i}).filter({visible:true}).first().click();await ready(p)
    await p.getByLabel('Number of guests').selectOption('4');await p.waitForTimeout(500)
    await p.locator('.reservation-furniture[data-table-id="G2"] .reservation-table').click();await p.waitForTimeout(1000)
    if(mode==='mobile'){await p.locator('.reservation-backdrop').evaluate(e=>e.scrollTo({top:650,behavior:'smooth'}));await p.waitForTimeout(1000)}
    await p.locator('.reservation-seat-preferences button').first().click();await p.waitForTimeout(450);await p.locator('.reservation-seat-preferences button').first().click()
    await p.getByLabel('Seating area',{exact:true}).selectOption('inside');await p.waitForTimeout(700)
    await p.locator('.reservation-furniture[data-table-id="D2"] .reservation-table').click();await p.waitForTimeout(900)
    await p.getByRole('button',{name:mode==='mobile'?'Continue':'Continue to Details',exact:true}).click();await p.waitForTimeout(700)
    await p.getByPlaceholder('Guest name').pressSequentially(`${mode==='mobile'?'Mobile':'Desktop'} Review Guest`,{delay:35})
    await p.getByPlaceholder('+91',{exact:true}).pressSequentially('9876543210',{delay:45})
    await p.getByPlaceholder('Allergies, accessibility or seating notes').fill('Review fixture only — please disregard.')
    await p.waitForTimeout(500);await p.getByRole('button',{name:'Request My Reservation',exact:true}).click();await p.locator('.reservation-confirmation').waitFor();await p.waitForTimeout(1600)
    if(mode==='mobile'){await p.locator('.reservation-backdrop').evaluate(e=>e.scrollTo({top:500,behavior:'smooth'}));await p.waitForTimeout(1000)}
    await p.getByRole('button',{name:'Back to Mangosteen',exact:true}).click();await p.getByRole('dialog').waitFor({state:'detached'});await p.waitForTimeout(600)
    await ctx.close();await video.saveAs(`${dir}/recordings/${mode}-reservation.webm`)
    console.log('RECORDED',mode)
  }

  // Measurement describes emulation, not a claim about physical phones/CWV.
  const perfContext=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true})
  const perf=await perfContext.newPage();const cdp=await perfContext.newCDPSession(perf)
  await cdp.send('Emulation.setCPUThrottlingRate',{rate:4})
  await perf.addInitScript(()=>{window.__reservationLongTasks=[];new PerformanceObserver(list=>{for(const e of list.getEntries())window.__reservationLongTasks.push(e.duration)}).observe({type:'longtask',buffered:true})})
  await perf.goto(`${base}/contact#book`);await ready(perf)
  report.performance=await perf.evaluate(async()=>{
    const stamps=[];await new Promise(resolve=>{let last=performance.now(),start=last;const sample=t=>{stamps.push(t-last);last=t;if(t-start<2000)requestAnimationFrame(sample);else resolve()};requestAnimationFrame(sample)})
    const resources=performance.getEntriesByType('resource').filter(r=>r.name.includes('/images/reservation/'))
    return {environment:'Headless Chrome on local Mac; 390x844 touch viewport; 4x CPU slowdown; not physical-device or field CWV data',sampleMs:2000,meanFrameIntervalMs:stamps.reduce((a,b)=>a+b,0)/stamps.length,maxFrameIntervalMs:Math.max(...stamps),framesOver34ms:stamps.filter(x=>x>34).length,reservationAssets:resources.map(r=>({url:new URL(r.name).pathname,transferBytes:r.transferSize,decodedBytes:r.decodedBodySize})),longTasksDuringPageLoad:window.__reservationLongTasks}
  })
  await perfContext.close()
  mark('Captured complete desktop/mobile recordings and mobile-emulation frame/resource measurements')
  const protectedBefore=JSON.parse(await readFile(`${dir}/protected-before.json`,'utf8'))
  for(const [file,hash] of Object.entries(protectedBefore)){
    let source=await readFile(file)
    if(file.endsWith('/SuppliedDesign.tsx'))source=Buffer.from(source.toString().replace('export { ts as SiteHeader,','export {'))
    const actual=crypto.createHash('sha256').update(source).digest('hex');assert.equal(actual,hash);report.protectedFiles[file]='unchanged (header export excluded where applicable)'
  }
  mark('Menu, seating data, backend/API, homepage content/motion/style sources unchanged; only shared-header export added')
  assert.deepEqual(report.errors,[]);assert.deepEqual(report.consoleErrors,[])
} catch(error) {report.failure=String(error);process.exitCode=1;console.error(error)}
finally{await writeFile(`${dir}/verification.json`,JSON.stringify(report,null,2));await browser.close();fixture.kill('SIGTERM')}
