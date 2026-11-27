// Re-encode retained originals in their full composition for the wide gallery.
// Shared portrait derivatives elsewhere on the website stay unchanged.
import { execFileSync } from 'node:child_process'
import fs from 'node:fs/promises'
const source = [
  ['story-dining', 'public/images/highres/mangosteen_original_1_8k.jpg', 'The long wooden dining table, cane chairs and woven pendant lights at Mangosteen'],
  ['rooftop-evening', 'public/images/gallery/cafe-16.jpg', 'Mangosteen’s rooftop in the evening with wooden tables and tropical greenery'],
  ['counter', 'public/images/gallery/cafe-07.jpg', 'Mangosteen’s café counter, woven pendant lamps and wooden seating'],
  ['facade', 'public/images/highres/mangosteen_original_4_8k.jpg', 'The illuminated handwritten Mangosteen sign, wooden façade and hanging greenery'],
  ['menu-invitation', 'public/images/gallery/cafe-18.jpeg', 'Wooden rooftop tables and greenery at Mangosteen Café'],
  ['cane-seating', 'public/images/gallery/cafe-06.png', 'Cane-back chairs and wooden tables beside Mangosteen’s windows'],
  ['rooftop-daylight', 'public/images/gallery/cafe-14.png', 'Mangosteen’s open rooftop in daylight, with wooden tables and tropical planters'],
  ['evening-corner', 'public/images/gallery/cafe-19.jpg', 'Warm pendant lighting over Mangosteen’s rooftop seating in the evening'],
  ['main-dining', 'public/images/highres/mangosteen_original_3_8k.jpg', 'Mangosteen’s main dining space with woven pendant lamps and its decorative café counter'],
]
const output = 'public/images/cafe-gallery'
await fs.mkdir(output, { recursive: true })
const manifest = {}
for (const [key, original, alt] of source) {
  const meta = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'json', original], { encoding: 'utf8' })).streams[0]
  const widths = [...new Set([640,1280,1920,2560].map(w => Math.min(w, meta.width)))]
  const files = []
  for (const width of widths) {
    const filename = `${key}-${width}.webp`
    execFileSync('cwebp', ['-quiet', '-q', '92', '-m', '6', '-sharp_yuv', '-resize', String(width), '0', original, '-o', `${output}/${filename}`])
    files.push({ src: `/images/cafe-gallery/${filename}`, width, height: Math.round(meta.height * width / meta.width), bytes: (await fs.stat(`${output}/${filename}`)).size })
  }
  manifest[key] = { original, alt, width: meta.width, height: meta.height, files }
}
await fs.writeFile('src/features/supplied-frontend/gallery-photos.json', JSON.stringify(manifest, null, 2) + '\n')
console.log(`Prepared ${source.length} uncropped retained café photographs; no source enlargement or generative processing.`)
