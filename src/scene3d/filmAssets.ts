/** Restored editorial versions of the supplied Mangosteen references. The original
 * photographs remain in /images/highres for documentary gallery use. */
export const filmAssets = {
  exterior: '/images/experience/mangosteen-arrival-enhanced.jpg',
  interior: '/images/mobile/mangosteen_original_3_mobile.jpg',
  table: '/images/experience/mangosteen-table-enhanced.jpg',
  food: '/images/experience/mangosteen-table-dish.jpg',
} as const

/** Restrained camera moves. The cuts at 40% and 70% change real viewpoints. */
export const cameraFrames = [
  { at: 0, x: 0, y: .12, z: 3.8, fov: 51 },
  { at: .2, x: .04, y: .04, z: 3.5, fov: 50 },
  { at: .4, x: .08, y: -.06, z: 3.25, fov: 49 },
  { at: .56, x: -.03, y: -.02, z: 3.36, fov: 50 },
  { at: .7, x: -.08, y: -.09, z: 3.18, fov: 49 },
  { at: .84, x: -.04, y: -.14, z: 3.16, fov: 49 },
  { at: 1, x: 0, y: -.22, z: 2.98, fov: 48 },
] as const
