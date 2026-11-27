import {chromium} from 'playwright'
import {mkdir,writeFile,readFile} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
const phase=process.argv[2]||'after';assert.ok(['before','after'].includes(phase))
const root=`artifacts/mangosteen-authentic-content-review/${phase}`;await mkdir(root,{recursive:true})
const browser=await chromium.launch({channel:'chrome',headless:true});const report={phase,errors:[],badResponses:[],frames:[],routes:[],viewports:[]}
const watch=page=>{page.on('pageerror',e=>report.errors.push(String(e)));page.on('response',r=>{if(r.status()>=400)report.badResponses.push({url:r.url(),status:r.status()})})}
const ready=async p=>{await p.goto('http://127.0.0.1:5173/');await p.locator('canvas').waitFor();await p.evaluate(()=>document.fonts.ready);await p.waitForFunction(()=>{const c=document.querySelector('canvas');return c.width>0&&c.getContext('2d').getImageData(c.width/2,c.height/2,1,1).data[0]>25})}
try{
 const p=await browser.newPage({viewport:{width:1440,height:1000}});watch(p);await ready(p)
 const end=await p.locator('#top').evaluate(el=>el.offsetHeight-innerHeight)
 for(const progress of [0,.25,.5,.75,1]){await p.evaluate(y=>scrollTo(0,y),end*progress);await p.waitForTimeout(850);const data=await p.locator('canvas').evaluate(c=>c.toDataURL());report.frames.push({progress,hash:createHash('sha256').update(data).digest('hex')});if(progress===.5)await p.screenshot({path:`${root}/hero-middle.jpg`,quality:88})}
 if(phase==='after')assert.deepEqual(report.frames,JSON.parse(await readFile('artifacts/mangosteen-authentic-content-review/before/results.json','utf8')).frames)
 report.heroAnimationUnchanged=phase==='after'?'Five canvas hashes identical to approved design':null
 for(const [label,width,height] of [['desktop',1440,1000],['mobile',390,844]]){
  await p.setViewportSize({width,height});await ready(p)
  const sections=p.locator('.saved-mangosteen main>section');const items=[]
  for(let i=1;i<await sections.count();i++){
   await sections.nth(i).evaluate(el=>el.scrollIntoView());await p.waitForTimeout(650)
   await p.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].filter(i=>i.loading!=='lazy'||i.complete).map(i=>i.decode().catch(()=>{})))})
   await p.screenshot({path:`${root}/${label}-section-${i}.jpg`,quality:85})
   items.push(await sections.nth(i).evaluate(el=>({id:el.id,className:el.className,images:[...el.querySelectorAll('img')].map(img=>({src:img.getAttribute('src'),alt:img.alt,parentClass:img.parentElement.className,width:img.parentElement.getBoundingClientRect().width,height:img.parentElement.getBoundingClientRect().height}))})))
  }
  report.routes.push({path:'/',viewport:{width,height},sections:items})
  for(const route of ['/menu','/about','/locations','/contact']){
   await p.goto('http://127.0.0.1:5173'+route);await p.locator('main,.bm-shell').first().waitFor();await p.evaluate(()=>document.fonts.ready)
   await p.screenshot({path:`${root}/${label}-${route.slice(1)}.jpg`,quality:85});report.routes.push({path:route,viewport:{width,height},images:await p.locator('img').evaluateAll(els=>els.map(e=>({src:e.getAttribute('src'),alt:e.alt,width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height})))})
  }
 }
 for(const [width,height] of [[320,568],[390,844],[768,1024],[1024,768],[1440,900],[1920,1080]]){
  await p.setViewportSize({width,height});await p.goto('http://127.0.0.1:5173/');await p.locator('.saved-mangosteen').waitFor();const metric=await p.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth}));assert.ok(metric.scrollWidth<=width);report.viewports.push({...metric,height})
 }
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.badResponses,[])
 await p.close()
}catch(e){report.failure=String(e);process.exitCode=1;console.error(e)}finally{await writeFile(`${root}/results.json`,JSON.stringify(report,null,2));await browser.close()}
