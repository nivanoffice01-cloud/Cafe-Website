// Re-encode retained originals in their full composition for the wide gallery.
// Shared portrait derivatives elsewhere on the website stay unchanged.
import { execFileSync } from 'node:child_process'
import fs from 'node:fs/promises'
const source = [
  ['story-dining', 'public/images/highres/mangosteen_original_1_8k.jpg'],
  ['rooftop-evening', 'public/images/gallery/cafe-16.jpg'],
  ['counter', 'public/images/gallery/cafe-07.jpg'],
  ['facade', 'public/images/highres/mangosteen_original_4_8k.jpg'],
  ['menu-invitation', 'public/images/gallery/cafe-18.jpeg'],
]
const output = 'public/images/cafe-gallery'
await fs.mkdir(output, { recursive: true })
const manifest = {}
for (const [key, original] of source) {
  const meta = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'json', original], { encoding: 'utf8' })).streams[0]
  const widths = [...new Set([640,1280,1920,2560].map(w => Math.min(w, meta.width)))]
  const files = []
  for (const width of widths) {
    const filename = `${key}-${width}.webp`
    execFileSync('cwebp', ['-quiet', '-q', '92', '-m', '6', '-sharp_yuv', '-resize', String(width), '0', original, '-o', `${output}/${filename}`])
    files.push({ src: `/images/cafe-gallery/${filename}`, width, height: Math.round(meta.height * width / meta.width), bytes: (await fs.stat(`${output}/${filename}`)).size })
  }
  manifest[key] = { original, width: meta.width, height: meta.height, files }
}
await fs.writeFile('src/features/supplied-frontend/gallery-photos.json', JSON.stringify(manifest, null, 2) + '\n')
console.log('Prepared five uncropped genuine café photographs; no source enlargement or generative processing.')
