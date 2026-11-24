export type SeatingZone = 'rooftop' | 'inside'

export type SeatCluster = {
  id: string
  label: string
  capacity: number
  columns: number
  column: 1 | 2 | 3
  row: 1 | 2 | 3
}

// Schematic positions inspired by the supplied café photographs. These are not
// live inventory or a surveyed floor plan; replace them with owner-verified data.
export const seatingPlans: Record<SeatingZone, { name: string; orientation: string; entry: string; description: string; image: string; imageAlt: string; clusters: SeatCluster[] }> = {
  rooftop: {
    name: 'The rooftop',
    orientation: 'OPEN EDGE · PLANTS & EVENING LIGHT',
    entry: 'ENTRY FROM INSIDE',
    description: 'Open-air tables among greenery, with the softest light near sunset.',
    image: '/images/gallery/cafe-06.png',
    imageAlt: 'Rattan chairs and a timber table on Mangosteen Café’s planted rooftop',
    clusters: [
      { id: 'R1', label: 'Railside 01', capacity: 2, columns: 2, column: 1, row: 1 },
      { id: 'R2', label: 'Railside 02', capacity: 2, columns: 2, column: 2, row: 1 },
      { id: 'R3', label: 'Railside 03', capacity: 2, columns: 2, column: 3, row: 1 },
      { id: 'G1', label: 'Garden 01', capacity: 4, columns: 2, column: 1, row: 2 },
      { id: 'G2', label: 'Garden 02', capacity: 4, columns: 2, column: 2, row: 2 },
      { id: 'C1', label: 'Canopy 01', capacity: 6, columns: 3, column: 3, row: 2 },
      { id: 'L1', label: 'Lounge 01', capacity: 4, columns: 2, column: 1, row: 3 },
      { id: 'L2', label: 'Lounge 02', capacity: 4, columns: 2, column: 2, row: 3 },
    ],
  },
  inside: {
    name: 'Inside Mangosteen',
    orientation: 'WINDOWS · WOVEN LIGHTS',
    entry: 'ENTRY / SERVICE',
    description: 'A sheltered dining room with woven pendants, broad windows and warm timber tables.',
    image: '/images/gallery/cafe-07.jpg',
    imageAlt: 'The light-filled interior dining room at Mangosteen Café',
    clusters: [
      { id: 'W1', label: 'Window 01', capacity: 4, columns: 2, column: 1, row: 1 },
      { id: 'W2', label: 'Window 02', capacity: 4, columns: 2, column: 1, row: 2 },
      { id: 'D1', label: 'Dining 01', capacity: 6, columns: 3, column: 2, row: 1 },
      { id: 'D2', label: 'Dining 02', capacity: 4, columns: 2, column: 2, row: 2 },
      { id: 'S1', label: 'Sofa 01', capacity: 4, columns: 2, column: 3, row: 1 },
      { id: 'S2', label: 'Sofa 02', capacity: 2, columns: 2, column: 3, row: 2 },
      { id: 'B1', label: 'Bar side', capacity: 2, columns: 2, column: 3, row: 3 },
    ],
  },
}

export const seatsFor = (cluster: SeatCluster) => Array.from({ length: cluster.capacity }, (_, index) => `${cluster.id}-${index + 1}`)

export type OrderTable = SeatCluster & { zone: SeatingZone; zoneName: string }

// QR ordering is intentionally separate from the reservation floor-plan model.
// Only codes physically printed and placed by the cafe belong in this list.
export const orderTables: OrderTable[] = [
  { id: '4', label: 'Table 4', capacity: 4, columns: 2, column: 2, row: 2, zone: 'inside', zoneName: 'Cafe floor' },
]

export const orderTableFor = (code: string | null | undefined) => {
  const normalized = String(code || '').trim().toUpperCase()
  return orderTables.find((table) => table.id === normalized) || null
}
