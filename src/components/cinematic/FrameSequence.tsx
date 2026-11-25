import { useEffect, useRef } from 'react'
import type { CinematicProgressDetail, FrameSequenceConfig } from '../../cinematic/types'

type Props = { config?: FrameSequenceConfig; sceneId: string; className?: string; progressRange?: readonly [number,number] }

/** Progressive, bounded frame cache. It stays dormant until production frames exist. */
export function FrameSequence({ config, sceneId, className = '', progressRange = [0,1] }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current
    const listedFrames = innerWidth < 700 && config?.mobileFrames?.length ? config.mobileFrames : config?.frames
    const frames = listedFrames?.length ? listedFrames : config?.pattern && config.frameCount
      ? Array.from({ length: config.frameCount }, (_, index) => config.pattern!
        .replace('{frame}', String((config.startNumber ?? 1) + index).padStart(config.padLength ?? 5, '0')))
      : undefined
    if (!canvas || !config || !frames?.length) return
    const context = canvas.getContext('2d')
    if (!context) return
    canvas.style.opacity = progressRange[0] > 0 ? '0' : '1'
    const cache = new Map<number, HTMLImageElement>()
    let active = true
    let current = -1
    let isVisible = progressRange[0] === 0
    const load = (index: number) => {
      if (index < 0 || index >= frames.length || cache.has(index)) return
      const image = new Image()
      image.decoding = 'async'
      image.src = frames[index]
      image.onload = () => { if (active && index === current) draw(index) }
      cache.set(index, image)
      const excess = cache.size - config.maxDecodedFrames
      if (excess > 0) [...cache.keys()]
        .sort((a,b) => Math.abs(b-current) - Math.abs(a-current))
        .slice(0,excess)
        .forEach((frame) => cache.delete(frame))
    }
    const draw = (index: number) => {
      const image = cache.get(index)
      if (!image?.complete || !image.naturalWidth) return
      const ratio = Math.min(devicePixelRatio, innerWidth < 700 ? 1.25 : 1.6)
      const width = Math.max(1, Math.round(innerWidth * ratio))
      const height = Math.max(1, Math.round(innerHeight * ratio))
      if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height }
      const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight)
      const drawWidth = image.naturalWidth * scale
      const drawHeight = image.naturalHeight * scale
      context.clearRect(0, 0, width, height)
      context.drawImage(image, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight)
    }
    const update = (event: Event) => {
      const detail = (event as CustomEvent<CinematicProgressDetail>).detail
      if (detail.sceneId !== sceneId) return
      const epsilon = .0001
      const shouldBeVisible = detail.progress + epsilon >= progressRange[0] && detail.progress - epsilon <= progressRange[1]
      if (!shouldBeVisible) {
        canvas.style.opacity = '0'
        if (isVisible) {
          cache.clear()
          canvas.width = 1
          canvas.height = 1
        }
        isVisible = false
        return
      }
      isVisible = true
      const localProgress = Math.min(1,Math.max(0,(detail.progress-progressRange[0])/Math.max(.0001,progressRange[1]-progressRange[0])))
      canvas.style.opacity = '1'
      current = Math.round(localProgress * (frames.length - 1))
      for (let offset = -2; offset <= 4; offset++) load(current + offset)
      draw(current)
    }
    addEventListener('mangosteen:cinematic-progress', update)
    if (progressRange[0] === 0) {
      current = 0
      load(0)
    }
    return () => { active = false; removeEventListener('mangosteen:cinematic-progress', update); cache.clear() }
  }, [config, progressRange, sceneId])
  if (!config || (!config.frames?.length && !config.mobileFrames?.length && !(config.pattern && config.frameCount))) return null
  return <canvas ref={canvasRef} className={`cinematic-frame-sequence ${className}`.trim()} aria-hidden="true" />
}
