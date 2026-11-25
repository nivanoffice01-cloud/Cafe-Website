import { chromium } from 'playwright'
import fs from 'node:fs/promises'
import { CatmullRomCurve3, Vector3 } from 'three'
const out=process.env.ARCHITECTURE_REVIEW_DIR || 'artifacts/mangosteen-architectural-3d-review'
await fs.mkdir(out,{recursive:true})
const browser=await chromium.launch({headless:process.env.ARCHITECTURE_HEADED!=='1',...(process.env.ARCHITECTURE_BROWSER?{channel:process.env.ARCHITECTURE_BROWSER}:{})})
// Exact camera curves used by the preserved aaa1d6d screenshots.
const oldPositions=new CatmullRomCurve3([[2.8,1.64,13],[1.5,1.64,9],[0,1.64,5],[0,1.64,1],[0,1.64,-3],[.1,1.64,-7],[.4,1.64,-10]].map(p=>new Vector3(...p)),false,'centripetal')
const oldTargets=new CatmullRomCurve3([[0,2.8,0],[0,2.4,-1],[0,1.9,-5],[0,1.7,-8],[.1,1.6,-12],[1.2,1.45,-14],[2.5,1.25,-15]].map(p=>new Vector3(...p)),false,'centripetal')
for(const [name,width,height] of [['desktop',1920,1080],['mobile',390,844]]){
  const context=await browser.newContext({viewport:{width,height},recordVideo:{dir:`${out}/recordings`,size:{width,height}}})
  const page=await context.newPage(),errors=[]
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())})
  const cdp=await context.newCDPSession(page);await cdp.send('Network.enable');let bytes=0;cdp.on('Network.loadingFinished',e=>bytes+=e.encodedDataLength)
  await page.goto('http://127.0.0.1:4173/experience');await page.waitForFunction(()=>window.architecturalReview?.stats().botanicalsReady);await page.waitForTimeout(1800)
  const initialBytes=bytes
  for(const p of [0,.25,.5,.75,1]){await page.evaluate(p=>scrollTo({top:(document.documentElement.scrollHeight-innerHeight)*p,behavior:'instant'}),p);await page.waitForFunction(p=>Math.abs(window.architecturalReview.stats().progress-p)<.001,p);await page.screenshot({path:`${out}/${name}-${p*100}.png`})}
  await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await page.waitForTimeout(1200)
  const timing=await page.evaluate(async()=>{const frames=[],progress=[];let last=performance.now(),start=last;await new Promise(resolve=>{function tick(now){frames.push(now-last);progress.push(window.architecturalReview.stats().progress);last=now;const t=Math.min(1,(now-start)/20000);scrollTo({top:(document.documentElement.scrollHeight-innerHeight)*(t<.5?t*2:2-t*2),behavior:'instant'});if(t<1)requestAnimationFrame(tick);else resolve(null)}requestAnimationFrame(tick)});return {frames,progress}})
  if(Math.max(...timing.progress)<.97)throw Error(`${name}: incomplete walkthrough recording`)
  const stats=await page.evaluate(()=>window.architecturalReview.stats())
  const renderer=await page.evaluate(()=>{const gl=document.querySelector('canvas').getContext('webgl2');const ext=gl.getExtension('WEBGL_debug_renderer_info');return ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):'unavailable'})
  for(const p of [0,.25,.5,.75,1]){
    const position=oldPositions.getPoint(p);if(name==='mobile')position.z+=(1-p)*2.5
    await page.evaluate(({p,position,target})=>{scrollTo({top:(document.documentElement.scrollHeight-innerHeight)*p,behavior:'instant'});window.architecturalReview.pose(position,target)},{p,position:position.toArray(),target:oldTargets.getPoint(p).toArray()})
    await page.waitForTimeout(1000);await page.screenshot({path:`${out}/${name}-matched-${p*100}.png`})
  }
  await page.evaluate(()=>window.architecturalReview.pose([1.4,1.4,-7.4],[3,1.3,-9.7]));await page.waitForTimeout(1000);await page.screenshot({path:`${out}/${name}-furniture-detail.png`})
  await page.evaluate(()=>window.architecturalReview.pose(null))
  await page.evaluate(()=>{scrollTo({top:document.documentElement.scrollHeight,behavior:'instant'});window.architecturalReview.wireframe(true)})
  await page.waitForTimeout(1500);await page.screenshot({path:`${out}/${name}-wireframe.png`})
  await page.evaluate(()=>window.architecturalReview.wireframe(false))
  let modelDownload
  if(name==='desktop'){
    const download=page.waitForEvent('download')
    await page.evaluate(async()=>{const b=await window.architecturalReview.exportGLB();const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([b],{type:'model/gltf-binary'}));a.download='mangosteen-entrance-study.glb';a.click()})
    modelDownload=await download
    await modelDownload.saveAs('/private/tmp/mangosteen-entrance-study.glb')
  }
  const video=page.video();await context.close();await video.saveAs(`${out}/${name}-entrance.webm`)
  await fs.writeFile(`${out}/${name}-performance.json`,JSON.stringify({initialBytes,fullBytes:bytes,errors,renderer,frameIntervalsMs:timing.frames.filter(ms=>ms>0),playbackProgressRange:[Math.min(...timing.progress),Math.max(...timing.progress)],stats},null,2))
  if(modelDownload){await fs.mkdir('public/models/architectural',{recursive:true});await fs.copyFile('/private/tmp/mangosteen-entrance-study.glb','public/models/architectural/mangosteen-entrance-study.glb')}
}
await browser.close()
