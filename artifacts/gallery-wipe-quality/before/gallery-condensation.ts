// Extends the existing marketing/sections/GlassReveal soft destination-out brush.
// The mask persists independently of the photographic texture, including on resize.
type Point = { x: number; y: number }

export function attachCondensation({ canvas, image, frame, isRevealed, onReady, onReveal }: {
  canvas: HTMLCanvasElement
  image: HTMLImageElement
  frame: HTMLElement
  isRevealed: () => boolean
  onReady: () => void
  onReveal: () => void
}) {
  const context = canvas.getContext('2d')
  if (!context) { onReveal(); return () => {} }
  const mask = document.createElement('canvas')
  const maskContext = mask.getContext('2d')!
  const sampler = document.createElement('canvas')
  sampler.width = 96; sampler.height = 64
  const sampleContext = sampler.getContext('2d', { willReadFrequently: true })!
  let alive = true, visible = false, ready = false, frameId = 0, resizeId = 0, previous: Point | null = null
  let lastSample = 0, pending: Point[] = []
  let coverageTimer: ReturnType<typeof setTimeout> | undefined
  let gesture: { id: number; x: number; y: number; mode: 'pending' | 'wipe' | 'scroll' } | null = null

  function paint() {
    if (!alive || !visible || isRevealed() || !image.complete || !image.naturalWidth) return
    const rect = canvas.getBoundingClientRect()
    if (!rect.width || !rect.height) return
    const coarse = matchMedia('(pointer: coarse)').matches
    const ratio = Math.min(devicePixelRatio || 1, coarse ? 1.2 : 1.4, 1400 / rect.width, Math.sqrt(1_200_000 / (rect.width * rect.height)))
    const width = Math.max(1, Math.round(rect.width * ratio)), height = Math.max(1, Math.round(rect.height * ratio))
    if (canvas.width === width && canvas.height === height && ready) return
    const oldMask = document.createElement('canvas')
    if (ready) { oldMask.width = mask.width; oldMask.height = mask.height; oldMask.getContext('2d')!.drawImage(mask, 0, 0) }
    canvas.width = width; canvas.height = height; mask.width = width; mask.height = height
    maskContext.fillStyle = '#fff'; maskContext.fillRect(0, 0, width, height)
    if (ready) { maskContext.clearRect(0, 0, width, height); maskContext.drawImage(oldMask, 0, 0, width, height) }

    const sharp = document.createElement('canvas'); sharp.width = width; sharp.height = height
    const sharpContext = sharp.getContext('2d')!
    const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight) * 1.025
    sharpContext.drawImage(image, (width - image.naturalWidth * scale) / 2, (height - image.naturalHeight * scale) * .56, image.naturalWidth * scale, image.naturalHeight * scale)
    context!.globalCompositeOperation = 'source-over'
    context!.filter = `blur(${15 * ratio}px)`
    context!.drawImage(sharp, -12 * ratio, -12 * ratio, width + 24 * ratio, height + 24 * ratio)
    context!.filter = 'none'
    context!.fillStyle = 'rgba(199,207,182,.16)'; context!.fillRect(0, 0, width, height)

    let seed = 8701
    const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296 }
    // Fine crystalline texture, without a solid white veil.
    const grain = document.createElement('canvas'); grain.width = 128; grain.height = 128
    const grainContext = grain.getContext('2d')!, pixels = grainContext.createImageData(128, 128)
    for (let i = 0; i < pixels.data.length; i += 4) {
      const tone = random() > .52 ? 241 : 38
      pixels.data[i] = tone; pixels.data[i + 1] = tone + 2; pixels.data[i + 2] = tone - 7; pixels.data[i + 3] = Math.round(random() * 17)
    }
    grainContext.putImageData(pixels, 0, 0)
    context!.fillStyle = context!.createPattern(grain, 'repeat')!; context!.fillRect(0, 0, width, height)
    // Uneven moisture density catches the warm pendant light.
    for (let i = 0; i < 9; i++) {
      const x = random() * width, y = random() * height, r = width * (.09 + random() * .15)
      const haze = context!.createRadialGradient(x, y, 0, x, y, r)
      haze.addColorStop(0, 'rgba(231,230,205,.09)'); haze.addColorStop(1, 'rgba(231,230,205,0)')
      context!.fillStyle = haze; context!.fillRect(x - r, y - r, r * 2, r * 2)
    }
    const drops = Math.min(1900, Math.round(rect.width * rect.height / 360))
    for (let i = 0; i < drops; i++) {
      const x = random() * width, y = random() * height
      const radius = (.55 + Math.pow(random(), 3) * 4.5) * ratio
      const rx = radius * (.65 + random() * .2), ry = radius * (1.05 + random() * .35)
      context!.save()
      context!.beginPath(); context!.ellipse(x, y, rx, ry, -.12, 0, Math.PI * 2); context!.clip()
      if (radius > 2.5 * ratio) {
        context!.globalAlpha = .45
        context!.drawImage(sharp, x - rx * 1.5, y - ry * 1.5, rx * 3, ry * 3, x - rx, y - ry, rx * 2, ry * 2)
        context!.globalAlpha = 1
      }
      const lens = context!.createRadialGradient(x - rx * .25, y - ry * .3, radius * .05, x, y, ry)
      lens.addColorStop(0, 'rgba(255,249,214,.19)'); lens.addColorStop(.58, 'rgba(183,196,170,.01)'); lens.addColorStop(.88, 'rgba(11,28,15,.22)'); lens.addColorStop(1, 'rgba(250,246,213,.3)')
      context!.fillStyle = lens; context!.fillRect(x - rx, y - ry, rx * 2, ry * 2)
      context!.restore()
      context!.beginPath(); context!.ellipse(x - rx * .1, y - ry * .06, rx * .77, ry * .85, -.12, Math.PI * 1.05, Math.PI * 1.58)
      context!.strokeStyle = 'rgba(255,250,222,.43)'; context!.lineWidth = .55 * ratio; context!.stroke()
      if (radius > 4 * ratio && i % 9 === 0) {
        context!.beginPath(); context!.moveTo(x, y + ry)
        context!.bezierCurveTo(x - ratio, y + ry * 3, x + ratio, y + ry * 4, x, y + ry * 7)
        context!.strokeStyle = 'rgba(224,232,208,.12)'; context!.lineWidth = rx * .6; context!.stroke()
      }
    }
    context!.globalCompositeOperation = 'destination-in'; context!.drawImage(mask, 0, 0); context!.globalCompositeOperation = 'source-over'
    ready = true; onReady(); frame.dataset.canvasPixels = String(width * height)
  }

  function erase(target: CanvasRenderingContext2D, point: Point, radius: number, angle: number) {
    const x = point.x * canvas.width, y = point.y * canvas.height
    target.save(); target.translate(x, y); target.rotate(angle); target.scale(1.1, .86)
    target.globalCompositeOperation = 'destination-out'
    const brush = target.createRadialGradient(-radius * .06, 0, radius * .1, 0, 0, radius)
    brush.addColorStop(0, 'rgba(0,0,0,.98)'); brush.addColorStop(.48, 'rgba(0,0,0,.95)'); brush.addColorStop(.76, 'rgba(0,0,0,.45)'); brush.addColorStop(1, 'rgba(0,0,0,0)')
    target.fillStyle = brush; target.fillRect(-radius, -radius, radius * 2, radius * 2)
    target.restore()
  }
  function measureCoverage(time = performance.now()) {
    coverageTimer = undefined
    if (!alive || !ready || isRevealed()) return
    sampleContext.clearRect(0, 0, 96, 64); sampleContext.drawImage(mask, 0, 0, 96, 64)
    const data = sampleContext.getImageData(0, 0, 96, 64).data
    let alpha = 0; for (let i = 3; i < data.length; i += 4) alpha += data[i]
    const cleared = 1 - alpha / (96 * 64 * 255)
    frame.dataset.cleared = cleared.toFixed(3)
    lastSample = time
    if (cleared >= .4) onReveal()
  }
  function flush(time: number) {
    frameId = 0
    if (!alive || !ready || isRevealed() || !visible) { pending = []; return }
    const rect = canvas.getBoundingClientRect(), ratio = canvas.width / rect.width
    const radius = Math.max(34, Math.min(85, rect.width * (matchMedia('(pointer: coarse)').matches ? .12 : .065))) * ratio
    for (const point of pending) {
      const start = previous || point
      const dx = (point.x - start.x) * canvas.width, dy = (point.y - start.y) * canvas.height
      const distance = Math.hypot(dx, dy), steps = Math.max(1, Math.ceil(distance / (radius * .2)))
      const angle = Math.atan2(dy, dx)
      for (let i = 1; i <= steps; i++) {
        const p = { x: start.x + (point.x - start.x) * i / steps, y: start.y + (point.y - start.y) * i / steps }
        const organicRadius = radius * (1 + Math.sin(p.x * 29 + p.y * 23) * .065)
        erase(context!, p, organicRadius, angle); erase(maskContext, p, organicRadius, angle)
      }
      previous = point
    }
    pending = []
    if (time - lastSample > 120) {
      clearTimeout(coverageTimer); measureCoverage(time)
    } else if (!coverageTimer) coverageTimer = setTimeout(measureCoverage, 125 - (time - lastSample))
  }
  const queue = (event: PointerEvent) => {
    if (!ready || isRevealed()) return
    const rect = canvas.getBoundingClientRect()
    pending.push({ x: Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)), y: Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height)) })
    if (!frameId) frameId = requestAnimationFrame(flush)
  }
  const down = (event: PointerEvent) => {
    if (isRevealed()) return
    previous = null
    gesture = { id: event.pointerId, x: event.clientX, y: event.clientY, mode: event.pointerType === 'touch' ? 'pending' : 'wipe' }
    if (event.pointerType !== 'touch') queue(event)
  }
  const move = (event: PointerEvent) => {
    if (event.pointerType === 'mouse') { queue(event); return }
    if (!gesture || gesture.id !== event.pointerId || isRevealed()) return
    const dx = Math.abs(event.clientX - gesture.x), dy = Math.abs(event.clientY - gesture.y)
    if (gesture.mode === 'pending') {
      if (dy > 8 && dy > dx * 1.1) gesture.mode = 'scroll'
      else if (dx > 8 && dx > dy * 1.2) { gesture.mode = 'wipe'; canvas.setPointerCapture(event.pointerId); frame.classList.add('is-wiping') }
    }
    if (gesture.mode === 'wipe') { if (event.cancelable) event.preventDefault(); queue(event) }
  }
  const end = (event: PointerEvent) => {
    if (pending.length) { cancelAnimationFrame(frameId); flush(performance.now()) }
    previous = null; gesture = null; frame.classList.remove('is-wiping')
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId)
  }
  const leave = (event: PointerEvent) => {
    if (event.pointerType === 'mouse' || !gesture) {
      if (pending.length) { cancelAnimationFrame(frameId); flush(performance.now()) }
      previous = null
    }
  }
  const resize = new ResizeObserver(() => { cancelAnimationFrame(resizeId); resizeId = requestAnimationFrame(paint) })
  resize.observe(canvas)
  const intersection = new IntersectionObserver(entries => {
    visible = entries.some(entry => entry.isIntersecting)
    frame.classList.toggle('is-visible', visible)
    if (visible) paint()
    else { pending = []; previous = null; cancelAnimationFrame(frameId); frameId = 0 }
  }, { rootMargin: '200px' })
  intersection.observe(frame)
  image.addEventListener('load', paint)
  canvas.addEventListener('pointerdown', down)
  canvas.addEventListener('pointermove', move, { passive: false })
  canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end); canvas.addEventListener('pointerleave', leave)
  return () => {
    alive = false; clearTimeout(coverageTimer); cancelAnimationFrame(frameId); cancelAnimationFrame(resizeId); resize.disconnect(); intersection.disconnect()
    image.removeEventListener('load', paint); canvas.removeEventListener('pointerdown', down); canvas.removeEventListener('pointermove', move)
    canvas.removeEventListener('pointerup', end); canvas.removeEventListener('pointercancel', end); canvas.removeEventListener('pointerleave', leave)
    canvas.width = 1; canvas.height = 1; mask.width = 1; mask.height = 1
  }
}
