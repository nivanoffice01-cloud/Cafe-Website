import { fullMenu, type MenuItem } from '../../data/fullMenu'
import generatedDishPhotos from './generated-dish-photos.json'
import { categoryBannerFor, hasDishPhoto, menuPhotoFor } from '../../data/menuPhotos'

export type VerifiedMenuPhoto = { src: string; srcSet?: string; alt: string; kind?: 'genuine' | 'reference' | 'generated'; position?: string }

// Deliberately separate from the homepage's illustrative photography mapping.
// Add only venue-supplied photographs whose category/dish identity is verified.
// Keys are exact catalogue identifiers, never inferred from a similar-looking dish.
export const verifiedDishPhotos: Record<string, VerifiedMenuPhoto> = {}
export const verifiedCategoryPhotos: Record<string, VerifiedMenuPhoto> = {}

function displayPhoto(source: string, alt: string, kind: 'reference' | 'generated', position = '50% 50%'): VerifiedMenuPhoto {
  const name = source.split('/').pop()!.replace(/\.[^.]+$/, '')
  const prefix = kind === 'generated' ? 'category' : 'dish'
  const base = `/images/menu-display/${prefix}-${name}`
  return { src: `${base}-800.webp`, srcSet: `${base}-320.webp 320w, ${base}-800.webp 800w`, alt, kind, position }
}

// Illustrations are now enabled at the user's request. Verified originals always
// win; an unrelated category photograph is never substituted for a named dish.
export function dishPhoto(dish: MenuItem & { category: string }) {
  const genuine = verifiedDishPhotos[`${dish.category}|${dish.name}`]
  if (genuine) return genuine
  const reference = hasDishPhoto(dish.category, dish.name) ? menuPhotoFor(dish.category, dish.name) : undefined
  if (reference) return displayPhoto(reference.src, `Illustrative reference for ${dish.name}; not Mangosteen's actual serving`, 'reference')
  return (generatedDishPhotos as Record<string, VerifiedMenuPhoto>)[dish.category + '|' + dish.name]
}

export function categoryPhoto(category: string) {
  const genuine = verifiedCategoryPhotos[category]
  if (genuine) return genuine
  const illustration = categoryBannerFor(category)
  return illustration ? displayPhoto(illustration.src, `AI-generated illustration for ${category}; not actual Mangosteen food photography`, 'generated') : undefined
}

const priorityCategories = [
  ['Pizza & Pide', 'Pizza'], ['Burger & sandwich', 'Burgers'], ['Pasta', 'Pasta'],
  ['Mocktail & Coolers', 'Mocktails'], ['Shakes', 'Shakes'], ['Desserts', 'Desserts'],
] as const

// Preserve the familiar first six shortcuts, then include every remaining
// category from the authoritative catalogue without maintaining a second list.
export const landingCategories = [
  ...priorityCategories.filter(([name]) => fullMenu.some(category => category.name === name)),
  ...fullMenu.filter(category => !priorityCategories.some(([name]) => name === category.name))
    .map(category => [category.name, category.name] as const),
]
