import { chromium } from 'playwright'
import { writeFile, rename } from 'node:fs/promises'
const directory='artifacts/reference-experience/local'
const browser=await chromium.launch()
const measurements=[]
for(const [name,width,height] of [['desktop',1440,1000],['mobile',390,844]]) {
  const context=await browser.newContext({viewport:{width,height},isMobile:name==='mobile',hasTouch:name==='mobile',recordVideo:{dir:directory,size:{width,height}}})
  const page=await context.newPage()
  const session=await context.newCDPSession(page)
  await session.send('Network.enable')
  let transferred=0
  session.on('Network.loadingFinished',event=>{transferred+=event.encodedDataLength})
  await page.goto('http://127.0.0.1:5173/reference-experience')
  await page.evaluate(()=>document.fonts.ready)
  await page.waitForTimeout(1600)
  const initialBytes=transferred
  await page.screenshot({path:`${directory}/${name}-hero.png`})
  await page.getByRole('button',{name:'Next dish',exact:true}).click();await page.waitForTimeout(1500)
  await page.getByRole('button',{name:'Previous dish',exact:true}).click();await page.waitForTimeout(1500)
  // Natural window scrolling: no timeline seeking or synthetic section replacement.
  const timings=await page.evaluate(async()=>{
    const durations=[]
    const max=document.documentElement.scrollHeight-innerHeight
    async function traverse(from,to,seconds){
      await new Promise(resolve=>{let start,last;function frame(now){start??=now;last??=now;durations.push(now-last);last=now;const p=Math.min(1,(now-start)/(seconds*1000));window.scrollTo(0,from+(to-from)*p);if(p<1)requestAnimationFrame(frame);else resolve()}requestAnimationFrame(frame)})
    }
    await traverse(0,max,18);await traverse(max,0,12)
    return durations.filter(n=>n>0)
  })
  const fullBytes=transferred
  for(const [i,selector] of ['.ref-story','.ref-menu-section','.ref-cafe-photo','.ref-glass','.ref-occasions','.ref-book','.ref-footer'].entries()){
    await page.locator(selector).scrollIntoViewIfNeeded();await page.waitForTimeout(1100)
    await page.screenshot({path:`${directory}/${name}-section-${i}.png`})
  }
  await page.locator('.ref-glass').scrollIntoViewIfNeeded();await page.waitForTimeout(300)
  const box=await page.locator('.ref-glass canvas').boundingBox()
  await page.mouse.move(box.x+box.width*.2,box.y+box.height*.6)
  await page.mouse.down();await page.mouse.move(box.x+box.width*.8,box.y+box.height*.5,{steps:40});await page.mouse.up()
  await page.screenshot({path:`${directory}/${name}-glass.png`})
  await page.getByRole('button',{name:'Wipe the glass to look inside'}).click();await page.waitForTimeout(900)
  await page.screenshot({path:`${directory}/${name}-room-clear.png`})
  const sorted=[...timings].sort((a,b)=>a-b)
  measurements.push({name,width,height,initialTransferredBytes:initialBytes,fullJourneyTransferredBytes:fullBytes,frames:timings.length,medianFrameMs:sorted[Math.floor(sorted.length*.5)],p95FrameMs:sorted[Math.floor(sorted.length*.95)],over50ms:timings.filter(t=>t>50).length,note:'Local Vite development server, headless Chromium on host M4, video recording active; mobile viewport emulation, not physical-device/CWV certification.'})
  const video=page.video();await context.close();await rename(await video.path(),`${directory}/${name}-journey.webm`)
}
await writeFile(`${directory}/performance.json`,JSON.stringify(measurements,null,2))
await browser.close()
