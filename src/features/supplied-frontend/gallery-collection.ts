import type { GalleryPhotoKey } from './gallery-photos'

// Retained café photographs with labelled AI-enhanced gallery variants. These
// are not a live Google visitor feed. Keep the homepage preview capped.
export const galleryCollection: { key: GalleryPhotoKey; title: string; detail: string; position?: string }[] = [
  { key: 'story-dining', title: 'The long table', detail: 'Inside Mangosteen', position: '50% 56%' },
  { key: 'rooftop-evening', title: 'The evening rooftop', detail: 'Above the city', position: '58% 50%' },
  { key: 'counter', title: 'A little café life', detail: 'The café counter', position: '42% 50%' },
  { key: 'facade', title: 'You have arrived', detail: 'Mangosteen, Indore', position: '50% 42%' },
  { key: 'menu-invitation', title: 'A seat in the sunshine', detail: 'On the rooftop' },
  { key: 'cane-seating', title: 'Pull up a chair', detail: 'By the window' },
  { key: 'rooftop-daylight', title: 'An afternoon above the city', detail: 'The rooftop in daylight' },
  { key: 'evening-corner', title: 'Stay into the evening', detail: 'Warm rooftop lighting' },
  { key: 'main-dining', title: 'Room for good company', detail: 'The main dining space' },
]

export const galleryPreview = galleryCollection.slice(0, 6)
