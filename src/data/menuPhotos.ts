export type MenuPhoto = { src: string; alt: string }

// Dish-specific editorial references. These are not photographs of Mangosteen's servings.
const dishPhotos: Record<string, MenuPhoto> = {
  'Pizza & Pide|Margarita': {
    src: '/images/menu/margarita-pizza.jpg',
    alt: 'Illustrative photograph of a basil and mozzarella pizza',
  },
  'Pasta|Pesto cream Pasta': {
    src: '/images/menu/pesto-pasta.jpg',
    alt: 'Illustrative photograph of basil pesto pasta with parmesan',
  },
  'Burger & sandwich|Veg Cheese Burger': {
    src: '/images/menu/veg-cheese-burger.jpg',
    alt: 'Illustrative photograph of a veggie cheese burger',
  },
  'Mocktail & Coolers|Virgin mojito': {
    src: '/images/menu/virgin-mojito.jpg',
    alt: 'Illustrative photograph of a lime and mint mojito',
  },
  'Desserts|Chocolate Cheesecake': {
    src: '/images/menu/chocolate-cheesecake.jpg',
    alt: 'Illustrative photograph of a chocolate cheesecake slice',
  },
}

// AI-created category portraits keep the complete menu visual without claiming to
// show the cafe's exact plating. Dish-specific references above take precedence.
const categoryPhotos: Record<string, MenuPhoto> = {
  Shakes: { src: '/images/menu-ai/shakes.webp', alt: 'Illustrative café photograph of artisan milkshakes' },
  Juice: { src: '/images/menu-ai/juice.webp', alt: 'Illustrative café photograph of fresh pressed juices' },
  'Mocktail & Coolers': { src: '/images/menu-ai/mocktails.webp', alt: 'Illustrative café photograph of fruit mocktails and coolers' },
  'Iced Tea': { src: '/images/menu-ai/iced-tea.webp', alt: 'Illustrative café photograph of peach and lemon iced tea' },
  Salad: { src: '/images/menu-ai/salad.webp', alt: 'Illustrative café photograph of a burrata and grilled vegetable salad' },
  'Pizza & Pide': { src: '/images/menu-ai/pizza-pide.webp', alt: 'Illustrative café photograph of an artisan vegetable pizza' },
  'Burger & sandwich': { src: '/images/menu-ai/burgers-sandwiches.webp', alt: 'Illustrative café photograph of a vegetable cheese burger and fries' },
  Breakfast: { src: '/images/menu-ai/breakfast.webp', alt: 'Illustrative café photograph of an omelette breakfast spread' },
  'Small Plates': { src: '/images/menu-ai/small-plates.webp', alt: 'Illustrative café photograph of falafel, hummus, pita and fries' },
  Pasta: { src: '/images/menu-ai/pasta.webp', alt: 'Illustrative café photograph of creamy pesto pasta' },
  Desserts: { src: '/images/menu-ai/desserts.webp', alt: 'Illustrative café photograph of assorted chocolate desserts' },
  'Main Course': { src: '/images/menu-ai/main-course.webp', alt: 'Illustrative café photograph of a composed grilled main course' },
  Soup: { src: '/images/menu-ai/soup.webp', alt: 'Illustrative café photograph of tomato and coconut soups' },
}

export function menuPhotoFor(category: string, name: string): MenuPhoto | undefined {
  return dishPhotos[`${category}|${name}`] ?? categoryPhotos[category]
}

export function hasDishPhoto(category: string, name: string) {
  return Boolean(dishPhotos[`${category}|${name}`])
}

// Banners have their own category mapping, independent of whichever dish is first.
// All currently remain temporary illustrations; no matched genuine category food
// photograph was found. See the complete missing-asset inventory in the review.
export function categoryBannerFor(category: string): MenuPhoto | undefined {
  return categoryPhotos[category]
}

export function menuPhotoStatus(category: string, name: string) {
  return {
    genuine: false,
    kind: hasDishPhoto(category, name) ? 'illustrative-dish' : 'illustrative-category',
    requiresOriginal: true,
  } as const
}
