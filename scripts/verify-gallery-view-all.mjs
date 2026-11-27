import {chromium} from 'playwright'
import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
const dir=process.env.GALLERY_REVIEW_DIR || 'artifacts/gallery-view-all'
await fs.mkdir(dir, { recursive: true })
const browser=await chromium.launch({channel:'chrome',headless:true})
const report={checks:[],viewports:[],errors:[],consoleErrors:[]}
const shot=(p,name)=>p.screenshot({path:`${dir}/${name}.png`})
try {
 for(const mobile of [false,true]) {
  const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:1000},isMobile:mobile,hasTouch:mobile,deviceScaleFactor:mobile?2:1,recordVideo:{dir:`${dir}/raw`,size:mobile?{width:390,height:844}:{width:1440,height:1000}}})
  const p=await context.newPage(); const video=p.video();p.on('pageerror',e=>report.errors.push(e.message));p.on('console',m=>{if(m.type()==='error')report.consoleErrors.push(m.text())})
  await p.goto('http://127.0.0.1:5173/');await p.locator('.cafe-gallery-spaces').scrollIntoViewIfNeeded();await p.waitForTimeout(600)
  assert.equal(await p.locator('.cafe-gallery-photo:not(.cafe-gallery-more)').count(),6)
  assert.equal(await p.getByRole('button',{name:'View all images',exact:true}).count(),1)
  const rail=p.locator('.cafe-spaces-window');let geometry
  if(!mobile){
   assert.ok(await p.locator('.cafe-gallery-spaces').evaluate(e=>e.classList.contains('is-scroll-driven')))
   geometry=await p.locator('.cafe-gallery-spaces').evaluate(e=>({start:e.parentElement.getBoundingClientRect().top+scrollY-90,distance:e.querySelector('.cafe-gallery-track').scrollWidth-e.querySelector('.cafe-spaces-window').clientWidth}))
   await p.evaluate(y=>scrollTo(0,y),geometry.start);await p.waitForTimeout(800);await shot(p,'desktop-start')
   for(let i=0;i<=42;i++){await p.evaluate(y=>scrollTo(0,y),geometry.start+geometry.distance*i/42);await p.waitForTimeout(55)}
   await p.waitForTimeout(850)
  } else {await rail.evaluate(e=>e.scrollLeft=e.scrollWidth);await p.waitForTimeout(400)}
  await shot(p,`${mobile?'mobile':'desktop'}-view-all-card`)
  assert.equal(await p.locator('dialog').count(),0,'Scrolling to the end must not open the gallery automatically')
  if(!mobile){
   // Ignoring the card must release the pin and expose the existing section below.
   await p.evaluate(y=>scrollTo(0,y),geometry.start+geometry.distance+900);await p.waitForTimeout(450)
   assert.ok((await p.locator('.cafe-gallery-spaces').boundingBox()).y<0)
   await shot(p,'desktop-continue-below')
   await p.evaluate(y=>scrollTo(0,y),geometry.start+geometry.distance);await p.waitForTimeout(850)
  }
  const scrollBefore=await p.evaluate(()=>scrollY)
  await p.getByRole('button',{name:'View all images',exact:true}).click()
  await p.locator('.cafe-gallery-viewer.is-collection').waitFor();await p.waitForTimeout(300)
  assert.equal(await p.locator('.cafe-gallery-collection-grid>button').count(),9)
  await shot(p,`${mobile?'mobile':'desktop'}-all-images`)
  const grid=p.locator('.cafe-gallery-collection');await grid.evaluate(e=>e.scrollTop=e.scrollHeight);await p.waitForTimeout(450)
  await p.getByRole('button',{name:'Open photograph: Room for good company',exact:true}).click()
  await p.locator('.cafe-gallery-viewer-image img').evaluate(i=>i.decode());await shot(p,`${mobile?'mobile':'desktop'}-full-photo`)
  assert.match(await p.locator('.cafe-gallery-viewer-bottom').innerText(),/09 \/ 09/)
  await p.keyboard.press('ArrowLeft');assert.match(await p.locator('.cafe-gallery-viewer-bottom').innerText(),/08 \/ 09/)
  await p.getByRole('button',{name:'All images',exact:true}).click();await p.locator('.cafe-gallery-collection-grid').waitFor();await p.waitForTimeout(100)
  assert.ok(await grid.evaluate(e=>e.scrollTop)>50)
  assert.equal(await p.evaluate(()=>document.activeElement?.getAttribute('data-photo-index')),'7')
  for(let i=0;i<13;i++){await p.keyboard.press('Tab');assert.ok(await p.evaluate(()=>Boolean(document.activeElement?.closest('dialog'))))}
  await p.keyboard.press('Escape');await p.locator('dialog').waitFor({state:'detached'})
  assert.equal(await p.evaluate(()=>document.activeElement?.getAttribute('aria-label')),'View all images')
  assert.notEqual(await p.evaluate(()=>document.body.style.overflow),'hidden')
  assert.ok(Math.abs(await p.evaluate(()=>scrollY)-scrollBefore)<10)
  assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))
  if(mobile){
   // Native vertical scroll still works over the horizontal gallery.
   const cdp=await context.newCDPSession(p),before=await p.evaluate(()=>scrollY)
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:180,y:620}]})
   for(let i=1;i<=16;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:180,y:620-i*12}]});await p.waitForTimeout(15)}
   await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await p.waitForTimeout(400)
   assert.ok(Math.abs(await p.evaluate(()=>scrollY)-before)>50)
  }
  report.checks.push(`${mobile?'Mobile':'Desktop'}: six preview photos plus terminal card; nine-photo in-site grid; full photo, keyboard arrows, list position, focus trap, close and original page position preserved`)
  await context.close();report[mobile?'mobileVideo':'desktopVideo']=await video.path()
 }
 for(const width of [320,375,390,430,768,1440,1920]) {
  const c=await browser.newContext({viewport:{width,height:900},isMobile:width<600,hasTouch:width<1024,reducedMotion:'reduce'});const p=await c.newPage()
  await p.goto('http://127.0.0.1:5173/');const rail=p.locator('.cafe-spaces-window');await rail.scrollIntoViewIfNeeded();await rail.evaluate(e=>e.scrollLeft=e.scrollWidth)
  await p.getByRole('button',{name:'View all images',exact:true}).click();await p.locator('dialog').waitFor()
  const layout=await p.evaluate(()=>({page:document.documentElement.scrollWidth<=innerWidth,dialog:document.querySelector('dialog').scrollWidth<=innerWidth,grid:document.querySelector('.cafe-gallery-collection').scrollWidth<=document.querySelector('.cafe-gallery-collection').clientWidth}))
  assert.ok(layout.page&&layout.dialog&&layout.grid)
  await p.getByRole('button',{name:'Close photo gallery'}).click();await p.locator('dialog').waitFor({state:'detached'})
  report.viewports.push({width,...layout});await c.close()
 }
 const hashes=JSON.parse(await fs.readFile('artifacts/cafe-cinematic-gallery/before/hashes.json','utf8'))
 let protectedCount=0
 for(const [file,hash] of Object.entries(hashes)){
  if(['src/features/supplied-frontend/CafeGallery.tsx','src/features/supplied-frontend/cafe-gallery.css'].includes(file))continue
  assert.equal(crypto.createHash('sha256').update(await fs.readFile(file)).digest('hex'),hash,`Protected file changed: ${file}`);protectedCount++
 }
 report.protectedCount=protectedCount
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.consoleErrors,[])
}catch(e){report.failure=String(e);process.exitCode=1;console.error(e)}finally{await fs.writeFile(`${dir}/results.json`,JSON.stringify(report,null,2));await browser.close()}
console.log(report)
