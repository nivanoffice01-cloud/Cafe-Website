import {chromium} from 'playwright'
import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
const dir=process.env.GALLERY_SCROLL_REVIEW_DIR || 'artifacts/gallery-mobile-scroll'
await fs.mkdir(dir,{recursive:true})
const browser=await chromium.launch({channel:'chrome',headless:true})
const report={viewports:[],errors:[]}
const matrix=process.env.GALLERY_SCROLL_VIEWPORTS?.split(',').map(size=>size.split('x').map(Number)) ?? [[320,568],[375,667],[390,844],[430,932],[768,1024],[844,390],[667,375],[1440,900]]
const geometry=p=>p.locator('.cafe-gallery-spaces').evaluate(e=>{const distance=e.querySelector('.cafe-gallery-track').scrollWidth-e.querySelector('.cafe-spaces-window').clientWidth;return{start:e.parentElement.getBoundingClientRect().top+scrollY-90,distance,scrollLength:Math.max(distance,1000)}})
const x=p=>p.locator('.cafe-gallery-track').evaluate(e=>getComputedStyle(e).transform==='none'?0:new DOMMatrixReadOnly(getComputedStyle(e).transform).m41)
try{
 for(const [width,height]of matrix){
  const phone=width<1024,record=width===390
  const c=await browser.newContext({viewport:{width,height},isMobile:phone,hasTouch:phone,deviceScaleFactor:record?2:1,...(record?{recordVideo:{dir:`${dir}/raw`,size:{width,height}}}:{})})
  const p=await c.newPage();p.on('pageerror',e=>report.errors.push(e.message));const video=record?p.video():null
  await p.goto('http://127.0.0.1:5173/');await p.locator('.cafe-gallery-spaces').scrollIntoViewIfNeeded();await p.waitForTimeout(600)
  assert.equal(await p.locator('.cafe-gallery-spaces.is-scroll-driven').count(),1)
  const g=await geometry(p)
  await p.evaluate(y=>scrollTo(0,y),g.start);await p.waitForTimeout(750)
  assert.ok(Math.abs(await x(p))<4)
  const firstCard=await p.locator('.cafe-gallery-photo').first().boundingBox()
  if(phone){
   const ratio=firstCard.width/firstCard.height
   if(width<768&&height>500&&height>width)assert.ok(ratio>=0.66&&ratio<1,'Portrait phone cards must grow into the pinned height (portrait, max 2:3)')
   else assert.ok(ratio>1.45&&ratio<1.55,'Landscape/tablet cards must keep a 3:2 composition')
   const gap=height-(await p.locator('.cafe-spaces-progress').boundingBox()).y
   if(width<768&&height>500&&height>width)assert.ok(gap<130,`Pinned gallery leaves ${Math.round(gap)}px of empty space below the progress bar`)
  }
  assert.ok((await p.locator('.cafe-spaces-progress').boundingBox()).y+30<=height)
  if(record){
   await p.screenshot({path:`${dir}/mobile-start.png`});const cdp=await c.newCDPSession(p)
   const touch=async(from,to)=>{await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:195,y:from}]});for(let i=1;i<=24;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:195,y:from+(to-from)*i/24}]});await p.waitForTimeout(15)}await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await p.waitForTimeout(650)}
   await touch(620,380);const forward=await x(p);assert.ok(forward < -100)
   await touch(350,590);const reverse=await x(p);assert.ok(reverse>forward+70)
   report.realTouch={forwardX:forward,reverseX:reverse,nativeHorizontalOffset:await p.locator('.cafe-spaces-window').evaluate(e=>e.scrollLeft)}
   assert.equal(report.realTouch.nativeHorizontalOffset,0)
   for(let i=0;i<=40;i++){await p.evaluate(y=>scrollTo(0,y),g.start+g.scrollLength*i/40);await p.waitForTimeout(50)}
  }
  await p.evaluate(y=>scrollTo(0,y),g.start+g.scrollLength/2);await p.waitForTimeout(750)
  assert.ok(Math.abs(await x(p)+g.distance/2)<4)
  assert.ok(Math.abs((await p.locator('.cafe-gallery-spaces').boundingBox()).y-90)<3)
  if(record)await p.screenshot({path:`${dir}/mobile-middle.png`})
  await p.evaluate(y=>scrollTo(0,y),g.start+g.scrollLength);await p.waitForTimeout(750)
  assert.ok(Math.abs(await x(p)+g.distance)<4)
  const card=p.getByRole('button',{name:'View all images',exact:true})
  const fit=await card.evaluate(e=>{const r=e.getBoundingClientRect();return [...e.children].filter(n=>getComputedStyle(n).display!=='none').every(n=>{const b=n.getBoundingClientRect();return b.top>=r.top-1&&b.bottom<=r.bottom+1})})
  assert.ok(fit,`Terminal card content clipped at ${width}x${height}`)
  await p.screenshot({path:`${dir}/${width}x${height}-end.png`})
  assert.equal(await p.locator('dialog').count(),0)
  if(record){const scroll=await p.evaluate(()=>scrollY);await card.click();await p.locator('.cafe-gallery-collection-grid').waitFor();assert.equal(await p.locator('.cafe-gallery-collection-grid>button').count(),9);await p.getByRole('button',{name:'Close photo gallery'}).click();await p.locator('dialog').waitFor({state:'detached'});assert.ok(Math.abs(await p.evaluate(()=>scrollY)-scroll)<10)}
  await p.evaluate(y=>scrollTo(0,y),g.start+g.scrollLength+900);await p.waitForTimeout(300)
  assert.ok((await p.locator('.cafe-gallery-spaces').boundingBox()).y<0)
  if(record)await p.screenshot({path:`${dir}/mobile-continue-below.png`})
  await p.evaluate(y=>scrollTo(0,y),g.start);await p.waitForTimeout(750);assert.ok(Math.abs(await x(p))<4)
  assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))
  await p.emulateMedia({reducedMotion:'reduce'});await p.waitForTimeout(200)
  assert.equal(await p.locator('.cafe-gallery-spaces.is-scroll-driven').count(),0)
  const rail=p.locator('.cafe-spaces-window');await rail.evaluate(e=>e.scrollLeft=e.scrollWidth);await p.waitForTimeout(200);assert.ok(await rail.evaluate(e=>e.scrollLeft)>100)
  report.viewports.push({width,height,cardWidth:firstCard.width,cardHeight:firstCard.height,scrollDriven:true,forwardReverse:true,release:true,cardFits:true,overflow:false,reducedMotionSwipe:true})
  await c.close();if(video)report.recording=await video.path()
 }
 assert.deepEqual(report.errors,[])
}catch(e){report.failure=String(e);process.exitCode=1;console.error(e)}finally{await fs.writeFile(`${dir}/results.json`,JSON.stringify(report,null,2));await browser.close()}
console.log(report)
