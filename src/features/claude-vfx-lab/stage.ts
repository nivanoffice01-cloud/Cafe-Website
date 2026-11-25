import * as THREE from 'three'
import layers from './layers.json'
import * as S from './shaders'

/** Everything the scroll timeline owns. Each frame is a pure function of this object plus ambient time, so scrubbing back is exact. */
export interface Direction {
  elev: number; azim: number; dist: number; shiftX: number; shiftY: number; spin: number
  lift: number; tiltX: number; rise: number
  sauce: number; bake: number; heat: number; flour: number; steam: number
  /** -1 gone past the lens · 0 suspended · 1 resting on the pizza */
  mozz: number; tom: number; basil: number
  slice: number; table: number; drift: number; loose: number
}
export const opening: Direction = {
  elev: 27, azim: 10, dist: 5.0, shiftX: 0, shiftY: .15, spin: -.35, lift: .05, tiltX: .06, rise: 1,
  sauce: 1, bake: 1, heat: 0, flour: 0, steam: .35, mozz: 0, tom: 0, basil: 0, slice: 0, table: 0, drift: 0, loose: 1,
}

type Kind = 'mozz' | 'tomato' | 'basil'
interface Layer { kind: string; rect: number[]; aspect: number; u?: number; v?: number; w?: number }
interface Item {
  kind: Kind; node: THREE.Group; mats: THREE.ShaderMaterial[]; home: THREE.Vector3; homeQ: THREE.Quaternion
  air: THREE.Vector3; airE: THREE.Euler; seed: number; order: number; radius: number; slice: boolean; blob: number; depth: number; size: number
}
interface Loose { node: THREE.Group; mats: THREE.ShaderMaterial[]; base: THREE.Vector3; rot: THREE.Euler; speed: number; seed: number; blur: number }
const L = layers as Record<string, Layer>
const px = (x: number, y: number) => new THREE.Vector2(((x - 63) / 1230 - .5) * 2, ((y - 37) / 1230 - .5) * 2)
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v))
const ss = (v: number) => v * v * (3 - 2 * v)
const rnd = (n: number) => { const s = Math.sin(n * 127.1 + 3.7) * 43758.5453; return s - Math.floor(s) }
const SLICE_DIR = new THREE.Vector3(Math.cos(2.0), 0, Math.sin(2.0))

export class PizzaStage {
  readonly dir: Direction = { ...opening }
  private renderer: THREE.WebGLRenderer
  private scene = new THREE.Scene()
  private cam = new THREE.PerspectiveCamera(30, 1, .1, 40)
  private main = new THREE.Group(); private sliceG = new THREE.Group()
  private items: Item[] = []; private loose: Loose[] = []
  private shared: Record<string, THREE.IUniform> = {
    uTime: { value: 0 }, uHeat: { value: 0 }, uCam: { value: new THREE.Vector3() }, uKey: { value: new THREE.Vector3(-.62, .9, -.5) },
  }
  private pizzaU!: Record<string, THREE.IUniform>; private pizzaMeshes: { mat: THREE.ShaderMaterial; group: THREE.Group }[] = []
  private table!: THREE.ShaderMaterial; private dust!: THREE.ShaderMaterial; private steam: THREE.ShaderMaterial[] = []; private flames: THREE.ShaderMaterial[] = []; private strands!: THREE.ShaderMaterial; private strandMesh!: THREE.Mesh
  private pointer = new THREE.Vector2(); private soft = new THREE.Vector2()
  private blobs = Array.from({ length: S.MAX_BLOBS }, () => new THREE.Vector4())
  private raf = 0; private t0 = performance.now(); private w = 1; private h = 1; private texel = 1 / 2048
  private disposables: { dispose(): void }[] = []
  private visible = true; private dead = false
  private cleanup: (() => void)[] = []

