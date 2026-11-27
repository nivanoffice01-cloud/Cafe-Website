import { chromium } from 'playwright'
import assert from 'node:assert/strict'
import { readFile, writeFile, mkdir, unlink } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import crypto from 'node:crypto'

const dir = 'artifacts/reservation-visual-refinement'
const base = process.env.REVIEW_URL || 'http://127.0.0.1:5173'
await mkdir(`${dir}/after`, { recursive: true })
const report = { checks: [], viewports: [], errors: [], consoleErrors: [], protectedFiles: {} }
const mark = text => { report.checks.push(text); console.log('PASS', text) }
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const ready = async page => {
  await page.getByRole('dialog').waitFor()
  await page.evaluate(async () => {
    await document.fonts.ready
    const urls = [...new Set([...document.querySelectorAll('.reservation-plan image')].map(i => i.getAttribute('href')))]
    await Promise.all(urls.map(src => new Promise(resolve => { const image = new Image(); image.onload = image.onerror = resolve; image.src = src })))
    await Promise.all([...document.images].filter(i => i.complete || i.loading !== 'lazy').map(i => i.decode().catch(() => {})))
  })
  await page.waitForTimeout(800)
}
try {
  const context = await browser.newContext({ reducedMotion: 'reduce', timezoneId: 'Asia/Kolkata' })
  const page = await context.newPage()
  page.on('pageerror', e => report.errors.push(e.message))
  page.on('console', m => { if (m.type() === 'error') report.consoleErrors.push(m.text()) })
  for (const [width, height] of [[320,568],[390,844],[768,1024],[1024,768],[1440,1000],[1920,1080]]) {
    await page.setViewportSize({width,height})
    await page.goto(`${base}/contact#book`); await page.reload(); await ready(page)
    await page.getByLabel('Number of guests').selectOption('4')
    for (const zone of ['rooftop','inside']) {
      await page.getByLabel('Seating area',{exact:true}).selectOption(zone)
      const groups = await page.evaluate(async zone => {
        const {visualSeatingGroups,chairPositions} = await import('/src/features/reservations/layout.ts')
        return visualSeatingGroups(zone).map(g=>({...g,chairs:chairPositions(g)}))
      },zone)
      assert.equal(await page.locator('.reservation-chair').count(),zone==='rooftop'?28:26)
      for (const group of groups) {
        const rendered=page.locator(`.reservation-furniture[data-table-id="${group.id}"]`)
        assert.equal(await rendered.getAttribute('transform'),`translate(${group.x} ${group.y}) rotate(${group.rotation})`)
        assert.equal(await rendered.locator('.reservation-chair').count(),group.capacity)
        for (const [i,chair] of group.chairs.entries()) assert.equal(await rendered.locator('.reservation-chair').nth(i).getAttribute('transform'),`translate(${chair.x} ${chair.y})`)
      }
      const selected=zone==='rooftop'?'G2':'D2'
      const table=page.locator(`.reservation-furniture[data-table-id="${selected}"] .reservation-table`)
      await table.click(); await ready(page)
      assert.equal(await page.locator('.reservation-chair[aria-pressed=true]').count(),4)
      assert.match(await page.locator('.reservation-preview-copy h3').innerText(), zone==='rooftop'?/Garden 02/:/Dining 02/)
      assert.equal(await page.locator('.reservation-table-marker text').first().textContent(),zone==='rooftop'?'R1':'W1')
      await table.hover()
      assert.match(await page.locator('.reservation-plan-toolbar').innerText(),/4 seats/)
      await page.mouse.move(0,0)
      await page.locator('.reservation-backdrop').evaluate(el=>el.scrollTo(0,0))
      const metrics=await page.locator('.reservation-backdrop').evaluate(el=>({width:innerWidth,height:innerHeight,scrollWidth:el.scrollWidth}))
      assert.ok(metrics.scrollWidth<=width)
      if ([390,1440,1920].includes(width)) {
        await page.screenshot({path:`${dir}/after/${zone==='rooftop'?'rooftop':'inside'}-${width}x${height}.jpg`,quality:92})
        if(zone==='rooftop')await page.locator('.reservation-plan').screenshot({path:`${dir}/after/map-${width}.jpg`,quality:92})
      }
      report.viewports.push({...metrics,zone})
    }
    await page.getByRole('button',{name:width<=600?'Continue':'Continue to Details',exact:true}).click()
    await page.getByRole('button',{name:'Change seats or arrival'}).click()
    assert.equal(await page.locator('.reservation-chair[aria-pressed=true]').count(),4)
    await page.getByLabel('Number of guests').selectOption('6')
    assert.equal(await page.locator('.reservation-table[aria-disabled=false]').count(),1)
    await page.locator('.reservation-table[aria-disabled=false]').focus();await page.keyboard.press('Enter')
    assert.equal(await page.locator('.reservation-chair[aria-pressed=true]').count(),6)
  }
  mark('320–1920px: no overflow, preserved table/chair coordinates, 54 seats, capacity filtering, selection and back navigation')
  mark('Small ID-only markers; immediate full-name/capacity hover information; photo and seat preferences remain synchronized')
  const protectedBefore = JSON.parse(await readFile(`${dir}/protected-before.json`,'utf8'))
  for(const [file,expected] of Object.entries(protectedBefore)){
    const actual=crypto.createHash('sha256').update(await readFile(file)).digest('hex')
    assert.equal(actual,expected);report.protectedFiles[file]='byte-identical'
  }
  mark('ReservationDialog, seating/layout data, handlers/API, homepage/nav, menu and backend remain byte-identical')
  await context.close()

  await mkdir(`${dir}/motion`,{recursive:true})
  const motion=await browser.newContext({viewport:{width:1440,height:1000},recordVideo:{dir:`${dir}/motion`,size:{width:1440,height:1000}}})
  const p=await motion.newPage(),video=p.video()
  p.on('pageerror',e=>report.errors.push(e.message))
  await p.goto(`${base}/contact#book`);await ready(p)
  await p.getByLabel('Number of guests').selectOption('4')
  await p.locator('.reservation-furniture[data-table-id="G1"] .reservation-table').click();await p.waitForTimeout(700)
  await p.locator('.reservation-furniture[data-table-id="G2"] .reservation-table').click();await p.waitForTimeout(700)
  await p.getByLabel('Seating area',{exact:true}).selectOption('inside');await ready(p)
  await p.locator('.reservation-furniture[data-table-id="D2"] .reservation-table').click();await p.waitForTimeout(900)
  const inline=await p.locator('.reservation-furniture').first().getAttribute('style')
  assert.ok(!inline?.includes('opacity: 0'))
  await motion.close();await video.saveAs(`${dir}/motion/reservation-refinement.webm`)
  mark('Non-reduced-motion map entrance, selection reveal and area switching recorded without runtime errors')
  assert.deepEqual(report.errors,[]);assert.deepEqual(report.consoleErrors,[])
} catch(error) {report.failure=String(error);process.exitCode=1;console.error(error)}
finally {await writeFile(`${dir}/verification.json`,JSON.stringify(report,null,2));await browser.close()}

// Reuse the existing regression unchanged; isolate only its output directory.
if(!process.exitCode){
 const original=await readFile('scripts/verify-reservation-redesign-business.mjs','utf8')
 const source=original.replace('artifacts/reservation-redesign/business-${phase}','artifacts/reservation-visual-refinement/business-${phase}')
 assert.notEqual(source,original)
 const temporary=`scripts/.reservation-visual-business-${process.pid}.mjs`
 await writeFile(temporary,source,{flag:'wx'})
 try{const child=spawn(process.execPath,[temporary,'after'],{stdio:'inherit'});const code=await new Promise(resolve=>child.on('exit',resolve));if(code)process.exitCode=Number(code)}finally{await unlink(temporary)}
}
