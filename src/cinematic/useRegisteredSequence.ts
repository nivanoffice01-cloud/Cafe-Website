import { useEffect, useState } from 'react'
import type { CinematicSequenceManifest, CinematicSequenceRegistry, FrameSequenceConfig } from './types'

const registryUrl = '/cinematic/sequence-registry.json'

export function useRegisteredSequence(sceneId: string) {
  const [sequence, setSequence] = useState<FrameSequenceConfig>()
  const [variant, setVariant] = useState<'desktop' | 'mobile'>(() => matchMedia('(max-width:700px)').matches ? 'mobile' : 'desktop')
  useEffect(() => {
    const media = matchMedia('(max-width:700px)')
    const update = () => setVariant(media.matches ? 'mobile' : 'desktop')
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])
  useEffect(() => {
    let active = true
    setSequence(undefined)
    const load = async () => {
      try {
        const registryResponse = await fetch(registryUrl, { cache: import.meta.env.DEV ? 'no-store' : 'default' })
        if (!registryResponse.ok) return
        const registry = await registryResponse.json() as CinematicSequenceRegistry
        const registration = registry.sequences.find((entry) => entry.sceneId === sceneId && entry.variant === variant)
        if (!registration) return
        const manifestResponse = await fetch(registration.manifest, { cache: import.meta.env.DEV ? 'no-store' : 'default' })
        if (!manifestResponse.ok) return
        const manifest = await manifestResponse.json() as CinematicSequenceManifest
        if (!active || !manifest.enabled || manifest.frameCount < 2) return
        setSequence({
          pattern: manifest.pattern,
          frameCount: manifest.frameCount,
          startNumber: manifest.startNumber,
          padLength: manifest.padLength,
          width: manifest.width,
          height: manifest.height,
          fps: manifest.fps,
          scrollLengthVh: manifest.scrollLengthVh,
          maxDecodedFrames: manifest.maxDecodedFrames,
        })
      } catch {
        // A missing production manifest intentionally falls back to the genuine poster.
      }
    }
    void load()
    return () => { active = false }
  }, [sceneId, variant])
  return sequence
}
