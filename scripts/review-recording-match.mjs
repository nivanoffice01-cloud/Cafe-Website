import {chromium} from 'playwright'
import {rename,writeFile} from 'node:fs/promises'
import assert from 'node:assert/strict'
const browser=await chromium.launch({channel:'chrome',headless:true})
const context=await browser.newContext({viewport:{width:1844,height:963},recordVideo:{dir:'artifacts/recording-match',size:{width:1844,height:964}}})
const page=await context.newPage(),checks=[],errors=[]
page.on('pageerror',error=>errors.push(error.message))
try{
  await page.goto('http://localhost:4174/reference-experience');await page.waitForTimeout(1400)
  for(const [x1,y1,x2,y2] of [[1260,500,1510,210],[1510,210,1260,500]]){
    await page.mouse.move(x1,y1);await page.mouse.down();await page.mouse.move(x2,y2,{steps:35});await page.mouse.up();await page.waitForTimeout(1300)
  }
  await page.locator('.ref-story').scrollIntoViewIfNeeded();await page.waitForTimeout(1000)
  assert.equal(await page.locator('.ref-story-image').count(),2)
  checks.push('Two inline photographic reveals in the statement')
  await page.locator('.ref-menu-section').scrollIntoViewIfNeeded();await page.waitForTimeout(900)
  const row=page.locator('.ref-menu-row').nth(1),box=await row.boundingBox()
  await page.mouse.move(box.x+150,box.y+50);await page.waitForTimeout(600)
  const before=await page.locator('.ref-menu-follower').boundingBox()
  await page.mouse.move(box.x+390,box.y+70,{steps:30});await page.waitForTimeout(600)
  const after=await page.locator('.ref-menu-follower').boundingBox()
  assert.ok(after.x-before.x>200)
  assert.equal(await page.locator('.ref-menu-list').getAttribute('data-preview'),'1')
  checks.push('Dish preview tracks the cursor instead of staying attached to the row')
  for(let i=0;i<5;i++){
    const item=page.locator('.ref-menu-row').nth(i);await item.scrollIntoViewIfNeeded();await page.waitForTimeout(350)
    const rect=await item.boundingBox();await page.mouse.move(rect.x+200,rect.y+45,{steps:20});await page.waitForTimeout(350)
    assert.equal(await page.locator('.ref-menu-list').getAttribute('data-preview'),String(i))
  }
  checks.push('All five verified dishes select the matching preview')
  await page.mouse.move(100,300);await page.waitForTimeout(250)
  assert.equal(await page.locator('.ref-menu-follower').evaluate(e=>getComputedStyle(e).visibility),'hidden')
  checks.push('Preview clears on leave and scrolling')
  const menu=await page.locator('.ref-menu-section').evaluate(e=>({top:e.getBoundingClientRect().top+scrollY,height:e.clientHeight}))
  await page.evaluate(y=>scrollTo(0,y),menu.top+30);await page.waitForTimeout(300)
  const stickyA=await page.locator('.ref-menu-intro').boundingBox()
  await page.evaluate(()=>scrollBy(0,60));await page.waitForTimeout(300)
  const stickyB=await page.locator('.ref-menu-intro').boundingBox()
  assert.ok(Math.abs(stickyA.y-stickyB.y)<3)
  checks.push('Menu introduction stays fixed during list exploration')
  await page.locator('.ref-cafe-photo').scrollIntoViewIfNeeded();await page.waitForTimeout(1100)
  await page.locator('.ref-glass').scrollIntoViewIfNeeded();await page.waitForTimeout(700)
  const glass=await page.locator('.ref-glass canvas').boundingBox();await page.mouse.move(400,glass.y+400);await page.mouse.move(1100,glass.y+500,{steps:60})
  await page.waitForTimeout(600)
  for(const width of [320,390,768]){
    await page.setViewportSize({width,height:844});await page.goto('http://localhost:4174/reference-experience');await page.waitForTimeout(1200)
    await page.locator('.ref-story').scrollIntoViewIfNeeded();await page.waitForTimeout(600)
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))
    await page.screenshot({path:`artifacts/recording-match/story-${width}.png`})
  }
  checks.push('Statement remains responsive at 320, 390 and 768px')
  assert.deepEqual(errors,[])
}catch(error){errors.push(String(error));process.exitCode=1;console.error(error)}
finally{await writeFile('artifacts/recording-match/results.json',JSON.stringify({checks,errors},null,2));const video=page.video();await context.close();await rename(await video.path(),'artifacts/recording-match/corrected-interactions.webm');await browser.close();console.log(checks)}
