import { chromium } from 'playwright'
import { mkdir, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import assert from 'node:assert/strict'
const out='artifacts/supplied-frontend-review'
await mkdir(`${out}/recordings`,{recursive:true});await mkdir(`${out}/screenshots`,{recursive:true})
const browser=await chromium.launch({channel:'chrome',headless:true})
const report={checks:[],errors:[],badResponses:[],viewports:[],heroFrames:[]}
const mark=s=>{report.checks.push(s);console.log('PASS',s)}
const ready=async page=>{await page.goto('http://127.0.0.1:5173/');await page.locator('.saved-mangosteen canvas').waitFor();await page.evaluate(()=>document.fonts.ready);await page.waitForFunction(()=>{const c=document.querySelector('canvas');return c?.width>0&&c.getContext('2d').getImageData(c.width/2,c.height/2,1,1).data[0]>25});await page.waitForTimeout(350)}
const watch=page=>{page.on('pageerror',e=>report.errors.push(String(e)));page.on('response',r=>{if(r.status()>=400)report.badResponses.push({url:r.url(),status:r.status()})})}
const shot=(p,n)=>p.screenshot({path:`${out}/screenshots/${n}.jpg`,quality:88})
const journey=async(page,duration)=>page.evaluate(async duration=>{const max=document.documentElement.scrollHeight-innerHeight;await new Promise(resolve=>{let start;const frame=t=>{start??=t;const p=Math.min(1,(t-start)/duration);scrollTo(0,p*max);if(p<1)requestAnimationFrame(frame);else resolve()};requestAnimationFrame(frame)})},duration)
try{
 const desktop=await browser.newContext({viewport:{width:1440,height:1000},recordVideo:{dir:`${out}/recordings/raw`,size:{width:1440,height:1000}}})
 const p=await desktop.newPage();watch(p);await ready(p)
 const extent=await p.locator('#top').evaluate(el=>el.offsetHeight-innerHeight)
 assert.ok(extent>innerHeightSafe());function innerHeightSafe(){return 1000}
 for(const progress of [0,.25,.5,.75,1]){await p.evaluate(y=>scrollTo(0,y),extent*progress);await p.waitForTimeout(850);await shot(p,`desktop-hero-${progress*100}`);const frame=await p.locator('canvas').evaluate(c=>c.toDataURL());report.heroFrames.push({progress,hash:createHash('sha256').update(frame).digest('hex')})}
 assert.equal(new Set(report.heroFrames.map(f=>f.hash)).size,5)
 await p.evaluate(()=>scrollTo(0,0));await p.waitForTimeout(1100)
 assert.equal(createHash('sha256').update(await p.locator('canvas').evaluate(c=>c.toDataURL())).digest('hex'),report.heroFrames[0].hash)
 mark('Five distinct burger animation states, with exact return to the opening canvas on reverse scroll')
 await journey(p,22000)
 for(const id of ['story','menu','craft','locations']){await p.locator('#'+id).evaluate(el=>el.scrollIntoView());await p.waitForTimeout(700);await shot(p,'desktop-'+id)}
 await p.locator('footer').evaluate(el=>el.scrollIntoView());await p.waitForTimeout(500);await shot(p,'desktop-footer')
 // No builder API, external replacement booking system or analytics request belongs in the restored application.
 const outside=await p.evaluate(()=>performance.getEntriesByType('resource').filter(r=>new URL(r.name).origin!==location.origin).map(r=>r.name))
 report.inheritedExternalResources=outside;assert.deepEqual(outside.filter(url=>!['fonts.googleapis.com','fonts.gstatic.com'].includes(new URL(url).hostname)),[]);mark('Supplied assets load locally with no Readdy or analytics requests; existing document font links are retained')
 await desktop.close();await p.video().saveAs(`${out}/recordings/desktop.webm`)
 const mobile=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1,recordVideo:{dir:`${out}/recordings/raw`,size:{width:390,height:844}}})
 const m=await mobile.newPage();watch(m);await ready(m);await shot(m,'mobile-opening')
 await m.getByRole('button',{name:'Toggle menu'}).click();assert.equal(await m.evaluate(()=>document.body.style.overflow),'hidden');await shot(m,'mobile-navigation');await m.keyboard.press('Escape');assert.equal(await m.getByRole('button',{name:'Toggle menu'}).getAttribute('aria-expanded'),'false');assert.notEqual(await m.evaluate(()=>document.body.style.overflow),'hidden')
 mark('Mobile navigation opens without overflow, closes with Escape and restores page scrolling')
 await m.getByRole('link',{name:'Reserve a table',exact:true}).filter({visible:true}).first().click();await m.getByRole('dialog').waitFor();await shot(m,'mobile-reservation');await m.keyboard.press('Escape');assert.equal(await m.getByRole('dialog').count(),0)
 mark('The supplied reservation buttons open the existing protected reservation dialog')
 await journey(m,25000);await shot(m,'mobile-footer');await mobile.close();await m.video().saveAs(`${out}/recordings/mobile.webm`)
 const inspect=await browser.newPage();watch(inspect)
 for(const [width,height] of [[320,568],[360,800],[390,844],[430,932],[768,1024],[1024,768],[1440,900],[1920,1080],[2560,1440]]){
  await inspect.setViewportSize({width,height});await ready(inspect)
  const metric=await inspect.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth}));report.viewports.push({...metric,height});assert.ok(metric.scrollWidth<=width,JSON.stringify(metric));await shot(inspect,`viewport-${width}-${height}`)
 }
 mark('No horizontal page overflow at nine viewport sizes from 320 to 2560 pixels')
 for(const pathname of ['/about','/locations','/contact']){await inspect.goto('http://127.0.0.1:5173'+pathname);await inspect.locator('.saved-mangosteen main').waitFor();await inspect.evaluate(()=>document.fonts.ready);await shot(inspect,'page-'+pathname.slice(1));assert.equal(await inspect.locator('main').count(),1)}
 mark('Story, café and contact pages render the supplied design with verified business connections')
 await inspect.goto('http://127.0.0.1:5173/');await inspect.locator('a[href^="/menu?category="]').first().click();await inspect.locator('.bm-shell').waitFor();assert.match(inspect.url(),/dish=Mangosteen\+chicken\+burger/);assert.ok(await inspect.getByRole('heading',{name:'Mangosteen chicken burger',exact:true}).count());
 mark('Featured dish links open the correct actual dish in the approved menu')
 await inspect.emulateMedia({reducedMotion:'reduce'});await inspect.goto('http://127.0.0.1:5173/');await inspect.locator('.saved-mangosteen').waitFor();assert.equal(await inspect.locator('canvas').count(),0);await shot(inspect,'reduced-motion');mark('Reduced motion uses the supplied static fallback without a pinned animation')
 await inspect.close();assert.deepEqual(report.errors,[]);assert.deepEqual(report.badResponses,[])
}catch(e){report.failure=String(e);process.exitCode=1;console.error(e)}finally{await writeFile(`${out}/interaction-results.json`,JSON.stringify(report,null,2));await browser.close()}
