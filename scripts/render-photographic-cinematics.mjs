#!/usr/bin/env node
import { mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import process from 'node:process'

const argumentsMap = new Map()
for (let index = 2; index < process.argv.length; index += 2) {
  const name = process.argv[index]
  const value = process.argv[index + 1]
  if (!name?.startsWith('--') || value === undefined) throw new Error(`Expected --name value, received ${name || 'nothing'}`)
  argumentsMap.set(name.slice(2), value)
}

const numberOption = (name, fallback) => {
  const parsed = Number(argumentsMap.get(name) ?? fallback)
  if (!Number.isFinite(parsed) || parsed <= 0) throw new Error(`--${name} must be a positive number`)
  return parsed
}

const duration = numberOption('duration', 8)
const fps = numberOption('fps', 24)
const crf = numberOption('crf', 18)
const desktopWidth = numberOption('desktop-width', 1920)
const desktopHeight = numberOption('desktop-height', 1080)
const mobileWidth = numberOption('mobile-width', 1080)
const mobileHeight = numberOption('mobile-height', 1920)
const fromChapter = numberOption('from-chapter', 1)

const sources = {
  exterior: path.resolve('public/images/highres/mangosteen_original_4_8k.jpg'),
  interiorNight: path.resolve('public/images/highres/mangosteen_original_3_8k.jpg'),
  interiorDay: path.resolve('public/images/highres/mangosteen_original_1_8k.jpg'),
  interiorWide: path.resolve('public/images/gallery/cafe-07.jpg'),
  coffeeIllustration: path.resolve('public/images/cinematic/generated/coffee-pour-vfx-v1.png'),
  pizza: path.resolve('public/images/menu-ai/pizza-pide.webp'),
  mocktails: path.resolve('public/images/menu-ai/mocktails.webp'),
  rooftopDay: path.resolve('public/images/gallery/cafe-14.png'),
  rooftopNight: path.resolve('public/images/gallery/cafe-16.jpg'),
  candlelitClosing: path.resolve('public/images/gallery/cafe-19.jpg'),
}

for (const [name, source] of Object.entries(sources)) {
  if (!existsSync(source)) throw new Error(`Missing genuine Mangosteen ${name} photograph: ${source}`)
}

const outputPath = (chapter, scene, variant) => path.resolve(
  'cinematic-source',
  `chapter-${String(chapter).padStart(2, '0')}-${scene}`,
  variant,
  `chapter-${String(chapter).padStart(2, '0')}-${scene}-${variant}.mp4`,
)

const cover = (width, height) => `scale=${width}:${height}:force_original_aspect_ratio=increase:flags=lanczos,crop=${width}:${height}`
const grade = 'eq=contrast=1.035:brightness=-0.012:saturation=0.94,vignette=PI/5.8'
const zoom = (width, height, increment, max, verticalExpression = 'ih/2-(ih/zoom/2)') =>
  `zoompan=z='min(zoom+${increment},${max})':x='iw/2-(iw/zoom/2)':y='${verticalExpression}':d=1:s=${width}x${height}:fps=${fps}`

function render({ chapter, scene, variant, width, height, first, second, transitionOffset, transitionDuration, firstMotion, secondMotion }) {
  const destination = outputPath(chapter, scene, variant)
  const sourceDuration = duration + transitionOffset + transitionDuration
  const firstFilter = [cover(width, height), firstMotion, `trim=duration=${duration}`, 'setpts=PTS-STARTPTS', grade].filter(Boolean).join(',')
  const secondFilter = [cover(width, height), secondMotion, `trim=duration=${sourceDuration}`, 'setpts=PTS-STARTPTS', grade].filter(Boolean).join(',')
  const graph = [
    `[0:v]${firstFilter}[first]`,
    `[1:v]${secondFilter}[second]`,
    `[first][second]xfade=transition=fade:duration=${transitionDuration}:offset=${transitionOffset},trim=duration=${duration},fps=${fps},format=yuv420p[out]`,
  ].join(';')
  const ffmpegArguments = [
    '-hide_banner', '-y',
    '-loop', '1', '-framerate', String(fps), '-i', first,
    '-loop', '1', '-framerate', String(fps), '-i', second,
    '-filter_complex', graph,
    '-map', '[out]', '-an', '-r', String(fps),
    '-c:v', 'libx264', '-preset', 'slow', '-crf', String(crf), '-movflags', '+faststart',
    '-t', String(duration), destination,
  ]
  console.log(`Rendering ${path.relative(process.cwd(), destination)} (${width}x${height}, ${duration}s, ${fps}fps)`)
  const result = spawnSync('ffmpeg', ffmpegArguments, { stdio: 'inherit' })
  if (result.status !== 0) process.exit(result.status || 2)
}

for (const profile of [
  { variant: 'desktop', width: desktopWidth, height: desktopHeight },
  { variant: 'mobile', width: mobileWidth, height: mobileHeight },
]) {
  await mkdir(path.dirname(outputPath(1, 'arrival', profile.variant)), { recursive: true })
  await mkdir(path.dirname(outputPath(2, 'interior', profile.variant)), { recursive: true })

  const mobile = profile.variant === 'mobile'
  if (fromChapter <= 1) render({
    chapter: 1,
    scene: 'arrival',
    ...profile,
    first: sources.exterior,
    second: sources.interiorNight,
    transitionOffset: 5.8,
    transitionDuration: 1.4,
    firstMotion: zoom(profile.width, profile.height, mobile ? 0.00052 : 0.00038, mobile ? 1.1 : 1.075, mobile ? 'ih/2-(ih/zoom/2)-on*0.015' : 'ih/2-(ih/zoom/2)-on*0.008'),
    // A fixed final plate makes the Chapter 01/02 handoff frame-exact.
    secondMotion: `fps=${fps}`,
  })

  if (fromChapter <= 2) render({
    chapter: 2,
    scene: 'interior',
    ...profile,
    first: sources.interiorNight,
    second: sources.interiorDay,
    transitionOffset: 4.15,
    transitionDuration: 1.25,
    firstMotion: `fps=${fps}`,
    secondMotion: zoom(profile.width, profile.height, mobile ? 0.00034 : 0.00025, mobile ? 1.07 : 1.055),
  })

  for (const scene of [
    { chapter: 3, name: 'walkthrough', first: sources.interiorDay, second: sources.interiorWide, offset: 4.45, transition: 1.15 },
    { chapter: 4, name: 'coffee', first: sources.interiorWide, second: sources.coffeeIllustration, offset: 2.4, transition: 1.2 },
    { chapter: 5, name: 'pizza', first: sources.coffeeIllustration, second: sources.pizza, offset: 2.2, transition: 1.2 },
    { chapter: 6, name: 'mocktail', first: sources.pizza, second: sources.mocktails, offset: 2.2, transition: 1.2 },
    { chapter: 7, name: 'day-night', first: sources.rooftopDay, second: sources.rooftopNight, offset: 3.35, transition: 2.25 },
    { chapter: 8, name: 'closing', first: sources.rooftopNight, second: sources.candlelitClosing, offset: 4.25, transition: 1.45 },
  ].filter((scene) => scene.chapter >= fromChapter)) {
    await mkdir(path.dirname(outputPath(scene.chapter, scene.name, profile.variant)), { recursive: true })
    render({
      chapter: scene.chapter,
      scene: scene.name,
      ...profile,
      first: scene.first,
      second: scene.second,
      transitionOffset: scene.offset,
      transitionDuration: scene.transition,
      firstMotion: zoom(profile.width, profile.height, mobile ? 0.00028 : 0.0002, mobile ? 1.06 : 1.045),
      secondMotion: zoom(profile.width, profile.height, mobile ? 0.00036 : 0.00024, mobile ? 1.075 : 1.052),
    })
  }
}

console.log('Rendered the eight-chapter photographic 2.5D masters. Generated food/beverage plates remain explicitly illustrative.')
