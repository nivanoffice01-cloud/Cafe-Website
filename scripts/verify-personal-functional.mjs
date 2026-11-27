import { chromium } from 'playwright'
import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import { fullMenu } from '../api/full-menu.mjs'
const base = process.env.REVIEW_URL || 'http://127.0.0.1:5173'
const dir = 'artifacts/menu-personal-screens'
const catalogue = fullMenu.flatMap(c => c.items.map(d => ({ ...d, category: c.name })))
const seed = catalogue.filter(d => ['Margarita', 'Pesto cream Pasta'].includes(d.name)).map(d => ({ ...d, quantity: d.name === 'Margarita' ? 2 : 1 }))
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const report = { checks: [], viewports: [], errors: [], mutations: [] }
try {
  for (const width of [320, 375, 390, 430, 768, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: width === 320 ? 700 : width >= 768 ? 1000 : 844 }, reducedMotion: 'reduce' })
    const page = await context.newPage()
    page.on('pageerror', e => report.errors.push(e.message))
    page.on('request', r => { if (r.method() !== 'GET') report.mutations.push({ method: r.method(), url: r.url() }) })
    const goto = async path => { await page.goto(base + path); await page.locator('.dm-menu').waitFor(); await page.evaluate(() => document.fonts.ready) }
    const shot = async name => { await page.screenshot({ path: `${dir}/after/${name}-${width}.png`, fullPage: true, animations: 'disabled' }); if ([390, 1440].includes(width)) await page.screenshot({ path: `${dir}/after/${name}-viewport-${width}.png`, animations: 'disabled' }) }
    const metrics = async screen => {
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${screen} overflow at ${width}`)
      assert.equal(await page.locator('.dm-bottom-nav').isVisible(), width < 900)
      const broken = await page.evaluate(() => [...document.images].filter(i => i.complete && !i.naturalWidth).length)
      assert.equal(broken, 0)
      report.viewports.push({ width, screen, overflow: false, brokenImages: 0 })
    }
    await goto('/menu')
    await page.evaluate(dishes => { localStorage.setItem('mangosteen-menu-selection', JSON.stringify(dishes)); localStorage.setItem('mangosteen-menu-favourites', JSON.stringify(dishes.map(d => d.category + '|' + d.name))) }, seed)
    await goto('/menu/search?table=4')
    const input = page.getByRole('searchbox', { name: 'Search all dishes' })
    await input.fill('pasta')
    const expected = catalogue.filter(d => `${d.name} ${d.description || ''} ${d.category}`.toLowerCase().includes('pasta'))
    assert.deepEqual(await page.locator('.dm-dish').evaluateAll(nodes => nodes.map(n => n.dataset.dish)), expected.map(d => d.category + '|' + d.name))
    const suggestions = page.getByRole('region', { name: 'Matching categories' })
    assert.equal(await suggestions.getByRole('button').count(), 1)
    assert.match(await suggestions.innerText(), /Pasta\s+10 dishes/)
    await metrics('search-results'); await shot('search')
    await suggestions.getByRole('button').click()
    assert.match(new URL(page.url()).pathname, /category\/pasta$/)
    assert.equal(new URL(page.url()).searchParams.get('table'), '4')
    await page.goBack(); await input.waitFor(); assert.equal(await input.inputValue(), 'pasta')
    await input.fill('no-such-dish-xyz')
    await page.getByRole('heading', { name: 'No dishes found', exact: true }).waitFor()
    assert.equal(await page.locator('.dm-dish').count(), 0)
    await metrics('search-no-results'); if ([390, 1440].includes(width)) await shot('search-empty')
    await page.getByRole('button', { name: 'Clear search', exact: true }).click()
    assert.equal(await input.inputValue(), '')
    assert.equal(await input.evaluate(e => e === document.activeElement), true)
    await input.fill('   '); await page.getByRole('heading', { name: 'What sounds good?', exact: true }).waitFor()
    await goto('/menu/favourites?table=4')
    assert.equal(await page.locator('.dm-dish').count(), 2)
    await metrics('favourites'); await shot('favourites')
    await page.reload(); await page.locator('.dm-dish').first().waitFor(); assert.equal(await page.locator('.dm-dish').count(), 2)
    await page.getByRole('button', { name: 'Remove Margarita from favourites', exact: true }).click()
    assert.equal(await page.locator('.dm-dish').count(), 1)
    await page.getByRole('button', { name: 'Remove Pesto cream Pasta from favourites', exact: true }).click()
    await page.getByRole('heading', { name: 'Nothing saved yet', exact: true }).waitFor()
    await page.getByRole('button', { name: 'Explore Menu', exact: true }).waitFor()
    await metrics('favourites-empty'); if ([390, 1440].includes(width)) await shot('favourites-empty')
    await goto('/menu/selection?table=4')
    assert.match(await page.locator('.dm-list-status').innerText(), /Not submitted/)
    assert.equal(await page.locator('.dm-selection-lines article').count(), 2)
    assert.match(await page.locator('.dm-selection-lines').innerText(), /₹998\s+₹499 each/)
    assert.match(await page.locator('.dm-order-summary').innerText(), /₹1,572/)
    await metrics('my-list'); await shot('selection')
    await page.getByRole('button', { name: 'Add another Margarita', exact: true }).click()
    assert.equal(await page.getByLabel('Quantity of Margarita', { exact: true }).innerText(), '3')
    await page.reload(); await page.locator('.dm-selection-lines').waitFor()
    assert.equal(await page.locator('.dm-quantity output').first().innerText(), '3')
    await page.getByRole('button', { name: 'Remove one Margarita', exact: true }).click()
    await page.getByRole('button', { name: 'Remove Margarita from My List', exact: true }).click()
    assert.equal(await page.locator('.dm-selection-lines article').count(), 1)
    await page.getByRole('button', { name: 'Clear list', exact: true }).click()
    await page.getByRole('heading', { name: 'Your list is empty', exact: true }).waitFor()
    await metrics('my-list-empty'); if ([390, 1440].includes(width)) await shot('selection-empty')
    // Website access still supports search/favourites without exposing QR ordering or erasing the saved list.
    await goto('/menu/search')
    await page.getByRole('searchbox').fill('basil')
    assert.equal(await page.locator('.dm-add,.dm-quantity,.dm-selection-peek,.dm-order-form').count(), 0)
    assert.equal(await page.getByRole('button', { name: /My List/ }).count(), 0)
    await metrics('website-preview-search')
    await context.close()
  }
  report.checks.push('Actual name/description/category search results, category suggestions/counts, category navigation and back/query retention; no-results, clear-focus and whitespace states verified')
  report.checks.push('Favourites persist through reload, remove individually and expose the existing empty-state action; QR selections retain actual unit/line prices, quantities, totals, reload persistence and removal')
  report.checks.push('320/375/390/430/768/1440px, populated and empty screens: no horizontal overflow or broken images; correct fixed navigation; website access stays browse-only')
  assert.deepEqual(report.errors, []); assert.deepEqual(report.mutations, [])
} catch (e) { report.failure = String(e); process.exitCode = 1; console.error(e) }
finally { await fs.writeFile(`${dir}/functional-results.json`, JSON.stringify(report, null, 2)); await browser.close() }
console.log(report)
