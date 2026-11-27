import { chromium } from 'playwright'
import fs from 'node:fs/promises'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'

const base = process.env.REVIEW_URL || 'http://127.0.0.1:5173'
const baseline = process.env.BASELINE_URL || 'http://127.0.0.1:5182'
const dir = 'artifacts/menu-catalogue-refinement'
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const report = { protectedPixels: [], checks: [], viewports: [], errors: [] }
const ready = async page => {
  await page.locator('.dm-menu').waitFor()
  await page.evaluate(() => document.fonts.ready)
}
try {
  const page = await browser.newPage({ reducedMotion: 'reduce' })
  page.on('pageerror', error => report.errors.push(error.message))
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 })
    for (const [path, name] of [['/menu', 'landing'], ['/menu/browse', 'all-categories']]) {
      let before
      for (const [url, phase] of [[baseline, 'before'], [base, 'after']]) {
        await page.goto(url + path); await ready(page)
        for (const image of await page.locator(path === '/menu' ? '.dm-hero-photo,.dm-gallery img' : '.dm-category-banner img').all()) {
          await image.evaluate(image => {
            // Compare the same responsive candidate, independent of Chrome's cache preference.
            const source = image.getAttribute('srcset')?.split(',')[0].trim().split(' ')[0] || image.src
            image.removeAttribute('srcset'); image.src = source; image.loading = 'eager'; return image.decode()
          })
        }
        // Wait for lazily requested font faces to settle before exact pixel comparison.
        await page.waitForTimeout(1000); await page.evaluate(() => document.fonts.ready)
        const buffer = await page.screenshot({ path: `${dir}/${phase}/protected-${name}-${width}.png`, fullPage: true, animations: 'disabled' })
        const hash = crypto.createHash('sha256').update(buffer).digest('hex')
        if (phase === 'before') before = hash
        else { assert.equal(hash, before, `${name} changed at ${width}`); report.protectedPixels.push({ name, width, identical: true, sha256: hash }) }
      }
    }
  }
  report.checks.push('Approved landing/gallery and All Categories screens are pixel-identical with matching decoded image variants to the pre-task Git checkpoint at mobile and desktop sizes')
  for (const width of [320, 375, 390, 430, 1440]) {
    const height = width === 320 ? 568 : width === 1440 ? 1000 : 844
    const context = await browser.newContext({ viewport: { width, height } })
    const page = await context.newPage()
    page.on('pageerror', error => report.errors.push(error.message))
    await page.goto(base + '/menu/category/pizza-and-pide?table=4'); await ready(page)
    await page.screenshot({ path: `${dir}/after/category-${width}.png`, animations: 'disabled' })
    if ([390, 1440].includes(width)) await page.screenshot({ path: `${dir}/after/category-full-${width}.png`, fullPage: true, animations: 'disabled' })
    const photo = await page.locator('.dm-dish .dm-photo').first().boundingBox()
    assert.ok(photo.width >= 94)
    assert.equal(await page.locator('.dm-category-navigation nav button').count(), 13)
    await page.getByRole('button', { name: 'Add Peri-Peri Paneer to My List', exact: true }).click()
    const collision = await page.locator('.dm-dish').first().evaluate(element => {
      const price = element.querySelector('.dm-price').getBoundingClientRect(), quantity = element.querySelector('.dm-quantity').getBoundingClientRect()
      return price.left < quantity.right && price.right > quantity.left && price.top < quantity.bottom && price.bottom > quantity.top
    })
    assert.equal(collision, false)
    await page.getByRole('button', { name: 'View Margarita', exact: true }).click()
    await page.locator('dialog').waitFor()
    await page.screenshot({ path: `${dir}/after/details-${width}.png`, animations: 'disabled' })
    const box = await page.locator('dialog').boundingBox()
    assert.ok(box.x >= 0 && box.x + box.width <= width + .5)
    assert.ok(box.y >= 0 && box.y + box.height <= height + 1)
    for (let i = 0; i < 6; i++) { await page.keyboard.press('Tab'); assert.equal(await page.evaluate(() => Boolean(document.activeElement?.closest('dialog'))), true) }
    await page.getByRole('button', { name: 'Close dish details', exact: true }).click()
    await page.locator('dialog').waitFor({ state: 'detached' })
    assert.equal(await page.getByRole('button', { name: 'View Margarita', exact: true }).evaluate(element => element === document.activeElement), true)
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    report.viewports.push({ width, category: true, details: true, photoWidth: photo.width, priceQuantityOverlap: false, dialogFits: true, focusRestored: true })
    await context.close()
  }
  report.checks.push('320/375/390/430/1440px: enlarged photos, no page overflow, price/quantity separation, sheet fits viewport, focus trap and close focus restoration')
  assert.deepEqual(report.errors, [])
} catch (error) { report.failure = String(error); process.exitCode = 1; console.error(error) }
finally { await fs.writeFile(`${dir}/visual-results.json`, JSON.stringify(report, null, 2)); await browser.close() }
console.log(report)
