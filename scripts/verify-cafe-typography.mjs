import { chromium } from 'playwright'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
const browser = await chromium.launch({channel:'chrome',headless:true})
const page = await browser.newPage({viewport:{width:390,height:844}})
const report={layouts:[],checks:[],errors:[],fontRequests:[]}
page.on('pageerror',e=>report.errors.push(e.message))
page.on('request',r=>{if(r.frame()===page.mainFrame() && /\.(woff2?|ttf)(\?|$)/.test(r.url()))report.fontRequests.push(r.url())})
const paths=['/','/about','/locations','/contact','/menu','/menu/browse','/menu/category/pizza-and-pide','/menu/search','/menu/favourites','/menu/selection']
const ready=async()=>{await page.locator('.saved-mangosteen,.dm-menu').first().waitFor();await page.evaluate(()=>document.fonts.ready)}
try{
 for(const width of [320,390,768,1024,1440]){
  await page.setViewportSize({width,height:width>=1024?900:844})
  for(const path of paths){
   await page.goto('http://127.0.0.1:5173'+path);await ready()
   const metrics=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,lora:document.fonts.check('400 32px Lora'),body:document.fonts.check('400 16px Manrope')}))
   assert.ok(metrics.scrollWidth<=width,`${path} overflows at ${width}: ${metrics.scrollWidth}`);assert.ok(metrics.lora&&metrics.body)
   report.layouts.push({path,...metrics})
   if([390,1440].includes(width)&&['/','/about','/locations','/contact','/menu','/menu/category/pizza-and-pide'].includes(path)){
    await page.waitForTimeout(300);const name=path==='/'?'home':path.split('/').pop();await page.screenshot({path:`artifacts/typography-refresh/after-${name}-${width}.png`})
   }
  }
 }
 report.checks.push('50 route/viewport combinations; Lora and Manrope loaded locally; no horizontal page overflow')
 await page.setViewportSize({width:390,height:844});await page.goto('http://127.0.0.1:5173/');await ready()
 await page.locator('.hero-copy').first().getByRole('link',{name:'Reserve a table',exact:true}).click()
 await page.getByRole('heading',{name:'Find your perfect table.',exact:true}).waitFor();await page.waitForTimeout(600)
 assert.match(await page.locator('.reservation-header h2').evaluate(e=>getComputedStyle(e).fontFamily),/Lora/)
 await page.screenshot({path:'artifacts/typography-refresh/after-reservation-390.png'})
 await page.getByRole('button',{name:'Seating area',exact:true}).click()
 await page.getByRole('button',{name:/Inside Mangosteen/}).click()
 await page.getByRole('button',{name:'Number of guests',exact:true}).click()
 await page.getByRole('button',{name:'Add a guest',exact:true}).click();await page.getByRole('button',{name:/Done/}).click()
 assert.match(await page.getByRole('button',{name:'Number of guests',exact:true}).innerText(),/3 Guests/)
 await page.getByRole('button',{name:'Close reservation',exact:true}).click();await page.locator('.reservation-backdrop').waitFor({state:'detached'})
 report.checks.push('Reservation heading and picker typography consistent; seating area and guest controls still work')
 await page.goto('http://127.0.0.1:5173/menu/search?table=4');await ready()
 await page.getByRole('searchbox').fill('Margarita')
 await page.getByRole('button',{name:'View Margarita',exact:true}).click();await page.waitForTimeout(300)
 assert.match(await page.locator('.dm-sheet-copy h2').evaluate(e=>getComputedStyle(e).fontFamily),/Lora/)
 assert.match(await page.locator('dialog .dm-price').innerText(),/₹499/)
 await page.getByRole('button',{name:'Favourite',exact:true}).click();await page.getByRole('button',{name:'Add to My List',exact:true}).click()
 await page.getByRole('navigation',{name:'Menu navigation',exact:true}).getByRole('button',{name:'My List',exact:true}).click()
 assert.equal(new URL(page.url()).searchParams.get('table'),'4')
 assert.match(await page.locator('.dm-order-summary').innerText(),/₹524/)
 await page.screenshot({path:'artifacts/typography-refresh/after-my-list-390.png'})
 report.checks.push('Search, dish details, ₹ prices, favourites, My List and QR table context preserved; no order submitted')
 assert.ok(report.fontRequests.length>0);assert.ok(report.fontRequests.every(u=>u.startsWith('http://127.0.0.1:5173/')))
 assert.deepEqual(report.errors,[])
 report.checks.push('No external main-document font requests or JavaScript errors')
}catch(e){report.failure=String(e);process.exitCode=1;console.error(e);await page.screenshot({path:'artifacts/typography-refresh/failure.png'})}finally{
 await fs.writeFile('artifacts/typography-refresh/results.json',JSON.stringify(report,null,2));await browser.close()
}
console.log(report.checks)
