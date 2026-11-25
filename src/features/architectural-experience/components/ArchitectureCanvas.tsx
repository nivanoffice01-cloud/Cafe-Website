import { useEffect, useRef } from 'react'
import * as T from 'three'
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { createMaterials } from '../materials/library'
import { buildExterior,buildInterior } from '../environment/buildEnvironment'
import { lightScene } from '../lighting/setup'
import { directCamera } from '../camera/director'
import { batchStatic } from '../geometry/primitives'
import { loadBotanicalAssets } from '../environment/botanicalAssets'

declare global { interface Window { architecturalReview?: { exportGLB:()=>Promise<ArrayBuffer>; wireframe:(enabled:boolean)=>void; pose:(position:number[]|null,target?:number[])=>void; stats:()=>unknown } } }

export function ArchitectureCanvas({progress,onFailure}:{progress:number;onFailure:()=>void}) {
  const host=useRef<HTMLDivElement>(null),requested=useRef(progress)
  requested.current=progress
  useEffect(()=>{
    const element=host.current!;let renderer:T.WebGLRenderer
    try {renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'})}catch{onFailure();return}
    const mobile=matchMedia('(max-width: 700px)').matches,reduced=matchMedia('(prefers-reduced-motion: reduce)').matches
    renderer.setPixelRatio(Math.min(devicePixelRatio,mobile?1.25:1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap
    renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;renderer.outputColorSpace=T.SRGBColorSpace
    renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true
    renderer.domElement.setAttribute('aria-label','Mangosteen architectural entrance');element.appendChild(renderer.domElement)
    const scene=new T.Scene(),model=new T.Group();model.name='Mangosteen architectural interpretation';scene.add(model)
    let disposed=false,dirty=true,botanicalsReady=false,reviewPose:{position:number[];target:number[]}|null=null
    const assetErrors:string[]=[]
    const materials=createMaterials(()=>{dirty=true});model.add(batchStatic(buildExterior(materials)));lightScene(scene,mobile)
    const pmrem=new T.PMREMGenerator(renderer),room=new RoomEnvironment(),environment=pmrem.fromScene(room,.04);scene.environment=environment.texture;scene.environmentIntensity=.15;room.dispose();pmrem.dispose()
    loadBotanicalAssets(materials.planter).then(plants=>{
      if(disposed){plants.traverse(o=>{if(o instanceof T.Mesh){o.geometry.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material]){if(m===materials.planter)continue;for(const v of Object.values(m))if(v instanceof T.Texture)v.dispose();m.dispose()}}});return}
      model.add(plants);botanicalsReady=true;renderer.shadowMap.needsUpdate=true;dirty=true
    }).catch(()=>{assetErrors.push('Calathea model failed to load');dirty=true})
    const camera=new T.PerspectiveCamera(mobile?62:58,1,.06,120)
    // Build dining after the exterior has had a chance to paint.
    const interiorTimer=setTimeout(()=>{if(!disposed){model.add(batchStatic(buildInterior(materials)));renderer.shadowMap.needsUpdate=true;dirty=true}},100)
    // Sign lettering is a local transparent texture on its own sign, never a scene photograph.
    const signCanvas=document.createElement('canvas');signCanvas.width=2048;signCanvas.height=512
    const ctx=signCanvas.getContext('2d')!;ctx.fillStyle='#fff0c9';ctx.textAlign='center';ctx.font='italic 260px "Cormorant Garamond", Georgia';ctx.fillText('Mangosteen',1024,380)
    const signMap=new T.CanvasTexture(signCanvas);signMap.colorSpace=T.SRGBColorSpace
    const sign=new T.Mesh(new T.PlaneGeometry(7,1.75),new T.MeshBasicMaterial({map:signMap,transparent:true,depthWrite:false}));sign.position.set(0,4,.105);sign.name='Illuminated lettering';model.add(sign)
    const brand=new Image();brand.onload=()=>{if(disposed)return;ctx.clearRect(0,0,2048,512);const h=2048*brand.height/brand.width;ctx.drawImage(brand,0,(512-h)/2,2048,h);ctx.globalCompositeOperation='source-in';ctx.fillStyle='#ffdfad';ctx.fillRect(0,0,2048,512);ctx.globalCompositeOperation='source-over';signMap.needsUpdate=true;dirty=true};brand.src='/images/architectural/brand-lockup.png'
    const resize=()=>{const {width,height}=element.getBoundingClientRect();renderer.setSize(width,height);camera.aspect=width/height;camera.updateProjectionMatrix();dirty=true}
    const observer=new ResizeObserver(resize);observer.observe(element);resize()
    let current=-1,last=performance.now(),frame=0;const samples:number[]=[]
    const render=(now:number)=>{
      if(disposed)return
      const dt=Math.min(50,now-last);last=now
      if(!document.hidden&&(dirty||Math.abs(requested.current-current)>.00005)){
        current=current<0||reduced?requested.current:T.MathUtils.lerp(current,requested.current,1-Math.exp(-dt/90))
        if(reviewPose){camera.position.fromArray(reviewPose.position);camera.lookAt(new T.Vector3(...reviewPose.target));camera.updateMatrixWorld()}else directCamera(camera,current,mobile)
        const start=performance.now();renderer.render(scene,camera);samples.push(performance.now()-start);if(samples.length>600)samples.shift();dirty=false
      }
      frame=requestAnimationFrame(render)
    }
    frame=requestAnimationFrame(render)
    window.architecturalReview={exportGLB:async()=>new GLTFExporter().parseAsync(model,{binary:true}) as Promise<ArrayBuffer>,pose:(position,target)=>{reviewPose=position&&target?{position,target}:null;dirty=true},wireframe:(enabled)=>{model.traverse(o=>{if(o instanceof T.Mesh)for(const m of Array.isArray(o.material)?o.material:[o.material])if('wireframe' in m)m.wireframe=enabled});dirty=true},stats:()=>({drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures,renderCpuMs:samples,camera:camera.position.toArray(),progress:current,pixelRatio:renderer.getPixelRatio(),botanicalsReady,assetErrors})}
    const lost=(e:Event)=>{e.preventDefault();onFailure()};renderer.domElement.addEventListener('webglcontextlost',lost)
    return ()=>{disposed=true;clearTimeout(interiorTimer);cancelAnimationFrame(frame);observer.disconnect();delete window.architecturalReview
      const geometries=new Set<T.BufferGeometry>(),mats=new Set<T.Material>(),textures=new Set<T.Texture>()
      scene.traverse(o=>{if(o instanceof T.Mesh){geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])mats.add(m)}})
      for(const m of mats){for(const v of Object.values(m))if(v instanceof T.Texture)textures.add(v);m.dispose()}textures.forEach(t=>t.dispose());geometries.forEach(g=>g.dispose());environment.dispose();renderer.dispose();renderer.domElement.remove()
    }
  },[onFailure])
  return <div className="arc-canvas" ref={host}/>
}
