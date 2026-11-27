import { seatingPlans, seatsFor, type SeatingZone } from '../../data/seating'

export type FurnitureKind = 'round' | 'rectangular' | 'lounge'
export type VisualSeatingGroup = {
  id: string; label: string; zone: SeatingZone; capacity: number; seats: string[]
  x: number; y: number; rotation: number; furniture: FurnitureKind
  width: number; height: number; photo: 'rooftop-evening' | 'visit-interior'
  accessibilityLabel: string
}

// Presentation only. Identifiers, capacities and relative grid positions come
// directly from the existing reservation configuration, never from the artwork.
export function visualSeatingGroups(zone: SeatingZone): VisualSeatingGroup[] {
  return seatingPlans[zone].clusters.map(cluster => ({
    id: cluster.id, label: cluster.label, zone, capacity: cluster.capacity,
    seats: seatsFor(cluster), x: 190 + (cluster.column - 1) * 330,
    y: 100 + (cluster.row - 1) * 180, rotation: 0,
    // Retained photographs verify rectangular wood tables; round tables remain
    // an available renderer, not an assumed physical feature of any group.
    furniture: /Lounge|Sofa/.test(cluster.label) ? 'lounge' : 'rectangular',
    width: cluster.capacity === 2 ? 88 : cluster.capacity === 6 ? 182 : 144,
    height: cluster.capacity === 2 ? 88 : 80,
    photo: zone === 'rooftop' ? 'rooftop-evening' : 'visit-interior',
    accessibilityLabel: `${cluster.label}, ${cluster.capacity} seats, ${seatingPlans[zone].name}`,
  }))
}

export function chairPositions(group: VisualSeatingGroup) {
  if (group.capacity === 2) return [{ x: -76, y: 0, rotation: -90 }, { x: 76, y: 0, rotation: 90 }]
  const perSide = group.capacity / 2
  return Array.from({ length: group.capacity }, (_, index) => ({
    x: (index % perSide - (perSide - 1) / 2) * 60,
    y: index < perSide ? -60 : 60, rotation: index < perSide ? 0 : 180,
  }))
}
