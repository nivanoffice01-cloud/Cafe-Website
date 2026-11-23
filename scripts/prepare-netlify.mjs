import { cp, mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const source = resolve(root, 'CRM', 'dist')
const destination = resolve(root, 'dist', 'crm')

await mkdir(destination, { recursive: true })
await cp(source, destination, { recursive: true, force: true })

console.log('Copied the CRM client to dist/crm')

