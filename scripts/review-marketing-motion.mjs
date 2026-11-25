import { chromium } from 'playwright'
import { mkdir, writeFile } from 'node:fs/promises'
import assert from 'node:assert/strict'

const base = process.env.REVIEW_URL || 'http://127.0.0.1:4174'
const root = 'artifacts/mangosteen-clean-rebuild-review'
await mkdir(`${root}/verified`, { recursive: true })
await mkdir(`${root}/recordings`, { recursive: true })
const browser = await chromium.launch({ channel: 'chrome' })
const report = { checks: [], errors: [], badResponses: [], viewports: [], performance: {} }
const mark = value => { report.checks.push(value); console.log('PASS', value) }
async function context(name, mobile = false) {
  const ctx = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 }, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: 1,
    recordVideo: { dir: `${root}/recordings/raw`, size: mobile ? { width: 390, height: 844 } : { width: 1280, height: 800 } } })
  const page = await ctx.newPage()
  page.on('pageerror', e => report.errors.push(`${name}: ${e.message}`))
  page.on('response', r => { if (r.status() >= 400) report.badResponses.push(`${name}: ${r.status()} ${r.url()}`) })
  const close = async () => { const video = page.video(); await ctx.close(); await video.saveAs(`${root}/recordings/${name}.webm`) }
  return { ctx, page, close }
}
async function ready(page) {
  await page.goto(base); await page.locator('.mg-site').waitFor()
  await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(1300)
}
async function at(page, selector) {
  await page.locator(selector).evaluate(el => window.scrollTo(0, el.getBoundingClientRect().top + scrollY - 60))
  await page.waitForTimeout(950)
}
async function shot(page, name) { await page.screenshot({ path: `${root}/verified/${name}.jpg`, quality: 90 }) }
async function journey(page, duration, reverse = false) {
  await page.evaluate(async ({ duration, reverse }) => {
    const start = performance.now(), distance = document.documentElement.scrollHeight - innerHeight
    await new Promise(resolve => { const step = time => { const p = Math.min(1, (time - start) / duration); scrollTo(0, (reverse ? 1 - p : p) * distance); if (p < 1) requestAnimationFrame(step); else resolve() }; requestAnimationFrame(step) })
  }, { duration, reverse })
}
try {
  const full = await context('desktop-complete'), page = full.page
  const cdp = await full.ctx.newCDPSession(page); let transfer = 0
  await cdp.send('Network.enable'); await cdp.send('Network.setCacheDisabled', { cacheDisabled: true })
  cdp.on('Network.loadingFinished', event => { transfer += event.encodedDataLength })
  await page.addInitScript(() => {
    window.__motionPerf = { frames: [], tasks: [], shifts: 0, lcp: 0 }
    new PerformanceObserver(list => list.getEntries().forEach(e => window.__motionPerf.tasks.push(e.duration))).observe({ type: 'longtask', buffered: true })
    new PerformanceObserver(list => list.getEntries().forEach(e => { if (!e.hadRecentInput) window.__motionPerf.shifts += e.value })).observe({ type: 'layout-shift', buffered: true })
    new PerformanceObserver(list => list.getEntries().forEach(e => { window.__motionPerf.lcp = e.startTime })).observe({ type: 'largest-contentful-paint', buffered: true })
  })
  await ready(page); const initialBytes = transfer
  const initialPath = await page.locator('#mg-arch-path').getAttribute('d')
  const imageTransform = await page.locator('.mg-arch-photo img').evaluate(el => getComputedStyle(el).transform)
  for (const progress of [0, .25, .5, .75, 1]) {
    await page.evaluate(p => { const el = document.querySelector('.mg-entrance'); scrollTo(0, (el.offsetHeight - innerHeight) * p) }, progress)
    await page.waitForTimeout(950); await shot(page, `desktop-arch-${progress * 100}`)
  }
  assert.notEqual(await page.locator('#mg-arch-path').getAttribute('d'), initialPath)
  assert.equal(await page.locator('.mg-arch-photo img').evaluate(el => getComputedStyle(el).transform), imageTransform)
  await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(1100)
  assert.equal(await page.locator('#mg-arch-path').getAttribute('d'), initialPath)
  mark('Arch path genuinely changes with scroll and returns exactly on reverse; photograph is not scaled')
  await page.evaluate(() => { let last = performance.now(); window.__motionPerf.running = true; const frame = now => { if (!window.__motionPerf.running) return; window.__motionPerf.frames.push(now - last); last = now; requestAnimationFrame(frame) }; requestAnimationFrame(frame) })
  await journey(page, 22000); await page.waitForTimeout(1000)
  const metrics = await page.evaluate(() => { window.__motionPerf.running = false; return window.__motionPerf })
  report.performance.desktop = { ...metrics, initialTransferBytes: initialBytes, fullJourneyTransferBytes: transfer, environment: 'Headless desktop Chrome on local Mac; cold HTTP cache; no network throttling' }
  await shot(page, 'desktop-footer'); await full.close(); mark('Complete desktop journey recorded')

  const table = await context('dining-table'), t = table.page; await ready(t); await at(t, '.mg-table-section')
  await t.getByRole('button', { name: 'Next dish', exact: true }).click(); await t.waitForTimeout(1300)
  assert.match(await t.locator('#mg-table-title').innerText(), /Pesto/)
  await t.getByRole('button', { name: 'Previous dish', exact: true }).click(); await t.waitForTimeout(1300)
  assert.match(await t.locator('#mg-table-title').innerText(), /Margarita/)
  await t.locator('.mg-wheel-viewport').focus(); await t.keyboard.press('ArrowRight'); await t.waitForTimeout(1300)
  assert.match(await t.locator('#mg-table-title').innerText(), /Pesto/)
  const beforeDrag = await t.locator('.mg-wheel').getAttribute('style')
  await t.mouse.move(1030, 380); await t.mouse.down(); await t.mouse.move(960, 650, { steps: 25 }); await t.mouse.up(); await t.waitForTimeout(1400)
  assert.notEqual(await t.locator('.mg-wheel').getAttribute('style'), beforeDrag)
  await shot(t, 'desktop-table'); await table.close(); mark('Dining table buttons, keyboard, independent rotation and pointer inertia work')

  const glass = await context('glass-reveal'), g = glass.page; await ready(g); await at(g, '.mg-glass')
  await g.locator('.mg-glass.is-ready').waitFor()
  const canvas = g.locator('.mg-glass canvas'), box = await canvas.boundingBox()
  const alpha = () => canvas.evaluate(c => c.getContext('2d').getImageData(Math.floor(c.width / 2), Math.floor(c.height / 2), 1, 1).data[3])
  assert.ok(await alpha() > 0)
  await g.mouse.move(box.x + box.width * .3, box.y + box.height * .5)
  await g.mouse.move(box.x + box.width * .7, box.y + box.height * .5, { steps: 35 })
  assert.equal(await alpha(), 0); await shot(g, 'glass-wiped')
  await g.getByRole('button', { name: 'Reveal Café' }).click(); assert.match(await g.locator('.mg-glass').getAttribute('class'), /is-clear/)
  await g.getByRole('button', { name: 'Restore the glass' }).click(); assert.ok(await alpha() > 0)
  await glass.close(); mark('Glass brush persistently erases real canvas pixels; accessible reveal and reset work')

  const nav = await context('page-transition'), n = nav.page; await ready(n)
  await n.getByRole('link', { name: 'Explore Menu', exact: true }).first().click()
  await n.waitForURL('**/menu'); await n.locator('.bm-shell').waitFor(); await n.waitForTimeout(700)
  await n.goBack(); await n.locator('.mg-site').waitFor(); await n.waitForTimeout(700)
  assert.equal(await n.locator('.mg-route-curtain').evaluate(el => getComputedStyle(el).visibility), 'hidden')
  await n.goForward(); await n.locator('.bm-shell').waitFor(); await n.waitForTimeout(400)
  const qrRequests = []; n.on('request', req => qrRequests.push(req.url()))
  await n.goto(`${base}/m?table=4`); await n.locator('.bm-shell').waitFor(); assert.match(await n.locator('.bm-brand').innerText(), /Table 4/i)
  assert.equal(qrRequests.some(url => /MarketingPage|gsap|ScrollTrigger/.test(url)), false)
  await nav.close(); mark('Marketing exit, native back/forward, and direct QR bypass work without a stuck curtain')

  const mobile = await context('mobile-complete', true), m = mobile.page
  await m.addInitScript(() => {
    window.__mobilePerf = { frames: [], tasks: [], shifts: 0 }
    new PerformanceObserver(l => l.getEntries().forEach(e => window.__mobilePerf.tasks.push(e.duration))).observe({ type: 'longtask', buffered: true })
    new PerformanceObserver(l => l.getEntries().forEach(e => { if (!e.hadRecentInput) window.__mobilePerf.shifts += e.value })).observe({ type: 'layout-shift', buffered: true })
  })
  const mc = await mobile.ctx.newCDPSession(m); let mobileTransfer = 0
  await mc.send('Network.enable'); await mc.send('Network.setCacheDisabled', { cacheDisabled: true }); mc.on('Network.loadingFinished', e => { mobileTransfer += e.encodedDataLength })
  await ready(m); const mobileInitial = mobileTransfer; await shot(m, 'mobile-hero')
  await m.getByRole('button', { name: 'Open navigation' }).click(); await m.waitForTimeout(650); await shot(m, 'mobile-navigation')
  assert.equal(await m.evaluate(() => document.body.style.overflow), 'hidden')
  await m.getByRole('button', { name: 'Close navigation' }).focus(); await m.keyboard.press('Shift+Tab')
  assert.equal(await m.evaluate(() => document.activeElement.closest('.mg-navigation') !== null), true)
  await m.keyboard.press('Escape'); await m.waitForTimeout(400); assert.equal(await m.locator('.mg-navigation').count(), 0)
  assert.equal(await m.getByRole('button', { name: 'Open navigation' }).evaluate(el => document.activeElement === el), true)
  await m.evaluate(() => { let last = performance.now(); window.__mobilePerf.running = true; const frame = t => { if (!window.__mobilePerf.running) return; window.__mobilePerf.frames.push(t - last); last = t; requestAnimationFrame(frame) }; requestAnimationFrame(frame) })
  await journey(m, 25000); await m.waitForTimeout(500)
  report.performance.mobile = { ...await m.evaluate(() => { window.__mobilePerf.running = false; return window.__mobilePerf }), initialTransferBytes: mobileInitial, fullJourneyTransferBytes: mobileTransfer, environment: '390x844 Chrome touch emulation on local Mac, not physical phone hardware; cold HTTP cache' }
  await at(m, '.mg-wheel-viewport'); const title = await m.locator('#mg-table-title').innerText(); const area = await m.locator('.mg-wheel-viewport').boundingBox()
  await mc.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 300, y: area.y + 220 }] })
  for (let x = 280; x >= 60; x -= 20) await mc.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: area.y + 220 }] })
  await mc.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await m.waitForTimeout(1300)
  assert.notEqual(await m.locator('#mg-table-title').innerText(), title); await shot(m, 'mobile-table')
  await at(m, '.mg-glass'); await m.locator('.mg-glass.is-ready').waitFor(); const mb = await m.locator('.mg-glass canvas').boundingBox()
  await mc.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 80, y: mb.y + mb.height / 2 }] })
  for (let x = 100; x <= 300; x += 20) await mc.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: mb.y + mb.height / 2 }] })
  await mc.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  assert.equal(await m.locator('.mg-glass canvas').evaluate(c => c.getContext('2d').getImageData(c.width / 2, c.height / 2, 1, 1).data[3]), 0)
  await shot(m, 'mobile-glass'); await mobile.close(); mark('Mobile navigation focus/scroll lock, touch table rotation and touch glass wiping pass')

  const inspect = await browser.newPage()
  for (const [width, height] of [[320,568],[360,800],[390,844],[430,932],[768,1024],[1024,768],[1440,900],[1920,1080],[2560,1440],[3440,1440],[3840,2160],[812,375]]) {
    await inspect.setViewportSize({width,height}); await ready(inspect)
    const metric = await inspect.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth }))
    assert.ok(metric.scrollWidth <= width); report.viewports.push({...metric,height}); await shot(inspect, `viewport-${width}-${height}`)
  }
  for (const [label,width,height] of [['desktop',1920,1080],['mobile',390,844]]) {
    await inspect.setViewportSize({width,height}); await ready(inspect)
    for (const section of ['.mg-story','.mg-food-story','.mg-table-section','.mg-spaces','.mg-glass-section','.mg-moments','.mg-closing']) { await at(inspect,section); await shot(inspect,`${label}-${section.slice(4)}`) }
    await inspect.emulateMedia({reducedMotion:'reduce'}); await inspect.reload(); await inspect.locator('.mg-site').waitFor(); await journey(inspect,1500); await inspect.screenshot({path:`${root}/verified/${label}-full-static.jpg`,fullPage:true,quality:85}); await inspect.emulateMedia({reducedMotion:'no-preference'})
  }
  await inspect.emulateMedia({reducedMotion:'reduce'}); await ready(inspect)
  assert.equal(await inspect.locator('.mg-hero').evaluate(el=>getComputedStyle(el).position),'relative')
  await inspect.close(); mark('12 responsive viewports, desktop/mobile section captures, and reduced-motion fallback verified')
  assert.deepEqual(report.errors,[]); assert.deepEqual(report.badResponses,[])
} catch (error) { report.failure=String(error); console.error(error); process.exitCode=1 }
finally {
  for (const value of Object.values(report.performance)) {
    const frames=value.frames.filter(x=>x>0).sort((a,b)=>a-b)
    value.frameStats={samples:frames.length,medianMs:frames[Math.floor(frames.length*.5)],p95Ms:frames[Math.floor(frames.length*.95)],framesOver25ms:frames.filter(x=>x>25).length,framesOver50ms:frames.filter(x=>x>50).length}
    value.longTaskCount=value.tasks.length;value.longTaskTotalMs=value.tasks.reduce((a,b)=>a+b,0);delete value.frames;delete value.tasks;delete value.running
  }
  await writeFile(`${root}/motion-results.json`,JSON.stringify(report,null,2)); await browser.close()
}
