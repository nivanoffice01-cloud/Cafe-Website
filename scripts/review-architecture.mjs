import { chromium } from 'playwright'
import fs from 'node:fs/promises'
const out='artifacts/mangosteen-architectural-3d-review'
await fs.mkdir(out,{recursive:true})
const browser=await chromium.launch({headless:true})
for(const [name,width,height] of [['desktop',1920,1080],['mobile',390,844]]){
  const context=await browser.newContext({viewport:{width,height},recordVideo:{dir:`${out}/recordings`,size:{width,height}}})
  const page=await context.newPage(),errors=[]
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())})
  const cdp=await context.newCDPSession(page);await cdp.send('Network.enable');let bytes=0;cdp.on('Network.loadingFinished',e=>bytes+=e.encodedDataLength)
  await page.goto('http://127.0.0.1:4173/experience');await page.waitForFunction(()=>window.architecturalReview);await page.waitForTimeout(1800)
  const initialBytes=bytes
  for(const p of [0,.25,.5,.75,1]){await page.evaluate(p=>scrollTo(0,(document.documentElement.scrollHeight-innerHeight)*p),p);await page.waitForTimeout(1000);await page.screenshot({path:`${out}/${name}-${p*100}.png`})}
  await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(1200)
  const timing=await page.evaluate(async()=>{const frames=[];let last=performance.now(),start=last;await new Promise(resolve=>{function tick(now){frames.push(now-last);last=now;const t=Math.min(1,(now-start)/12000);scrollTo(0,(document.documentElement.scrollHeight-innerHeight)*(t<.5?t*2:2-t*2));if(t<1)requestAnimationFrame(tick);else resolve(null)}requestAnimationFrame(tick)});return frames})
  const stats=await page.evaluate(()=>window.architecturalReview.stats())
  let modelDownload
  if(name==='desktop'){
    const download=page.waitForEvent('download')
    await page.evaluate(async()=>{const b=await window.architecturalReview.exportGLB();const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([b],{type:'model/gltf-binary'}));a.download='mangosteen-entrance-study.glb';a.click()})
    modelDownload=await download
    await modelDownload.saveAs('/private/tmp/mangosteen-entrance-study.glb')
  }
  const video=page.video();await context.close();await video.saveAs(`${out}/${name}-entrance.webm`)
  await fs.writeFile(`${out}/${name}-performance.json`,JSON.stringify({initialBytes,fullBytes:bytes,errors,frameIntervalsMs:timing,stats},null,2))
  if(modelDownload){await fs.mkdir('public/models/architectural',{recursive:true});await fs.copyFile('/private/tmp/mangosteen-entrance-study.glb','public/models/architectural/mangosteen-entrance-study.glb')}
}
await browser.close()
