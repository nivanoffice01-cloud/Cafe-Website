import {chromium} from 'playwright'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
const dir='artifacts/gallery-wipe-quality'
const report={viewports:[],errors:[]}
const browser=await chromium.launch({channel:'chrome',headless:true})
try {
 for(const mobile of [false,true]){
  const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1920,height:1080},deviceScaleFactor:mobile?2:1,isMobile:mobile,hasTouch:mobile})
  const p=await context.newPage();p.on('pageerror',e=>report.errors.push(e.message))
  await p.goto('http://127.0.0.1:5173/');await p.locator('.cafe-glass').scrollIntoViewIfNeeded();
  await p.waitForFunction(()=>document.querySelector('.cafe-glass')?.classList.contains('is-ready'))
  const glass=p.locator('.cafe-glass'),box=await glass.boundingBox(),cdp=mobile?await context.newCDPSession(p):null
  const wipe=async row=>{
   const y=box.y+Math.max(1,Math.min(box.height-1,box.height*row)),left=box.x+1,right=box.x+box.width-1
   if(mobile){
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:left,y}]})
    for(let i=1;i<=24;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:left+(right-left)*i/24,y}]});await p.waitForTimeout(12)}
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]})
   }else{await p.mouse.move(left,y);await p.mouse.move(right,y,{steps:45});await p.mouse.move(box.x-1,y)}
   await p.waitForTimeout(140)
  }
  await p.screenshot({path:`${dir}/${mobile?'mobile':'desktop'}-initial.png`})
  for(const row of [.2,.45,.7]) await wipe(row)
  assert.equal(await glass.getAttribute('data-revealed'),'false','Three swipes must not clear the untouched window')
  const coverageAfterThree=+await glass.getAttribute('data-cleared')
  assert.ok(coverageAfterThree>0 && coverageAfterThree<.65)
  await p.screenshot({path:`${dir}/${mobile?'mobile':'desktop'}-three-swipes.png`})
  for(let row=0;row<=1.001;row+=mobile?.035:.07){await wipe(Math.min(1,row));if(await glass.getAttribute('data-revealed')==='true')break}
  const finalCoverage=+await glass.getAttribute('data-cleared')
  assert.equal(await glass.getAttribute('data-revealed'),'true',`Full surface wiping must finish (coverage ${finalCoverage})`)
  assert.ok(finalCoverage>=.65)
  await p.waitForTimeout(1700)
  await p.screenshot({path:`${dir}/${mobile?'mobile':'desktop'}-revealed.png`})
  const photo=await p.locator('.cafe-glass-photo').evaluate(i=>({url:i.currentSrc,naturalWidth:i.naturalWidth,naturalHeight:i.naturalHeight,slotWidth:i.clientWidth,slotHeight:i.clientHeight}))
  assert.match(photo.url,/cafe-gallery/)
  assert.ok(photo.naturalWidth/photo.naturalHeight>1.4,'Wide frames must use the complete original composition')
  await p.locator('.cafe-gallery-spaces').scrollIntoViewIfNeeded();await p.waitForTimeout(350)
  await p.locator('.cafe-gallery-photo').evaluateAll(buttons=>buttons.forEach(b=>b.querySelector('img').loading='eager'))
  const images=await p.locator('.cafe-gallery-photo img').evaluateAll(async images=>Promise.all(images.map(async i=>{await i.decode();return {url:i.currentSrc,width:i.naturalWidth,height:i.naturalHeight}})))
  // naturalWidth is density-corrected for width-descriptor srcsets; inspect the
  // encoded candidate filename rather than mistaking CSS pixels for file pixels.
  assert.equal(images.length,6);assert.ok(images.every(i=>i.url.includes('/cafe-gallery/') && Number(i.url.match(/-(\d+)\.webp$/)?.[1])>=960))
  await p.screenshot({path:`${dir}/${mobile?'mobile':'desktop'}-gallery.png`})
  // Keyboard arrows and the original native full-screen viewer remain operational.
  const rail=p.locator('.cafe-spaces-window');await rail.focus();await p.keyboard.press('ArrowRight');await p.keyboard.press('Enter');
  await p.locator('dialog').waitFor();await p.keyboard.press('ArrowRight');await p.keyboard.press('Escape');await p.locator('dialog').waitFor({state:'detached'})
  report[mobile?'mobile':'desktop']={coverageAfterThree,finalCoverage,photo,images,viewer:true}
  await context.close()
 }
 for(const width of [320,375,390,430,768,1440,1920]){
  const context=await browser.newContext({viewport:{width,height:900},hasTouch:width<1024,isMobile:width<600})
  const p=await context.newPage();await p.goto('http://127.0.0.1:5173/');await p.locator('.cafe-glass').scrollIntoViewIfNeeded()
  assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))
  await p.getByRole('button',{name:'Reveal photo',exact:true}).click();await p.locator('.cafe-glass[data-revealed=true]').waitFor()
  report.viewports.push({width,overflow:false,skip:true});await context.close()
 }
 assert.deepEqual(report.errors,[])
}catch(e){report.failure=String(e);process.exitCode=1;console.error(e)}finally{await fs.writeFile(`${dir}/results.json`,JSON.stringify(report,null,2));await browser.close()}
console.log(report)
