import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { cameraFrames, filmAssets } from '../scene3d/filmAssets'

type Props = { menuOpen?: boolean; onOpenMenu?: () => void; onReady?: () => void }

/** A photographed café, a scroll-driven WebGL camera, and a food-photo match cut. */
export function CinematicScene({ menuOpen = false, onOpenMenu, onReady }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const menuOpenRef = useRef(menuOpen)
  const openMenuRef = useRef(onOpenMenu)
  const readyRef = useRef(onReady)
  useEffect(() => { menuOpenRef.current = menuOpen }, [menuOpen])
  useEffect(() => { openMenuRef.current = onOpenMenu }, [onOpenMenu])
  useEffect(() => { readyRef.current = onReady }, [onReady])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' })
    } catch {
      document.documentElement.classList.add('scene-fallback')
      readyRef.current?.()
      return
    }

    let active = true
    let readyNotified = false
    const notifyReady = () => { if (!readyNotified) { readyNotified = true; readyRef.current?.() } }
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(48, 1, .1, 40)
    const loader = new THREE.TextureLoader()
    renderer.setClearColor(0x000000, 0)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    canvas.style.pointerEvents = 'none'

    // Shallow displacement gives photographs spatial response without inventing furniture.
    const photoGeometry = (table: boolean) => {
      const geometry = new THREE.PlaneGeometry(1, 1, 40, 26)
      const positions = geometry.attributes.position
      const uvs = geometry.attributes.uv
      for (let i = 0; i < positions.count; i++) {
        const u = uvs.getX(i)
        const v = uvs.getY(i)
        const foreground = THREE.MathUtils.smoothstep(1 - v, table ? .48 : .55, .95)
        const plant = table ? 0 : THREE.MathUtils.smoothstep(u, .68, .98) * THREE.MathUtils.smoothstep(1 - v, .25, .7)
        positions.setZ(i, foreground * .13 + plant * .12 - v * .075)
      }
      positions.needsUpdate = true
      geometry.computeVertexNormals()
      return geometry
    }
    const makePhoto = (table: boolean, z: number) => {
      const material = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, toneMapped: false })
      const mesh = new THREE.Mesh(photoGeometry(table), material)
      mesh.position.z = z
      scene.add(mesh)
      return { mesh, material }
    }
    const exterior = makePhoto(false, -7)
    const table = makePhoto(true, -6.99)
    table.mesh.renderOrder = 1
    const aerial = filmAssets.aerial ? makePhoto(false, -7.02) : null
    const photoFiles = [filmAssets.rooftop, filmAssets.table, ...(filmAssets.aerial ? [filmAssets.aerial] : [])]
    const textures: THREE.Texture[] = []
    let loaded = 0
    let texturesStarted = false

    const placePhotos = () => {
      const distance = Math.abs(3.8 - exterior.mesh.position.z)
      const height = 2 * Math.tan(THREE.MathUtils.degToRad(48 / 2)) * distance
      const width = height * camera.aspect
      const fit = (mesh: THREE.Mesh, texture: THREE.Texture | undefined, overscan: number) => {
        const image = texture?.image as { width: number; height: number } | undefined
        const aspect = image ? image.width / image.height : 16 / 9
        if (aspect > width / height) mesh.scale.set(height * aspect, height, 1)
        else mesh.scale.set(width, width / aspect, 1)
        mesh.scale.multiplyScalar(overscan)
      }
      fit(exterior.mesh, textures[0], 1.08)
      fit(table.mesh, textures[1], 1.27)
      if (aerial) fit(aerial.mesh, textures[2], 1.27)
    }

    const loadPhotos = () => {
      if (texturesStarted) return
      texturesStarted = true
      photoFiles.forEach((url, index) => {
        loader.load(url, (texture) => {
          if (!active) { texture.dispose(); return }
          texture.colorSpace = THREE.SRGBColorSpace
          texture.generateMipmaps = index === 0
          texture.minFilter = index === 0 ? THREE.LinearMipmapLinearFilter : THREE.LinearFilter
          texture.anisotropy = index === 0 ? Math.min(4, renderer.capabilities.getMaxAnisotropy()) : 1
          textures[index] = texture
          const target = index === 0 ? exterior : index === 1 ? table : aerial
          if (target) { target.material.map = texture; target.material.needsUpdate = true }
          placePhotos()
          loaded++
          if (loaded === photoFiles.length) notifyReady()
        }, undefined, () => { loaded++; if (loaded === photoFiles.length) notifyReady() })
      })
    }

    const journey = document.getElementById('cinematic-journey')
    const seatButton = journey?.querySelector<HTMLElement>('.film-seat-invite')
    const enterButton = journey?.querySelector<HTMLElement>('.film-opening button')
    const foodImage = journey?.querySelector<HTMLImageElement>('.film-food-reveal')
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const seatFrom = new THREE.Vector3()
    const seatTo = new THREE.Vector3()
    const lookTarget = new THREE.Vector3(0, 0, -7)
    let progress = 0
    let targetProgress = 0
    let chapterVisible = false
    let frame = 0
    let lastFrame = 0
    let seatStarted = 0
    let foodRevealStarted = 0
    let foodReady = false
    let foodFailed = false
    let foodTimeout = 0
    let callbackFired = false
    let dialogWasOpen = false

    const sampleCamera = (value: number) => {
      const next = cameraFrames.findIndex((keyframe) => keyframe.at > value)
      const index = next < 0 ? cameraFrames.length - 2 : Math.max(0, next - 1)
      const from = cameraFrames[index]
      const to = cameraFrames[index + 1]
      const fraction = THREE.MathUtils.clamp((value - from.at) / (to.at - from.at), 0, 1)
      const ease = fraction * fraction * (3 - 2 * fraction)
      const mix = (a: number, b: number) => THREE.MathUtils.lerp(a, b, ease)
      return { x: mix(from.x, to.x), y: mix(from.y, to.y), z: mix(from.z, to.z), fov: mix(from.fov, to.fov) }
    }

    const beginSeat = () => {
      if (seatStarted || menuOpenRef.current) return
      seatStarted = performance.now()
      seatFrom.copy(camera.position)
      seatTo.set(camera.position.x + .08, camera.position.y - .42, camera.position.z - .75)
      if (!foodImage) { foodFailed = true; return }
      foodImage.onload = () => { foodReady = true; window.clearTimeout(foodTimeout) }
      foodImage.onerror = () => { foodFailed = true; window.clearTimeout(foodTimeout) }
      foodImage.src = filmAssets.food
      if (foodImage.complete && foodImage.naturalWidth > 0) foodReady = true
      else foodTimeout = window.setTimeout(() => { if (active && !foodReady) foodFailed = true }, 5000)
    }
    const takeSeat = () => {
      if (reducedMotion || document.documentElement.classList.contains('scene-fallback')) { openMenuRef.current?.(); return }
      if (progress >= .82) { beginSeat(); return }
      const section = journey?.parentElement
      if (!section) { openMenuRef.current?.(); return }
      window.scrollTo({ top: section.offsetTop + (section.offsetHeight - window.innerHeight) * .95, behavior: 'smooth' })
      const started = performance.now()
      const awaitArrival = () => {
        if (!active || menuOpenRef.current || seatStarted) return
        if (progress >= .82 || performance.now() - started > 4000) beginSeat()
        else requestAnimationFrame(awaitArrival)
      }
      requestAnimationFrame(awaitArrival)
    }

    const readScroll = () => {
      const section = journey?.parentElement
      if (!section) return
      const span = Math.max(1, section.offsetHeight - window.innerHeight)
      targetProgress = THREE.MathUtils.clamp((window.scrollY - section.offsetTop) / span, 0, 1)
      chapterVisible = !document.hidden && window.scrollY >= section.offsetTop - window.innerHeight && window.scrollY <= section.offsetTop + section.offsetHeight
      if ((chapterVisible || seatStarted) && !frame) frame = requestAnimationFrame(animate)
    }
    const resize = () => {
      const width = Math.max(1, window.innerWidth)
      const height = Math.max(1, window.innerHeight)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, width < 700 ? 1.15 : 1.6))
      renderer.setSize(width, height, false)
      placePhotos()
      if (width > 700) loadPhotos()
      else notifyReady()
      readScroll()
    }
    const animate = (time: number) => {
      if (!active) return
      frame = 0
      if (!chapterVisible && !seatStarted) return
      const dt = lastFrame ? Math.min((time - lastFrame) / 1000, .05) : 1 / 60
      lastFrame = time
      progress = reducedMotion ? targetProgress : THREE.MathUtils.damp(progress, targetProgress, 3.4, dt)
      const shot = sampleCamera(progress)
      const mobile = window.innerWidth < 700
      camera.fov = shot.fov + (mobile ? 9 : 0)
      camera.updateProjectionMatrix()
      camera.position.set(shot.x + (mobile ? -.12 : 0), shot.y, shot.z)
      if (seatStarted) {
        const push = THREE.MathUtils.smoothstep((time - seatStarted) / 900, 0, 1)
        camera.position.lerpVectors(seatFrom, seatTo, push)
        if (push >= .8 && (foodReady || foodFailed) && !foodRevealStarted) foodRevealStarted = time
      }
      lookTarget.set(camera.position.x, camera.position.y, -7)
      camera.lookAt(lookTarget)

      // The cuts conceal changes between different real photographs.
      const locationCut = 1 - THREE.MathUtils.smoothstep(Math.abs(progress - .54), 0, .052)
      const openingDarkness = 1 - THREE.MathUtils.smoothstep(progress, .01, .18)
      const push = seatStarted ? THREE.MathUtils.clamp((time - seatStarted) / 900, 0, 1) : 0
      const reveal = foodRevealStarted ? THREE.MathUtils.clamp((time - foodRevealStarted) / 950, 0, 1) : 0
      const seatCut = seatStarted ? THREE.MathUtils.smoothstep(push, .4, .95) * (1 - THREE.MathUtils.smoothstep(reveal, .14, .55)) * .94 : 0
      journey?.style.setProperty('--film-curtain', String(Math.max(locationCut, openingDarkness, seatCut)))
      journey?.style.setProperty('--film-opening-opacity', String(1 - THREE.MathUtils.smoothstep(progress, .08, .24)))
      journey?.style.setProperty('--film-roof-opacity', String(THREE.MathUtils.smoothstep(progress, .2, .29) * (1 - THREE.MathUtils.smoothstep(progress, .42, .5))))
      journey?.style.setProperty('--film-table-opacity', String(THREE.MathUtils.smoothstep(progress, .62, .72) * (1 - THREE.MathUtils.smoothstep(progress, .77, .87))))
      journey?.style.setProperty('--film-seat-opacity', String(THREE.MathUtils.smoothstep(progress, .88, .96) * (1 - THREE.MathUtils.smoothstep(push, 0, .32))))
      journey?.style.setProperty('--film-food-opacity', String(foodReady ? THREE.MathUtils.smoothstep(reveal, .08, .48) : 0))
      journey?.style.setProperty('--film-food-scale', String(1.045 - reveal * .045))
      journey?.style.setProperty('--film-progress', String(progress))
      journey?.style.setProperty('--film-mobile-exterior-opacity', String(1 - THREE.MathUtils.smoothstep(progress, .47, .61)))
      journey?.style.setProperty('--film-mobile-table-opacity', String(THREE.MathUtils.smoothstep(progress, .55, .7)))
      journey?.style.setProperty('--film-mobile-shift', `${Math.round(progress * -28)}px`)
      journey?.style.setProperty('--film-mobile-scale', String(1 + Math.min(progress, .5) * .08))
      if (seatButton) seatButton.style.pointerEvents = reducedMotion || (progress > .82 && !seatStarted) ? 'auto' : 'none'
      if (enterButton) enterButton.style.pointerEvents = progress < .2 ? 'auto' : 'none'
      if (aerial) aerial.material.opacity = textures[2] ? 1 - THREE.MathUtils.smoothstep(progress, .18, .32) : 0
      exterior.material.opacity = textures[0] ? (textures[2] ? THREE.MathUtils.smoothstep(progress, .18, .32) : 1) : 0
      table.material.opacity = textures[1] && progress >= .54 ? 1 : 0
      if (!mobile) renderer.render(scene, camera)
      if (foodRevealStarted && reveal >= 1 && !callbackFired) { callbackFired = true; openMenuRef.current?.() }
      if (menuOpenRef.current) dialogWasOpen = true
      else if (dialogWasOpen) {
        dialogWasOpen = false
        window.clearTimeout(foodTimeout)
        seatStarted = 0
        foodRevealStarted = 0
        callbackFired = false
        foodImage?.removeAttribute('src')
        foodReady = false
        foodFailed = false
      }
      if (loaded === photoFiles.length) notifyReady()
      frame = requestAnimationFrame(animate)
    }

    window.addEventListener('resize', resize)
    window.addEventListener('scroll', readScroll, { passive: true })
    document.addEventListener('visibilitychange', readScroll)
    window.addEventListener('mangosteen:take-seat', takeSeat)
    resize()
    return () => {
      active = false
      cancelAnimationFrame(frame)
      window.clearTimeout(foodTimeout)
      window.removeEventListener('resize', resize)
      window.removeEventListener('scroll', readScroll)
      document.removeEventListener('visibilitychange', readScroll)
      window.removeEventListener('mangosteen:take-seat', takeSeat)
      if (foodImage) { foodImage.onload = null; foodImage.onerror = null }
      textures.forEach((texture) => texture.dispose())
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose()
          const materials = Array.isArray(object.material) ? object.material : [object.material]
          materials.forEach((material) => material.dispose())
        }
      })
      renderer.dispose()
    }
  }, [])

  return <canvas ref={canvasRef} className="cinematic-canvas" aria-hidden="true" />
}
