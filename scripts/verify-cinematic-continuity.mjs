#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import process from 'node:process'

const args = new Map()
for (let index = 2; index < process.argv.length; index += 2) args.set(process.argv[index]?.replace(/^--/,'') || '',process.argv[index + 1])
const variant = args.get('variant') || 'desktop'
const fromPath = args.get('from') || `public/cinematic/chapter-01-arrival/${variant}/sequence.json`
const toPath = args.get('to') || `public/cinematic/chapter-02-interior/${variant}/sequence.json`
const threshold = Number(args.get('threshold') || .82)
const strict = (args.get('strict') || 'false') === 'true'
const from = JSON.parse(await readFile(fromPath,'utf8'))
const to = JSON.parse(await readFile(toPath,'utf8'))
if (!from.enabled || !to.enabled || from.frameCount < 2 || to.frameCount < 2) {
  console.error('Both sequence manifests must be enabled and contain at least two frames.')
  process.exit(2)
}
const framePath = (manifestPath,manifest,index) => {
  const number = String(index).padStart(manifest.padLength, '0')
  const relative = manifest.pattern.replace(/^\/cinematic\//,'').replace('{frame}',number)
  return path.join('public','cinematic',relative)
}
const last = framePath(fromPath,from,from.startNumber + from.frameCount - 1)
const first = framePath(toPath,to,to.startNumber)
const filter = '[0:v]scale=960:540:force_original_aspect_ratio=increase,crop=960:540[a];[1:v]scale=960:540:force_original_aspect_ratio=increase,crop=960:540[b];[a][b]ssim'
const result = spawnSync('ffmpeg',['-hide_banner','-i',last,'-i',first,'-lavfi',filter,'-f','null','-'],{ encoding:'utf8' })
if (result.error) { console.error('FFmpeg is required but was not found on PATH.'); process.exit(3) }
const output = `${result.stdout || ''}\n${result.stderr || ''}`
const match = output.match(/All:([0-9.]+)/)
if (!match) { console.error(output); throw new Error('Could not read an SSIM score from FFmpeg.') }
const score = Number(match[1])
const report = { variant, chapter01FinalFrame:last, chapter02FirstFrame:first, ssim:score, threshold, passes:score >= threshold, checkedAt:new Date().toISOString() }
const reportPath = args.get('report') || `public/cinematic/continuity-${variant}.json`
await writeFile(reportPath,`${JSON.stringify(report,null,2)}\n`)
console.log(JSON.stringify(report,null,2))
if (strict && !report.passes) process.exit(5)
