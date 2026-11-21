export type MenuPhoto = { src: string; alt: string }

// Editorial references only. These are not photographs of Mangosteen's servings.
const photos: Record<string, MenuPhoto> = {
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

export function menuPhotoFor(category: string, name: string): MenuPhoto | undefined {
  return photos[`${category}|${name}`]
}
