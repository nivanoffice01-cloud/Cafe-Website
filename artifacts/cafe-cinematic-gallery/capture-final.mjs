import {chromium} from 'playwright';
const browser=await chromium.launch({channel:'chrome',headless:true});
for(const mobile of [false,true]){
 const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:1000},isMobile:mobile,hasTouch:mobile,deviceScaleFactor:mobile?2:1});
 const page=await context.newPage();await page.goto('http://127.0.0.1:5181/');
 await page.locator('.cafe-glass').scrollIntoViewIfNeeded();await page.waitForFunction(()=>document.querySelector('.cafe-glass')?.classList.contains('is-ready'));
 await page.waitForTimeout(300); await page.screenshot({path:`artifacts/cafe-cinematic-gallery/after/${mobile?'09-mobile':'01-desktop'}-frosted.png`});
 await context.close();
}await browser.close();
