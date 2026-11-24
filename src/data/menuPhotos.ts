export type MenuPhoto = { src: string; alt: string; kind: 'dish' | 'category' }

// Dish-specific editorial references. These are not photographs of Mangosteen's servings.
const dishPhotos: Record<string, MenuPhoto> = {
  'Pizza & Pide|Margarita': {
    src: '/images/menu/margarita-pizza.jpg',
    alt: 'Illustrative photograph of a basil and mozzarella pizza',
    kind: 'dish',
  },
  'Pasta|Pesto cream Pasta': {
    src: '/images/menu/pesto-pasta.jpg',
    alt: 'Illustrative photograph of basil pesto pasta with parmesan',
    kind: 'dish',
  },
  'Burger & sandwich|Veg Cheese Burger': {
    src: '/images/menu/veg-cheese-burger.jpg',
    alt: 'Illustrative photograph of a veggie cheese burger',
    kind: 'dish',
  },
  'Mocktail & Coolers|Virgin mojito': {
    src: '/images/menu/virgin-mojito.jpg',
    alt: 'Illustrative photograph of a lime and mint mojito',
    kind: 'dish',
  },
  'Desserts|Chocolate Cheesecake': {
    src: '/images/menu/chocolate-cheesecake.jpg',
    alt: 'Illustrative photograph of a chocolate cheesecake slice',
    kind: 'dish',
  },
}

// AI-created category portraits keep the complete menu visual without claiming to
// show the cafe's exact plating. Dish-specific references above take precedence.
const categoryPhotos: Record<string, MenuPhoto> = {
  Shakes: { src: '/images/menu-ai/shakes.webp', alt: 'Illustrative café photograph of artisan milkshakes', kind: 'category' },
  Juice: { src: '/images/menu-ai/juice.webp', alt: 'Illustrative café photograph of fresh pressed juices', kind: 'category' },
  'Mocktail & Coolers': { src: '/images/menu-ai/mocktails.webp', alt: 'Illustrative café photograph of fruit mocktails and coolers', kind: 'category' },
  'Iced Tea': { src: '/images/menu-ai/iced-tea.webp', alt: 'Illustrative café photograph of peach and lemon iced tea', kind: 'category' },
  Salad: { src: '/images/menu-ai/salad.webp', alt: 'Illustrative café photograph of a burrata and grilled vegetable salad', kind: 'category' },
  'Pizza & Pide': { src: '/images/menu-ai/pizza-pide.webp', alt: 'Illustrative café photograph of an artisan vegetable pizza', kind: 'category' },
  'Burger & sandwich': { src: '/images/menu-ai/burgers-sandwiches.webp', alt: 'Illustrative café photograph of a vegetable cheese burger and fries', kind: 'category' },
  Breakfast: { src: '/images/menu-ai/breakfast.webp', alt: 'Illustrative café photograph of an omelette breakfast spread', kind: 'category' },
  'Small Plates': { src: '/images/menu-ai/small-plates.webp', alt: 'Illustrative café photograph of falafel, hummus, pita and fries', kind: 'category' },
  Pasta: { src: '/images/menu-ai/pasta.webp', alt: 'Illustrative café photograph of creamy pesto pasta', kind: 'category' },
  Desserts: { src: '/images/menu-ai/desserts.webp', alt: 'Illustrative café photograph of assorted chocolate desserts', kind: 'category' },
  'Main Course': { src: '/images/menu-ai/main-course.webp', alt: 'Illustrative café photograph of a composed grilled main course', kind: 'category' },
  Soup: { src: '/images/menu-ai/soup.webp', alt: 'Illustrative café photograph of tomato and coconut soups', kind: 'category' },
}

export function menuPhotoFor(category: string, name: string): MenuPhoto | undefined {
  return dishPhotos[`${category}|${name}`] ?? categoryPhotos[category]
}

export function dishPhotoFor(category: string, name: string): MenuPhoto | undefined {
  return dishPhotos[`${category}|${name}`]
}

export function categoryPhotoFor(category: string): MenuPhoto | undefined {
  return categoryPhotos[category]
}
