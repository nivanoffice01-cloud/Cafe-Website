// Cropped derivatives of retained Mangosteen photographs. Camera/source files remain untouched.
const photos = {
  "story-dining": {
    "src": "/images/authentic/story-dining-960.webp",
    "srcSet": "/images/authentic/story-dining-480.webp 480w, /images/authentic/story-dining-960.webp 960w, /images/authentic/story-dining-1440.webp 1440w, /images/authentic/story-dining-1920.webp 1920w",
    "sizes": "(max-width: 767px) 100vw, 50vw",
    "alt": "The long wooden dining table, cane chairs and woven pendant lights at Mangosteen"
  },
  "story-food": {
    "src": "/images/authentic/story-food-960.webp",
    "srcSet": "/images/authentic/story-food-480.webp 480w, /images/authentic/story-food-960.webp 960w, /images/authentic/story-food-1440.webp 1440w, /images/authentic/story-food-1920.webp 1920w",
    "sizes": "(max-width: 767px) 100vw, 50vw",
    "alt": "A plated meal photographed on a wooden table at Mangosteen; dish identity not confirmed"
  },
  "counter": {
    "src": "/images/authentic/counter-960.webp",
    "srcSet": "/images/authentic/counter-480.webp 480w, /images/authentic/counter-960.webp 960w, /images/authentic/counter-1440.webp 1440w",
    "sizes": "(max-width: 767px) 100vw, 50vw",
    "alt": "Mangosteen\u2019s caf\u00e9 counter, woven pendant lamps and wooden seating"
  },
  "rooftop-evening": {
    "src": "/images/authentic/rooftop-evening-960.webp",
    "srcSet": "/images/authentic/rooftop-evening-480.webp 480w, /images/authentic/rooftop-evening-960.webp 960w, /images/authentic/rooftop-evening-1440.webp 1440w",
    "sizes": "100vw",
    "alt": "Mangosteen\u2019s rooftop in the evening with wooden tables and tropical greenery"
  },
  "facade": {
    "src": "/images/authentic/facade-960.webp",
    "srcSet": "/images/authentic/facade-480.webp 480w, /images/authentic/facade-960.webp 960w, /images/authentic/facade-1440.webp 1440w, /images/authentic/facade-1920.webp 1920w",
    "sizes": "(max-width: 767px) 100vw, 50vw",
    "alt": "The illuminated handwritten Mangosteen sign, wooden fa\u00e7ade and hanging greenery"
  },
  "visit-interior": {
    "src": "/images/authentic/visit-interior-960.webp",
    "srcSet": "/images/authentic/visit-interior-480.webp 480w, /images/authentic/visit-interior-960.webp 960w, /images/authentic/visit-interior-1440.webp 1440w, /images/authentic/visit-interior-1920.webp 1920w",
    "sizes": "(max-width: 767px) 100vw, 50vw",
    "alt": "Mangosteen\u2019s main dining area, warm pendant lighting and decorative caf\u00e9 counter"
  },
  "cane-seating": {
    "src": "/images/authentic/cane-seating-960.webp",
    "srcSet": "/images/authentic/cane-seating-480.webp 480w, /images/authentic/cane-seating-960.webp 960w",
    "sizes": "(max-width: 767px) 100vw, 50vw",
    "alt": "Cane-back chairs and natural wooden tables beside Mangosteen\u2019s windows"
  },
  "menu-interior": {
    "src": "/images/authentic/menu-interior-960.webp",
    "srcSet": "/images/authentic/menu-interior-480.webp 480w, /images/authentic/menu-interior-960.webp 960w, /images/authentic/menu-interior-1440.webp 1440w, /images/authentic/menu-interior-1920.webp 1920w",
    "sizes": "(max-width: 767px) 100vw, 60vw",
    "alt": "Inside Mangosteen: woven pendant lights, wooden tables, cane chairs and botanical greenery"
  },
  "menu-invitation": {
    "src": "/images/authentic/menu-invitation-960.webp",
    "srcSet": "/images/authentic/menu-invitation-480.webp 480w, /images/authentic/menu-invitation-960.webp 960w, /images/authentic/menu-invitation-1440.webp 1440w",
    "sizes": "(max-width: 767px) 100vw, 50vw",
    "alt": "Wooden rooftop tables and greenery at Mangosteen Caf\u00e9"
  }
} as const

export type AuthenticPhotoKey = keyof typeof photos
export function authenticPhoto(key: AuthenticPhotoKey) { return photos[key] }
