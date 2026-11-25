import { mkdir, writeFile } from 'node:fs/promises'
import { fullMenu } from '../api/full-menu.mjs'

const target = new URL('../shared/menu-catalog.json', import.meta.url)
await mkdir(new URL('../shared/', import.meta.url), { recursive: true })
await writeFile(target, `${JSON.stringify(fullMenu, null, 2)}\n`)
console.log(`Exported ${fullMenu.reduce((sum, category) => sum + category.items.length, 0)} menu items to shared/menu-catalog.json`)
