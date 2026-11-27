import {chromium} from 'playwright'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
const browser=await chromium.launch({channel:'chrome',headless:true});const page=await browser.newPage({viewport:{width:390,height:844}});const report={checks:[],errors:[]};page.on('pageerror',e=>report.errors.push(e.message));
try{
 await page.goto('http://127.0.0.1:5173/menu');await page.locator('.dm-menu').waitFor();
 for(const name of ['Categories','Search']){
  await page.getByRole('button',{name:'Open menu navigation',exact:true}).click();
  await page.getByRole('navigation',{name:'Menu drawer navigation',exact:true}).getByRole('button',{name,exact:true}).click();
  assert.ok(page.url().endsWith(name==='Categories'?'/browse':'/search'));
 }
 await page.getByRole('searchbox').fill('Margarita');await page.getByRole('button',{name:'Add Margarita to favourites',exact:true}).click();
 await page.getByRole('button',{name:'Add Margarita to My List',exact:true}).click();
 const peek=page.locator('.dm-selection-peek');assert.ok(await peek.isVisible());await page.waitForTimeout(350);const bounds=await peek.boundingBox();assert.ok(Math.abs(844-bounds.y-bounds.height-12)<1);
 await page.getByRole('button',{name:'Open favourites',exact:true}).click();assert.ok(await page.getByRole('button',{name:'View Margarita',exact:true}).isVisible());
 await page.locator('.dm-header-actions').getByRole('button',{name:/^My List,/}).click();assert.ok(page.url().endsWith('/selection'));assert.ok(await page.locator('.dm-selection-lines article').count());
 report.checks.push('Categories and Search accessible through hamburger drawer; favourite, selection and header shortcuts work; conditional list summary sits 12px above viewport bottom');
 for(const width of [320,390,768,1440]){
  await page.setViewportSize({width,height:844});
  for(const route of ['','/browse','/category/pizza-and-pide','/search','/favourites','/selection']){
   await page.goto('http://127.0.0.1:5173/menu'+route);await page.locator('.dm-menu').waitFor();
   assert.equal(await page.locator('.dm-bottom-nav').count(),0);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  }
 }
 report.checks.push('Bottom navigation absent and no horizontal overflow on six menu screens at 320, 390, 768 and 1440px');assert.deepEqual(report.errors,[]);
}finally{await fs.writeFile(new URL('./navigation-results.json',import.meta.url),JSON.stringify(report,null,2));await browser.close()};console.log(report)
