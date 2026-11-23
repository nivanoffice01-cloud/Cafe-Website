import { mkdir, writeFile } from 'node:fs/promises'
import QRCode from 'qrcode'

const menuUrl = process.env.MENU_QR_URL || 'https://mangosteen-cafe-indore.vercel.app/menu'
const target = `${menuUrl}${menuUrl.includes('?') ? '&' : '?'}table=4`
const options = {
  type: 'svg', errorCorrectionLevel: 'H', margin: 3, width: 1200,
  color: { dark: '#24352b', light: '#f7f1e5' },
}
const output = new URL('../artifacts/', import.meta.url)
await mkdir(output, { recursive: true })
await writeFile(new URL('table-4-order-qr.svg', output), await QRCode.toString(target, options))
await writeFile(new URL('table-4-order-qr.png', output), await QRCode.toBuffer(target, { ...options, type: 'png' }))
console.log(`Generated the physical Table 4 order QR for ${target}`)
