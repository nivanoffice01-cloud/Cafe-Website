import { useEffect, useRef } from 'react'
import type { FocusEvent, PointerEvent } from 'react'
import gsap from 'gsap'
import { reducedMotion } from './motionConfig'

type Dish = { name:string; description?:string; category:string; price:number; photo:{src:string;alt:string} }

/** The supplied recording uses one floating preview that follows the pointer,
 * not a thumbnail attached to each row. Keep it outside the row's reveal mask. */
export function MenuHoverPreview({dishes,descriptions,total}:{dishes:Dish[];descriptions:boolean;total:number}) {
  const list=useRef<HTMLDivElement>(null)
  const follower=useRef<HTMLDivElement>(null)
  const selected=useRef(-1)
  const moveX=useRef<ReturnType<typeof gsap.quickTo>|null>(null)
  const moveY=useRef<ReturnType<typeof gsap.quickTo>|null>(null)
  useEffect(()=>{
    const target=follower.current!
    moveX.current=gsap.quickTo(target,'x',{duration:.34,ease:'power3.out'})
    moveY.current=gsap.quickTo(target,'y',{duration:.4,ease:'power3.out'})
    const hide=()=>leave()
    window.addEventListener('scroll',hide,{passive:true})
    return()=>{window.removeEventListener('scroll',hide);moveX.current?.tween.kill();moveY.current?.tween.kill();gsap.killTweensOf(target);gsap.killTweensOf(target.children)}
  },[])
  function position(x:number,y:number,instant=false){
    const px=Math.max(120,Math.min(innerWidth-120,x)),py=Math.max(120,Math.min(innerHeight-120,y-36))
    if(instant||reducedMotion())gsap.set(follower.current,{x:px,y:py})
    else{moveX.current?.(px);moveY.current?.(py)}
  }
  function show(index:number,x:number,y:number){
    if(!window.matchMedia('(hover:hover) and (pointer:fine)').matches)return
    const first=selected.current<0
    position(x,y,first)
    if(selected.current!==index){
      selected.current=index
      list.current!.dataset.preview=String(index)
      list.current!.querySelectorAll('.ref-menu-row').forEach((row,i)=>row.classList.toggle('is-previewed',i===index))
      const images=follower.current!.children
      gsap.to(images,{opacity:0,scale:.92,duration:reducedMotion()?0:.22,overwrite:true})
      gsap.to(images[index],{opacity:.94,scale:1,duration:reducedMotion()?0:.28,ease:'power2.out',overwrite:true})
    }
    gsap.to(follower.current,{autoAlpha:1,duration:reducedMotion()?0:.18,overwrite:'auto'})
  }
  function pointer(event:PointerEvent<HTMLAnchorElement>,index:number){if(event.pointerType==='mouse')show(index,event.clientX,event.clientY)}
  function focus(event:FocusEvent<HTMLAnchorElement>,index:number){if(!event.currentTarget.matches(':focus-visible'))return;const box=event.currentTarget.getBoundingClientRect();show(index,box.right-120,box.top+box.height/2)}
  function leave(){
    if(selected.current<0)return
    selected.current=-1
    if(list.current){delete list.current.dataset.preview;list.current.querySelectorAll('.is-previewed').forEach(row=>row.classList.remove('is-previewed'))}
    gsap.to(follower.current,{autoAlpha:0,duration:reducedMotion()?0:.18,overwrite:'auto'})
  }
  return <div className="ref-menu-list" ref={list} onPointerLeave={leave}>
    {dishes.map((dish,index)=><a key={dish.name} href={`/menu?category=${encodeURIComponent(dish.category)}`} className="ref-menu-row ref-reveal" onPointerMove={e=>pointer(e,index)} onFocus={e=>focus(e,index)} onBlur={leave}>
      <span className="ref-roman">{['I','II','III','IV','V'][index]}</span><div><h3>{dish.name}</h3><p>{descriptions?dish.description||dish.category:dish.category}</p></div><span className="ref-price">₹{dish.price.toLocaleString('en-IN')}</span>
    </a>)}
    <a href="/menu" className="ref-menu-all" onPointerEnter={leave}>All {total} dishes <span>↗</span></a>
    <div className="ref-menu-follower" ref={follower} aria-hidden="true">{dishes.map(dish=><img key={dish.name} src={dish.photo.src} alt="" loading="lazy"/>)}</div>
  </div>
}
