import {chromium} from 'playwright';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const dir='artifacts/cafe-cinematic-gallery';
const browser=await chromium.launch({channel:'chrome',headless:true});
const results={checks:[],errors:[]};
try {
 const context=await browser.newContext({viewport:{width:1440,height:1000}});
 const page=await context.newPage(); page.on('pageerror',e=>results.errors.push(e.message));
 await page.goto('http://127.0.0.1:5181/');
 await page.locator('.cafe-glass').scrollIntoViewIfNeeded();
 await page.waitForFunction(()=>document.querySelector('.cafe-glass')?.classList.contains('is-ready'));
 await page.getByRole('button',{name:'Reveal photo',exact:true}).click();
 await page.waitForTimeout(200);
 await page.emulateMedia({reducedMotion:'reduce'}); await page.waitForTimeout(180);
 assert.equal(await page.locator('.cafe-glass canvas').evaluate(e=>+getComputedStyle(e).opacity),0);
 assert.equal(await page.locator('.cafe-gallery-spaces.is-scroll-driven').count(),0);
 await page.emulateMedia({reducedMotion:'no-preference'}); await page.waitForTimeout(300);
 const rail=page.locator('.cafe-spaces-window'); await rail.scrollIntoViewIfNeeded();
 await rail.focus(); await page.keyboard.press('ArrowRight');
 assert.equal(await page.evaluate(()=>document.activeElement?.getAttribute('aria-label')),'View café photo: The long table');
 await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowRight'); await page.waitForTimeout(800);
 const focused=await page.evaluate(()=>{const e=document.activeElement;const r=e.getBoundingClientRect();return {label:e.getAttribute('aria-label'),left:r.left,right:r.right,viewport:innerWidth}});
 assert.equal(focused.label,'View café photo: A little café life'); assert.ok(focused.left>=0 && focused.right<=focused.viewport+2);
 await page.keyboard.press('ArrowLeft'); assert.equal(await page.evaluate(()=>document.activeElement?.getAttribute('aria-label')),'View café photo: The evening rooftop');
 await page.emulateMedia({reducedMotion:'reduce'}); await page.waitForTimeout(150);
 await rail.focus(); await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowRight');
 assert.ok(await rail.evaluate(e=>e.scrollLeft)>100);
 results.checks.push('Production: Arrow keys focus and reveal offscreen photographs in pinned and native rail modes; live reduced-motion changes stop animations and remove the pin.');
 await context.close();
 const mobile=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
 const p=await mobile.newPage(); p.on('pageerror',e=>results.errors.push(e.message));
 const cdp=await mobile.newCDPSession(p);
 await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
 await cdp.send('Network.enable');
 await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:80,downloadThroughput:750000,uploadThroughput:187500});
 let transferred=0;cdp.on('Network.loadingFinished',e=>transferred+=e.encodedDataLength);
 await p.goto('http://127.0.0.1:5181/'); await p.locator('.cafe-glass').waitFor();
 await p.locator('.cafe-glass').scrollIntoViewIfNeeded();
 await p.waitForFunction(()=>document.querySelector('.cafe-glass')?.classList.contains('is-ready'),null,{timeout:30000});
 await p.waitForTimeout(400);
 assert.match(await p.locator('.cafe-glass-actions').innerText(),/Swipe across the glass/);
 const box=await p.locator('.cafe-glass').boundingBox();
 await p.evaluate(()=>{window.galleryPerf={frames:[],tasks:[],start:performance.now(),running:true};const s=window.galleryPerf;new PerformanceObserver(l=>{if(s.running)for(const e of l.getEntries())s.tasks.push(e.duration)}).observe({type:'longtask',buffered:false});let prev=performance.now();const f=t=>{if(!s.running)return;s.frames.push(t-prev);prev=t;requestAnimationFrame(f)};requestAnimationFrame(f)});
 for(const row of [.2,.45,.7,.85]){
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x+box.width*.08,y:box.y+box.height*row}]});
  for(let i=1;i<=40;i++){
   await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:box.x+box.width*(.08+.83*i/40),y:box.y+box.height*row}]});await p.waitForTimeout(16);
  }
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await p.waitForTimeout(120);
  if(await p.locator('.cafe-glass').getAttribute('data-revealed')==='true')break;
 }
 await p.waitForTimeout(1600);
 results.performance=await p.evaluate(()=>{const s=window.galleryPerf;s.running=false;const a=s.frames.slice(1).sort((a,b)=>a-b),sum=a.reduce((n,v)=>n+v,0);return {durationMs:Math.round(performance.now()-s.start),samples:a.length,meanFrameMs:+(sum/a.length).toFixed(2),p95FrameMs:+a[Math.floor(a.length*.95)].toFixed(2),frameIntervalsOver33ms:a.filter(n=>n>33.4).length,longTasks:s.tasks.map(n=>+n.toFixed(1)),canvasPixels:+document.querySelector('.cafe-glass').dataset.canvasPixels,autoRevealCoverage:+document.querySelector('.cafe-glass').dataset.cleared,revealed:document.querySelector('.cafe-glass').dataset.revealed==='true'}});
 results.performance.environment='Local production build, Chrome mobile emulation 390×844 DPR2, 4× CPU slowdown, 6Mbps / 80ms network. rAF intervals during real touch wiping and reveal; not a physical-phone or field Core Web Vitals measurement.';
 results.performance.pageTransferToGalleryBytes=transferred;
 assert.equal(results.performance.revealed,true);
 assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await p.screenshot({path:`${dir}/after/final-mobile-revealed.png`});
 await mobile.close();
 assert.deepEqual(results.errors,[]);
}catch(e){results.failure=String(e);process.exitCode=1;console.error(e)}finally{await fs.writeFile(`${dir}/final-check.json`,JSON.stringify(results,null,2));await browser.close()}
console.log(results);
