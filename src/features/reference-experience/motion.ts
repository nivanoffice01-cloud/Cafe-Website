import { useLayoutEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { motion, reducedMotion } from './motionConfig'
export { motion, reducedMotion } from './motionConfig'

gsap.registerPlugin(ScrollTrigger)

export function useEditorialMotion(root: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const media = gsap.matchMedia()
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const context = gsap.context(() => {
        const compact = window.matchMedia('(max-width:700px)').matches
        const entrance = gsap.timeline({defaults:{ease:motion.ease}})
        entrance.from('.ref-header > *', {y:-12,opacity:0,duration:.55,stagger:.055},0)
          .from('.ref-table-area',{xPercent:compact?0:6,y:compact?28:0,opacity:0,duration:motion.entrance},0)
          .from('.ref-course-label',{opacity:0,y:8,duration:.4},.18)
          .from('.ref-dish-motion',{clipPath:'inset(0 0 100% 0)',y:24,opacity:0,duration:.85},.27)
          .from('.ref-hero-actions > *, .ref-photo-disclosure',{y:12,opacity:0,duration:.55,stagger:.06},.48)
          .from('.ref-drag-controls',{opacity:0,y:8,duration:.45},.75)
        gsap.utils.toArray<HTMLElement>('.ref-story-line').forEach((line,i)=>{
          gsap.fromTo(line,{opacity:.2,filter:'blur(7px)',y:12},{opacity:1,filter:'blur(0px)',y:0,ease:'none',scrollTrigger:{trigger:line,start:`top ${88-i*2}%`,end:'top 55%',scrub:.45}})
        })
        const reveal = (target:string,from:gsap.TweenVars,trigger=target,stagger=0) => gsap.from(target,{...from,duration:motion.reveal,ease:motion.ease,stagger,scrollTrigger:{trigger,start:'top 89%',toggleActions:'play none none reverse'}})
        reveal('.ref-story-footer',{opacity:0,y:15})
        reveal('.ref-menu-intro h2',{clipPath:'inset(0 0 100% 0)',y:24})
        gsap.utils.toArray<HTMLElement>('.ref-menu-row').forEach(row=>gsap.from(row,{clipPath:'inset(0 100% 0 0)',x:12,duration:.8,ease:motion.ease,scrollTrigger:{trigger:row,start:'top 92%',toggleActions:'play none none reverse'}}))
        gsap.from('.ref-cafe-background',{clipPath:'inset(9% 0 9% 0)',scale:1.06,ease:'none',scrollTrigger:{trigger:'.ref-cafe-photo',start:'top 90%',end:'top 10%',scrub:.6}})
        gsap.fromTo('.ref-photo-inset',{yPercent:12,rotation:3},{yPercent:compact?-8:-20,rotation:-4,ease:'none',scrollTrigger:{trigger:'.ref-cafe-photo',start:'top bottom',end:'bottom top',scrub:.8}})
        reveal('.ref-photo-copy h2',{clipPath:'inset(0 0 100% 0)',y:24})
        reveal('.ref-photo-copy p, .ref-photo-copy .ref-pill',{opacity:0,y:12},'.ref-photo-copy',.1)
        gsap.from('.ref-glass h2',{clipPath:'inset(0 100% 0 0)',x:-16,ease:'none',scrollTrigger:{trigger:'.ref-glass',start:'top 70%',end:'top 15%',scrub:.5}})
        reveal('.ref-room-invite h2',{clipPath:'inset(0 0 100% 0)',y:26})
        reveal('.ref-room-invite p, .ref-room-invite button',{opacity:0,y:12},'.ref-room-invite h2',.12)
        reveal('.ref-gather-photo',{clipPath:'inset(0 0 100% 0)'})
        reveal('.ref-card-stage',{clipPath:'inset(0 100% 0 0)'})
        gsap.utils.toArray<HTMLElement>('.ref-occasions article').forEach(article=>gsap.from(article.querySelectorAll('.ref-article-title, p, .ref-tags'),{opacity:0,y:16,stagger:.09,duration:.65,scrollTrigger:{trigger:article.querySelector('.ref-article-title'),start:'top 91%',toggleActions:'play none none reverse'}}))
        reveal('.ref-book h2',{clipPath:'inset(0 0 100% 0)',y:22})
        reveal('.ref-book-form fieldset, .ref-book-submit, .ref-book-note',{opacity:0,y:14},'.ref-book-form',.075)
        reveal('.ref-footer-grid > div',{opacity:0,y:16},'.ref-footer-grid',.075)
        reveal('.ref-footer-brand',{clipPath:'inset(0 0 100% 0)',y:28})
        // Contrast changes only the header backdrop, not the established section colours.
        gsap.to('.ref-header',{'--ref-nav-shade':.92,ease:'none',scrollTrigger:{trigger:'.ref-story',start:'top 95%',end:'top 60%',scrub:true}})
      },root)
      return ()=>context.revert()
    })
    return ()=>media.revert()
  },[root])
}

export function useDishMotion(active:number) {
  const [displayed,setDisplayed]=useState(active)
  const element=useRef<HTMLDivElement>(null)
  const previous=useRef(displayed)
  const exiting=useRef(false)
  useLayoutEffect(()=>{
    if(!element.current) return
    if(active===displayed){
      if(!exiting.current)return
      exiting.current=false
      const recover=gsap.to(element.current,{y:0,opacity:1,clipPath:'inset(0 0 0% 0)',duration:reducedMotion()?0:motion.fast,overwrite:true})
      return ()=>{recover.kill()}
    }
    if(reducedMotion()){setDisplayed(active);return}
    exiting.current=true
    const tween=gsap.to(element.current,{y:-10,opacity:0,clipPath:'inset(0 0 100% 0)',duration:motion.exit,ease:'power2.in',onComplete:()=>setDisplayed(active)})
    return ()=>{tween.kill()}
  },[active,displayed])
  useLayoutEffect(()=>{
    if(previous.current===displayed)return
    previous.current=displayed;exiting.current=false
    if(!element.current) return
    const tween=gsap.fromTo(element.current,{y:16,opacity:0,clipPath:'inset(100% 0 0 0)'},{y:0,opacity:1,clipPath:'inset(0 0 0% 0)',duration:reducedMotion()?0:motion.reveal,ease:motion.ease,overwrite:true})
    return ()=>{tween.kill()}
  },[displayed])
  return {displayed,element}
}

export function closeLayer(container:HTMLElement|null,done:()=>void) {
  if(!container || reducedMotion()){done();return}
  gsap.killTweensOf(container)
  if(container.classList.contains('ref-mobile-nav')){
    gsap.to(container,{xPercent:-100,duration:.32,ease:motion.travel,onComplete:done})
    return
  }
  gsap.timeline({onComplete:done}).to(container,{opacity:0,duration:motion.exit,ease:'power2.in'},0)
    .to(container.querySelectorAll('.reservation-dialog, nav > *'),{y:12,opacity:0,duration:motion.exit},0)
}
