export type MenuItem = {
  id?: number
  name: string
  price: number
  description?: string
  available?: boolean
}

export type MenuCategory = {
  name: string
  items: MenuItem[]
}

// The public website and Vercel Function share one runtime-safe menu catalog.
// @ts-expect-error The shared ESM data file intentionally has no declaration file.
import { fullMenu as sharedFullMenu, fullMenuCount as sharedFullMenuCount } from '../../api/full-menu.mjs'

export const fullMenu = sharedFullMenu as MenuCategory[]
export const fullMenuCount = sharedFullMenuCount as number
