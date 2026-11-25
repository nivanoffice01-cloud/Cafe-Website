import { useEffect } from 'react'

// Static holding photograph. Spatial entrance is blocked by missing capture coverage.
// Intentionally no camera, portal, scale animation, mask, or image crossfade.
export function SpatialEntrance({ onReady }: { progress: number; onReady: () => void }) {
  useEffect(() => { onReady() }, [onReady])
  return <div className="mie-spatial-canvas" aria-hidden="true">
    <img src="/images/cinematic/arrival-desktop.webp" alt="" />
  </div>
}
