import {chromium} from 'playwright'
import assert from 'node:assert/strict'
import {mkdir,writeFile} from 'node:fs/promises'
const dir='artifacts/reservation-entry-fix'
await mkdir(dir,{recursive:true})
const b=await chromium.launch({channel:'chrome',headless:true})
const results=[],errors=[]
try{
for(const host of ['localhost','127.0.0.1']){
 const p=await b.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'})
 p.on('pageerror',e=>errors.push(e.message))
 const verify=async entry=>{
  await p.locator('.reservation-backdrop').waitFor();await p.evaluate(()=>document.fonts.ready)
  const actual=await p.locator('.reservation-backdrop').evaluate(el=>({background:getComputedStyle(el).backgroundColor,rect:el.getBoundingClientRect().toJSON(),controls:el.querySelectorAll('.booking-trigger').length,layout:getComputedStyle(el.querySelector('.reservation-settings')).display,oldHeaderImage:getComputedStyle(el.querySelector('.reservation-header'),'::before').content}))
  assert.equal(actual.background,'rgb(245, 239, 229)');assert.equal(actual.rect.width,1440);assert.equal(actual.rect.height,1000);assert.equal(actual.controls,4);assert.equal(actual.layout,'grid');assert.equal(actual.oldHeaderImage,'none')
  await p.getByRole('button',{name:'Seating area',exact:true}).click();await p.locator('.booking-picker[open]').waitFor();assert.equal(await p.locator('.booking-area-options>button').count(),2);await p.getByRole('button',{name:'Close booking picker',exact:true}).click()
  results.push({host,entry,...actual})
 }
 const close=async()=>{await p.getByRole('button',{name:'Close reservation',exact:true}).click();await p.locator('.reservation-backdrop').waitFor({state:'detached'})}
 await p.goto(`http://${host}:5173/`);await p.locator('.saved-mangosteen.motion-ready').waitFor();await p.locator('.saved-mangosteen.motion-ready header a[href="/contact#book"]').filter({visible:true}).first().click();await verify('homepage header');await close()
 await p.goto(`http://${host}:5173/contact`);await p.getByRole('button',{name:'Reserve a table',exact:true}).click();await verify('contact page booking button');await close()
 await p.goto(`http://${host}:5173/contact#book`);await verify('direct booking URL');await p.screenshot({path:`${dir}/after-${host}.jpg`,quality:90});await p.close()
}
const p=await b.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'})
await p.goto('http://localhost:5173/');await p.locator('.saved-mangosteen.motion-ready header button[aria-label="Toggle menu"]').click();await p.locator('.saved-mangosteen.motion-ready header a[href="/contact#book"]').filter({visible:true}).first().click();await p.locator('.reservation-backdrop').waitFor();assert.equal(await p.locator('.booking-trigger').count(),4);assert.equal(await p.locator('.reservation-backdrop').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(245, 239, 229)');await p.screenshot({path:`${dir}/after-mobile.jpg`,quality:90});await p.close()
assert.deepEqual(errors,[])
console.log('PASS new reservation via homepage header, contact booking button, direct URL on both hosts and mobile navigation; all four styled pickers render')
}finally{await writeFile(`${dir}/results.json`,JSON.stringify({results,errors},null,2));await b.close()}
