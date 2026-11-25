import type { CinematicSceneManifest } from './types'

export const arrivalScene: CinematicSceneManifest = {
  id: 'arrival',
  chapter: 1,
  chapterCount: 8,
  label: 'The Arrival',
  scrollLengthVh: 330,
  poster: '/images/cinematic/arrival-desktop.webp',
  mobilePoster: '/images/cinematic/arrival-mobile.webp',
  transitionPoster: '/images/cinematic/interior-transition.webp',
  sequence: {
    // Production frames plug in here without changing the renderer or choreography.
    frames: [],
    mobileFrames: [],
    maxDecodedFrames: 10,
  },
  camera: [
    { at: 0, x: 0, y: .05, z: 3.55, fov: 49 },
    { at: .2, x: -.02, y: .02, z: 3.32, fov: 48 },
    { at: .5, x: .03, y: -.02, z: 3.02, fov: 47 },
    { at: .76, x: .01, y: -.06, z: 2.72, fov: 46 },
    { at: 1, x: 0, y: -.09, z: 2.52, fov: 45 },
  ],
  copy: {
    eyebrow: 'A ROOFTOP ESCAPE · INDORE',
    brand: 'MANGOSTEEN',
    headline: 'Above the city. Beyond the ordinary.',
    supporting: 'Good food. Golden evenings. Moments worth staying for.',
  },
  assetStatus: 'development-poster',
}

export const cinematicScenes = [arrivalScene] as const
