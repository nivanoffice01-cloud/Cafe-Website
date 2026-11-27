import { chromium } from 'playwright'
import fs from 'node:fs/promises'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'
const browser=await chromium.launch({channel:'chrome',headless:true})
const page=await browser.newPage({viewport:{width:390,height:844}})
const report={viewports:[],checks:[],errors:[]}
page.on('pageerror',e=>report.errors.push(e.message))
try {
  for(const [width,height] of [[320,568],[360,800],[375,667],[390,844],[393,852],[414,896],[430,932],[768,1024],[844,390],[568,320],[1024,768],[1440,900]]){
    await page.setViewportSize({width,height});await page.goto('http://127.0.0.1:5173/');await page.locator('canvas').waitFor();await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(400)
    const metrics=await page.evaluate(()=>{
      const hero=document.querySelector('.cinematic-hero-stage').getBoundingClientRect(),canvas=document.querySelector('canvas').getBoundingClientRect()
      const layer=document.querySelector('.hero-copy')
      const actions=[...layer.querySelectorAll('.btn-poster')].map(a=>({name:a.textContent,rect:a.getBoundingClientRect().toJSON()}))
      const title=layer.querySelector('h1').getBoundingClientRect()
      return {width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,hero:hero.toJSON(),canvas:canvas.toJSON(),actions,title:title.toJSON(),desktopLinksVisible:getComputedStyle(document.querySelector('.premium-header-links')).display!=='none'}
    })
    assert.ok(metrics.scrollWidth<=width)
    assert.ok(Math.abs(metrics.hero.width-width)<1)
    assert.equal(metrics.desktopLinksVisible,width>=1024)
    for(const a of metrics.actions){assert.ok(a.rect.x>=0&&a.rect.right<=width);assert.ok(a.rect.bottom<=height+1,`${a.name} below viewport ${width}×${height}`);assert.ok(a.rect.top>=76);assert.ok(a.rect.height>=44)}
    if(width<1024){assert.ok(metrics.title.bottom<metrics.actions[0].rect.top)}
    await page.screenshot({path:`artifacts/mobile-hero/after-${width}-${height}.png`})
    report.viewports.push(metrics)
  }
  report.checks.push('Twelve portrait, landscape, tablet and desktop layouts have full-width heroes, visible 44px actions, readable titles and no horizontal overflow')
  // Change size repeatedly without reloading: catch stale GSAP inline pin widths.
  for(const [width,height] of [[320,568],[430,932],[844,390],[390,844]]){
    await page.setViewportSize({width,height});await page.waitForTimeout(500)
    const box=await page.locator('.cinematic-hero-stage').boundingBox();assert.ok(Math.abs(box.width-width)<1)
  }
  report.checks.push('Live phone resizing and orientation changes preserve full-width pin and canvas layout')
  const canvas=page.locator('canvas').first()
  const hash=async()=>crypto.createHash('sha256').update(await canvas.evaluate(c=>c.toDataURL())).digest('hex')
  const initial=await hash()
  await page.evaluate(()=>scrollTo(0,innerHeight*2.6));await page.waitForTimeout(900);const forward=await hash()
  await page.screenshot({path:'artifacts/mobile-hero/forward-scroll.png'})
  await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(900);const reverse=await hash()
  assert.notEqual(initial,forward);assert.equal(initial,reverse)
  report.checks.push('Actual canvas frames change with forward scrolling and return to the original frame on reverse scrolling')
  await page.getByRole('button',{name:'Toggle menu',exact:true}).click();await page.keyboard.press('Escape')
  assert.equal(await page.getByRole('button',{name:'Toggle menu',exact:true}).getAttribute('aria-expanded'),'false')
  await page.locator('.hero-copy').first().getByRole('link',{name:'Reserve a table',exact:true}).click();await page.getByRole('heading',{name:'Find your perfect table.',exact:true}).waitFor();await page.getByRole('button',{name:'Close reservation',exact:true}).click();await page.locator('.reservation-backdrop').waitFor({state:'detached'})
  await page.locator('.hero-copy').first().getByRole('link',{name:'Explore the menu',exact:true}).click();await page.waitForURL('**/menu');await page.locator('.dm-menu').waitFor()
  report.checks.push('Mobile navigation, Escape, reservation opening and digital menu link still work')
  assert.deepEqual(report.errors,[])
}catch(e){report.failure=String(e);process.exitCode=1;console.error(e);await page.screenshot({path:'artifacts/mobile-hero/failure.png'})}finally{
  await fs.writeFile('artifacts/mobile-hero/results.json',JSON.stringify(report,null,2));await browser.close()
}
console.log(report.checks)
