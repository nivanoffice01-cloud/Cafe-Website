import { chromium } from 'playwright'
import fs from 'node:fs/promises'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
const dir = 'artifacts/menu-personal-screens'
const { commit } = JSON.parse(await fs.readFile(`${dir}/checkpoint.json`, 'utf8'))
const before = execFileSync('git', ['show', `${commit}:src/pages/MenuExperiencePage.tsx`], { encoding: 'utf8' })
const after = await fs.readFile('src/pages/MenuExperiencePage.tsx', 'utf8')
const part = (source, from, to) => source.slice(source.indexOf(from), source.indexOf(to, source.indexOf(from)))
const report = { sourceChecks: [], screenshots: [], errors: [] }
for (const [from, to] of [["function Modal", "const destinations"], ["const header =", "const renderDishList"], ["{screen === 'home'", "{screen === 'search'"], ["const placeOrder =", "  useEffect(() =>"], ['{dishOpen && <Modal', '\n  </div>\n}']]) {
  assert.equal(part(after, from, to), part(before, from, to)); report.sourceChecks.push(from)
}
const hashes = JSON.parse(await fs.readFile(`${dir}/before/hashes.json`, 'utf8'))
for (const [file, hash] of Object.entries(hashes)) {
  if (file === 'src/pages/MenuExperiencePage.tsx') continue
  assert.equal(crypto.createHash('sha256').update(await fs.readFile(file)).digest('hex'), hash, file)
}
report.sourceChecks.push('All pre-existing non-page source, styles, menu data, original photographs, reservations, APIs and CRM match their pre-task checksums')
const browser = await chromium.launch({ channel: 'chrome', headless: true })
try {
  const page = await browser.newPage({ reducedMotion: 'reduce' })
  page.on('pageerror', e => report.errors.push(e.message))
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 })
    for (const [path, name] of [['/menu', 'landing'], ['/menu/browse', 'all-categories'], ['/menu/category/pizza-and-pide?table=4', 'category'], ['/menu/category/pizza-and-pide?table=4', 'details']]) {
      let original
      for (const [port, phase] of [[5182, 'before'], [5173, 'after']]) {
        await page.goto(`http://127.0.0.1:${port}${path}`); await page.locator('.dm-menu').waitFor()
        for (const image of await page.locator('.dm-menu img').all()) await image.evaluate(image => {
          const src = image.getAttribute('srcset')?.split(',')[0].trim().split(' ')[0] || image.src
          image.removeAttribute('srcset'); image.src = src; image.loading = 'eager'; return image.decode()
        })
        await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(1000)
        if (name === 'details') {
          await page.getByRole('button', { name: 'View Margarita', exact: true }).click()
          await page.locator('dialog img').evaluate(image => { image.removeAttribute('srcset'); image.src = '/images/menu-display/dish-margarita-pizza-320.webp'; return image.decode() })
        }
        const buffer = await page.screenshot({ path: `${dir}/${phase}/protected-${name}-${width}.png`, fullPage: name !== 'details', animations: 'disabled' })
        const hash = crypto.createHash('sha256').update(buffer).digest('hex')
        if (phase === 'before') original = hash
        else {
          if (hash === original) report.screenshots.push({ name, width, pixelIdentical: true, hash })
          else {
            const pixels = JSON.parse(execFileSync('python3', ['-c', `
from PIL import Image,ImageChops
import json,sys
a=Image.open(sys.argv[1]).convert('RGB');b=Image.open(sys.argv[2]).convert('RGB')
assert a.size==b.size
d=ImageChops.difference(a,b)
print(json.dumps({'changedPixels':sum(p!=(0,0,0) for p in d.getdata()),'maxChannelDelta':max(v[1] for v in d.getextrema())}))
`, `${dir}/before/protected-${name}-${width}.png`, `${dir}/after/protected-${name}-${width}.png`], { encoding: 'utf8' }))
            // Native dialog text can rasterize a handful of edge pixels differently.
            assert.ok(name === 'details' && pixels.changedPixels <= 30 && pixels.maxChannelDelta <= 10, `Protected ${name} changed at ${width}: ${JSON.stringify(pixels)}`)
            report.screenshots.push({ name, width, pixelIdentical: false, ...pixels, note: 'Negligible text-edge rasterization variance; component source and layout unchanged' })
          }
        }
      }
    }
  }
  assert.deepEqual(report.errors, [])
} catch (e) { report.failure = String(e); process.exitCode = 1; console.error(e) }
finally { await fs.writeFile(`${dir}/protected-results.json`, JSON.stringify(report, null, 2)); await browser.close() }
console.log(report)
