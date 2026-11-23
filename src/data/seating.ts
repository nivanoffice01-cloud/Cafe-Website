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
export const seatingPlans: Record<SeatingZone, { name: string; orientation: string; entry: string; clusters: SeatCluster[] }> = {
  rooftop: {
    name: 'The rooftop',
    orientation: 'OPEN EDGE · PLANTS & EVENING LIGHT',
    entry: 'ENTRY FROM INSIDE',
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

export const orderTables: OrderTable[] = (Object.entries(seatingPlans) as [SeatingZone, (typeof seatingPlans)[SeatingZone]][]).flatMap(([zone, plan]) =>
  plan.clusters.map((cluster) => ({ ...cluster, zone, zoneName: plan.name })),
)

export const orderTableFor = (code: string | null | undefined) => {
  const normalized = String(code || '').trim().toUpperCase()
  return orderTables.find((table) => table.id === normalized) || null
}
