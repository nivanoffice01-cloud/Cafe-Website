// Reservation visuals and real submissions, using only an isolated CRM database.
import { chromium } from 'playwright'
import { spawn, execFileSync } from 'node:child_process'
import fs from 'node:fs/promises'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'
const dir='artifacts/reservation-refinement-v3'
await fs.mkdir(dir+'/after',{recursive:true})
const report={checks:[],layouts:[],errors:[],requests:[],protected:{}}
const fixture=spawn('python3',['-u','-c',`
import sys,tempfile,signal
from pathlib import Path
from http.server import ThreadingHTTPServer
sys.path.insert(0,'CRM')
import server as crm
with tempfile.TemporaryDirectory(prefix='mangosteen-reservation-v3-') as tmp:
    crm.DATA_DIR=Path(tmp)/'data'
    crm.DB_PATH=crm.DATA_DIR/'test.sqlite3'
    crm.BACKUP_DIR=Path(tmp)/'backups'
    crm.init_database()
    server=ThreadingHTTPServer(('127.0.0.1',0),crm.CRMHandler)
    signal.signal(signal.SIGTERM,lambda *_:sys.exit(0))
    print('READY:'+str(server.server_address[1]),flush=True)
    server.serve_forever()
`],{stdio:['ignore','pipe','pipe']})
let browser,logs='';fixture.stderr.on('data',d=>logs+=d)
try{
 const port=await new Promise((resolve,reject)=>{let out='';const timer=setTimeout(()=>reject(Error('Fixture timeout')),20000);fixture.stdout.on('data',d=>{out+=d;const m=out.match(/READY:(\d+)/);if(m){clearTimeout(timer);resolve(m[1])}});fixture.on('exit',code=>{clearTimeout(timer);reject(Error(`Fixture ${code}: ${logs}`))})})
 const crm=`http://127.0.0.1:${port}`
 browser=await chromium.launch({channel:'chrome',headless:true})
 const context=await browser.newContext({viewport:{width:390,height:844},timezoneId:'Asia/Kolkata',reducedMotion:'reduce'})
 await context.route('**/crm-api/**',async route=>{const r=route.request();if(r.method()==='POST')report.requests.push(r.postDataJSON());const response=await context.request.fetch(crm+new URL(r.url()).pathname.replace('/crm-api',''),{method:r.method(),headers:r.headers(),data:r.postData()});await route.fulfill({response})})
 const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text())})
 const ready=async()=>{await page.locator('.reservation-backdrop').waitFor();await page.evaluate(async()=>{await document.fonts.ready;const urls=[...new Set([...document.querySelectorAll('.reservation-plan image')].map(e=>e.getAttribute('href')))];await Promise.all(urls.map(src=>new Promise((resolve,reject)=>{const i=new Image();i.onload=resolve;i.onerror=()=>reject(Error(src));i.src=src})));await Promise.all([...document.images].filter(i=>i.loading!=='lazy').map(i=>i.decode()))})}
 const area=async zone=>{await page.getByRole('button',{name:'Seating area',exact:true}).click();await page.getByRole('button',{name:zone==='inside'?/Inside Mangosteen/:/The Rooftop/}).click();await ready()}
 const guests=async n=>{await page.getByRole('button',{name:'Number of guests',exact:true}).click();let value=Number(await page.locator('.booking-party-counter strong').innerText());while(value!==n){await page.getByRole('button',{name:value<n?'Add a guest':'Remove a guest',exact:true}).click();value+=value<n?1:-1}await page.getByRole('button',{name:/Done/}).click()}
 for(const width of [320,390,600,768,1024,1440,1920]){
  const height=width===1920?1200:width>=1024?1000:844;await page.setViewportSize({width,height});await page.goto('http://127.0.0.1:5173/contact#book');await page.reload();await ready();await guests(4)
  for(const zone of ['rooftop','inside']){
   if(zone==='inside')await area(zone)
   const groups=await page.evaluate(async zone=>{const {visualSeatingGroups,chairPositions}=await import('/src/features/reservations/layout.ts');return visualSeatingGroups(zone).map(g=>({...g,chairs:chairPositions(g)}))},zone)
   assert.equal(await page.locator('.reservation-chair').count(),zone==='rooftop'?28:26)
   for(const g of groups){const node=page.locator(`[data-table-id="${g.id}"]`);assert.equal(await node.getAttribute('transform'),`translate(${g.x} ${g.y}) rotate(${g.rotation})`);assert.equal(await node.locator('.reservation-chair').count(),g.capacity);for(const [i,c] of g.chairs.entries())assert.equal(await node.locator('.reservation-chair').nth(i).getAttribute('transform'),`translate(${c.x} ${c.y})`)}
   const id=zone==='rooftop'?'G2':'D2';await page.locator(`[data-table-id="${id}"] .reservation-table`).click();assert.equal(await page.locator('.reservation-chair[aria-pressed=true]').count(),4)
   const seat=page.getByRole('button',{name:`Preferred seat ${id}-1 at ${zone==='rooftop'?'Garden 02':'Dining 02'}`,exact:true});await seat.click();assert.equal(await page.locator('.reservation-chair[aria-pressed=true]').count(),3);assert.ok(await page.getByRole('button',{name:'Continue to Details',exact:true}).isDisabled());await seat.click()
   const metrics=await page.locator('.reservation-backdrop').evaluate(e=>({width:innerWidth,scrollWidth:e.scrollWidth,mapWidth:e.querySelector('.reservation-seat-map').getBoundingClientRect().width,photoWidth:e.querySelector('.reservation-area-photo').getBoundingClientRect().width,photoNatural:e.querySelector('.reservation-area-photo img').naturalWidth}));assert.ok(metrics.scrollWidth<=width)
   if(width<=600){const rect=await page.locator(`[data-table-id="${id}"] .reservation-chair-focus`).first().boundingBox();assert.ok(rect.width>=44);const sticky=await page.locator('.reservation-mobile-sticky').boundingBox();assert.ok(sticky.y+sticky.height<=height+1);assert.ok(await page.locator('.reservation-mobile-sticky button').isEnabled());await page.getByRole('button',{name:'Fit plan',exact:true}).click();assert.ok(await page.locator('.reservation-seat-map').evaluate(e=>e.getBoundingClientRect().width<=e.parentElement.clientWidth+1));await page.getByRole('button',{name:'Explore',exact:true}).click()}
   if([390,1440,1920].includes(width)){await page.locator('.reservation-backdrop').evaluate(e=>e.scrollTo(0,0));await page.screenshot({path:`${dir}/after/${zone}-${width}.png`,animations:'disabled'});await page.locator('.reservation-plan').screenshot({path:`${dir}/after/${zone}-map-${width}.png`,animations:'disabled'});await page.locator('.reservation-summary').scrollIntoViewIfNeeded();await page.screenshot({path:`${dir}/after/${zone}-preview-${width}.png`,animations:'disabled'})}
   report.layouts.push({zone,...metrics})
  }
  await page.getByRole('button',{name:'Continue to Details',exact:true}).click();await page.getByRole('button',{name:'Change seats or arrival',exact:true}).click();assert.equal(await page.locator('.reservation-chair[aria-pressed=true]').count(),4)
  await guests(6);assert.equal(await page.locator('.reservation-table[aria-disabled=false]').count(),1);await page.locator('.reservation-table[aria-disabled=false]').focus();await page.keyboard.press('Enter');assert.equal(await page.locator('.reservation-chair[aria-pressed=true]').count(),6)
 }
 report.checks.push('Seven widths / both zones: 15 table groups and 54 seats retain exact transforms, capacities and IDs; individual seat toggles, party filtering, keyboard selection, back persistence, mobile 44px map targets, fit/explore and sticky continuation pass without page overflow')
 // Dedicated 390px pending reservation with an explicitly adjusted seat preference.
 await page.setViewportSize({width:390,height:844});await page.goto('http://127.0.0.1:5173/contact#book');await page.reload();await ready();await guests(4);await area('inside')
 await page.getByRole('button',{name:'Preferred arrival time',exact:true}).click();await page.getByRole('button',{name:'8:00 PM',exact:true}).click()
 await page.getByRole('button',{name:'Preferred date',exact:true}).click();const day=page.locator('.booking-calendar-grid>button:not(:disabled)').nth(1);const date=await day.getAttribute('data-date');await day.click()
 await page.locator('[data-table-id="D1"] .reservation-table').click();await page.getByRole('button',{name:'Preferred seat D1-1 at Dining 01',exact:true}).click();await page.getByRole('button',{name:'Preferred seat D1-5 at Dining 01',exact:true}).click()
 await page.getByRole('button',{name:'Continue to Details',exact:true}).click();await page.getByPlaceholder('Guest name').fill('Reservation Visual V3 Guest');await page.getByPlaceholder('+91',{exact:true}).fill('9876543210')
 await page.screenshot({path:`${dir}/after/guest-details-390.png`,animations:'disabled'});await page.getByRole('button',{name:'Request My Reservation',exact:true}).click();await page.locator('.reservation-receipt').waitFor();assert.match(await page.locator('.reservation-receipt').innerText(),/Pending café confirmation/);await page.screenshot({path:`${dir}/after/confirmation-390.png`,animations:'disabled'})
 assert.equal(report.requests.length,1);assert.deepEqual(report.requests[0].seats,['D1-2','D1-3','D1-4','D1-5']);assert.equal(report.requests[0].date,date);assert.equal(report.requests[0].time,'20:00');assert.equal(report.requests[0].guests,4);assert.equal(report.requests[0].table,'Dining 01')
 const login=await context.request.post(crm+'/api/auth/login',{data:{email:'owner@mangosteen.local',password:'Mangosteen@123'}});assert.ok(login.ok());const data=await (await context.request.get(crm+'/api/bootstrap')).json();assert.ok(data.reservations.some(r=>JSON.stringify(r).includes('Reservation Visual V3 Guest')))
 report.checks.push('Real pending request with changed date/time and non-default D1-2/3/4/5 individual seats reached disposable CRM and appears in authenticated bootstrap; no live reservation created')
 await page.getByRole('button',{name:'Close reservation',exact:true}).click();await page.locator('.reservation-backdrop').waitFor({state:'detached'});assert.notEqual(await page.evaluate(()=>document.body.style.overflow),'hidden')
 const baseline=JSON.parse(await fs.readFile(dir+'/protected-before.json','utf8'))
 for(const [file,hash] of Object.entries(baseline.protected)){assert.equal(crypto.createHash('sha256').update(await fs.readFile(file)).digest('hex'),hash,file);report.protected[file]='byte-identical'}
 const before=execFileSync('git',['show',`${baseline.checkpoint}:src/components/ReservationDialog.tsx`],{encoding:'utf8'}),after=await fs.readFile('src/components/ReservationDialog.tsx','utf8');assert.equal(before.split('  return <div ref={backdropRef}')[0],after.split('  return <div ref={backdropRef}')[0]);report.checks.push('All protected source hashes and reservation state/submission handlers are unchanged; Escape/close restores body scrolling')
 assert.deepEqual(report.errors,[])
}catch(e){report.failure=String(e);process.exitCode=1;console.error(e)}finally{await browser?.close();fixture.kill('SIGTERM');await fs.writeFile(dir+'/verification.json',JSON.stringify(report,null,2))}
console.log({checks:report.checks,layouts:report.layouts.length,errors:report.errors,failure:report.failure})
