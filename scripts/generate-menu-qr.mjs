import { mkdir, writeFile } from 'node:fs/promises'
import QRCode from 'qrcode'
import tables from '../CRM/qr-tables.json' with { type: 'json' }

const menuUrl = process.env.MENU_QR_URL || 'https://mangosteen-cafe-indore.vercel.app/menu'
const options = {
  type: 'svg', errorCorrectionLevel: 'H', margin: 4, width: 1200,
  color: { dark: '#24352b', light: '#f7f1e5' },
}
const output = new URL('../artifacts/', import.meta.url)
await mkdir(output, { recursive: true })
for (const table of tables) {
  const url = new URL(menuUrl)
  url.searchParams.set('table', table.id)
  const target = url.href
  const filename = `table-${table.id}-order-qr`
  await Promise.all([
    QRCode.toString(target, options).then(svg => writeFile(new URL(`${filename}.svg`, output), svg)),
    QRCode.toBuffer(target, { ...options, type:'png' }).then(png => writeFile(new URL(`${filename}.png`, output), png)),
  ])
  console.log(`Generated ${table.label} order QR for ${target}`)
}
