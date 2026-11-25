// Real browser regressions against a disposable CRM database. Never uses live data.
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import assert from 'node:assert/strict'

const phase = process.argv[2] || 'after'
assert.ok(['before', 'after'].includes(phase))
const base = process.env.REVIEW_URL || 'http://127.0.0.1:5173'
const dir = `artifacts/mangosteen-clean-rebuild/${phase}`
await mkdir(dir, { recursive: true })
const fixture = spawn('python3', ['-u', '-c', `
import sys, tempfile, signal
from pathlib import Path
from http.server import ThreadingHTTPServer
sys.path.insert(0, 'CRM')
import server as crm
with tempfile.TemporaryDirectory(prefix='mangosteen-reset-test-') as tmp:
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
fixture.stderr.on('data', data => { fixtureLogs += data })
const port = await new Promise((resolve, reject) => {
  let output = ''
  fixture.stdout.on('data', data => { output += data; const found = output.match(/READY:(\d+)/); if (found) resolve(found[1]) })
  fixture.on('exit', code => reject(new Error(`CRM fixture exited ${code}: ${fixtureLogs}`)))
})
const crm = `http://127.0.0.1:${port}`
const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, timezoneId: 'Asia/Kolkata', reducedMotion: 'reduce' })
// All browser submissions are forwarded to the real API running on a disposable DB.
await context.route('**/crm-api/**', async route => {
  const request = route.request()
  const url = new URL(request.url())
  const response = await context.request.fetch(crm + url.pathname.replace('/crm-api', ''), {
    method: request.method(), headers: request.headers(), data: request.postData(),
  })
  await route.fulfill({ response })
})
const page = await context.newPage()
const report = { phase, checks: [], errors: [], consoleErrors: [], badResponses: [], viewports: [] }
const mark = value => { report.checks.push(value); console.log('PASS', value) }
page.on('pageerror', error => report.errors.push(error.message))
page.on('console', message => { if (message.type() === 'error') report.consoleErrors.push(message.text()) })
page.on('response', response => { if (response.status() >= 400) report.badResponses.push({ url: response.url(), status: response.status() }) })
const shot = async name => {
  await page.locator('.bm-shell, .marketing-holding, .holding-page, #login-form, .sidebar').first().waitFor()
  await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map(i => i.decode().catch(() => {}))) })
  await page.screenshot({ path: `${dir}/${name}.png`, animations: 'disabled' })
}
try {
  await page.goto(`${base}/menu`); await shot('menu-landing')
  await page.goto(`${base}/menu?table=4`)
  assert.match(await page.locator('.bm-brand').innerText(), /Table 4/i); await shot('menu-table-4')
  await page.getByRole('button', { name: 'Search menu', exact: true }).click()
  await page.getByRole('textbox', { name: 'Search all dishes' }).fill('Margarita')
  await shot('menu-search')
  await page.locator('.bm-dish-open').filter({ hasText: 'Margarita' }).click()
  await page.getByRole('button', { name: 'Favourite', exact: true }).click()
  await page.getByRole('button', { name: 'Close dish details' }).click()
  await page.getByRole('navigation', { name: 'Menu navigation' }).getByRole('button', { name: 'Favourites', exact: true }).click()
  await page.reload(); assert.match(await page.locator('main').innerText(), /Margarita/)
  await shot('menu-favourites')
  await page.locator('.bm-dish-open').filter({ hasText: 'Margarita' }).click()
  await page.getByRole('button', { name: 'Add to My List', exact: true }).click()
  await page.getByRole('navigation', { name: 'Menu navigation' }).getByRole('button', { name: /My List/ }).click()
  assert.match(await page.locator('main').innerText(), /TABLE 4/); await shot('menu-selection')
  await page.getByPlaceholder('Name for this order').fill('Reset Test Guest')
  await page.getByRole('button', { name: 'Demo pay & place order' }).click()
  await page.getByRole('heading', { name: 'Your table is in the kitchen queue.' }).waitFor()
  mark('Search, persistent favourites, selection and real Table 4 demo order submission to isolated CRM')
  await page.goto(`${base}/m?table=4`); assert.match(await page.locator('.bm-brand').innerText(), /Table 4/i)
  await page.goto(`${base}/menu/all`); assert.match(await page.locator('h1').innerText(), /131/)
  await page.goto(`${base}/menu/browse`); await page.locator('.mn-category-grid').waitFor()
  assert.equal(await page.locator('.mn-category-grid>button').count(), 15); await shot('menu-categories')
  mark('QR alias and all 131 dishes / 13 categories remain accessible')
  await page.goto(`${base}/`)
  await page.getByRole('button', { name: /Reserve a table/i }).click()
  assert.equal(await page.locator('.reservation-counter output').innerText(), '2')
  assert.equal(await page.locator('.reservation-times [aria-pressed=true]').innerText(), '7:00 PM')
  await shot('reservation-mobile')
  await page.getByRole('button', { name: 'Continue to seating' }).click()
  await page.getByRole('button', { name: 'Railside 01, seat 1', exact: true }).click()
  await page.getByRole('button', { name: 'Railside 01, seat 2', exact: true }).click()
  await page.getByRole('button', { name: 'Review choice' }).click()
  await page.getByRole('button', { name: 'Continue to your details' }).click()
  await page.getByPlaceholder('Guest name').fill('Reset Reservation Guest')
  await page.getByPlaceholder('+91', { exact: true }).fill('9876543210')
  await page.getByRole('button', { name: 'Send reservation request', exact: true }).click()
  await page.locator('.reservation-receipt').waitFor()
  assert.match(await page.locator('.reservation-receipt').innerText(), /Pending café confirmation/)
  await page.keyboard.press('Escape'); assert.equal(await page.getByRole('dialog').count(), 0)
  assert.notEqual(await page.evaluate(() => document.body.style.overflow), 'hidden')
  mark('Complete mobile seat selection and pending reservation submission to isolated CRM; Escape restores scrolling')
  await page.setViewportSize({ width: 1440, height: 1000 }); await page.goto(`${base}/`)
  await page.getByRole('button', { name: /Reserve a table/i }).click(); await shot('reservation-desktop')
  await page.locator('.reservation-dialog').screenshot({ path: `${dir}/reservation-dialog.png`, animations: 'disabled' })
  await page.keyboard.press('Escape')
  for (const width of [320, 390, 768, 1440, 1920]) {
    await page.setViewportSize({ width, height: width > 1000 ? 1080 : 844 })
    await page.goto(`${base}/menu/browse`); await page.locator('.mn-category-grid').waitFor()
    const metrics = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth }))
    assert.ok(metrics.scrollWidth <= width); report.viewports.push(metrics)
  }
  mark('Protected menu has no horizontal overflow at 320/390/768/1440/1920px')
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto(crm); await page.locator('#login-form').waitFor(); await shot('crm-login')
  await page.locator('#login-form [name=email]').fill('owner@mangosteen.local')
  await page.locator('#login-form [name=password]').fill('Mangosteen@123')
  await page.locator('#login-form [type=submit]').click()
  await page.locator('.sidebar').waitFor(); await shot('crm-dashboard')
  for (const section of ['orders', 'reservations', 'settings']) {
    await page.locator(`.sidebar [data-page="${section}"]`).click()
    await page.waitForTimeout(200)
    if (section === 'orders') assert.match(await page.locator('body').innerText(), /Table 4/)
    if (section === 'reservations') assert.match(await page.locator('body').innerText(), /Reset Reservation Guest/)
    await shot(`crm-${section}`)
  }
  mark('Owner login, dashboard, order queue, submitted reservation and admin settings work in isolated CRM')
  if (phase === 'after') {
    const loaded = []
    page.on('request', request => loaded.push(request.url()))
    await page.goto(base); await shot('holding-desktop')
    assert.equal(await page.locator('canvas').count(), 0)
    assert.equal(await page.evaluate(() => document.getAnimations().length), 0)
    assert.equal(loaded.some(url => /reference-experience|architectural-experience|claude-vfx|PageTransitions|gsap|three|cinematic/i.test(url)), false)
    await page.getByRole('link', { name: 'Explore Menu', exact: true }).click()
    await page.locator('.bm-landing').waitFor()
    for (const path of ['/experience', '/reference-experience', '/claude-vfx-lab', '/food-vfx-lab']) {
      await page.goto(base + path)
      await page.getByRole('link', { name: 'Explore Menu', exact: true }).waitFor()
      assert.equal(await page.getByRole('link', { name: 'Explore Menu', exact: true }).count(), 1)
      assert.equal(await page.locator('canvas').count(), 0)
    }
    await page.setViewportSize({ width: 390, height: 844 }); await page.goto(base); await shot('holding-mobile')
    mark('Holding page has no animation engine; removed experiment URLs fall back safely; menu action works')
    report.homeRequests = loaded.filter(url => url.startsWith(base))
  }
  assert.deepEqual(report.errors, [])
  // Observed before reset: Chromium's v-mode rejects the existing phone pattern.
  // Preserve the protected reservation source; report this baseline defect explicitly.
  report.knownBaselineIssues = report.consoleErrors.filter(message => message.startsWith('Pattern attribute value [+0-9 ()-]{7,24}'))
  assert.deepEqual(report.consoleErrors.filter(message => !report.knownBaselineIssues.includes(message)), [])
  assert.deepEqual(report.badResponses, [])
} catch (error) {
  report.failure = String(error); process.exitCode = 1; console.error(error)
  await page.screenshot({ path: `${dir}/failure.png` })
} finally {
  await writeFile(`${dir}/results.json`, JSON.stringify(report, null, 2))
  await browser.close(); fixture.kill('SIGTERM')
}
