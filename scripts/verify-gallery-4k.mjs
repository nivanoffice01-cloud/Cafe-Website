import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import {execFileSync} from 'node:child_process'
import {chromium} from 'playwright'
const dir='artifacts/gallery-4k'
const manifest=JSON.parse(await fs.readFile('src/features/supplied-frontend/gallery-photos.json','utf8'))
const report={assets:[],viewports:[],errors:[],notes:['4K-size exports of AI-assisted restorations, not native 4K captures or exact pixel copies. All original café photographs are retained and available in the viewer.']}
const dimensions=path=>JSON.parse(execFileSync('ffprobe',['-v','error','-select_streams','v:0','-show_entries','stream=width,height','-of','json',path],{encoding:'utf8'})).streams[0]
for(const [key,photo]of Object.entries(manifest)){
 const full=photo.files.at(-1),size=dimensions(`public${full.src}`)
 assert.equal(Math.max(size.width,size.height),3840)
 assert.equal(size.width,full.width);assert.equal(size.height,full.height);assert.equal(photo.enhanced,true)
 assert.ok(await fs.stat(photo.original));assert.ok(await fs.stat(photo.master));
 report.assets.push({key,original:photo.original,master:photo.master,generationDimensions:{width:photo.sourceWidth,height:photo.sourceHeight},export:size,fullFile:full.src,bytes:full.bytes,enhanced:true})
}
const browser=await chromium.launch({channel:'chrome',headless:true})
try{
 for(const width of [320,375,390,430,768,1440,3840]){
  const c=await browser.newContext({viewport:{width,height:width<600?844:width===3840?2160:1000},isMobile:width<600,hasTouch:width<1024,reducedMotion:'reduce'}),p=await c.newPage();p.on('pageerror',e=>report.errors.push(e.message))
  await p.goto('http://127.0.0.1:5173/');await p.locator('.cafe-glass').scrollIntoViewIfNeeded();await p.locator('.cafe-glass-photo').evaluate(i=>i.decode())
  assert.equal(await p.locator('.cafe-glass .cafe-photo-disclosure').innerText(),'AI-enhanced photo')
  if([390,1440].includes(width))await p.screenshot({path:`${dir}/${width}-entrance.png`})
  assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))
  const rail=p.locator('.cafe-spaces-window');await rail.scrollIntoViewIfNeeded();await rail.evaluate(e=>e.scrollLeft=e.scrollWidth)
  await p.getByRole('button',{name:'View all images',exact:true}).click();await p.locator('.cafe-gallery-collection').waitFor()
  assert.equal(await p.locator('.cafe-gallery-collection .cafe-photo-disclosure').count(),9)
  await p.locator('.cafe-gallery-collection-grid button').first().click();const image=p.locator('.cafe-gallery-viewer-image img');await image.evaluate(i=>i.decode())
  assert.equal(await image.getAttribute('data-image-version'),'enhanced')
  const enhanced=await image.evaluate(i=>i.currentSrc);assert.match(enhanced,/cafe-gallery-enhanced/)
  if(width===3840)assert.match(enhanced,/-3840\.webp$/)
  if([390,1440,3840].includes(width))await p.screenshot({path:`${dir}/${width}-enhanced.png`})
  await p.getByRole('button',{name:'View original',exact:true}).click();await image.evaluate(i=>i.decode());assert.equal(await image.getAttribute('data-image-version'),'original');assert.match(await image.evaluate(i=>i.currentSrc),/\/images\/highres\/mangosteen_original_1_8k\.jpg$/)
  if([390,1440].includes(width))await p.screenshot({path:`${dir}/${width}-original.png`})
  await p.getByRole('button',{name:'View enhanced',exact:true}).click();await image.evaluate(i=>i.decode());assert.equal(await image.getAttribute('data-image-version'),'enhanced')
  const overflow=await p.locator('dialog').evaluate(e=>e.scrollWidth>e.clientWidth);assert.equal(overflow,false)
  await p.keyboard.press('Escape');await p.locator('dialog').waitFor({state:'detached'});assert.notEqual(await p.evaluate(()=>document.body.style.overflow),'hidden')
  report.viewports.push({width,enhancedSource:enhanced,disclosures:9,originalToggle:true,overflow:false});await c.close()
 }
 assert.deepEqual(report.errors,[])
}catch(e){report.failure=String(e);process.exitCode=1;console.error(e)}finally{await fs.writeFile(`${dir}/results.json`,JSON.stringify(report,null,2));await browser.close()}
console.log(report)
