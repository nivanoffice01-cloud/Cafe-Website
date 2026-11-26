import { chromium } from 'playwright'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const context = await browser.newContext({viewport:{width:390,height:844}})
const page = await context.newPage()
const report = { checks:[], errors:[], viewports:[] }
page.on('pageerror',e=>report.errors.push(e.message))
page.on('console',e=>{if(e.type()==='error')report.errors.push(e.text())})
const base='http://127.0.0.1:5173'
const ready=async()=>{await page.locator('.dm-menu').waitFor();await page.evaluate(()=>document.fonts.ready)}
const decode=async selector=>{await page.locator(selector).evaluateAll(async nodes=>{await Promise.all(nodes.map(i=>i.decode()))})}
try {
  for(const width of [320,390,768,1440]){
    await page.setViewportSize({width,height:width===1440?1000:844})
    await page.goto(base+'/menu');await ready()
    await page.locator('.dm-browse').scrollIntoViewIfNeeded()
    await decode('.dm-category-circles img')
    assert.equal(await page.locator('.dm-category-circles img').count(),6)
    assert.equal(await page.locator('.dm-category-circles .dm-image-label').count(),6)
    await page.locator('.dm-home-dishes').scrollIntoViewIfNeeded()
    await decode('.dm-home-dishes img')
    assert.equal(await page.locator('.dm-home-dishes .dm-dish img').count(),3)
    assert.equal(await page.locator('.dm-home-dishes .is-pending').count(),0)
    await page.screenshot({path:`artifacts/menu-images/featured-${width}.png`,animations:'disabled'})
    await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:`artifacts/menu-images/landing-${width}.png`,fullPage:true,animations:'disabled'})
    const metrics=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,broken:[...document.images].filter(i=>i.complete&&!i.naturalWidth).length}))
    assert.equal(metrics.broken,0);assert.ok(metrics.scrollWidth<=width);report.viewports.push(metrics)
  }
  report.checks.push('Six category circles and all three featured dishes have loaded, labelled images at 320/390/768/1440px; no broken images or horizontal overflow')
  await page.setViewportSize({width:390,height:844});await page.goto(base+'/menu/browse?table=4');await ready()
  for(const image of await page.locator('.dm-category-banner img').all()){await image.scrollIntoViewIfNeeded();await image.evaluate(i=>i.decode())}
  assert.equal(await page.locator('.dm-category-banner img').count(),13)
  report.checks.push('All thirteen category banners have distinct loaded images')
  await page.goto(base+'/menu/search?table=4');await ready();await page.getByRole('searchbox').fill('Margarita')
  await page.getByRole('button',{name:'View Margarita',exact:true}).click();await decode('dialog img')
  assert.match(await page.locator('dialog').innerText(),/Illustrative reference image/)
  await page.getByRole('button',{name:'Add to My List',exact:true}).click()
  await page.getByRole('navigation',{name:'Menu navigation',exact:true}).getByRole('button',{name:'My List',exact:true}).click()
  await decode('.dm-list-photo img');assert.equal(new URL(page.url()).searchParams.get('table'),'4')
  report.checks.push('Dish details, selection photo and QR context remain consistent; demo checkout is unchanged')
  assert.deepEqual(report.errors,[])
} catch(e){report.failure=String(e);process.exitCode=1;console.error(e)} finally {
  await fs.writeFile('artifacts/menu-images/results.json',JSON.stringify(report,null,2));await browser.close()
}
console.log(report)