  constructor(private canvas: HTMLCanvasElement, private calm: boolean, private mobile: boolean) {
    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, premultipliedAlpha: true, powerPreference: 'high-performance' })
    this.renderer.setClearColor(0, 0); this.scene.add(this.main, this.sliceG)
    this.resize()
    const on = <K extends keyof WindowEventMap>(k: K, f: (e: WindowEventMap[K]) => void) => { window.addEventListener(k, f, { passive: true }); this.cleanup.push(() => window.removeEventListener(k, f)) }
    on('resize', () => this.resize())
    on('pointermove', e => { if (e.pointerType !== 'touch') this.pointer.set(e.clientX / this.w * 2 - 1, e.clientY / this.h * 2 - 1) })
    const vis = () => { this.visible = !document.hidden }
    document.addEventListener('visibilitychange', vis); this.cleanup.push(() => document.removeEventListener('visibilitychange', vis))
  }

  async load(onProgress: (p: number) => void) {
    const s = this.mobile ? 'm' : 'd', loader = new THREE.TextureLoader(), an = this.renderer.capabilities.getMaxAnisotropy()
    this.texel = 1 / (this.mobile ? 1024 : 2048)
    const files = [`pizza-baked-${s}`, `pizza-raw-${s}`, `pizza-normal-${s}`, `pizza-masks-${s}`, `ingredients-${s}`, `ingredients-height-${s}`, 'slate-color', 'slate-normal']
    let n = 0
    const t = await Promise.all(files.map(async (f, i) => {
      const x = await loader.loadAsync(`/claude-vfx/${f}.webp`)
      if (i === 0 || i === 1 || i === 4 || i === 6) x.colorSpace = THREE.SRGBColorSpace
      x.anisotropy = Math.min(an, 8); if (i >= 6) x.wrapS = x.wrapT = THREE.RepeatWrapping
      if (i === 4 || i === 5) x.flipY = false
      this.disposables.push(x); onProgress(++n / files.length); return x
    }))
    if (this.dead) return
    this.build(t)
    this.renderer.compile(this.scene, this.cam)
    this.tick()
  }

  private shader(vertexShader: string, fragmentShader: string, uniforms: Record<string, THREE.IUniform>, o: Partial<THREE.ShaderMaterialParameters> = {}) {
    const m = new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms: { ...this.shared, ...uniforms }, ...o }); this.disposables.push(m); return m
  }
  private glow = { transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor } as const

  private build([baked, raw, normal, mask, atlas, height, sc, sn]: THREE.Texture[]) {
    // ── relief pizza ──
    const seg = this.mobile ? 150 : 260, geo = new THREE.PlaneGeometry(2, 2, seg, seg).rotateX(-Math.PI / 2); this.disposables.push(geo)
    this.pizzaU = { tBaked: { value: baked }, tRaw: { value: raw }, tNormal: { value: normal }, tMask: { value: mask }, uSauce: { value: 1 }, uBake: { value: 1 }, uFlour: { value: 0 }, uRise: { value: 1 }, uCut: { value: 0 }, uBlobs: { value: this.blobs }, uShell: { value: 0 } }
    for (const [side, group] of [[0, this.main], [1, this.sliceG]] as const) {
      const u = { ...this.pizzaU, uSide: { value: side }, uNM: { value: new THREE.Matrix3() } }
      const top = this.shader(S.pizzaVertex, S.pizzaFragment, u, { alphaToCoverage: true }), shell = this.shader(S.pizzaVertex, S.pizzaFragment, u, { defines: { SHELL: 1 }, alphaToCoverage: true })
      const mesh = new THREE.Mesh(geo, top), sg = new THREE.PlaneGeometry(2, 2, 90, 90).rotateX(-Math.PI / 2), sh = new THREE.InstancedMesh(sg, shell, 9)
      const id = new THREE.Matrix4(); for (let i = 0; i < 9; i++) sh.setMatrixAt(i, id)
      mesh.frustumCulled = sh.frustumCulled = false; this.disposables.push(sg, sh); group.add(mesh, sh); this.pizzaMeshes.push({ mat: top, group })
    }
    // ── stone ──
    this.table = this.shader(S.tableVertex, S.tableFragment, { tCol: { value: sc }, tNor: { value: sn }, uLift: { value: 0 }, uShow: { value: 1 }, uFlour: { value: 0 }, uSlice: { value: new THREE.Vector3() } }, { transparent: true, premultipliedAlpha: true, depthWrite: false })
    const tg = new THREE.PlaneGeometry(10, 10); this.disposables.push(tg); const tm = new THREE.Mesh(tg, this.table); tm.rotation.x = -Math.PI / 2; tm.position.y = -.04; tm.renderOrder = -5; this.scene.add(tm)

    // ── ingredients ──
    const size = (n: string, w: number) => [w, w / L[n].aspect] as const
    const mat = (name: string, kind: Kind, o: { blur?: number; sign?: number; depth?: number; bend?: number; face?: number; shade?: number; skin?: number } = {}) => this.shader(S.cutVertex, S.cutFragment, {
      tAtlas: { value: atlas }, tHeight: { value: height }, uRect: { value: new THREE.Vector4(...L[name].rect) }, uDepth: { value: o.depth ?? 0 }, uBend: { value: o.bend ?? 0 }, uLive: { value: 1 }, uBlur: { value: o.blur ?? 0 }, uKind: { value: kind === 'mozz' ? 0 : kind === 'tomato' ? 1 : 2 },
      uFresh: { value: 1 }, uOpacity: { value: 1 }, uSideSign: { value: o.sign ?? 1 }, uTexel: { value: this.texel }, uGlow: { value: 0 }, uShade: { value: o.shade ?? 1 }, uCutFace: { value: o.face ?? 0 }, uSkin: { value: o.skin ?? 0 }, uOver: { value: o.blur ? 1 + o.blur * 5 : 1 }, uDomeR: { value: 2.3 }, uDome: { value: kind === 'tomato' && !o.face ? 1 : 0 }, uNM: { value: new THREE.Matrix3() },
    }, { transparent: true, premultipliedAlpha: true, side: kind === 'basil' ? THREE.DoubleSide : (o.sign ?? 1) < 0 ? THREE.BackSide : THREE.FrontSide, depthWrite: !(o.blur && o.blur > 0) })
    const solid = (name: string, kind: Kind, w: number, blur = 0, shade = 1) => {
      const node = new THREE.Group(), mats: THREE.ShaderMaterial[] = [], [sx, sy] = size(name, w)
      const face = name.startsWith('cut'), plane = (nn: string, dd: number, sign: number, f: number, bend = 0, skin = 0) => {
        const g = new THREE.PlaneGeometry(sx, sy, kind === 'basil' ? 32 : 64, kind === 'basil' ? 32 : 64), m = mat(nn, kind, { depth: dd, sign, blur, bend, face: f, shade, skin }), me = new THREE.Mesh(g, m)
        this.disposables.push(g); mats.push(m); node.add(me)
      }
      if (kind === 'tomato') {
        if (face) { plane(name, w * .03, 1, 1); plane(name, -w * .36, -1, 0, 0, 1) } else { plane(name, w * .46, 1, 0); plane(name, -w * .46, -1, 0) }
      } else if (kind === 'mozz') { plane(name, w * .24, 1, 0); plane(name, -w * .07, -1, 0) } else plane(name, w * .018, 1, 0, w * .42)
      return { node, mats }
    }
    const up = (yaw: number) => new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0)).premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw))
    const place = (name: string, kind: Kind, p: THREE.Vector2, w: number, yaw: number, order: number, y: number, slice = false, tilt = 0) => {
      const { node, mats } = solid(name, kind, w), i = this.items.length, a = i * 2.39996 + 1.1, seed = rnd(i + 1)
      const spread = kind === 'mozz' ? .75 + seed * .75 : kind === 'tomato' ? 1.0 + seed * .65 : .8 + seed * .9
      const q = up(yaw); if (tilt) q.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), tilt))
      const it: Item = { kind, node, mats, home: new THREE.Vector3(p.x, y, p.y), homeQ: q, air: new THREE.Vector3(p.x * .55 + Math.cos(a) * spread, .50 + rnd(i + 40) * (kind === 'basil' ? 1.05 : .85), p.y * .4 + Math.sin(a) * spread * .62), airE: new THREE.Euler(-.9 + (seed - .5) * 1.8, (rnd(i + 9) - .5) * 1.9, yaw + (rnd(i + 5) - .5) * 2.4), seed, order, radius: w * .36, slice, blob: i, depth: w * .24, size: w }
      ;(slice ? this.sliceG : this.main).add(node); this.items.push(it)
    }
    const mz = Object.keys(L).filter(k => k.startsWith('mozz'))
    mz.forEach((n, i) => place(n, 'mozz', new THREE.Vector2((L[n].u! - .5) * 2, (L[n].v! - .5) * 2), L[n].w! * 2, 0, ((i * 5) % mz.length) / mz.length, .042, n === 'mozz12'))
    ;([[740, 402, 'cut0'], [322, 548, 'cut1'], [905, 762, 'cut1'], [352, 805, 'cut0'], [1066, 452, 'cut1'], [775, 1010, 'cut0']] as const).forEach(([x, y, n], i) => place(n, 'tomato', px(x, y), .205 + rnd(i) * .02, i * 1.3, i / 6, .066, false, (rnd(i + 3) - .5) * .3))
    ;([[545, 392, 'basil0', .36, .2], [865, 655, 'basil2', .34, -.9], [420, 915, 'basil2', .30, 1.2], [735, 560, 'basil1', .46, .5], [1000, 905, 'basil0', .33, 2.2]] as const).forEach(([x, y, n, w, yaw], i) => place(n, 'basil', px(x, y), w, yaw, i / 5, .10, i === 2))

    // ── lens-side accents that never land: pure depth ──
    const free: [string, Kind, number, number, number, number, number, number][] = [
      ['tom1', 'tomato', .46, -1.75, .25, 1.75, .07, .8], ['basil1', 'basil', .85, 1.55, 1.35, 1.75, .06, 1.1], ['tom1', 'tomato', .30, 1.75, .25, .35, .0, .5],
      ['basil0', 'basil', .62, -1.15, 1.75, -.2, .0, .45], ['cut1', 'tomato', .36, 1.0, 1.55, -.9, .015, .35], ['basil2', 'basil', .7, -1.25, -.55, 2.0, .08, 1.35], ['tom0', 'tomato', .26, -1.9, 1.15, -1.1, .03, .3], ['cut0', 'tomato', .5, 1.5, -.55, 2.3, .09, 1.4],
    ]
    free.forEach(([n, k, w, x, y, z, blur, speed], i) => {
      const { node, mats } = solid(n, k, w, blur, z > 1 ? .62 : .95); const fit = this.mobile ? .52 : 1
      const base = new THREE.Vector3(x * fit, this.mobile && i === 3 ? 2.5 : y, z); node.renderOrder = z > 0 ? 8 : -2; node.traverse(o => { o.renderOrder = z > 0 ? 8 : -2 })
      this.scene.add(node); this.loose.push({ node, mats, base, rot: new THREE.Euler(rnd(i + 2) * 1.2 - .6, rnd(i + 7) * 1.4 - .7, rnd(i + 11) * 6), speed, seed: rnd(i + 60), blur })
    })

    // ── air ──
    const count = this.mobile ? 130 : 320, pg = new THREE.BufferGeometry(), sd = new Float32Array(count * 4); for (let i = 0; i < sd.length; i++) sd[i] = rnd(i * 1.37 + 5)
    pg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3)); pg.setAttribute('aSeed', new THREE.BufferAttribute(sd, 4)); this.disposables.push(pg)
    this.dust = this.shader(S.dustVertex, S.dustFragment, { uScroll: { value: 0 }, uFlour: { value: 0 }, uPx: { value: 1000 } }, this.glow)
    const pts = new THREE.Points(pg, this.dust); pts.frustumCulled = false; pts.renderOrder = 9; this.scene.add(pts)
    const stg = new THREE.PlaneGeometry(1.5, 2.1); stg.translate(0, 1.0, 0); this.disposables.push(stg)
    ;[[-.35, .1], [.35, -.15], [0, .4]].forEach(([x, z], i) => { const m = this.shader(S.steamVertex, S.steamFragment, { uAmt: { value: 0 }, uSeed: { value: i * 7.3 }, uSpeed: { value: 1 }, uScale: { value: 1 }, uTint: { value: new THREE.Color(.62, .64, .56) } }, this.glow); const me = new THREE.Mesh(stg, m); me.position.set(x, .1, z); me.renderOrder = 7; me.frustumCulled = false; this.steam.push(m); this.scene.add(me) })

    ;[[-1.9, -1.7, 1.5], [-.7, -2.1, 1.2], [.6, -2.4, .9], [-2.6, -1.2, 1.25]].forEach(([x, z, s], i) => { const m = this.shader(S.steamVertex, S.steamFragment, { uAmt: { value: 0 }, uSeed: { value: 31 + i * 5.1 }, uSpeed: { value: 6 + i }, uScale: { value: 1 }, uTint: { value: new THREE.Color(1, .25, .03) } }, this.glow); const me = new THREE.Mesh(stg, m); me.position.set(x, -.25, z); m.uniforms.uScale.value = s; me.renderOrder = -1; me.frustumCulled = false; this.flames.push(m); this.scene.add(me) })

    // ── cheese pull ──
    const N = 11, SEG = 22, A: number[] = [], B: number[] = [], T: number[] = [], Sd: number[] = [], I: number[] = []
    const c = px(690, 595), edges = [[2.454, 1], [1.553, -1]] as const
    for (let i = 0; i < N; i++) { const [ea] = edges[i % 2], r = .18 + rnd(i + 31) * .50, x = c.x + Math.cos(ea) * r, z = c.y + Math.sin(ea) * r, v0 = A.length / 3
      for (let j = 0; j <= SEG; j++) for (const sgn of [-1, 1]) { A.push(x, .035, z); B.push(x + SLICE_DIR.x * .02 + (rnd(i) - .5) * .03, .035, z + SLICE_DIR.z * .02); T.push(j / SEG, sgn); Sd.push(rnd(i + 77)) }
      for (let j = 0; j < SEG; j++) { const b = v0 + j * 2; I.push(b, b + 1, b + 2, b + 1, b + 3, b + 2) } }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(A, 3)); g.setAttribute('aA', new THREE.Float32BufferAttribute(A, 3)); g.setAttribute('aB', new THREE.Float32BufferAttribute(B, 3)); g.setAttribute('aT', new THREE.Float32BufferAttribute(T, 2)); g.setAttribute('aSeed', new THREE.Float32BufferAttribute(Sd, 1)); g.setIndex(I); this.disposables.push(g)
    this.strands = this.shader(S.strandVertex, S.strandFragment, { uPull: { value: 0 }, uWide: { value: .021 }, uMA: { value: this.main.matrixWorld }, uMB: { value: this.sliceG.matrixWorld } }, { side: THREE.DoubleSide })
    this.strandMesh = new THREE.Mesh(g, this.strands); this.strandMesh.frustumCulled = false; this.scene.add(this.strandMesh)
  }

  private resize() {
    this.w = this.canvas.clientWidth || innerWidth; this.h = this.canvas.clientHeight || innerHeight
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, this.mobile ? 1.5 : 1.75)); this.renderer.setSize(this.w, this.h, false)
    this.cam.aspect = this.w / this.h
  }

  private v = new THREE.Vector3(); private q = new THREE.Quaternion(); private q2 = new THREE.Quaternion(); private e = new THREE.Euler()
  private pose(it: Item, time: number) {
    const d = this.dir, raw = it.kind === 'mozz' ? d.mozz : it.kind === 'tomato' ? d.tom : d.basil
    let k = raw; if (raw > 0) k = clamp((raw * 1.65 - it.order * .65)); else if (raw < 0) k = -clamp((-raw * 1.5 - it.order * .5))
    const land = k > 0 ? k : 0, gone = k < 0 ? -k : 0, f = 1 - ss(land), live = this.calm ? 0 : f
    const fall = land * land * (2.2 - 1.2 * land), xz = ss(clamp(land * 1.25))
    const n = it.node, A = it.air, H = it.home, fit = this.mobile ? .62 : 1
    n.position.set(A.x * fit + (H.x - A.x * fit) * xz, A.y + (H.y - A.y) * fall, A.z + (H.z - A.z) * xz)
    n.position.x += Math.sin(time * .5 + it.seed * 20) * .045 * live; n.position.y += Math.sin(time * .7 + it.seed * 40) * .06 * live
    n.position.y += gone * gone * (2.4 + it.seed * 1.4); n.position.x += A.x * gone * .9; n.position.z += gone * (1.0 + it.seed * 1.2)
    // settle: a soft weight response on contact
    const contact = clamp((land - .86) / .14), squash = Math.sin(contact * Math.PI) * .16
    const sc = it.kind === 'mozz' ? .9 + .1 * ss(d.bake * land) : 1
    n.scale.set(sc * (1 + squash * .5), sc * (1 + squash * .5), sc * (1 - squash) * (it.kind === 'mozz' ? 1.2 - .6 * d.bake * land : 1))
    this.e.set(it.airE.x + live * Math.sin(time * .4 + it.seed * 9) * .22 + gone * 2.2, it.airE.y + live * Math.sin(time * .33 + it.seed * 14) * .3, it.airE.z + gone * 1.5 + (1 - xz) * d.drift * .25)
    this.q.setFromEuler(this.e); n.quaternion.slerpQuaternions(this.q, it.homeQ, ss(clamp(land * 1.08)))
    n.visible = gone < .995
    for (const m of it.mats) { m.uniforms.uFresh.value = it.kind === 'mozz' ? 1 - .8 * d.bake * land : 1; m.uniforms.uLive.value = live; m.uniforms.uOpacity.value = 1 - clamp((gone - .75) / .25); m.uniforms.uShade.value = 1 - (it.kind === 'tomato' ? .10 * d.bake * land : 0) }
    const b = this.blobs[it.blob]; if (b) b.set(n.position.x, n.position.z, Math.max(0, n.position.y - H.y), gone > .3 || (it.slice && d.slice > .02) ? 0 : it.radius)
  }

  private render(now: number) {
    const time = this.calm ? 0 : (now - this.t0) / 1000, d = this.dir
    this.soft.lerp(this.calm ? this.pointer.set(0, 0) : this.pointer, .045)
    const u = this.shared; u.uTime.value = time; u.uHeat.value = d.heat
    const p = this.pizzaU; p.uSauce.value = d.sauce; p.uBake.value = d.bake; p.uFlour.value = d.flour; p.uRise.value = d.rise; p.uCut.value = d.slice
    // camera
    const el = THREE.MathUtils.degToRad(d.elev - this.soft.y * 2.6), az = THREE.MathUtils.degToRad(d.azim + this.soft.x * 5)
    const aspect = this.w / this.h, dist = d.dist * (aspect < .8 ? 1.0 + (.8 - aspect) * 1.45 : aspect < 1.4 ? 1.12 : 1)
    this.cam.position.set(Math.sin(az) * Math.cos(el) * dist, Math.sin(el) * dist, Math.cos(az) * Math.cos(el) * dist)
    this.cam.up.set(0, 1, 0); this.cam.lookAt(0, .18, 0)
    this.cam.setViewOffset(this.w, this.h, -d.shiftX * this.w, -d.shiftY * this.h, this.w, this.h)
    this.cam.updateMatrixWorld(); u.uCam.value.copy(this.cam.position)
    // pizza
    const bob = this.calm ? 0 : Math.sin(time * .6) * .018 * clamp(d.lift * 3)
    this.main.position.y = d.lift + bob; this.main.rotation.set(d.tiltX + this.soft.y * .018, d.spin, -this.soft.x * .018)
    const s = ss(d.slice); this.v.copy(SLICE_DIR).applyEuler(this.main.rotation)
    this.sliceG.position.copy(this.main.position).addScaledVector(this.v, s * .62); this.sliceG.position.y += s * .30
    this.sliceG.rotation.copy(this.main.rotation); this.sliceG.rotateOnAxis(this.e2.set(SLICE_DIR.z, 0, -SLICE_DIR.x), -s * .16)
    this.main.visible = true; this.sliceG.visible = true
    for (const it of this.items) this.pose(it, time)
    for (const l of this.loose) {
      const float = this.calm ? 0 : 1, py = l.base.y + d.drift * l.speed + Math.sin(time * .45 + l.seed * 30) * .07 * float
      l.node.position.set(l.base.x + this.soft.x * -.10 * (l.base.z + 1.2), ((py + 2.6) % 6.2 + 6.2) % 6.2 - 2.6, l.base.z)
      l.node.rotation.set(l.rot.x + d.drift * .35 * l.speed, l.rot.y + Math.sin(time * .3 + l.seed * 9) * .25 * float, l.rot.z + d.drift * .3 + time * .03)
      for (const m of l.mats) m.uniforms.uOpacity.value = d.loose; l.node.visible = d.loose > .01
    }
    this.table.uniforms.uLift.value = Math.max(0, d.lift); this.table.uniforms.uShow.value = d.table; this.table.uniforms.uFlour.value = d.flour
    this.table.uniforms.uSlice.value.set(this.sliceG.position.x + this.v.x * .55, this.sliceG.position.z + this.v.z * .55, s)
    this.dust.uniforms.uScroll.value = d.drift * .25; this.dust.uniforms.uFlour.value = d.flour; this.dust.uniforms.uPx.value = this.renderer.domElement.height * 1.9
    for (const m of this.steam) m.uniforms.uAmt.value = d.steam * .5
    for (const m of this.flames) m.uniforms.uAmt.value = d.heat * .75
    this.strandMesh.visible = d.slice > .015; this.strands.uniforms.uPull.value = s
    this.scene.updateMatrixWorld()
    for (const { mat, group } of this.pizzaMeshes) (mat.uniforms.uNM.value as THREE.Matrix3).setFromMatrix4(group.matrixWorld)
    for (const n of [...this.items, ...this.loose]) { n.node.getWorldQuaternion(this.q2); for (const m of n.mats) (m.uniforms.uNM.value as THREE.Matrix3).setFromMatrix4(this.m4.makeRotationFromQuaternion(this.q2)) }
    this.renderer.render(this.scene, this.cam)
  }
  private e2 = new THREE.Vector3(); private m4 = new THREE.Matrix4()
  private tick = () => { if (this.dead) return; this.raf = requestAnimationFrame(this.tick); if (this.visible) this.render(performance.now()) }
  dispose() { this.dead = true; cancelAnimationFrame(this.raf); this.cleanup.forEach(f => f()); this.disposables.forEach(x => x.dispose()); this.renderer.dispose() }
}
