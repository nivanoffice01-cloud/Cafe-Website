// Exercise both entry modes. Order submissions go only to a disposable CRM.
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import { fullMenu } from '../api/full-menu.mjs'
const dir=process.env.MENU_ACCESS_REVIEW_DIR || 'artifacts/menu-access-modes'
const base=process.env.REVIEW_URL || 'http://127.0.0.1:5173'
await fs.mkdir(dir,{recursive:true})
const fixture=spawn('python3',['-u','-c',`
import sys, tempfile, signal
from pathlib import Path
from http.server import ThreadingHTTPServer
sys.path.insert(0, 'CRM')
import server as crm
with tempfile.TemporaryDirectory(prefix='mangosteen-access-test-') as tmp:
    crm.DATA_DIR=Path(tmp)/'data'
    crm.DB_PATH=crm.DATA_DIR/'test.sqlite3'
    crm.BACKUP_DIR=Path(tmp)/'backups'
    crm.init_database()
    server=ThreadingHTTPServer(('127.0.0.1',0),crm.CRMHandler)
    signal.signal(signal.SIGTERM, lambda *_: sys.exit(0))
    print('READY:'+str(server.server_address[1]),flush=True)
    server.serve_forever()
`],{stdio:['ignore','pipe','pipe']})
let logs='';fixture.stderr.on('data',d=>logs+=d)
const report={checks:[],errors:[],orders:[]}
let browser
try {
 const port=await new Promise((resolve,reject)=>{let text='';const timer=setTimeout(()=>reject(Error('CRM startup timed out')),20000);fixture.stdout.on('data',d=>{text+=d;const m=text.match(/READY:(\d+)/);if(m){clearTimeout(timer);resolve(m[1])}});fixture.on('exit',code=>{clearTimeout(timer);reject(Error(`CRM exited ${code}: ${logs}`))})})
 browser=await chromium.launch({channel:'chrome',headless:true})
 const context=await browser.newContext({viewport:{width:390,height:844}})
 await context.route('**/crm-api/**',async route=>{const r=route.request();if(r.method()==='POST')report.orders.push(r.postDataJSON());const response=await context.request.fetch(`http://127.0.0.1:${port}`+new URL(r.url()).pathname.replace('/crm-api',''),{method:r.method(),headers:r.headers(),data:r.postData()});await route.fulfill({response})})
 const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text())})
 const goto=async path=>{await page.goto(base+path);await page.locator('.dm-menu').waitFor()}
 const preview=async()=>{assert.equal(await page.locator('.dm-add,.dm-quantity,.dm-selection-peek,.dm-order-form,.dm-table-context').count(),0);assert.equal(await page.getByRole('button',{name:/My List/}).count(),0);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))}
 // An old QR cart must neither appear nor be erased during website browsing.
 const dish={...fullMenu.find(c=>c.name==='Pizza & Pide').items.find(d=>d.name==='Margarita'),category:'Pizza & Pide',quantity:1}
 await goto('/menu');await page.evaluate(d=>localStorage.setItem('mangosteen-menu-selection',JSON.stringify([d])),dish)
 for(const width of [320,390,768,1440]){
  await page.setViewportSize({width,height:844})
  for(const path of ['/menu','/menu/browse','/menu/all','/menu/category/pizza-and-pide','/menu/search','/menu/favourites','/menu/selection','/menu/selection?table=invalid']){
   await goto(path);await preview()
   if(path==='/menu/all')assert.equal(await page.locator('.dm-dish').count(),131)
   if(path.startsWith('/menu/selection'))assert.equal(new URL(page.url()).pathname,'/menu/browse')
  }
 }
 assert.equal(report.orders.length,0)
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('mangosteen-menu-selection'))[0].quantity),1)
 report.checks.push('Website entry: 32 route/viewport combinations are browse-only, all 131 dishes retained, invalid QR/selection links fall back to categories, old QR cart remains hidden and unchanged')
 await page.setViewportSize({width:390,height:844});await goto('/menu/search');await page.getByRole('searchbox').fill('Margarita');await preview()
 await page.getByRole('button',{name:'Add Margarita to favourites',exact:true}).click()
 await page.getByRole('button',{name:'View Margarita',exact:true}).click();assert.equal(await page.getByRole('button',{name:'Add to My List',exact:true}).count(),0)
 await page.screenshot({path:`${dir}/website-dish-details.png`,animations:'disabled'})
 await page.keyboard.press('Escape');await page.getByRole('button',{name:'Open favourites',exact:true}).click();await preview();assert.equal(await page.getByRole('button',{name:'View Margarita',exact:true}).count(),1)
 await page.getByRole('button',{name:'Open menu navigation',exact:true}).click();assert.equal(await page.getByRole('navigation',{name:'Menu drawer navigation'}).getByRole('button',{name:'My List',exact:true}).count(),0);await page.keyboard.press('Escape')
 await goto('/menu/category/pizza-and-pide');await page.screenshot({path:`${dir}/website-pizza.png`,animations:'disabled'})
 report.checks.push('Website search, favourites, dish details and drawer work with no selection or checkout controls')
 for(const alias of ['/m?table=4','/menu?table=4']){await goto(alias);assert.equal(new URL(page.url()).pathname,'/menu/browse');assert.match(await page.locator('.dm-table-context').innerText(),/Table 4/)}
 await page.locator('.dm-category-banner').filter({hasText:'Pizza & Pide'}).click();assert.equal(new URL(page.url()).searchParams.get('table'),'4');assert.equal(await page.getByRole('button',{name:'Add another Margarita',exact:true}).count(),1)
 await page.screenshot({path:`${dir}/qr-pizza.png`,animations:'disabled'})
 await page.getByRole('button',{name:'View Margarita',exact:true}).click();await page.getByRole('button',{name:'Add to My List',exact:true}).click()
 await page.locator('.dm-header-actions').getByRole('button',{name:/^My List,/}).click();assert.match(await page.locator('.dm-order-summary').innerText(),/₹1,048/)
 await page.reload();await page.locator('.dm-order-form').waitFor();assert.equal(await page.locator('.dm-quantity output').innerText(),'2')
 await page.getByRole('button',{name:'Remove one Margarita',exact:true}).click();assert.match(await page.locator('.dm-order-summary').innerText(),/₹524/)
 await page.getByPlaceholder('Name for this order').fill('QR Access Regression Guest');await page.getByRole('button',{name:'Demo pay & place order',exact:true}).click()
 await page.getByRole('heading',{name:'Your table is in the kitchen queue.',exact:true}).waitFor()
 assert.equal(report.orders.length,1);assert.equal(report.orders[0].table,'4');assert.equal(report.orders[0].items[0].quantity,1);assert.equal(report.orders[0].items[0].unitPrice,499)
 assert.match(await page.locator('.dm-receipt').innerText(),/No money was transferred/)
 report.checks.push('Both Table 4 QR aliases skip hero; table context, independent details Add, quantities, totals, reload persistence and demo order submission pass against disposable CRM')
 assert.deepEqual(report.errors,[])
} catch(e){report.failure=String(e);process.exitCode=1;console.error(e)}finally{await browser?.close();fixture.kill('SIGTERM');await fs.writeFile(`${dir}/results.json`,JSON.stringify(report,null,2))}
console.log(report)
