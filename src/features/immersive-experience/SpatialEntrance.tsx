import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

type Props = { progress: number; onReady: () => void }

type PortalPiece = { x: number; y: number; width: number; height: number; u: number; v: number; uw: number; vh: number }

const pieces: PortalPiece[] = [
  { x: 0, y: 3.35, width: 12, height: 2.7, u: 0, v: .71, uw: 1, vh: .29 },
  { x: 0, y: -3.25, width: 12, height: 2.5, u: 0, v: 0, uw: 1, vh: .27 },
  { x: -4.15, y: .05, width: 3.7, height: 4.2, u: 0, v: .27, uw: .31, vh: .44 },
  { x: 4.15, y: .05, width: 3.7, height: 4.2, u: .69, v: .27, uw: .31, vh: .44 },
]

function croppedTexture(source: THREE.Texture, piece: PortalPiece) {
  const texture = source.clone()
  texture.needsUpdate = true
  texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping
  texture.repeat.set(piece.uw, piece.vh)
  texture.offset.set(piece.u, piece.v)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

export function SpatialEntrance({ progress, onReady }: Props) {
  const mountRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef(progress)
  const pointerRef = useRef({ x: 0, y: 0 })
  const [failed, setFailed] = useState(false)
  progressRef.current = progress

  useEffect(() => {
    const mount = mountRef.current
    if (!mount || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let disposed = false
    let frame = 0
    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#0a100b')
    const camera = new THREE.PerspectiveCamera(45, 1, .05, 40)
    camera.position.set(0, 0, 7.4)
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    mount.appendChild(renderer.domElement)

    const group = new THREE.Group()
    scene.add(group)
    const loader = new THREE.TextureLoader()
    const resources: Array<THREE.Texture | THREE.Material | THREE.BufferGeometry> = []

    Promise.all([
      loader.loadAsync('/images/cinematic/arrival-desktop.webp'),
      loader.loadAsync('/images/cinematic/interior-transition.webp'),
    ]).then(([facade, interior]) => {
      if (disposed) return
      facade.colorSpace = interior.colorSpace = THREE.SRGBColorSpace
      pieces.forEach((piece) => {
        const texture = croppedTexture(facade, piece)
        const geometry = new THREE.PlaneGeometry(piece.width, piece.height, 2, 2)
        const material = new THREE.MeshBasicMaterial({ map: texture })
        const mesh = new THREE.Mesh(geometry, material)
        mesh.position.set(piece.x, piece.y, 0)
        group.add(mesh)
        resources.push(texture, geometry, material)
      })
      const innerGeometry = new THREE.PlaneGeometry(12.5, 7.1)
      const innerMaterial = new THREE.MeshBasicMaterial({ map: interior })
      const inner = new THREE.Mesh(innerGeometry, innerMaterial)
      inner.position.set(0, 0, -4.4)
      scene.add(inner)
      resources.push(facade, interior, innerGeometry, innerMaterial)
      onReady()
    }).catch(() => setFailed(true))

    const resize = () => {
      const width = mount.clientWidth
      const height = mount.clientHeight
      renderer.setSize(width, height, false)
      camera.aspect = width / Math.max(height, 1)
      camera.updateProjectionMatrix()
    }
    const pointer = (event: PointerEvent) => {
      pointerRef.current.x = (event.clientX / window.innerWidth - .5) * 2
      pointerRef.current.y = (event.clientY / window.innerHeight - .5) * 2
    }
    resize()
    window.addEventListener('resize', resize)
    window.addEventListener('pointermove', pointer, { passive: true })

    let smooth = 0
    const render = () => {
      smooth += (progressRef.current - smooth) * .075
      const eased = THREE.MathUtils.smoothstep(smooth, 0, 1)
      const pointerX = pointerRef.current.x * .09 * (1 - eased)
      const pointerY = -pointerRef.current.y * .055 * (1 - eased)
      camera.position.z = THREE.MathUtils.lerp(7.4, -1.05, eased)
      camera.position.x += (pointerX - camera.position.x) * .045
      camera.position.y += (pointerY - camera.position.y) * .045
      camera.rotation.z = Math.sin(eased * Math.PI) * -.006
      group.position.z = Math.sin(eased * Math.PI) * .12
      renderer.render(scene, camera)
      frame = requestAnimationFrame(render)
    }
    render()
    return () => {
      disposed = true
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', pointer)
      resources.forEach((resource) => resource.dispose())
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [onReady])

  return <div ref={mountRef} className="mie-spatial-canvas" aria-hidden="true">
    {failed && <img src="/images/experience/mangosteen-arrival.jpg" alt="" />}
  </div>
}
