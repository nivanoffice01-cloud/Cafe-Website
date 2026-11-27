import { chromium } from 'playwright'
import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import { execFileSync, spawn } from 'node:child_process'
const dir='artifacts/rooftop-map-v4'
const b=await chromium.launch({channel:'chrome',headless:true}),report={checks:[],errors:[],layouts:[]}
try{
 const p=await b.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'})
 p.on('pageerror',e=>report.errors.push(e.message));p.on('console',m=>{if(m.type()==='error')report.errors.push(m.text())})
 const ready=async()=>{await p.locator('.reservation-plan').waitFor();await p.evaluate(async()=>{await document.fonts.ready;const urls=[...new Set([...document.querySelectorAll('.reservation-plan image')].map(e=>e.getAttribute('href')).filter(Boolean))];await Promise.all(urls.map(src=>new Promise((resolve,reject)=>{const image=new Image();image.onload=resolve;image.onerror=()=>reject(Error(src));image.src=src})));await Promise.all([...document.images].filter(i=>i.loading!=='lazy').map(i=>i.decode()))})}
 const open=async()=>{await p.goto('http://127.0.0.1:5173/contact#book');await p.reload();await ready()}
 for(const width of [320,390,768,1440,1920]){
  await p.setViewportSize({width,height:width>=1440?1100:844});await open()
  const layout=await p.evaluate(async()=>{const {visualSeatingGroups,chairPositions}=await import('/src/features/reservations/layout.ts');return visualSeatingGroups('rooftop').map(g=>({...g,chairs:chairPositions(g)}))})
  assert.equal(await p.locator('.reservation-furniture').count(),8);assert.equal(await p.locator('.reservation-chair').count(),28)
  for(const g of layout){const node=p.locator(`[data-table-id="${g.id}"]`);assert.equal(await node.getAttribute('transform'),`translate(${g.x} ${g.y}) rotate(${g.rotation})`);for(const [i,c] of g.chairs.entries())assert.equal(await node.locator('.reservation-chair').nth(i).getAttribute('transform'),`translate(${c.x} ${c.y})`)}
  const plants=await p.evaluate(async()=>{const {rooftopPlanters}=await import('/src/features/reservations/RooftopEnvironment.tsx');return rooftopPlanters})
  for(const plant of plants){const angle=plant.rotation*Math.PI/180,w=Math.abs(plant.width*Math.cos(angle))+Math.abs(plant.height*Math.sin(angle)),h=Math.abs(plant.height*Math.cos(angle))+Math.abs(plant.width*Math.sin(angle));const box={left:plant.x-w/2,right:plant.x+w/2,top:plant.y-h/2,bottom:plant.y+h/2};const intersects=r=>box.left<r.right&&box.right>r.left&&box.top<r.bottom&&box.bottom>r.top;for(const g of layout){assert.ok(!intersects({left:g.x-g.width/2-5,right:g.x+g.width/2+5,top:g.y-g.height/2-5,bottom:g.y+g.height/2+5}),`Planter overlaps ${g.id}`);for(const chair of g.chairs)assert.ok(!intersects({left:g.x+chair.x-29,right:g.x+chair.x+29,top:g.y+chair.y-29,bottom:g.y+chair.y+29}),`Planter overlaps chair at ${g.id}`)}assert.ok(!intersects({left:390,right:650,top:552,bottom:580}),'Planter obstructs existing entry')}
  await p.locator('[data-table-id="G1"] .reservation-table').click();assert.equal(await p.locator('.reservation-chair[aria-pressed=true]').count(),2)
  assert.equal(await p.locator('[data-table-id="G1"] .reservation-table-ring').evaluate(e=>getComputedStyle(e).stroke),'rgb(244, 236, 220)')
  assert.equal(await p.locator('[data-table-id="G1"] .reservation-table-marker circle').evaluate(e=>getComputedStyle(e).fill),'rgb(27, 58, 40)')
  const metrics=await p.locator('.reservation-backdrop').evaluate(e=>({width:innerWidth,pageWidth:e.scrollWidth,mapWidth:e.querySelector('.reservation-seat-map').getBoundingClientRect().width}));assert.ok(metrics.pageWidth<=width);report.layouts.push(metrics)
  if([390,1440,1920].includes(width)){await p.locator('.reservation-plan').screenshot({path:`${dir}/after/map-${width}.png`,animations:'disabled'});await p.locator('.reservation-backdrop').evaluate(e=>e.scrollTop=0);await p.screenshot({path:`${dir}/after/page-${width}.png`,animations:'disabled'})}
  if(width===390){await p.getByRole('button',{name:'Fit plan',exact:true}).click();await p.locator('.reservation-backdrop').evaluate(e=>e.scrollTop+=e.querySelector('.reservation-plan').getBoundingClientRect().top-90);await p.locator('.reservation-plan').screenshot({path:`${dir}/after/overview-mobile.png`});await p.getByRole('button',{name:'Explore',exact:true}).click();await p.locator('.reservation-backdrop').evaluate(e=>e.scrollTop+=e.querySelector('.reservation-plan').getBoundingClientRect().top-90);await p.screenshot({path:`${dir}/after/mobile-map-screen.png`,animations:'disabled'})}
 }
 report.checks.push('Five viewport widths: unchanged eight rooftop groups / 28 seats and exact transforms; all planter footprints clear of table/chair targets and entry; forest-green/ivory selection; no page overflow or image failures')
 // Match the previous approved indoor screenshot exactly: four guests, Dining 02.
 await p.setViewportSize({width:1440,height:1000});await open();await p.getByRole('button',{name:'Number of guests',exact:true}).click();await p.getByRole('button',{name:'Add a guest',exact:true}).click();await p.getByRole('button',{name:'Add a guest',exact:true}).click();await p.getByRole('button',{name:/Done/}).click();await p.getByRole('button',{name:'Seating area',exact:true}).click();await p.getByRole('button',{name:/Inside Mangosteen/}).click();await ready();await p.locator('[data-table-id="D2"] .reservation-table').click();const seat=p.getByRole('button',{name:'Preferred seat D2-1 at Dining 02',exact:true});await seat.click();await seat.click();await p.locator('.reservation-plan').screenshot({path:`${dir}/after/indoor-preservation.png`,animations:'disabled'})
 const baseline=JSON.parse(await fs.readFile(`${dir}/protected-before.json`,'utf8'));for(const [file,hash] of Object.entries(baseline.protected))assert.equal(crypto.createHash('sha256').update(await fs.readFile(file)).digest('hex'),hash,file)
 const before=execFileSync('git',['show',`${baseline.checkpoint}:src/features/reservations/SeatingMap.tsx`],{encoding:'utf8'}),after=await fs.readFile('src/features/reservations/SeatingMap.tsx','utf8');assert.equal(before.split('export function SeatingMap')[1].split('  return <div ref={root}')[0],after.split('export function SeatingMap')[1].split('  return <div ref={root}')[0])
 report.checks.push('Reservation page/styles, booking controls, seating/layout config, menu, marketing, API and backend hashes unchanged; complete map state/interaction/animation code before JSX unchanged')
 assert.deepEqual(report.errors,[])
}catch(e){report.failure=String(e);process.exitCode=1;console.error(e)}finally{await b.close();await fs.writeFile(`${dir}/rooftop-verification.json`,JSON.stringify(report,null,2))}
console.log(report)
// Reuse the existing full reservation/CRM and touch regressions unchanged, writing only here.
if(!process.exitCode){
 for(const [source,name] of [['scripts/verify-reservation-refinement-v3.mjs','business'],['scripts/verify-reservation-touch-motion.mjs','touch-motion']]){
  const text=(await fs.readFile(source,'utf8')).replaceAll("'artifacts/reservation-refinement-v3'",`'${dir}'`)
  const temp=`scripts/.rooftop-v4-${name}-${process.pid}.mjs`;await fs.writeFile(temp,text,{flag:'wx'})
  try{const child=spawn(process.execPath,[temp],{stdio:'inherit'});const code=await new Promise(resolve=>child.on('exit',resolve));if(code)process.exitCode=Number(code)}finally{await fs.unlink(temp)}
  if(process.exitCode)break
 }
}
