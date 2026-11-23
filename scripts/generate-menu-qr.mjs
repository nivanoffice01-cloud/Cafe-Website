import { mkdir, writeFile } from 'node:fs/promises'
import QRCode from 'qrcode'

const target = process.env.MENU_QR_URL || 'https://mangosteen-cafe-indore-206.netlify.app/menu'
const options = {
  type: 'svg', errorCorrectionLevel: 'H', margin: 3, width: 1200,
  color: { dark: '#24352b', light: '#f7f1e5' },
}
const tables = [
  ['R1', 'Railside 01', 'The rooftop'], ['R2', 'Railside 02', 'The rooftop'], ['R3', 'Railside 03', 'The rooftop'],
  ['G1', 'Garden 01', 'The rooftop'], ['G2', 'Garden 02', 'The rooftop'], ['C1', 'Canopy 01', 'The rooftop'],
  ['L1', 'Lounge 01', 'The rooftop'], ['L2', 'Lounge 02', 'The rooftop'], ['W1', 'Window 01', 'Inside Mangosteen'],
  ['W2', 'Window 02', 'Inside Mangosteen'], ['D1', 'Dining 01', 'Inside Mangosteen'], ['D2', 'Dining 02', 'Inside Mangosteen'],
  ['S1', 'Sofa 01', 'Inside Mangosteen'], ['S2', 'Sofa 02', 'Inside Mangosteen'], ['B1', 'Bar side', 'Inside Mangosteen'],
]
const svg = await QRCode.toString(target, options)
await writeFile(new URL('../public/menu-qr.svg', import.meta.url), svg)
const output = new URL('../public/table-qr/', import.meta.url)
await mkdir(output, { recursive: true })
for (const [code] of tables) {
  const tableUrl = `${target}${target.includes('?') ? '&' : '?'}table=${encodeURIComponent(code)}`
  await writeFile(new URL(`${code}.svg`, output), await QRCode.toString(tableUrl, options))
}
const cards = tables.map(([code, label, zone]) => `<article><img src="./table-qr/${code}.svg" alt="QR code for ${label}"><p>MANGOSTEEN · ${zone.toUpperCase()}</p><h2>${label}</h2><strong>TABLE ${code}</strong><small>Scan to view the menu and order for this table</small></article>`).join('')
const printSheet = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Mangosteen table QR cards</title><style>*{box-sizing:border-box}body{margin:0;padding:24px;color:#27322a;background:#eee8dc;font-family:Arial,sans-serif}.intro{max-width:1000px;margin:0 auto 24px}.intro h1{font-family:Georgia,serif;font-size:36px;margin:0 0 8px}.intro p{color:#64685f}.grid{display:grid;max-width:1000px;grid-template-columns:repeat(3,1fr);gap:16px;margin:auto}article{break-inside:avoid;display:grid;justify-items:center;padding:20px;border:1px solid #c9bfaf;background:#f8f2e8;text-align:center}img{width:180px;height:180px}p{margin:10px 0 5px;color:#836b48;font-size:8px;letter-spacing:.13em}h2{margin:0;font-family:Georgia,serif;font-size:25px;font-weight:500}strong{margin-top:7px;font-size:11px;letter-spacing:.16em}small{max-width:190px;margin-top:8px;color:#77776e;font-size:9px;line-height:1.4}@media(max-width:700px){.grid{grid-template-columns:1fr 1fr}}@media print{body{padding:0;background:#fff}.intro{display:none}.grid{grid-template-columns:repeat(3,1fr);gap:0}article{min-height:92mm;border-color:#aaa;page-break-inside:avoid}img{width:45mm;height:45mm}}</style></head><body><div class="intro"><h1>Dedicated table QR cards</h1><p>Print at 100% scale and attach the matching card to each physical table. Verify every code before service.</p></div><main class="grid">${cards}</main></body></html>`
await writeFile(new URL('../table-qr.html', output), printSheet)
console.log(`Generated the menu preview QR and ${tables.length} dedicated table QR cards for ${target}`)
