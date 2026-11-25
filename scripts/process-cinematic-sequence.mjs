#!/usr/bin/env node
import { copyFile, mkdir, readdir, rm, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import process from 'node:process'

const values = new Map()
for (let index = 2; index < process.argv.length; index += 2) {
  const key = process.argv[index]
  const value = process.argv[index + 1]
  if (!key?.startsWith('--') || value === undefined) throw new Error(`Expected --name value, received ${key || 'nothing'}`)
  values.set(key.slice(2), value)
}
const number = (name, fallback) => {
  const parsed = Number(values.get(name) ?? fallback)
  if (!Number.isFinite(parsed) || parsed <= 0) throw new Error(`--${name} must be a positive number`)
  return parsed
}
const variant = values.get('variant') || 'desktop'
if (!['desktop','mobile'].includes(variant)) throw new Error('--variant must be desktop or mobile')
const chapter = number('chapter', 1)
const scene = values.get('scene') || (chapter === 1 ? 'arrival' : 'interior')
const chapterSlug = `chapter-${String(chapter).padStart(2,'0')}-${scene}`
const sourceName = values.get('input') || path.join('cinematic-source', chapterSlug, variant, `${chapterSlug}-${variant}.mp4`)
const output = values.get('output') || path.join('public','cinematic',chapterSlug,variant)
const desktop = variant === 'desktop'
const width = number('width', desktop ? 1920 : 720)
const height = number('height', desktop ? 1080 : 1280)
const quality = number('quality', desktop ? 78 : 76)
const duration = number('duration', 10)
const requestedFrameCount = values.has('frames') ? number('frames', 1) : undefined
const fps = requestedFrameCount ? requestedFrameCount / duration : number('fps', desktop ? 18 : 15)
const scrollLengthVh = number('scroll-vh', desktop ? 330 : 290)
const maxDecodedFrames = number('cache', desktop ? 10 : 8)
const padLength = 5
const framesDirectory = path.join(output,'frames')
const framePattern = path.join(framesDirectory,`frame-%0${padLength}d.webp`)
const publicBase = `/cinematic/${chapterSlug}/${variant}`

if (!existsSync(sourceName)) {
  console.error(`Missing source video: ${sourceName}`)
  console.error('Place the café-approved master at that path or pass --input /absolute/path/video.mov')
  process.exit(2)
}
const ffmpegCheck = spawnSync('ffmpeg',['-version'],{ stdio:'ignore' })
if (ffmpegCheck.error || ffmpegCheck.status !== 0) {
  console.error('FFmpeg is required but was not found on PATH.')
  process.exit(3)
}

const ffmpegEncoders = spawnSync('ffmpeg',['-hide_banner','-encoders'],{ encoding:'utf8' })
const hasFfmpegWebp = /\blibwebp\b/.test(`${ffmpegEncoders.stdout || ''}\n${ffmpegEncoders.stderr || ''}`)
const cwebpCheck = hasFfmpegWebp ? undefined : spawnSync('cwebp',['-version'],{ stdio:'ignore' })
if (!hasFfmpegWebp && (cwebpCheck?.error || cwebpCheck?.status !== 0)) {
  console.error('This FFmpeg build has no libwebp encoder and cwebp was not found. Install the WebP tools (`brew install webp`) and retry.')
  process.exit(3)
}

await rm(framesDirectory,{ recursive:true, force:true })
await mkdir(framesDirectory,{ recursive:true })
const filter = `fps=${fps},scale=${width}:${height}:force_original_aspect_ratio=increase:flags=lanczos,crop=${width}:${height},setsar=1`
let encoder = 'ffmpeg-libwebp'
if (hasFfmpegWebp) {
  const command = [
    '-hide_banner','-y','-i',sourceName,'-t',String(duration),'-an','-vf',filter,
    '-c:v','libwebp','-lossless','0','-quality',String(quality),'-compression_level','6','-preset','picture',
    '-start_number','1',framePattern,
  ]
  console.log(`ffmpeg ${command.map((part) => part.includes(' ') ? JSON.stringify(part) : part).join(' ')}`)
  const result = spawnSync('ffmpeg',command,{ stdio:'inherit' })
  if (result.status !== 0) process.exit(result.status || 4)
} else {
  encoder = 'cwebp'
  const temporaryDirectory = path.join(output,'.frames-png-tmp')
  const pngPattern = path.join(temporaryDirectory,`frame-%0${padLength}d.png`)
  await rm(temporaryDirectory,{ recursive:true, force:true })
  await mkdir(temporaryDirectory,{ recursive:true })
  const command = ['-hide_banner','-y','-i',sourceName,'-t',String(duration),'-an','-vf',filter,'-compression_level','3','-start_number','1',pngPattern]
  console.log('FFmpeg libwebp unavailable; extracting lossless intermediates for cwebp.')
  const result = spawnSync('ffmpeg',command,{ stdio:'inherit' })
  if (result.status !== 0) process.exit(result.status || 4)
  const pngFrames = (await readdir(temporaryDirectory)).filter((name) => /^frame-\d{5}\.png$/.test(name)).sort()
  for (const png of pngFrames) {
    const target = path.join(framesDirectory,png.replace(/\.png$/,'.webp'))
    const conversion = spawnSync('cwebp',['-quiet','-preset','picture','-q',String(quality),'-m','6','-mt','-metadata','none',path.join(temporaryDirectory,png),'-o',target])
    if (conversion.status !== 0) throw new Error(`cwebp failed while encoding ${png}`)
  }
  await rm(temporaryDirectory,{ recursive:true, force:true })
}

const frames = (await readdir(framesDirectory)).filter((name) => /^frame-\d{5}\.webp$/.test(name)).sort()
if (frames.length < 2) throw new Error('FFmpeg produced fewer than two frames; check the input video and duration.')
await copyFile(path.join(framesDirectory,frames[0]),path.join(output,'poster.webp'))
const manifest = {
  version:1,
  enabled:true,
  id:`${chapterSlug}-${variant}`,
  sceneId:scene,
  chapter,
  variant,
  pattern:`${publicBase}/frames/frame-{frame}.webp`,
  frameCount:frames.length,
  startNumber:1,
  padLength,
  width,
  height,
  fps:Number(fps.toFixed(3)),
  durationSeconds:duration,
  quality,
  scrollLengthVh,
  maxDecodedFrames,
  poster:`${publicBase}/poster.webp`,
  generatedAt:new Date().toISOString(),
  sourceFilename:path.basename(sourceName),
  encoder,
}
await writeFile(path.join(output,'sequence.json'),`${JSON.stringify(manifest,null,2)}\n`)
console.log(`Generated ${frames.length} frames and ${path.join(output,'sequence.json')}`)
