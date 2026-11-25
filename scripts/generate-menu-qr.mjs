import QRCode from 'qrcode'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { orderTables } from '../api/table-config.mjs'

const menuUrl = process.env.MENU_QR_URL || 'https://mangosteen-cafe-indore.vercel.app/menu'
const output = new URL('../artifacts/table-order-qrs/', import.meta.url)
const crmOutput = new URL('../CRM/dist/assets/table-qrs/', import.meta.url)
await rm(output, { recursive: true, force: true })
await rm(crmOutput, { recursive: true, force: true })
await mkdir(output, { recursive: true })
await mkdir(crmOutput, { recursive: true })

for (const table of orderTables) {
  const separator = menuUrl.includes('?') ? '&' : '?'
  const target = `${menuUrl}${separator}table=${encodeURIComponent(table.id)}&key=${encodeURIComponent(table.accessKey)}`
  const filename = `table-${table.id.padStart(2, '0')}-order-qr`
  const options = { errorCorrectionLevel: 'H', margin: 3, color: { dark: '#1d3025', light: '#fffaf2' }, width: 1200 }
  const svg = await QRCode.toString(target, { ...options, type: 'svg' })
  const png = await QRCode.toBuffer(target, { ...options, type: 'png' })
  await Promise.all([
    writeFile(new URL(`${filename}.svg`, output), svg), writeFile(new URL(`${filename}.png`, output), png),
    writeFile(new URL(`${filename}.svg`, crmOutput), svg), writeFile(new URL(`${filename}.png`, crmOutput), png),
  ])
}

console.log(`Generated ${orderTables.length} protected table QR pairs for print and CRM downloads`)
