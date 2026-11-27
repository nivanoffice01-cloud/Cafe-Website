import { chromium } from 'playwright'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { fullMenu, fullMenuCount } from '../api/full-menu.mjs'
const dir='artifacts/all-menu-images'
await fs.mkdir(dir,{recursive:true})
const browser=await chromium.launch({channel:'chrome',headless:true})
const page=await browser.newPage({viewport:{width:390,height:844}})
const report={checks:[],errors:[],coverage:[]}
page.on('pageerror',e=>report.errors.push(e.message))
page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text())})
const ready=async path=>{await page.goto('http://127.0.0.1:5173'+path);await page.locator('.dm-menu').waitFor();await page.evaluate(()=>document.fonts.ready)}
try{
 await ready('/menu/all')
 assert.equal(await page.locator('.dm-dish').count(),fullMenuCount)
 assert.equal(await page.locator('.dm-dish .is-pending').count(),0)
 assert.equal(await page.locator('.dm-dish .dm-photo img').count(),fullMenuCount)
 assert.ok(await page.locator('.dm-dish .dm-photo img').evaluateAll(images=>images.every(i=>i.loading==='lazy')))
 // Request all images deliberately for completeness verification; production remains lazy.
 await page.locator('.dm-dish img').evaluateAll(async images=>{images.forEach(i=>i.loading='eager');await Promise.all(images.map(i=>i.decode()))})
 report.coverage=await page.locator('.dm-dish').evaluateAll(cards=>cards.map(c=>({key:c.dataset.dish,name:c.querySelector('.dm-dish-copy>strong').textContent,price:c.querySelector('.dm-price').textContent,src:c.querySelector('img').getAttribute('src'),currentSrc:c.querySelector('img').currentSrc,alt:c.querySelector('img').alt,label:c.querySelector('.dm-image-label')?.textContent,width:c.querySelector('img').naturalWidth,height:c.querySelector('img').naturalHeight})))
 assert.deepEqual(report.coverage.map(d=>[d.key,d.price]),fullMenu.flatMap(c=>c.items.map(d=>[`${c.name}|${d.name}`,`₹${d.price.toLocaleString('en-IN')}`])))
 assert.equal(new Set(report.coverage.map(d=>d.src)).size,fullMenuCount)
 assert.ok(report.coverage.every(d=>d.width>0&&d.height>0&&d.label))
 assert.equal(report.coverage.filter(d=>d.label==='AI illustration').length,126)
 assert.equal(report.coverage.filter(d=>d.label==='Reference photo').length,5)
 assert.equal(await page.locator('.dm-add,.dm-quantity,.dm-selection-peek').count(),0)
 report.checks.push('All 131 exact catalogue items have independently mapped, loaded, labelled images; 126 AI illustrations and five retained reference photographs; all prices unchanged; list images lazy by default')
 for(const width of [320,390,768,1440]){
  await page.setViewportSize({width,height:width>=1024?900:844});await ready('/menu/category/burger-and-sandwich')
  await page.locator('.dm-dish img').evaluateAll(async images=>{images.forEach(i=>i.loading='eager');await Promise.all(images.map(i=>i.decode()))})
  assert.equal(await page.locator('.dm-dish .is-pending').count(),0);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))
  await page.screenshot({path:`${dir}/burgers-${width}.png`,fullPage:width===390,animations:'disabled'})
 }
 await page.setViewportSize({width:390,height:844});await ready('/menu/search?table=4');await page.getByRole('searchbox').fill('Bbq Chicken Sendwich')
 await page.getByRole('button',{name:'View Bbq Chicken Sendwich',exact:true}).click();await page.locator('dialog img').evaluate(i=>i.decode())
 assert.match(await page.locator('dialog').innerText(),/AI-generated illustration/)
 await page.screenshot({path:`${dir}/sandwich-details.png`,animations:'disabled'})
 await page.getByRole('button',{name:'Add to My List',exact:true}).click();await page.locator('.dm-header-actions').getByRole('button',{name:/^My List,/}).click();await page.locator('.dm-list-photo img').evaluate(i=>i.decode())
 assert.equal(new URL(page.url()).searchParams.get('table'),'4');assert.ok(await page.locator('.dm-list-photo .dm-image-label').isVisible())
 report.checks.push('320/390/768/1440px burger layouts have no placeholders or overflow; generated-image search, details and QR selection retain matched imagery and disclosure; no live order submitted')
 assert.deepEqual(report.errors,[])
}catch(e){report.failure=String(e);process.exitCode=1;console.error(e)}finally{await fs.writeFile(`${dir}/results.json`,JSON.stringify(report,null,2));await browser.close()}
console.log({checks:report.checks,errors:report.errors,failure:report.failure})
