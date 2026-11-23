import { writeFile } from 'node:fs/promises'
import QRCode from 'qrcode'

const target = process.env.MENU_QR_URL || 'https://mangosteen-cafe-indore-206.netlify.app/menu'
const svg = await QRCode.toString(target, {
  type: 'svg', errorCorrectionLevel: 'H', margin: 3, width: 1200,
  color: { dark: '#24352b', light: '#f7f1e5' },
})
await writeFile(new URL('../public/menu-qr.svg', import.meta.url), svg)
console.log(`Generated public/menu-qr.svg for ${target}`)
