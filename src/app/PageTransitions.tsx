import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { motion, reducedMotion } from '../features/reference-experience/motionConfig'
import './page-transitions.css'

const key='mangosteen-page-transition'
const getPending=()=>{
  try {const p=JSON.parse(sessionStorage.getItem(key)||'null');return p && Date.now()-p.time<15000 && p.url===location.href?p:null} catch{return null}
}

/** MPA transition: keep native document navigation, history and scroll restoration.
 * Direct QR entry and the menu's own quick browsing never wait for a curtain. */
export function PageTransitions({children}:{children:ReactNode}) {
  const [arrival]=useState(()=>Boolean(getPending())&&!reducedMotion())
  const curtain=useRef<HTMLDivElement>(null)
  useEffect(()=>{
    let disposed=false, pending='', running=false
    let timeline:ReturnType<typeof import('gsap')['default']['timeline']>|undefined
    let observer:MutationObserver|undefined
    let restoreObserver:MutationObserver|undefined
    let restoreFrame=0
    const layer=curtain.current!
    // Lazy routes can be shorter than the saved scroll position during native restoration.
    // Keep a position per history entry, then restore only for back/forward traversal.
    let entry=history.state?.mangosteenMotionEntry as string|undefined
    if(!entry){entry=crypto.randomUUID();history.replaceState({...history.state,mangosteenMotionEntry:entry},'')}
    const scrollKey=`mangosteen-scroll-${entry}`
    const saveScroll=()=>{try{sessionStorage.setItem(scrollKey,JSON.stringify({x:scrollX,y:scrollY}))}catch{/* storage optional */}}
    const routeReady=()=>Boolean(document.querySelector('.ref-experience, .bm-shell, .holding-page, main'))
    const navigation=performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming|undefined
    if(navigation?.type==='back_forward'){
      let position:{x:number;y:number}|null=null
      try{position=JSON.parse(sessionStorage.getItem(scrollKey)||'null')}catch{/* native fallback */}
      if(position){
        const restore=()=>{restoreObserver?.disconnect();restoreFrame=requestAnimationFrame(()=>{restoreFrame=requestAnimationFrame(()=>scrollTo(position!.x,position!.y))})}
        if(routeReady())restore()
        else{restoreObserver=new MutationObserver(()=>{if(routeReady())restore()});restoreObserver.observe(document.getElementById('root')!,{subtree:true,childList:true})}
      }
    }
    const clear=()=>{
      timeline?.kill();layer.style.visibility='hidden';layer.style.pointerEvents='none';layer.style.transform='translateY(100%)'
      running=false;pending='';try{sessionStorage.removeItem(key)}catch{/* private browsing */}
    }
    async function reveal(){
      observer?.disconnect()
      const {default:gsap}=await import('gsap');if(disposed)return
      gsap.set(layer,{visibility:'visible',yPercent:0,y:0,pointerEvents:'none'})
      timeline=gsap.timeline({onComplete:clear}).to(layer.querySelector('span'),{opacity:0,y:-8,duration:.18},0)
        .to(layer,{yPercent:-100,duration:motion.uncover,ease:motion.travel},.05)
    }
    if(arrival){
      const ready=()=>Boolean(document.querySelector('.ref-experience, .bm-shell, .holding-page, .architectural-experience, main'))
      if(ready())void reveal()
      else {observer=new MutationObserver(()=>{if(ready())void reveal()});observer.observe(document.getElementById('root')!,{childList:true,subtree:true})}
    }
    async function click(event:MouseEvent){
      const anchor=(event.target as Element).closest<HTMLAnchorElement>('a[href]')
      if(!anchor || event.defaultPrevented || event.button!==0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || anchor.target || anchor.hasAttribute('download'))return
      const url=new URL(anchor.href,location.href)
      if(url.origin!==location.origin || (url.pathname===location.pathname && url.search===location.search) || !['/','/menu','/reference-experience','/m'].some(p=>url.pathname===p||p==='/menu'&&url.pathname.startsWith('/menu/')))return
      // Scope the enhancement to this experience; unrelated entry routes stay untouched.
      if(location.pathname!=='/reference-experience' && url.pathname!=='/reference-experience')return
      if(reducedMotion())return
      event.preventDefault();pending=url.href
      if(running)return
      running=true
      const {default:gsap}=await import('gsap');if(disposed || !running)return
      gsap.set(layer,{yPercent:100,y:0,visibility:'visible',pointerEvents:'none'})
      gsap.set(layer.querySelector('span'),{opacity:0,y:8})
      timeline=gsap.timeline({onComplete:()=>{
        saveScroll()
        try{sessionStorage.setItem(key,JSON.stringify({url:pending,time:Date.now()}))}catch{/* native navigation still works */}
        location.assign(pending)
      }}).to(layer,{yPercent:0,duration:motion.cover,ease:motion.travel},0)
        .to(layer.querySelector('span'),{opacity:1,y:0,duration:.22},.1)
    }
    const pageshow=(event:PageTransitionEvent)=>{if(event.persisted)clear()} // BFCache returns must never retain the outgoing cover.
    const cancel=(event:KeyboardEvent)=>{if(event.key==='Escape' && running)clear()}
    document.addEventListener('click',click)
    window.addEventListener('pageshow',pageshow)
    window.addEventListener('keydown',cancel)
    window.addEventListener('pagehide',saveScroll)
    return()=>{disposed=true;timeline?.kill();observer?.disconnect();restoreObserver?.disconnect();cancelAnimationFrame(restoreFrame);document.removeEventListener('click',click);window.removeEventListener('pageshow',pageshow);window.removeEventListener('keydown',cancel);window.removeEventListener('pagehide',saveScroll)}
  },[arrival])
  return <>{children}<div ref={curtain} className="mangosteen-page-curtain" aria-hidden="true" style={arrival?{visibility:'visible',transform:'translateY(0)'}:undefined}><span>Mangosteen</span></div></>
}
