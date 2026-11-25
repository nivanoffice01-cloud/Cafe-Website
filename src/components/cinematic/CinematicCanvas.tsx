import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import type { CinematicProgressDetail, CinematicSceneManifest } from '../../cinematic/types'

type Props = { manifest: CinematicSceneManifest; onReady: () => void; onFailure: () => void }

export function CinematicCanvas({ manifest, onReady, onFailure }: Props) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current
    const enabled = matchMedia('(min-width: 701px) and (prefers-reduced-motion: no-preference)').matches
    if (!canvas || !enabled) { onReady(); return }
    let renderer: THREE.WebGLRenderer
    try { renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' }) }
    catch { onFailure(); return }
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(49, 1, .1, 20)
    camera.position.set(manifest.camera[0].x, manifest.camera[0].y, manifest.camera[0].z)
    camera.fov = manifest.camera[0].fov
    const geometry = new THREE.PlaneGeometry(1, 1, 56, 32)
    const position = geometry.attributes.position
    const uv = geometry.attributes.uv
    for (let index = 0; index < position.count; index++) {
      const x = uv.getX(index); const y = uv.getY(index)
      const canopy = THREE.MathUtils.smoothstep(y, .58, .95) * .075
      const foreground = THREE.MathUtils.smoothstep(1 - y, .55, .98) * .08
      const edge = Math.abs(x - .5) * .025
      position.setZ(index, canopy + foreground + edge)
    }
    geometry.computeVertexNormals()
    const material = new THREE.MeshBasicMaterial({ transparent: true, toneMapped: false })
    const plate = new THREE.Mesh(geometry, material)
    scene.add(plate)

    const particleGeometry = new THREE.BufferGeometry()
    const particleData = new Float32Array(72 * 3)
    for (let index = 0; index < 72; index++) {
      particleData[index * 3] = (Math.random() - .5) * 7
      particleData[index * 3 + 1] = (Math.random() - .5) * 4
      particleData[index * 3 + 2] = Math.random() * 1.5 + .2
    }
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particleData, 3))
    const particleMaterial = new THREE.PointsMaterial({ color:0xc5a572, size:.018, transparent:true, opacity:.25, depthWrite:false })
    const particles = new THREE.Points(particleGeometry, particleMaterial)
    scene.add(particles)

    const loader = new THREE.TextureLoader()
    let texture: THREE.Texture | undefined
    let progress = 0
    let pointerX = 0
    let pointerY = 0
    let renderFrame = 0
    const render = () => {
      renderFrame = 0
      const keys = manifest.camera
      const after = keys.findIndex((key) => key.at > progress)
      const fromIndex = after < 0 ? keys.length - 2 : Math.max(0, after - 1)
      const from = keys[fromIndex]; const to = keys[fromIndex + 1]
      const amount = THREE.MathUtils.smoothstep((progress - from.at) / Math.max(.001, to.at - from.at), 0, 1)
      camera.position.set(THREE.MathUtils.lerp(from.x,to.x,amount) + pointerX * .035, THREE.MathUtils.lerp(from.y,to.y,amount) + pointerY * .025, THREE.MathUtils.lerp(from.z,to.z,amount))
      camera.fov = THREE.MathUtils.lerp(from.fov,to.fov,amount)
      camera.updateProjectionMatrix()
      camera.lookAt(0,0,0)
      plate.rotation.y = pointerX * -.008
      plate.rotation.x = pointerY * .006
      particles.position.x = pointerX * -.08
      particles.position.y = progress * .12
      particleMaterial.opacity = .18 + progress * .14
      renderer.render(scene,camera)
    }
    const requestRender = () => { if (!renderFrame && !document.hidden) renderFrame = requestAnimationFrame(render) }
    const resize = () => {
      const width = Math.max(1, innerWidth); const height = Math.max(1, innerHeight)
      renderer.setPixelRatio(Math.min(devicePixelRatio,1.6)); renderer.setSize(width,height,false)
      camera.aspect = width / height; camera.updateProjectionMatrix()
      const image = texture?.image as { width:number; height:number } | undefined
      const imageAspect = image ? image.width / image.height : 16/9
      const viewHeight = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov/2)) * camera.position.z
      const viewWidth = viewHeight * camera.aspect
      if (imageAspect > viewWidth/viewHeight) plate.scale.set(viewHeight*imageAspect,viewHeight,1)
      else plate.scale.set(viewWidth,viewWidth/imageAspect,1)
      plate.scale.multiplyScalar(1.08)
      requestRender()
    }
    const onProgress = (event: Event) => {
      const detail = (event as CustomEvent<CinematicProgressDetail>).detail
      if (detail.sceneId !== manifest.id) return
      progress = detail.progress; requestRender()
    }
    const onPointer = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return
      pointerX = event.clientX / innerWidth - .5; pointerY = event.clientY / innerHeight - .5; requestRender()
    }
    addEventListener('mangosteen:cinematic-progress', onProgress)
    addEventListener('pointermove', onPointer, { passive:true })
    addEventListener('resize', resize)
    loader.load(manifest.poster, (loaded) => {
      texture = loaded; texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = Math.min(4,renderer.capabilities.getMaxAnisotropy()); material.map = texture; material.needsUpdate = true; resize(); onReady()
    }, undefined, () => { onFailure() })
    resize()
    return () => {
      cancelAnimationFrame(renderFrame)
      removeEventListener('mangosteen:cinematic-progress', onProgress)
      removeEventListener('pointermove', onPointer)
      removeEventListener('resize', resize)
      texture?.dispose(); geometry.dispose(); material.dispose(); particleGeometry.dispose(); particleMaterial.dispose(); renderer.dispose()
    }
  }, [manifest, onFailure, onReady])
  return <canvas ref={ref} className="cinematic-engine-canvas" aria-hidden="true" />
}
