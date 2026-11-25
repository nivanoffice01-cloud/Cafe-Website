export type Viewpoint = {
  id: string
  name: string
  zone: string
  description: string
  image: string
  position: { x: number; y: number }
}

export const viewpoints: Viewpoint[] = [
  { id: 'facade', name: 'The Arrival', zone: 'Entrance', description: 'The illuminated Mangosteen façade, photographed from the street.', image: '/images/experience/mangosteen-arrival-enhanced.jpg', position: { x: 17, y: 68 } },
  { id: 'long-table', name: 'The Long Table', zone: 'Indoor seating', description: 'A shared wooden table beneath woven pendant lights.', image: '/images/experience/mangosteen-interior-enhanced.jpg', position: { x: 43, y: 48 } },
  { id: 'evening-room', name: 'The Evening Room', zone: 'Indoor seating', description: 'Warm light, cane details and a quieter corner of the café.', image: '/images/highres/mangosteen_original_3_8k.jpg', position: { x: 70, y: 42 } },
  { id: 'table', name: 'At the Table', zone: 'Dining', description: 'A closer view of the table and the food that brings people together.', image: '/images/experience/mangosteen-table-enhanced.jpg', position: { x: 76, y: 71 } },
]

export const atmosphere = [
  { label: 'Slow afternoon', image: '/images/gallery/cafe-14.png', copy: 'Natural light, cane textures and an unhurried table.' },
  { label: 'Golden hour', image: '/images/gallery/cafe-07.jpg', copy: 'The room softens as the city turns warm.' },
  { label: 'After dark', image: '/images/highres/mangosteen_original_3_8k.jpg', copy: 'Pendant light, deep green and the evening in full swing.' },
]
