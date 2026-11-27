import {chromium} from 'playwright'
import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
const dir='artifacts/reservation-refinement-v3'
const b=await chromium.launch({channel:'chrome',headless:true}),report={checks:[],errors:[]}
try{
 const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'})
 const p=await c.newPage();p.on('pageerror',e=>report.errors.push(e.message));await p.goto('http://127.0.0.1:5173/contact#book');await p.locator('.reservation-plan').waitFor();await p.evaluate(()=>document.fonts.ready)
 const frame=async()=>p.locator('.reservation-backdrop').evaluate(e=>{const plan=e.querySelector('.reservation-plan');e.scrollTop+=plan.getBoundingClientRect().top-92})
 await frame();const client=await c.newCDPSession(p)
 const swipe=async(x1,y1,x2,y2)=>{await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:x1,y:y1}]});for(let i=1;i<=8;i++){await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x1+(x2-x1)*i/8,y:y1+(y2-y1)*i/8}]});await p.waitForTimeout(25)}await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await p.waitForTimeout(180)}
 const before=await p.locator('.reservation-map-scroll').evaluate(e=>e.scrollLeft);await swipe(320,310,90,310);const after=await p.locator('.reservation-map-scroll').evaluate(e=>e.scrollLeft);assert.ok(after-before>50)
 const y1=await p.locator('.reservation-backdrop').evaluate(e=>e.scrollTop);await swipe(190,520,190,330);const y2=await p.locator('.reservation-backdrop').evaluate(e=>e.scrollTop);assert.ok(y2-y1>40)
 report.touch={horizontalPan:after-before,verticalPageScroll:y2-y1};report.checks.push('Real emulated touch swipes pan the map horizontally and scroll the booking page vertically without gesture trapping')
 await p.locator('.reservation-table-list summary').tap();await p.locator('.reservation-table-list button').filter({hasText:'Garden 02'}).tap();await p.locator('.reservation-table-list summary').tap();await frame();await p.screenshot({path:`${dir}/after/mobile-seating-390.png`,animations:'disabled'})
 await p.locator('.reservation-summary').scrollIntoViewIfNeeded();await p.screenshot({path:`${dir}/after/mobile-preview-390.png`,animations:'disabled'})
 const d=await b.newContext({viewport:{width:1440,height:1000},reducedMotion:'no-preference'});const page=await d.newPage();page.on('pageerror',e=>report.errors.push(e.message));await page.goto('http://127.0.0.1:5173/contact#book');await page.locator('.reservation-plan').waitFor();await page.waitForTimeout(900)
 await page.getByRole('button',{name:'Seating area',exact:true}).click();await page.getByRole('button',{name:/Inside Mangosteen/}).click();await page.waitForTimeout(80)
 const running=await page.locator('.reservation-area-photo').evaluate(e=>({opacity:Number(getComputedStyle(e).opacity),clip:getComputedStyle(e).clipPath}));await page.waitForTimeout(750);const complete=await page.locator('.reservation-area-photo').evaluate(e=>({opacity:Number(getComputedStyle(e).opacity),clip:getComputedStyle(e).clipPath}));assert.ok(running.opacity<1);assert.equal(complete.opacity,1);assert.equal(await page.locator('.reservation-furniture').count(),7)
 report.motion={running,complete};report.checks.push('Non-reduced-motion area switch visibly progresses through GSAP photographic mask and opacity states, finishing with fully visible indoor map/photo')
 assert.deepEqual(report.errors,[])
}catch(e){report.failure=String(e);process.exitCode=1;console.error(e)}finally{await fs.writeFile(dir+'/touch-motion.json',JSON.stringify(report,null,2));await b.close()}
console.log(report)
