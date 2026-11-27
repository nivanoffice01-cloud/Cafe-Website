// Prepare gallery-only responsive images. Restoration masters are retained
// separately from the untouched photographs. --originals restores the old source.
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
const originalsOnly = process.argv.includes('--originals')
const manifest = {}
for (const [key, original, alt] of source) {
  const restoration = `assets/gallery-restorations/${key}.png`
  const enhanced = !originalsOnly && await fs.access(restoration).then(() => true, () => false)
  const master = enhanced ? restoration : original
  const meta = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'json', master], { encoding: 'utf8' })).streams[0]
  const scale = enhanced ? 3840 / Math.max(meta.width, meta.height) : 1
  const width = Math.round(meta.width * scale), height = Math.round(meta.height * scale)
  const widths = [...new Set([640,1280,1920,2560,width].map(w => Math.min(w, width)))].sort((a,b) => a-b)
  const output = `public/images/${enhanced ? 'cafe-gallery-enhanced' : 'cafe-gallery'}`
  await fs.mkdir(output, { recursive: true })
  const files = []
  for (const candidate of widths) {
    const filename = `${key}-${candidate}.webp`, candidateHeight = Math.round(height * candidate / width)
    execFileSync('cwebp', ['-quiet', '-q', '92', '-m', '6', '-sharp_yuv', '-resize', String(candidate), String(candidateHeight), master, '-o', `${output}/${filename}`])
    files.push({ src: `${output.replace(/^public/, '')}/${filename}`, width: candidate, height: candidateHeight, bytes: (await fs.stat(`${output}/${filename}`)).size })
  }
  manifest[key] = { original, master, enhanced, alt, width, height, sourceWidth: meta.width, sourceHeight: meta.height, files }
}
await fs.writeFile('src/features/supplied-frontend/gallery-photos.json', JSON.stringify(manifest, null, 2) + '\n')
console.log(`Prepared ${source.length} gallery images. AI-enhanced files are labelled and exported at a 3840px long edge; these are upscaled restorations, not native 4K camera files. Originals remain untouched.`)
