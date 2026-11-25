import { chromium } from 'playwright'
import { mkdir,writeFile,rename } from 'node:fs/promises'
import assert from 'node:assert/strict'
const base=process.env.REVIEW_URL||'http://localhost:5173'
const dir='artifacts/palazzo-motion/after'
await mkdir(dir,{recursive:true})
const browser=await chromium.launch({channel:'chrome',headless:true})
const report={checks:[],performance:[],errors:[]}
function pass(name){report.checks.push(name);console.log('PASS',name)}
async function context(name,width=1440,height=1000){
  const c=await browser.newContext({viewport:{width,height},isMobile:width<700,hasTouch:width<700,recordVideo:{dir,size:{width,height}}})
  const page=await c.newPage();page.on('pageerror',e=>report.errors.push(e.message))
  const cd=await c.newCDPSession(page);await cd.send('Network.enable');let bytes=0;cd.on('Network.loadingFinished',e=>bytes+=e.encodedDataLength)
  await page.addInitScript(()=>{window.motionMetrics={tasks:[],lcp:0};new PerformanceObserver(list=>list.getEntries().forEach(e=>window.motionMetrics.tasks.push(e.duration))).observe({type:'longtask',buffered:true});new PerformanceObserver(list=>list.getEntries().forEach(e=>window.motionMetrics.lcp=e.startTime)).observe({type:'largest-contentful-paint',buffered:true})})
  await page.goto(`${base}/reference-experience`);await page.waitForTimeout(1700)
  return {page,cd,bytes:()=>bytes,finish:async()=>{const video=page.video();await c.close();await rename(await video.path(),`${dir}/${name}.webm`)}}
}
async function touch(cd,points){await cd.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[points[0]]});for(const point of points.slice(1))await cd.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[point]});await cd.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]})}
try {
for(const[name,width,height]of[['desktop-complete',1440,1000],['mobile-complete',390,844]]){
  const run=await context(name,width,height),{page,cd}=run
  const initialBytes=run.bytes()
  await page.screenshot({path:`${dir}/${name}-hero.png`})
  if(width<700){
    await page.getByRole('button',{name:'Open navigation'}).click();await page.waitForTimeout(650)
    await page.screenshot({path:`${dir}/mobile-navigation.png`});await page.keyboard.press('Escape');await page.getByRole('dialog').waitFor({state:'hidden'})
    await touch(cd,Array.from({length:15},(_,i)=>({x:330-i*20,y:570})));await page.waitForTimeout(1800)
    assert.doesNotMatch(await page.locator('h1').innerText(),/Margarita/);pass('Mobile touch inertia settles and updates dish')
    await touch(cd,Array.from({length:10},(_,i)=>({x:180,y:650-i*25})));await page.waitForTimeout(400)
    assert.ok(await page.evaluate(()=>scrollY)>50);pass('Vertical touch gesture scrolls instead of dragging table')
    await page.evaluate(()=>scrollTo(0,0))
  } else {
    await page.locator('.ref-table-area').focus();await page.keyboard.press('ArrowRight');await page.waitForTimeout(1500)
    assert.match(await page.locator('h1').innerText(),/Pesto/);pass('Table arrow-key navigation')
  }
  const frames=await page.evaluate(async()=>{
    const times=[],max=document.documentElement.scrollHeight-innerHeight
    async function travel(from,to,duration){await new Promise(resolve=>{let start,last;function step(now){start??=now;if(last)times.push(now-last);last=now;const p=Math.min(1,(now-start)/duration);scrollTo(0,from+(to-from)*p);if(p<1)requestAnimationFrame(step);else resolve()}requestAnimationFrame(step)})}
    await travel(0,max,18000);await travel(max,0,12000);return times
  })
  for(const[section,selector]of[['story','.ref-story'],['menu','.ref-menu-section'],['photo','.ref-cafe-photo'],['glass','.ref-glass'],['cards','.ref-occasions'],['booking','.ref-book'],['footer','.ref-footer']]){
    await page.locator(selector).scrollIntoViewIfNeeded();await page.waitForTimeout(1100);await page.screenshot({path:`${dir}/${name}-${section}.png`})
  }
  if(width<700){
    await page.locator('.ref-glass').scrollIntoViewIfNeeded();await page.waitForTimeout(600)
    const canvas=page.locator('.ref-glass canvas'),box=await canvas.boundingBox()
    await touch(cd,Array.from({length:13},(_,i)=>({x:60+i*22,y:box.y+box.height*.55})))
    const erased=await canvas.evaluate(c=>c.getContext('2d').getImageData(Math.floor(c.width*.5),Math.floor(c.height*.55),1,1).data[3])
    assert.equal(erased,0);pass('Mobile touch glass brush follows actual gesture')
    await page.screenshot({path:`${dir}/mobile-glass-touch.png`})
    await page.locator('.ref-footer').scrollIntoViewIfNeeded()
  }
  await page.getByRole('button',{name:'Reserve a table',exact:true}).click();await page.waitForTimeout(700)
  await page.screenshot({path:`${dir}/${name}-reservation.png`});await page.keyboard.press('Escape');await page.getByRole('dialog').waitFor({state:'hidden'})
  assert.notEqual(await page.evaluate(()=>document.body.style.overflow),'hidden')
  pass(`${name}: forward/reverse section journey and reservation close`)
  const measures=await page.evaluate(()=>window.motionMetrics),sorted=frames.slice().sort((a,b)=>a-b)
  report.performance.push({name,initialBytes,fullBytes:run.bytes(),frameSamples:frames.length,medianMs:sorted[Math.floor(sorted.length*.5)],p95Ms:sorted[Math.floor(sorted.length*.95)],framesOver25ms:frames.filter(n=>n>25).length,framesOver50ms:frames.filter(n=>n>50).length,...measures,note:'Chrome on local Mac with recording; mobile is emulated. Long tasks include navigation/module initialization. LCP is a lab observation, not field CWV.'})
  await run.finish()
}
{
  const run=await context('page-transitions'),{page}=run
  // Abort in-flight cover, including a rapid second click.
  await page.locator('.ref-hero-actions a').click();await page.keyboard.press('Escape');await page.waitForTimeout(600)
  assert.match(page.url(),/reference-experience/);pass('Escape interrupts outgoing navigation')
  await page.locator('.ref-menu-section').scrollIntoViewIfNeeded();await page.waitForTimeout(900)
  const scroll=await page.evaluate(()=>scrollY)
  await page.locator('.ref-menu-intro > a').click();await page.waitForURL('**/menu');await page.waitForTimeout(900)
  assert.equal(await page.locator('.mangosteen-page-curtain').evaluate(e=>getComputedStyle(e).visibility),'hidden')
  assert.ok(await page.locator('.bm-shell').isVisible());pass('Covered document navigation reveals approved menu')
  await page.goBack();await page.waitForTimeout(1400)
  assert.match(page.url(),/reference-experience/);assert.ok(Math.abs(await page.evaluate(()=>scrollY)-scroll)<150)
  assert.equal(await page.locator('.mangosteen-page-curtain').evaluate(e=>getComputedStyle(e).visibility),'hidden');pass('Browser Back restores scroll without a stranded cover')
  await page.goForward();await page.waitForTimeout(1000);assert.ok(await page.locator('.bm-shell').isVisible());pass('Browser Forward restores menu')
  await page.goto(`${base}/menu?table=4`);await page.locator('.bm-shell').waitFor();assert.equal(await page.locator('.mangosteen-page-curtain').evaluate(e=>getComputedStyle(e).visibility),'hidden');pass('Direct Table 4 QR access has no entrance curtain')
  await page.goto(`${base}/reference-experience`);await page.locator('.ref-hero-actions a').waitFor();await page.waitForTimeout(1200)
  await page.evaluate(()=>{document.querySelector('.ref-hero-actions a').click();document.querySelector('.ref-header .ref-wordmark').click()})
  await page.waitForURL(base+'/');await page.waitForTimeout(700);pass('Rapid navigation uses the latest destination')
  await run.finish()
}
{
  const run=await context('dining-table'),{page}=run
  await page.mouse.move(850,550);await page.mouse.down();await page.mouse.move(1120,180,{steps:30});await page.mouse.up();await page.waitForTimeout(1800)
  const first=await page.locator('h1').innerText()
  await page.mouse.move(1120,180);await page.mouse.down();await page.mouse.move(850,550,{steps:30});await page.mouse.up();await page.waitForTimeout(1800)
  assert.notEqual(await page.locator('h1').innerText(),first)
  for(let i=0;i<3;i++){await page.getByRole('button',{name:'Next dish',exact:true}).click();await page.waitForTimeout(120)}await page.waitForTimeout(1800)
  assert.equal(await page.locator('.ref-dish-motion').evaluate(e=>getComputedStyle(e).opacity),'1');pass('Table reverse and rapid selections leave text visible')
  await page.screenshot({path:`${dir}/table-settled.png`});await run.finish()
}
{
  const run=await context('glass-wiping'),{page}=run
  await page.locator('.ref-glass').scrollIntoViewIfNeeded();await page.waitForTimeout(800)
  const canvas=page.locator('.ref-glass canvas'),box=await canvas.boundingBox()
  await page.mouse.move(box.x+box.width*.25,box.y+box.height*.55);await page.mouse.move(box.x+box.width*.75,box.y+box.height*.55,{steps:70})
  const alpha=()=>canvas.evaluate(c=>c.getContext('2d').getImageData(Math.floor(c.width*.5),Math.floor(c.height*.55),1,1).data[3])
  assert.equal(await alpha(),0)
  await page.screenshot({path:`${dir}/glass-soft-brush.png`});await page.setViewportSize({width:1280,height:1000});await page.waitForTimeout(500);assert.equal(await alpha(),0);pass('Glass trail persists across responsive resize')
  await page.getByRole('button',{name:'Reveal café',exact:true}).click();await page.waitForTimeout(900);await page.getByRole('button',{name:'Restore the glass'}).click();await page.waitForTimeout(900);assert.ok(await alpha()>200);pass('Accessible reveal and full condensation reset')
  await run.finish()
}
assert.deepEqual(report.errors,[])
}catch(error){report.failure=String(error);console.error(error);process.exitCode=1}
finally{await writeFile(`${dir}/motion-results.json`,JSON.stringify(report,null,2));await browser.close()}
