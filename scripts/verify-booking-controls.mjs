import {chromium} from 'playwright'
import assert from 'node:assert/strict'
import {spawn,execFileSync} from 'node:child_process'
import {writeFile,mkdir,readFile} from 'node:fs/promises'

const dir='artifacts/reservation-controls'
await mkdir(dir,{recursive:true})
const fixture=spawn('python3',['-u','-c',`
import sys,tempfile,signal
from pathlib import Path
from http.server import ThreadingHTTPServer
sys.path.insert(0,'CRM')
import server as crm
with tempfile.TemporaryDirectory(prefix='mangosteen-controls-') as tmp:
 crm.DATA_DIR=Path(tmp)/'data'
 crm.DB_PATH=crm.DATA_DIR/'fixture.sqlite3'
 crm.BACKUP_DIR=Path(tmp)/'backups'
 crm.init_database()
 server=ThreadingHTTPServer(('127.0.0.1',0),crm.CRMHandler)
 signal.signal(signal.SIGTERM,lambda *_:sys.exit(0))
 print('READY:'+str(server.server_address[1]),flush=True)
 server.serve_forever()
`],{stdio:['ignore','pipe','pipe']})
let logs='';fixture.stderr.on('data',d=>logs+=d)
const port=await new Promise((resolve,reject)=>{let text='';fixture.stdout.on('data',d=>{text+=d;const m=text.match(/READY:(\d+)/);if(m)resolve(m[1])});fixture.on('exit',code=>reject(Error(`Fixture ${code}: ${logs}`)))})
const b=await chromium.launch({channel:'chrome',headless:true})
const report={checks:[],viewports:[],errors:[],consoleErrors:[]}
const mark=text=>{report.checks.push(text);console.log('PASS',text)}
const base='http://127.0.0.1:5173'
try{
 const c=await b.newContext({reducedMotion:'reduce',timezoneId:'Asia/Kolkata'})
 await c.route('**/crm-api/**',async route=>{const r=route.request(),url=new URL(r.url());const response=await c.request.fetch(`http://127.0.0.1:${port}${url.pathname.replace('/crm-api','')}`,{method:r.method(),headers:r.headers(),data:r.postData()});await route.fulfill({response})})
 const p=await c.newPage();p.on('pageerror',e=>report.errors.push(e.message));p.on('console',m=>{if(m.type()==='error')report.consoleErrors.push(m.text())})
 const popup=p.locator('dialog.booking-picker')
 const open=async name=>{await p.getByRole('button',{name,exact:true}).click();await popup.waitFor({state:'visible'});const r=await popup.evaluate(e=>({x:e.getBoundingClientRect().left,right:e.getBoundingClientRect().right,top:e.getBoundingClientRect().top,bottom:e.getBoundingClientRect().bottom,scroll:e.scrollWidth,client:e.clientWidth}));assert.ok(r.x>=0&&r.right<=p.viewportSize().width+.5&&r.top>=0&&r.bottom<=p.viewportSize().height+.5);assert.ok(r.scroll<=r.client);return r}
 const close=async()=>{await p.keyboard.press('Escape');await popup.waitFor({state:'hidden'});assert.equal(await p.locator('section.reservation-dialog').count(),1)}
 const shot=async name=>{await popup.locator('img').evaluateAll(async images=>{await Promise.all(images.map(i=>i.decode().catch(()=>{})))});await p.screenshot({path:`${dir}/${name}.jpg`,quality:90})}
 for(const [width,height]of[[320,568],[390,844],[768,1024],[1024,768],[1440,1000]]){
  await p.setViewportSize({width,height});await p.goto(`${base}/contact#book`);await p.reload();await p.getByRole('heading',{name:'Find your perfect table.'}).waitFor();await p.evaluate(()=>document.fonts.ready)
  const dates=await p.evaluate(()=>Array.from({length:14},(_,n)=>{const d=new Date();d.setDate(d.getDate()+n);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}))
  assert.equal(await p.locator('.reservation-settings select').count(),0)
  await open('Seating area');if([390,1440].includes(width))await shot(`area-${width}`)
  await popup.getByRole('button',{name:/Inside Mangosteen/}).click();await popup.waitFor({state:'hidden'})
  await p.locator('.reservation-furniture[data-table-id="S2"] .reservation-table').click();assert.equal(await p.locator('.reservation-chair[aria-pressed=true]').count(),2)
  await open('Seating area');await popup.getByRole('button',{name:/Inside Mangosteen/}).click();assert.equal(await p.locator('.reservation-chair[aria-pressed=true]').count(),2)
  await open('Seating area');await close();assert.equal(await p.evaluate(()=>document.activeElement.getAttribute('aria-label')),'Seating area')
  await open('Number of guests');for(let n=0;n<4;n++)await popup.getByRole('button',{name:'Add a guest'}).click();assert.equal(await popup.locator('output strong').innerText(),'6');assert.equal(await popup.getByRole('button',{name:'Add a guest'}).isDisabled(),true)
  assert.equal(await p.locator('.reservation-table[aria-disabled=false]').count(),1)
  for(let n=0;n<5;n++)await popup.getByRole('button',{name:'Remove a guest'}).click();assert.equal(await popup.getByRole('button',{name:'Remove a guest'}).isDisabled(),true)
  for(let n=0;n<3;n++)await popup.getByRole('button',{name:'Add a guest'}).click()
  if([390,1440].includes(width))await shot(`guests-${width}`)
  await popup.getByRole('button',{name:'Done',exact:true}).click();await popup.waitFor({state:'hidden'});assert.equal(await p.locator('.reservation-chair[aria-pressed=true]').count(),0)
  await open('Preferred arrival time');assert.deepEqual(await popup.locator('.booking-arrival>div>button').allTextContents(),['5:00 PM','6:00 PM','7:00 PM','8:00 PM','9:00 PM'])
  if([390,1440].includes(width))await shot(`time-${width}`)
  await popup.getByRole('button',{name:'8:00 PM',exact:true}).click();await popup.waitFor({state:'hidden'});assert.match(await p.getByRole('button',{name:'Preferred arrival time',exact:true}).innerText(),/8:00 PM/)
  await open('Preferred date');const offered=[]
  while(true){offered.push(...await popup.locator('[data-date]:enabled').evaluateAll(nodes=>nodes.map(n=>n.dataset.date)));if(await popup.getByRole('button',{name:'Next month'}).isDisabled())break;await popup.getByRole('button',{name:'Next month'}).click()}
  assert.deepEqual(offered,dates)
  while(!await popup.getByRole('button',{name:'Previous month'}).isDisabled())await popup.getByRole('button',{name:'Previous month'}).click()
  await popup.locator(`[data-date="${dates[0]}"]`).focus();await p.keyboard.press('ArrowRight');await p.waitForFunction(value=>document.activeElement?.getAttribute('data-date')===value,dates[1]);assert.equal(await p.evaluate(()=>document.activeElement.getAttribute('data-date')),dates[1])
  for(let n=0;n<18;n++){await p.keyboard.press('Tab');assert.equal(await p.evaluate(()=>!!document.activeElement.closest('dialog.booking-picker')),true)}
  if([390,1440].includes(width))await shot(`date-${width}`)
  await popup.locator(`[data-date="${dates[1]}"]`).click();await popup.waitFor({state:'hidden'})
  await open('Preferred arrival time');await p.mouse.click(2,150);await popup.waitFor({state:'hidden'});assert.equal(await p.locator('section.reservation-dialog').count(),1)
  await p.locator('.reservation-furniture[data-table-id="D2"] .reservation-table').click();assert.equal(await p.locator('.reservation-chair[aria-pressed=true]').count(),4)
  await p.getByRole('button',{name:width<=600?'Continue':'Continue to Details',exact:true}).click();if(width<=600)await p.locator('.reservation-mobile-recap summary').click();assert.match(await p.locator(width<=600?'.reservation-mobile-recap .reservation-summary-list':'.reservation-details-recap .reservation-summary-list').innerText(),/8:00 PM/)
  await p.getByRole('button',{name:'Change seats or arrival'}).click();assert.equal(await p.locator('.reservation-chair[aria-pressed=true]').count(),4)
  const metrics=await p.locator('.reservation-backdrop').evaluate(e=>({width:innerWidth,height:innerHeight,scrollWidth:e.scrollWidth}));assert.ok(metrics.scrollWidth<=width);report.viewports.push(metrics)
  if(width===1440){await p.getByRole('button',{name:'Continue to Details',exact:true}).click();await p.getByPlaceholder('Guest name').fill('Booking Controls Review');await p.getByPlaceholder('+91',{exact:true}).fill('9876543210');const sent=p.waitForRequest(r=>r.url().includes('/api/public/reservations')&&r.method()==='POST');await p.getByRole('button',{name:'Request My Reservation',exact:true}).click();const payload=(await sent).postDataJSON();assert.equal(payload.date,dates[1]);assert.equal(payload.time,'20:00');assert.equal(payload.guests,4);assert.equal(payload.area,'Inside Mangosteen');assert.equal(payload.table,'Dining 02');assert.deepEqual(payload.seats,['D2-1','D2-2','D2-3','D2-4']);await p.locator('.reservation-confirmation').waitFor();assert.match(await p.locator('.reservation-receipt').innerText(),/Pending/)}
 }
 mark('Photo area choice, same-area preservation and guest stepper bounds 1–6; capacity filtering unchanged')
 mark('Exactly 14 permitted dates across month navigation; keyboard arrows/Tab and disabled out-of-window dates')
 mark('Five existing arrival times; selection, focus return, outside dismissal and Escape close only the picker')
 mark('320/390/768/1024/1440px: pickers fit viewport, no horizontal overflow; details/back retain selection')
 mark('Complete real reservation API submission to disposable CRM: date, 20:00 time, 4 guests, D2 seats, Pending receipt')
 const original=execFileSync('git',['show','baa930a:src/components/ReservationDialog.tsx'],{encoding:'utf8'})
 const current=await readFile('src/components/ReservationDialog.tsx','utf8')
 const submit=s=>s.slice(s.indexOf('  const sendReservation = async'),s.indexOf('  const summary = '))
 assert.equal(submit(current),submit(original))
 for(const file of['src/data/seating.ts','src/lib/crm.ts','src/features/reservations/SeatingMap.tsx','src/features/reservations/layout.ts','src/features/supplied-frontend/SuppliedDesign.tsx','src/pages/MenuExperiencePage.tsx','CRM/server.py'])assert.equal(await readFile(file,'utf8'),execFileSync('git',['show',`baa930a:${file}`],{encoding:'utf8'}))
 mark('Submission function, seating configuration, map, homepage/menu and backend source unchanged')
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.consoleErrors,[])
}catch(error){report.failure=String(error);process.exitCode=1;console.error(error)}finally{await writeFile(`${dir}/results.json`,JSON.stringify(report,null,2));await b.close();fixture.kill('SIGTERM')}
