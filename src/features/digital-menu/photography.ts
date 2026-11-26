import type { MenuItem } from '../../data/fullMenu'

export type VerifiedMenuPhoto = { src: string; srcSet?: string; alt: string }

// Deliberately separate from the homepage's illustrative photography mapping.
// Add only venue-supplied photographs whose category/dish identity is verified.
// Keys are exact catalogue identifiers, never inferred from a similar-looking dish.
export const verifiedDishPhotos: Record<string, VerifiedMenuPhoto> = {}
export const verifiedCategoryPhotos: Record<string, VerifiedMenuPhoto> = {}

export const dishPhoto = (dish: MenuItem & { category: string }) => verifiedDishPhotos[`${dish.category}|${dish.name}`]
export const categoryPhoto = (category: string) => verifiedCategoryPhotos[category]

export const landingCategories = [
  ['Pizza & Pide', 'Pizza'], ['Burger & sandwich', 'Burgers'], ['Pasta', 'Pasta'],
  ['Mocktail & Coolers', 'Mocktails'], ['Shakes', 'Shakes'], ['Desserts', 'Desserts'],
] as const
