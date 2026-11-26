// Browser regressions use a disposable CRM database. No live business data is written.
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import fs from 'node:fs/promises'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'
import { fullMenu, fullMenuCount } from '../api/full-menu.mjs'

const base = process.env.REVIEW_URL || 'http://127.0.0.1:5173'
const dir = 'artifacts/menu-premium-v3'
await fs.mkdir(`${dir}/after`, { recursive: true })
const fixture = spawn('python3', ['-u', '-c', `
import sys, tempfile, signal
from pathlib import Path
from http.server import ThreadingHTTPServer
sys.path.insert(0, 'CRM')
import server as crm
with tempfile.TemporaryDirectory(prefix='mangosteen-menu-v3-') as tmp:
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
  const timeout = setTimeout(() => reject(new Error('Fixture startup timed out')), 20000)
  fixture.stdout.on('data', data => { output += data; const found = output.match(/READY:(\d+)/); if (found) { clearTimeout(timeout); resolve(found[1]) } })
  fixture.on('exit', code => { clearTimeout(timeout); reject(new Error(`Fixture exited ${code}: ${fixtureLogs}`)) })
})
const crm = `http://127.0.0.1:${port}`
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, timezoneId: 'Asia/Kolkata' })
await context.route('**/crm-api/**', async route => {
  const req = route.request()
  const response = await context.request.fetch(crm + new URL(req.url()).pathname.replace('/crm-api', ''), { method: req.method(), headers: req.headers(), data: req.postData() })
  await route.fulfill({ response })
})
const page = await context.newPage()
const report = { checks: [], errors: [], consoleErrors: [], badResponses: [], viewports: [], protectedSourceChanges: [] }
page.on('pageerror', error => report.errors.push(error.message))
page.on('console', message => { if (message.type() === 'error') report.consoleErrors.push(message.text()) })
page.on('response', response => { if (response.status() >= 400) report.badResponses.push({ url: response.url(), status: response.status() }) })
const mark = value => { report.checks.push(value); console.log('PASS', value) }
const slug = value => value.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
const goto = async path => { await page.goto(base + path); await page.locator('.dm-menu').waitFor(); await page.evaluate(() => document.fonts.ready) }
const shot = async (name, fullPage = true) => {
  await page.waitForTimeout(300)
  await page.screenshot({ path: `${dir}/after/${name}.png`, fullPage, animations: 'disabled' })
}
const bottom = () => page.getByRole('navigation', { name: 'Menu navigation', exact: true })
const clickNav = async label => { await bottom().getByRole('button', { name: label, exact: true }).click(); await page.waitForTimeout(80) }
try {
  assert.equal(fullMenuCount, 131); assert.equal(fullMenu.length, 13)
  await goto('/menu'); await shot('mobile-landing'); await shot('mobile-landing-viewport', false)
  await page.getByRole('button', { name: 'Explore the Menu', exact: true }).click()
  await page.waitForTimeout(650)
  assert.ok(await page.evaluate(() => Math.abs(document.getElementById('browse-categories').getBoundingClientRect().top) < 30))
  assert.equal(await page.locator('.dm-category-circles>button').count(), 6)
  await page.getByRole('button', { name: 'View All Categories', exact: true }).click()
  assert.equal(await page.locator('.dm-category-banner').count(), 13)
  assert.deepEqual(await page.locator('.dm-banner-copy strong').allTextContents(), fullMenu.map(c => c.name))
  await shot('mobile-categories'); await shot('mobile-categories-viewport', false)
  mark('Landing CTA scrolls directly to six categories; all 13 exact category names and order preserved')

  for (const category of fullMenu) {
    await goto(`/menu/category/${slug(category.name)}`)
    const dishes = await page.locator('.dm-dish').evaluateAll(cards => cards.map(card => ({
      key: card.dataset.dish,
      name: card.querySelector('.dm-dish-copy>strong').textContent,
      price: card.querySelector('.dm-price').textContent,
      description: card.querySelector('.dm-description')?.textContent || null,
    })))
    assert.deepEqual(dishes, category.items.map(item => ({ key: `${category.name}|${item.name}`, name: item.name, price: `₹${item.price.toLocaleString('en-IN')}`, description: item.description || null })))
    if (category.name === 'Pizza & Pide') { await shot('mobile-pizza'); await shot('mobile-pizza-viewport', false) }
    if (category.name === 'Pasta') await shot('mobile-pasta')
    if (category.name === 'Shakes') await shot('mobile-shakes')
  }
  await goto('/menu/all'); assert.equal(await page.locator('.dm-dish').count(), 131)
  assert.equal(await page.locator('img[src*="menu-ai"],img[src*="/images/menu/"]').count(), 0)
  mark('All 131 exact names, prices and descriptions verified across all 13 category routes; no stock or AI food substitution')

  await goto('/menu?table=4')
  await page.getByRole('heading', { name: 'All Categories', exact: true }).waitFor()
  assert.equal(new URL(page.url()).pathname, '/menu/browse')
  assert.match(await page.locator('.dm-table-context').innerText(), /Table 4/)
  await clickNav('Search')
  await page.getByRole('searchbox', { name: 'Search all dishes' }).fill('Margarita')
  assert.equal(await page.locator('.dm-dish').count(), 1)
  await shot('mobile-search')
  await page.getByRole('button', { name: 'Add Margarita to favourites', exact: true }).click()
  await page.getByRole('button', { name: 'View Margarita', exact: true }).click()
  await shot('mobile-dish-details', false)
  // Native dialog traps focus and Escape restores the triggering dish button.
  for (let i = 0; i < 8; i++) { await page.keyboard.press('Tab'); assert.equal(await page.evaluate(() => Boolean(document.activeElement?.closest('dialog'))), true) }
  await page.keyboard.press('Escape'); assert.equal(await page.locator('dialog').count(), 0)
  assert.equal(await page.getByRole('button', { name: 'View Margarita', exact: true }).evaluate(el => el === document.activeElement), true)
  await clickNav('Favourites'); await page.reload(); await page.locator('.dm-dish').waitFor()
  assert.equal(await page.locator('.dm-dish').count(), 1); await shot('mobile-favourites')
  await page.getByRole('button', { name: 'Add Margarita to My List', exact: true }).click()
  await page.getByRole('button', { name: 'Add another Margarita', exact: true }).click()
  assert.equal(await page.locator('.dm-quantity output').innerText(), '2')
  await clickNav('My List'); await shot('mobile-my-list')
  assert.equal(new URL(page.url()).searchParams.get('table'), '4')
  assert.match(await page.locator('.dm-order-summary').innerText(), /₹1,048/)
  await page.getByRole('button', { name: 'Remove one Margarita', exact: true }).click()
  await page.reload(); await page.locator('.dm-quantity').waitFor()
  assert.equal(await page.locator('.dm-quantity output').innerText(), '1')
  await page.getByPlaceholder('Name for this order').fill('Premium Menu Regression Guest')
  await page.getByPlaceholder('For order updates').fill('9876543210')
  await page.getByRole('button', { name: 'Demo pay & place order', exact: true }).click()
  await page.getByRole('heading', { name: 'Your table is in the kitchen queue.', exact: true }).waitFor()
  await shot('mobile-demo-order-receipt')
  assert.match(await page.locator('.dm-receipt').innerText(), /No money was transferred/)
  mark('QR Table 4 skips hero; context persists through search, favourites, details and My List; saved selections survive reload; quantities/totals and real demo API submission verified on disposable CRM')

  await goto('/menu?category=Pizza%20%26%20Pide&dish=Margarita')
  await page.locator('dialog').waitFor(); await page.keyboard.press('Escape')
  await clickNav('Search'); assert.equal(await page.getByRole('searchbox', { name: 'Search all dishes' }).count(), 1)
  await page.getByRole('searchbox', { name: 'Search all dishes' }).fill('zzzznofood')
  await page.getByRole('heading', { name: 'No dishes found', exact: true }).waitFor()
  await page.getByRole('button', { name: 'Clear search', exact: true }).click()
  await page.getByRole('heading', { name: 'What sounds good?', exact: true }).waitFor()
  await goto('/m?table=4'); await page.getByRole('heading', { name: 'All Categories', exact: true }).waitFor()
  await goto('/menu/browse')
  await page.waitForTimeout(300); await page.evaluate(() => scrollTo(0, 700)); const position = await page.evaluate(() => scrollY)
  await page.locator('.dm-category-banner').filter({ hasText: 'Pasta' }).click()
  await page.getByRole('button', { name: 'Go back', exact: true }).click(); await page.waitForTimeout(200)
  assert.equal(new URL(page.url()).pathname, '/menu/browse')
  assert.ok(Math.abs(await page.evaluate(() => scrollY) - position) < 200)
  await page.getByRole('button', { name: 'Open menu navigation', exact: true }).click()
  assert.equal(await page.evaluate(() => document.body.style.overflow), 'hidden')
  for (let i = 0; i < 8; i++) { await page.keyboard.press('Tab'); assert.equal(await page.evaluate(() => Boolean(document.activeElement?.closest('dialog'))), true) }
  await page.keyboard.press('Escape')
  assert.equal(await page.locator('dialog').count(), 0)
  assert.notEqual(await page.evaluate(() => document.body.style.overflow), 'hidden')
  mark('Legacy dish query links, QR alias, search empty/clear states, back/scroll restoration, drawer focus trap and Escape verified')

  // Menu is a personal shortlist without a valid QR context, never a checkout.
  await goto('/menu/selection')
  assert.equal(await page.getByRole('button', { name: 'Demo pay & place order' }).count(), 0)
  await clickNav('Favourites'); await page.getByRole('button', { name: 'Remove Margarita from favourites', exact: true }).click()
  await page.getByRole('heading', { name: 'Nothing saved yet', exact: true }).waitFor()
  await clickNav('My List'); await page.getByRole('heading', { name: 'Your list is empty', exact: true }).waitFor()
  mark('Non-QR menu never exposes order submission; favourite removal and My List empty states verified')

  for (const [width, height] of [[320,568],[360,800],[375,667],[390,844],[393,852],[414,896],[430,932],[768,1024],[1024,768],[1440,1000],[1920,1080],[844,390]]) {
    await page.setViewportSize({ width, height })
    for (const path of ['/menu', '/menu/browse', '/menu/category/pizza-and-pide', '/menu/search', '/menu/favourites', '/menu/selection']) {
      await goto(path)
      const metrics = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth, brokenImages: [...document.images].filter(i => i.complete && !i.naturalWidth).length, navVisible: getComputedStyle(document.querySelector('.dm-bottom-nav')).display !== 'none' }))
      assert.ok(metrics.scrollWidth <= width, `${path} overflow at ${width}: ${metrics.scrollWidth}`)
      assert.equal(metrics.brokenImages, 0)
      assert.equal(metrics.navVisible, width < 900)
      report.viewports.push({ path, height, ...metrics })
    }
    if ([320,768,1440,1920].includes(width)) {
      await goto('/menu'); await shot(`${width === 768 ? 'tablet' : width >= 1440 ? 'desktop' : 'small-mobile'}-${width}-landing`)
      await goto('/menu/category/pizza-and-pide'); await shot(`${width === 768 ? 'tablet' : width >= 1440 ? 'desktop' : 'small-mobile'}-${width}-pizza`)
    }
  }
  mark('72 route/viewport checks: all seven requested phone widths, tablet, laptop, desktop and mobile landscape; no page overflow, broken images or duplicated navigation')
  // Reduced motion is an actual computed-style check.
  await page.emulateMedia({ reducedMotion: 'reduce' }); await goto('/menu')
  assert.equal(await page.locator('.dm-content').evaluate(el => getComputedStyle(el).animationName), 'none')
  mark('Reduced-motion disables menu animation')

  // Protected reservation workflow, using the same isolated API, not the production database.
  await page.setViewportSize({ width: 390, height: 844 }); await page.goto(base + '/')
  await page.getByRole('link', { name: /Reserve a table/i }).filter({ visible: true }).first().click()
  assert.match(await page.getByLabel('Number of guests', { exact: true }).innerText(), /2 Guests/)
  assert.match(await page.getByLabel('Preferred arrival time', { exact: true }).innerText(), /7:00 PM/)
  await page.locator('.reservation-table[aria-label^="Railside 01"]').click()
  assert.equal(await page.locator('.reservation-chair[aria-pressed=true]').count(), 2)
  await page.getByRole('button', { name: 'Continue', exact: true }).click()
  await page.getByPlaceholder('Guest name').fill('Premium Menu Reservation Regression')
  await page.getByPlaceholder('+91', { exact: true }).fill('9876543210')
  await page.getByRole('button', { name: 'Request My Reservation', exact: true }).click()
  await page.locator('.reservation-receipt').waitFor()
  assert.match(await page.locator('.reservation-receipt').innerText(), /Pending café confirmation/)
  await shot('protected-reservation-receipt', false)
  await page.keyboard.press('Escape')
  mark('Protected homepage opens existing reservation; unchanged seat IDs, guest controls and pending-confirmation submission work')

  await page.setViewportSize({ width: 1440, height: 1000 }); await page.goto(crm)
  await page.locator('#login-form [name=email]').fill('owner@mangosteen.local')
  await page.locator('#login-form [name=password]').fill('Mangosteen@123')
  await page.locator('#login-form [type=submit]').click(); await page.locator('.sidebar').waitFor()
  await page.locator('.sidebar [data-page="orders"]').click()
  await page.getByText(/Premium Menu Regression/).first().waitFor(); await shot('protected-crm-order', false)
  assert.match(await page.locator('body').innerText(), /Table 4/)
  await page.locator('.sidebar [data-page="reservations"]').click()
  await page.getByText(/Premium Menu Reservation/).first().waitFor(); await shot('protected-crm-reservation', false)
  mark('Existing CRM authentication, order queue and reservation queue show both actual test submissions')

  const hashes = JSON.parse(await fs.readFile(`${dir}/before/protected-hashes.json`, 'utf8'))
  for (const [file, hash] of Object.entries(hashes)) {
    if (file === 'src/pages/MenuExperiencePage.tsx') continue
    if (crypto.createHash('sha256').update(await fs.readFile(file)).digest('hex') !== hash) report.protectedSourceChanges.push(file)
  }
  assert.deepEqual(report.protectedSourceChanges, [])
  mark('Checksums prove all pre-existing non-menu source, APIs, data, homepage, reservation, CRM and original assets unchanged')
  assert.deepEqual(report.errors, []); assert.deepEqual(report.consoleErrors, []); assert.deepEqual(report.badResponses, [])
} catch (error) {
  report.failure = String(error); process.exitCode = 1; console.error(error)
  await page.screenshot({ path: `${dir}/after/failure.png` }).catch(() => {})
} finally {
  await fs.writeFile(`${dir}/browser-results.json`, JSON.stringify(report, null, 2))
  await browser.close(); fixture.kill('SIGTERM')
}
