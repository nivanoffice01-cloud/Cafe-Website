#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { chromium } from 'playwright'

const options = new Map()
for (let index = 2; index < process.argv.length; index += 2) {
  const name = process.argv[index]
  const value = process.argv[index + 1]
  if (!name?.startsWith('--') || value === undefined) throw new Error(`Expected --name value, received ${name || 'nothing'}`)
  options.set(name.slice(2), value)
}

const baseUrl = options.get('url') || 'http://127.0.0.1:5173/'
const outputRoot = path.resolve(options.get('output') || 'artifacts/cinematic-qa')
const requestedProfile = options.get('profile') || 'all'
const profiles = [
  { name: 'desktop', width: 1920, height: 1080, deviceScaleFactor: 1 },
  { name: 'mobile', width: 390, height: 844, deviceScaleFactor: 1 },
].filter(({ name }) => requestedProfile === 'all' || requestedProfile === name)

if (!profiles.length) throw new Error('--profile must be all, desktop, or mobile')

const browser = await chromium.launch({ headless: true })
const report = { baseUrl, createdAt: new Date().toISOString(), profiles: [] }

try {
  for (const profile of profiles) {
    const profileDirectory = path.join(outputRoot, profile.name)
    const videoDirectory = path.join(profileDirectory, 'video')
    await mkdir(videoDirectory, { recursive: true })
    const context = await browser.newContext({
      viewport: { width: profile.width, height: profile.height },
      deviceScaleFactor: profile.deviceScaleFactor,
      recordVideo: { dir: videoDirectory, size: { width: profile.width, height: profile.height } },
      reducedMotion: 'no-preference',
      colorScheme: 'dark',
    })
    const page = await context.newPage()
    const consoleErrors = []
    const pageErrors = []
    page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()) })
    page.on('pageerror', (error) => pageErrors.push(error.message))
    await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 45_000 })
    await page.locator('#cinematic-journey').waitFor({ state: 'visible', timeout: 30_000 })
    await page.waitForTimeout(1_000)

    const scrollRange = await page.evaluate(() => {
      const experience = document.querySelector('.cinema-experience')
      if (!(experience instanceof HTMLElement)) throw new Error('Missing .cinema-experience')
      return Math.max(1, experience.offsetHeight - innerHeight)
    })

    // Includes the mandatory 0/25/50/75/100% captures plus each chapter boundary.
    const checkpoints = [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1]
    const captures = []
    for (const progress of checkpoints) {
      await page.evaluate(({ progress, scrollRange }) => scrollTo(0, Math.round(scrollRange * progress)), { progress, scrollRange })
      await page.waitForTimeout(650)
      const filename = `scroll-${String(Math.round(progress * 100)).padStart(3, '0')}.png`
      await page.screenshot({ path: path.join(profileDirectory, filename), fullPage: false })
      const state = await page.evaluate(() => {
        const experience = document.querySelector('.cinema-experience')
        return {
          scrollY,
          progress: experience ? getComputedStyle(experience).getPropertyValue('--cinema-progress').trim() : null,
          missingExperience: !experience,
          fallbackVisible: Boolean(document.querySelector('.cinema-static-fallback')),
          title: document.title,
        }
      })
      captures.push({ progress, filename, state })
    }

    for (const direction of ['forward', 'reverse']) {
      const values = Array.from({ length: 41 }, (_, index) => index / 40)
      if (direction === 'reverse') values.reverse()
      for (const progress of values) {
        await page.evaluate(({ progress, scrollRange }) => scrollTo(0, Math.round(scrollRange * progress)), { progress, scrollRange })
        await page.waitForTimeout(55)
      }
    }
    await page.waitForTimeout(500)
    const finalReverseProgress = await page.evaluate(() => {
      const experience = document.querySelector('.cinema-experience')
      return experience ? getComputedStyle(experience).getPropertyValue('--cinema-progress').trim() : null
    })
    const video = page.video()
    await page.close()
    await context.close()
    const videoPath = video ? await video.path() : undefined
    report.profiles.push({ ...profile, scrollRange, captures, finalReverseProgress, consoleErrors, pageErrors, videoPath })
  }
} finally {
  await browser.close()
}

await mkdir(outputRoot, { recursive: true })
await writeFile(path.join(outputRoot, 'report.json'), `${JSON.stringify(report, null, 2)}\n`)
console.log(JSON.stringify(report, null, 2))
