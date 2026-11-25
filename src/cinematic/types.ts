export type CameraKeyframe = {
  at: number
  x: number
  y: number
  z: number
  fov: number
}

export type FrameSequenceConfig = {
  frames?: readonly string[]
  mobileFrames?: readonly string[]
  pattern?: string
  frameCount?: number
  startNumber?: number
  padLength?: number
  width?: number
  height?: number
  fps?: number
  scrollLengthVh?: number
  maxDecodedFrames: number
}

export type CinematicSequenceManifest = {
  version: 1
  enabled: boolean
  id: string
  sceneId: string
  chapter: number
  variant: 'desktop' | 'mobile'
  pattern: string
  frameCount: number
  startNumber: number
  padLength: number
  width: number
  height: number
  fps: number
  durationSeconds: number
  quality: number
  scrollLengthVh: number
  maxDecodedFrames: number
  poster: string
  generatedAt?: string
  sourceFilename: string
}

export type CinematicSequenceRegistry = {
  version: 1
  sequences: Array<{ sceneId: string; chapter: number; variant: 'desktop' | 'mobile'; manifest: string }>
}

export type CinematicSceneManifest = {
  id: string
  chapter: number
  chapterCount: number
  label: string
  scrollLengthVh: number
  poster: string
  mobilePoster: string
  transitionPoster?: string
  sequence?: FrameSequenceConfig
  camera: readonly CameraKeyframe[]
  copy: {
    eyebrow: string
    brand: string
    headline: string
    supporting: string
  }
  assetStatus: 'production' | 'development-poster'
}

export type CinematicProgressDetail = {
  sceneId: string
  progress: number
}
