import { chromium } from 'playwright'
import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
const dir = 'artifacts/cafe-cinematic-gallery'
const base = process.env.REVIEW_URL || 'http://127.0.0.1:5173'
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const report = { checks: [], desktop: {}, mobile: {}, viewports: [], errors: [], consoleErrors: [], recordings: [] }
const open = async (context) => {
  const page = await context.newPage()
  page.on('pageerror', e => report.errors.push(e.message))
  page.on('console', m => { if (m.type() === 'error') report.consoleErrors.push(m.text()) })
  await page.goto(base + '/')
  await page.locator('.cafe-glass').waitFor()
  return page
}
const ready = async page => {
  await page.locator('.cafe-glass').scrollIntoViewIfNeeded()
  await page.waitForFunction(() => document.querySelector('.cafe-glass').classList.contains('is-ready'))
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(300)
}
const shot = (page, name) => page.screenshot({ path: `${dir}/after/${name}.png` })
const pinGeometry = page => page.locator('.cafe-gallery-spaces').evaluate(el => ({
  start: el.parentElement.getBoundingClientRect().top + scrollY - 90,
  distance: el.querySelector('.cafe-gallery-track').scrollWidth - el.querySelector('.cafe-spaces-window').clientWidth,
}))
const trackX = page => page.locator('.cafe-gallery-track').evaluate(el => getComputedStyle(el).transform === 'none' ? 0 : new DOMMatrixReadOnly(getComputedStyle(el).transform).m41)
const sampleAlpha = page => page.locator('.cafe-glass canvas').evaluate(c => c.getContext('2d').getImageData(Math.round(c.width * .27), Math.round(c.height * .45), 1, 1).data[3])
try {
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 1000 }, recordVideo: { dir: `${dir}/recordings/raw`, size: { width: 1440, height: 1000 } } })
  const page = await open(desktop), video = page.video()
  await ready(page); await page.waitForTimeout(700); await shot(page, '01-desktop-frosted')
  let box = await page.locator('.cafe-glass').boundingBox()
  await page.mouse.move(box.x + box.width * .12, box.y + box.height * .45)
  await page.mouse.move(box.x + box.width * .48, box.y + box.height * .45, { steps: 40 })
  await page.waitForTimeout(200)
  const partial = Number(await page.locator('.cafe-glass').getAttribute('data-cleared'))
  assert.ok(partial > .02 && partial < .4)
  const alpha = await sampleAlpha(page); assert.ok(alpha < 100)
  await shot(page, '02-desktop-partial')
  await page.setViewportSize({ width: 1380, height: 1000 }); await page.waitForTimeout(250)
  const resizedAlpha = await sampleAlpha(page); assert.ok(resizedAlpha < 100)
  await page.setViewportSize({ width: 1440, height: 1000 }); await page.waitForTimeout(200)
  box = await page.locator('.cafe-glass').boundingBox()
  for (const row of Array.from({ length: 19 }, (_, i) => i / 18)) {
    await page.mouse.move(box.x + box.width * .001, box.y + Math.max(1, Math.min(box.height - 1, box.height * row)))
    await page.mouse.move(box.x + box.width * .999, box.y + Math.max(1, Math.min(box.height - 1, box.height * row)), { steps: 70 })
    await page.waitForTimeout(180)
    if (await page.locator('.cafe-glass').getAttribute('data-revealed') === 'true') break
  }
  await page.waitForFunction(() => document.querySelector('.cafe-glass').dataset.revealed === 'true')
  const coverage = Number(await page.locator('.cafe-glass').getAttribute('data-cleared'))
  assert.ok(coverage >= .65 && coverage <= 1)
  await page.waitForTimeout(1700); await shot(page, '03-desktop-revealed')
  assert.equal(await page.locator('.cafe-glass canvas').evaluate(el => Number(getComputedStyle(el).opacity)), 0)
  const frameTop = await page.locator('.cafe-glass').evaluate(el => el.getBoundingClientRect().top + scrollY)
  await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(200)
  await page.evaluate(y => scrollTo(0, y - 160), frameTop); await page.waitForTimeout(250)
  assert.equal(await page.locator('.cafe-glass').getAttribute('data-revealed'), 'true')
  assert.ok(await page.locator('.cafe-gallery-spaces').evaluate(el => el.classList.contains('is-scroll-driven')))
  await page.waitForTimeout(300)
  const geometry = await pinGeometry(page)
  await page.evaluate(y => scrollTo(0, y), geometry.start); await page.waitForTimeout(900)
  assert.ok(Math.abs(await trackX(page)) < 4)
  await shot(page, '04-desktop-gallery-start')
  for (let i = 1; i <= 42; i++) {
    await page.evaluate(y => scrollTo(0, y), geometry.start + geometry.distance * i / 42)
    await page.waitForTimeout(65)
    if (i === 23) await shot(page, '05-desktop-gallery-middle')
  }
  await page.waitForTimeout(850)
  assert.ok(Math.abs(await trackX(page) + geometry.distance) < 4)
  await shot(page, '06-desktop-gallery-end')
  await page.evaluate(y => scrollTo(0, y), geometry.start + geometry.distance + 1000); await page.waitForTimeout(400)
  assert.ok((await page.locator('.cafe-gallery-spaces').boundingBox()).y < 0)
  await shot(page, '07-desktop-pin-released')
  for (let i = 30; i >= 0; i--) { await page.evaluate(y => scrollTo(0, y), geometry.start + geometry.distance * i / 30); await page.waitForTimeout(55) }
  await page.waitForTimeout(850); assert.ok(Math.abs(await trackX(page)) < 4)
  await page.getByRole('button', { name: 'View café photo: The long table', exact: true }).click()
  await page.locator('.cafe-gallery-viewer img').evaluate(i => i.decode()); await shot(page, '08-desktop-fullscreen')
  await page.keyboard.press('ArrowRight'); assert.match(await page.locator('.cafe-gallery-viewer-bottom').innerText(), /The evening rooftop/)
  for (let i = 0; i < 6; i++) { await page.keyboard.press('Tab'); assert.equal(await page.evaluate(() => Boolean(document.activeElement?.closest('dialog'))), true) }
  await page.keyboard.press('Escape'); await page.locator('.cafe-gallery-viewer').waitFor({ state: 'detached' })
  assert.notEqual(await page.evaluate(() => document.body.style.overflow), 'hidden')
  // Gallery state survives SPA navigation and its ScrollTriggers do not accumulate.
  await page.locator('.premium-header-links').getByRole('link', { name: /Our Story/i }).click(); await page.waitForURL('**/about')
  await page.locator('#cafe-gallery').waitFor({ state: 'detached' }); assert.equal(await page.locator('.pin-spacer-mangosteen-cafe-gallery').count(), 0)
  await page.goBack(); await page.locator('.cafe-glass[data-revealed=true]').waitFor()
  assert.equal(await page.locator('.pin-spacer-mangosteen-cafe-gallery').count(), 1)
  report.desktop = { partialCoverage: partial, autoRevealCoverage: coverage, erasedAlpha: alpha, alphaAfterResize: resizedAlpha, canvasPixelBudget: await page.locator('.cafe-glass').getAttribute('data-canvas-pixels'), scrollDistance: geometry.distance, reversible: true, pinRelease: true, fullscreenPreserved: true, spaStatePersists: true, noDuplicatePin: true }
  await desktop.close(); report.recordings.push({ label: 'Desktop wipe, automatic reveal and forward/reverse gallery', source: await video.path(), output: `${dir}/recordings/desktop-gallery.mp4` })
  console.log('PASS desktop wipe, mask persistence, auto completion, pin, reverse, release, viewer and cleanup')

  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, recordVideo: { dir: `${dir}/recordings/raw`, size: { width: 390, height: 844 } } })
  const phone = await open(mobile), phoneVideo = phone.video(), cdp = await mobile.newCDPSession(phone)
  const swipe = async (x1, y1, x2, y2) => {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x1, y: y1 }] })
    for (let i = 1; i <= 22; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x1 + (x2 - x1) * i / 22, y: y1 + (y2 - y1) * i / 22 }] }); await phone.waitForTimeout(22) }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await phone.waitForTimeout(350)
  }
  await ready(phone); await shot(phone, '09-mobile-frosted')
  const glass = phone.locator('.cafe-glass')
  let r = await glass.boundingBox(), before = await phone.evaluate(() => scrollY)
  await swipe(r.x + r.width * .5, r.y + r.height * .65, r.x + r.width * .5, r.y + r.height * .25)
  const verticalDelta = await phone.evaluate(() => scrollY) - before
  assert.ok(verticalDelta > 70); assert.equal(Number(await glass.getAttribute('data-cleared')), 0)
  await glass.scrollIntoViewIfNeeded(); r = await glass.boundingBox()
  before = await phone.evaluate(() => scrollY)
  for (const row of [.2, .43, .66, .85, ...Array.from({ length: 31 }, (_, i) => i / 30)]) {
    const wipeY = r.y + Math.max(1, Math.min(r.height - 1, r.height * row))
    await swipe(r.x + 1, wipeY, r.x + r.width - 1, wipeY)
    if (row === .2) { assert.ok(Number(await glass.getAttribute('data-cleared')) > .02); await shot(phone, '10-mobile-partial') }
    if (await glass.getAttribute('data-revealed') === 'true') break
  }
  assert.equal(await glass.getAttribute('data-revealed'), 'true')
  assert.ok(Math.abs(await phone.evaluate(() => scrollY) - before) < 15)
  await phone.waitForTimeout(1700); await shot(phone, '11-mobile-revealed')
  const phoneCoverage = Number(await glass.getAttribute('data-cleared'))
  await phone.locator('.cafe-gallery-spaces').scrollIntoViewIfNeeded(); await phone.waitForTimeout(300)
  assert.equal(await phone.locator('.cafe-gallery-spaces.is-scroll-driven').count(), 1)
  const phoneGeometry = await pinGeometry(phone)
  await phone.evaluate(y => scrollTo(0, y), phoneGeometry.start); await phone.waitForTimeout(500)
  const initialX = await trackX(phone)
  await swipe(200, 620, 200, 360); await phone.waitForTimeout(500)
  const horizontalDelta = initialX - await trackX(phone)
  assert.ok(horizontalDelta > 100); assert.equal(await phone.locator('dialog').count(), 0)
  await shot(phone, '12-mobile-gallery-swipe')
  const scrollBeforeGallery = await phone.evaluate(() => scrollY)
  await swipe(200, 620, 200, 400)
  assert.ok(Math.abs(await phone.evaluate(() => scrollY) - scrollBeforeGallery) > 50)
  report.mobile = { verticalGesturePageScroll: verticalDelta, verticalGestureCleared: 0, autoRevealCoverage: phoneCoverage, horizontalTravelFromVerticalTouch: horizontalDelta, verticalGalleryScroll: true, scrollDrivenGallery: true }
  await mobile.close(); report.recordings.push({ label: 'Mobile touch wiping and vertical-scroll-controlled gallery', source: await phoneVideo.path(), output: `${dir}/recordings/mobile-gallery.mp4` })
  console.log('PASS real touch: vertical navigation, intentional wiping, automatic reveal and scroll-controlled photographs')

  for (const width of [320, 375, 390, 430, 768, 1440, 1920]) {
    const context = await browser.newContext({ viewport: { width, height: width < 600 ? 844 : 1000 }, isMobile: width < 600, hasTouch: width < 1024 })
    const p = await open(context); await ready(p)
    assert.ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    const pixels = Number(await p.locator('.cafe-glass').getAttribute('data-canvas-pixels')); assert.ok(pixels > 0 && pixels <= 1_205_000)
    assert.equal(await p.locator('.cafe-gallery-track>.cafe-gallery-photo:not(.cafe-gallery-more)').count(), 6)
    const skip = p.getByRole('button', { name: 'Reveal photo', exact: true })
    await skip.focus(); await p.keyboard.press('Enter'); await p.locator('.cafe-glass[data-revealed=true]').waitFor()
    if ([320, 375, 430, 768, 1920].includes(width)) { await p.waitForTimeout(1600); await shot(p, `responsive-${width}`) }
    await p.emulateMedia({ reducedMotion: 'reduce' }); await p.reload(); await p.locator('.cafe-glass[data-revealed=true]').waitFor()
    assert.equal(await p.locator('.cafe-gallery-spaces.is-scroll-driven').count(), 0)
    assert.ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    report.viewports.push({ width, pageOverflow: false, canvasPixels: pixels, photos: 6, keyboardSkip: true, reducedMotionStatic: true })
    await context.close()
  }
  const hashes = JSON.parse(await fs.readFile(`${dir}/before/hashes.json`, 'utf8'))
  for (const [file, hash] of Object.entries(hashes)) {
    if (['src/features/supplied-frontend/CafeGallery.tsx', 'src/features/supplied-frontend/cafe-gallery.css'].includes(file)) continue
    assert.equal(crypto.createHash('sha256').update(await fs.readFile(file)).digest('hex'), hash, `Protected source changed: ${file}`)
  }
  report.checks.push('Only gallery files changed; homepage hero/navbar, menu, reservations, CRM, APIs, data, package dependencies and original photographs are unchanged; full-screen viewer keyboard/focus/close behaviour verified')
  report.checks.push('Seven widths: no horizontal page overflow, bounded Canvas resolution, six preview photographs, keyboard skip and reduced-motion fallback verified')
  assert.deepEqual(report.errors, []); assert.deepEqual(report.consoleErrors, [])
} catch (e) { report.failure = String(e); process.exitCode = 1; console.error(e) }
finally { await fs.writeFile(`${dir}/browser-results.json`, JSON.stringify(report, null, 2)); await browser.close() }
console.log({ desktop: report.desktop, mobile: report.mobile, viewports: report.viewports.length, errors: report.errors, failure: report.failure })
