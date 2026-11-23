/** Restored editorial versions of the supplied Mangosteen references. The original
 * photographs remain in /images/highres for documentary gallery use. */
export const filmAssets = {
  exterior: '/images/experience/mangosteen-arrival-enhanced.jpg',
  table: '/images/experience/mangosteen-table-enhanced.jpg',
  food: '/images/experience/mangosteen-table-dish.jpg',
} as const

/** One continuous push across each photograph, with a motivated cut at 54%. */
export const cameraFrames = [
  { at: 0, x: -.25, y: .45, z: 3.8, fov: 51 },
  { at: .15, x: -.18, y: .28, z: 3.4, fov: 49 },
  { at: .34, x: .02, y: -.08, z: 2.58, fov: 46 },
  { at: .54, x: -.04, y: -.35, z: 2.45, fov: 47 },
  { at: .72, x: -.14, y: -.6, z: 2.13, fov: 46 },
  { at: .88, x: -.22, y: -.86, z: 1.72, fov: 45 },
  { at: 1, x: -.26, y: -1.02, z: 1.46, fov: 45 },
] as const
