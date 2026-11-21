export type SeatingZone = 'rooftop' | 'inside'

export type SeatCluster = {
  id: string
  label: string
  capacity: number
  columns: number
  x: number
  y: number
}

// Schematic positions inspired by the supplied café photographs. These are not
// live inventory or a surveyed floor plan; replace them with owner-verified data.
export const seatingPlans: Record<SeatingZone, { name: string; orientation: string; entry: string; clusters: SeatCluster[] }> = {
  rooftop: {
    name: 'The rooftop',
    orientation: 'OPEN EDGE · PLANTS & EVENING LIGHT',
    entry: 'ENTRY FROM INSIDE',
    clusters: [
      { id: 'R1', label: 'Railside 01', capacity: 2, columns: 2, x: 12, y: 15 },
      { id: 'R2', label: 'Railside 02', capacity: 2, columns: 2, x: 39, y: 15 },
      { id: 'R3', label: 'Railside 03', capacity: 2, columns: 2, x: 68, y: 15 },
      { id: 'G1', label: 'Garden 01', capacity: 4, columns: 2, x: 10, y: 46 },
      { id: 'G2', label: 'Garden 02', capacity: 4, columns: 2, x: 38, y: 46 },
      { id: 'C1', label: 'Canopy 01', capacity: 6, columns: 3, x: 68, y: 43 },
      { id: 'L1', label: 'Lounge 01', capacity: 4, columns: 2, x: 14, y: 66 },
      { id: 'L2', label: 'Lounge 02', capacity: 4, columns: 2, x: 47, y: 66 },
    ],
  },
  inside: {
    name: 'Inside Mangosteen',
    orientation: 'WINDOWS · WOVEN LIGHTS',
    entry: 'ENTRY / SERVICE',
    clusters: [
      { id: 'W1', label: 'Window 01', capacity: 4, columns: 2, x: 9, y: 13 },
      { id: 'W2', label: 'Window 02', capacity: 4, columns: 2, x: 9, y: 50 },
      { id: 'D1', label: 'Dining 01', capacity: 6, columns: 3, x: 39, y: 17 },
      { id: 'D2', label: 'Dining 02', capacity: 4, columns: 2, x: 41, y: 56 },
      { id: 'S1', label: 'Sofa 01', capacity: 4, columns: 2, x: 73, y: 16 },
      { id: 'S2', label: 'Sofa 02', capacity: 2, columns: 2, x: 74, y: 58 },
      { id: 'B1', label: 'Bar side', capacity: 2, columns: 2, x: 73, y: 78 },
    ],
  },
}

export const seatsFor = (cluster: SeatCluster) => Array.from({ length: cluster.capacity }, (_, index) => `${cluster.id}-${index + 1}`)
