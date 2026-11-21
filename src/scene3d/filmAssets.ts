/** Stage 1 media. Supply an actual Mangosteen aerial here when one is commissioned. */
export const filmAssets = {
  aerial: null as string | null,
  rooftop: '/images/experience/mangosteen-exterior-reconstruction.png',
  table: '/images/experience/mangosteen-table-reconstruction.png',
  food: '/images/highres/mangosteen_original_2_8k.jpg',
} as const

/** Camera positions are relative to the two photo planes near z=-7. */
export const cameraFrames = [
  { at: 0, x: -.42, y: .78, z: 3.8, fov: 48 },
  { at: .1, x: -.4, y: .72, z: 3.7, fov: 48 },
  { at: .28, x: -.2, y: .42, z: 3.08, fov: 46 },
  { at: .5, x: .42, y: -.3, z: 1.04, fov: 41 },
  { at: .57, x: .18, y: -1.25, z: 2.65, fov: 43 },
  { at: .72, x: .4, y: -1.65, z: 1.1, fov: 42 },
  { at: .88, x: .42, y: -2.1, z: .4, fov: 41 },
  { at: 1, x: .44, y: -2.35, z: -.2, fov: 41 },
] as const
