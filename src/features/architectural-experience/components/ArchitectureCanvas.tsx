import { useEffect, useRef } from 'react'
import * as T from 'three'
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js'
import { createMaterials } from '../materials/library'
import { buildExterior,buildInterior } from '../environment/buildEnvironment'
import { lightScene } from '../lighting/setup'
import { directCamera } from '../camera/director'
import { batchStatic } from '../geometry/primitives'

declare global { interface Window { architecturalReview?: { exportGLB:()=>Promise<ArrayBuffer>; stats:()=>unknown } } }

export function ArchitectureCanvas({progress,onFailure}:{progress:number;onFailure:()=>void}) {
  const host=useRef<HTMLDivElement>(null),requested=useRef(progress)
  requested.current=progress
  useEffect(()=>{
    const element=host.current!;let renderer:T.WebGLRenderer
    try {renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'})}catch{onFailure();return}
    const mobile=matchMedia('(max-width: 700px)').matches,reduced=matchMedia('(prefers-reduced-motion: reduce)').matches
    renderer.setPixelRatio(Math.min(devicePixelRatio,mobile?1.25:1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap
    renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;renderer.outputColorSpace=T.SRGBColorSpace
    renderer.domElement.setAttribute('aria-label','Mangosteen architectural entrance');element.appendChild(renderer.domElement)
    const scene=new T.Scene(),model=new T.Group();model.name='Mangosteen architectural interpretation';scene.add(model)
    const materials=createMaterials();model.add(batchStatic(buildExterior(materials)));lightScene(scene,mobile)
    const camera=new T.PerspectiveCamera(mobile?62:58,1,.06,120)
    let disposed=false,dirty=true
    // Build dining after the exterior has had a chance to paint.
    const interiorTimer=setTimeout(()=>{if(!disposed){model.add(batchStatic(buildInterior(materials)));dirty=true}},100)
    // Sign lettering is a local transparent texture on its own sign, never a scene photograph.
    const signCanvas=document.createElement('canvas');signCanvas.width=2048;signCanvas.height=256
    const ctx=signCanvas.getContext('2d')!;ctx.fillStyle='#fff0c9';ctx.textAlign='center';ctx.font='italic 180px "Cormorant Garamond", Georgia';ctx.fillText('Mangosteen',1024,190)
    const signMap=new T.CanvasTexture(signCanvas);signMap.colorSpace=T.SRGBColorSpace
    const sign=new T.Mesh(new T.PlaneGeometry(7,.88),new T.MeshBasicMaterial({map:signMap,transparent:true,depthWrite:false}));sign.position.set(0,3.8,.105);sign.name='Illuminated lettering';model.add(sign)
    const resize=()=>{const {width,height}=element.getBoundingClientRect();renderer.setSize(width,height);camera.aspect=width/height;camera.updateProjectionMatrix();dirty=true}
    const observer=new ResizeObserver(resize);observer.observe(element);resize()
    let current=-1,last=performance.now(),frame=0;const samples:number[]=[]
    const render=(now:number)=>{
      if(disposed)return
      const dt=Math.min(50,now-last);last=now
      if(!document.hidden&&(dirty||Math.abs(requested.current-current)>.00005)){
        current=current<0||reduced?requested.current:T.MathUtils.lerp(current,requested.current,1-Math.exp(-dt/90))
        directCamera(camera,current,mobile);const start=performance.now();renderer.render(scene,camera);samples.push(performance.now()-start);if(samples.length>600)samples.shift();dirty=false
      }
      frame=requestAnimationFrame(render)
    }
    frame=requestAnimationFrame(render)
    window.architecturalReview={exportGLB:async()=>new GLTFExporter().parseAsync(model,{binary:true}) as Promise<ArrayBuffer>,stats:()=>({drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures,renderCpuMs:samples,camera:camera.position.toArray(),progress:current,pixelRatio:renderer.getPixelRatio()})}
    const lost=(e:Event)=>{e.preventDefault();onFailure()};renderer.domElement.addEventListener('webglcontextlost',lost)
    return ()=>{disposed=true;clearTimeout(interiorTimer);cancelAnimationFrame(frame);observer.disconnect();delete window.architecturalReview
      const geometries=new Set<T.BufferGeometry>(),mats=new Set<T.Material>(),textures=new Set<T.Texture>()
      scene.traverse(o=>{if(o instanceof T.Mesh){geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])mats.add(m)}})
      for(const m of mats){for(const v of Object.values(m))if(v instanceof T.Texture)textures.add(v);m.dispose()}textures.forEach(t=>t.dispose());geometries.forEach(g=>g.dispose());renderer.dispose();renderer.domElement.remove()
    }
  },[onFailure])
  return <div className="arc-canvas" ref={host}/>
}
