import { chromium } from 'playwright'
import fs from 'node:fs/promises'
const base = process.env.REVIEW_URL || 'http://127.0.0.1:5181'
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const report = { environment: 'Local production preview, headless Chrome, emulated 390×844 DPR 2 mobile, 4× CPU slowdown, 6 Mbps down / 2 Mbps up / 80 ms latency. Lab measurements, not real-device or field Core Web Vitals. Category/dish photos are currently neutral placeholders, so future photography changes transfer and paint results.', runs: [] }
try {
  for (const route of ['/menu', '/menu?table=4']) for (let run = 1; run <= 3; run++) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
    await context.addInitScript(() => {
      window.__menuMetrics = { lcp: 0, cls: 0, longTasks: [], events: [] }
      new PerformanceObserver(list => { for (const e of list.getEntries()) window.__menuMetrics.lcp = e.startTime }).observe({ type: 'largest-contentful-paint', buffered: true })
      new PerformanceObserver(list => { for (const e of list.getEntries()) if (!e.hadRecentInput) window.__menuMetrics.cls += e.value }).observe({ type: 'layout-shift', buffered: true })
      new PerformanceObserver(list => { for (const e of list.getEntries()) window.__menuMetrics.longTasks.push(e.duration) }).observe({ type: 'longtask', buffered: true })
      new PerformanceObserver(list => { for (const e of list.getEntries()) if (e.interactionId) window.__menuMetrics.events.push({ name: e.name, duration: e.duration, interactionId: e.interactionId }) }).observe({ type: 'event', buffered: true, durationThreshold: 16 })
    })
    const page = await context.newPage()
    const cdp = await context.newCDPSession(page)
    await cdp.send('Network.enable')
    await cdp.send('Network.setCacheDisabled', { cacheDisabled: true })
    await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 80, downloadThroughput: 750000, uploadThroughput: 250000 })
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
    let transfer = 0, requests = 0
    cdp.on('Network.loadingFinished', event => { transfer += event.encodedDataLength; requests++ })
    await page.goto(base + route)
    await page.locator('.dm-menu').waitFor()
    await page.evaluate(() => document.fonts.ready)
    await page.waitForTimeout(1500)
    const initial = await page.evaluate(() => ({ ...window.__menuMetrics, paints: performance.getEntriesByType('paint').map(e => ({ name: e.name, ms: e.startTime })), navigation: performance.getEntriesByType('navigation').map(e => ({ domContentLoaded: e.domContentLoadedEventEnd, load: e.loadEventEnd })), resources: performance.getEntriesByType('resource').map(e => ({ name: new URL(e.name).pathname, transferSize: e.transferSize, encodedBodySize: e.encodedBodySize, decodedBodySize: e.decodedBodySize })) }))
    const initialTransfer = transfer, initialRequests = requests
    // Real menu interactions and smooth forward/reverse scrolling; sample rAF intervals.
    await page.getByRole('button', { name: 'Open menu navigation', exact: true }).tap()
    await page.getByRole('navigation', { name: 'Menu drawer navigation', exact: true }).getByRole('button', { name: 'Categories', exact: true }).tap()
    await page.locator('.dm-category-banner').first().waitFor()
    const animation = await page.evaluate(async () => {
      const intervals = []; let previous = performance.now(); const start = previous
      await new Promise(resolve => {
        function frame(now) {
          intervals.push(now - previous); previous = now
          const progress = Math.min(1, (now - start) / 2400)
          const phase = progress <= .5 ? progress * 2 : (1 - progress) * 2
          scrollTo(0, (document.documentElement.scrollHeight - innerHeight) * phase)
          if (progress < 1) requestAnimationFrame(frame); else resolve()
        }
        requestAnimationFrame(frame)
      })
      const sorted = intervals.slice(1).sort((a,b) => a-b)
      return { sampledFrames: sorted.length, meanFrameMs: sorted.reduce((a,b) => a+b, 0) / sorted.length, p95FrameMs: sorted[Math.floor(sorted.length * .95)], intervalsOver33ms: sorted.filter(x => x > 33.4).length }
    })
    await page.locator('.dm-category-banner').first().tap()
    await page.locator('.dm-dish').first().getByRole('button', { name: /^View / }).tap()
    await page.getByRole('button', { name: 'Close dish details', exact: true }).tap()
    const interactions = await page.evaluate(() => window.__menuMetrics)
    report.runs.push({ route, run, initialTransferBytes: initialTransfer, initialRequests, fullInteractionTransferBytes: transfer, fullInteractionRequests: requests, initial, animation, interactions })
    console.log(route, run, 'LCP', initial.lcp.toFixed(0), 'CLS', initial.cls.toFixed(4), 'bytes', initialTransfer, 'p95frame', animation.p95FrameMs.toFixed(1))
    await context.close()
  }
} finally {
  await fs.writeFile('artifacts/menu-premium-v3/performance.json', JSON.stringify(report, null, 2))
  await browser.close()
}
