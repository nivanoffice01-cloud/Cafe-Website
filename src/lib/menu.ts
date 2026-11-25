import { fullMenu, type MenuCategory } from '../data/fullMenu'

export type PublicMenuResponse = { categories: MenuCategory[]; updatedAt: string }

const crmBaseUrl = (import.meta.env.VITE_CRM_API_URL || '/crm-api').replace(/\/$/, '')
const fallback = fullMenu.map((category) => ({ ...category, items: category.items.map((item) => ({ ...item, available: true })) }))

export async function getPublicMenu(): Promise<PublicMenuResponse> {
  const response = await fetch(`${crmBaseUrl}/api/public/menu`, { cache: 'no-store' })
  if (!response.ok) throw new Error('Live menu is temporarily unavailable')
  const payload = await response.json() as PublicMenuResponse
  if (!Array.isArray(payload.categories) || !payload.categories.length) throw new Error('The live menu is empty')
  return payload
}

export const fallbackPublicMenu = fallback
