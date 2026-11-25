import { useCallback,useEffect,useRef,useState } from 'react'
import { ReservationDialog } from '../../components/ReservationDialog'
import { ArchitectureCanvas } from './components/ArchitectureCanvas'
import './styles/experience.css'

export default function ArchitecturalExperiencePage(){
  const [progress,setProgress]=useState(0),[failed,setFailed]=useState(false),[reserve,setReserve]=useState(false)
  const root=useRef<HTMLElement>(null),animation=useRef(0)
  const fail=useCallback(()=>setFailed(true),[])
  useEffect(()=>{const onScroll=()=>{const node=root.current!;setProgress(Math.max(0,Math.min(1,-node.getBoundingClientRect().top/(node.offsetHeight-innerHeight))))};addEventListener('scroll',onScroll,{passive:true});addEventListener('resize',onScroll);onScroll();return()=>{removeEventListener('scroll',onScroll);removeEventListener('resize',onScroll);cancelAnimationFrame(animation.current)}},[])
  const enter=(instant=false)=>{cancelAnimationFrame(animation.current);const end=root.current!.offsetTop+root.current!.offsetHeight-innerHeight
    if(instant||matchMedia('(prefers-reduced-motion: reduce)').matches){scrollTo({top:end,behavior:'instant'});return}
    const start=scrollY,time=performance.now();const step=(now:number)=>{const t=Math.min(1,(now-time)/9500);scrollTo({top:start+(end-start)*(t*t*(3-2*t)),behavior:'instant'});if(t<1)animation.current=requestAnimationFrame(step)};animation.current=requestAnimationFrame(step)
  }
  useEffect(()=>{const stop=()=>cancelAnimationFrame(animation.current);addEventListener('wheel',stop,{passive:true});addEventListener('touchstart',stop,{passive:true});addEventListener('pointerdown',stop,{passive:true});addEventListener('keydown',stop);return()=>{removeEventListener('wheel',stop);removeEventListener('touchstart',stop);removeEventListener('pointerdown',stop);removeEventListener('keydown',stop)}},[])
  return <>
    <main className="arc-journey" ref={root}>
      <div className="arc-stage">
        {failed?<img className="arc-fallback" src="/images/experience/mangosteen-arrival.jpg" alt="Mangosteen café exterior"/>:<ArchitectureCanvas progress={progress} onFailure={fail}/>}
        <header className="arc-header"><a href="/" className="arc-brand">MANGOSTEEN<span>CAFÉ · INDORE</span></a><nav aria-label="Café navigation"><a href="/menu">Explore Menu</a><button onClick={()=>setReserve(true)}>Reserve a Table</button></nav></header>
        {progress<.12&&<section className="arc-intro"><p>A LITTLE WORLD ABOVE THE CITY</p><h1>Don't just visit.<br/><em>Step inside.</em></h1><button onClick={()=>enter()}>Enter Mangosteen <span aria-hidden="true">↗</span></button></section>}
        <footer className="arc-controls"><div><span>{progress<.3?'THE ARRIVAL':progress<.75?'STEP INSIDE':'YOU ARE EXPLORING'}</span><strong>{progress<.3?'Mangosteen, Indore':progress<.75?'Through the entrance':'The Long Table'}</strong></div><div>{progress<.98?<button onClick={()=>enter(true)}>Skip Entrance →</button>:<button onClick={()=>scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'})}>Return to arrival ↑</button>}<small>{progress<.98?'SCROLL TO ENTER':'SCROLL BACK TO RETURN'}</small></div></footer>
      </div>
    </main>
    {reserve&&<ReservationDialog onClose={()=>setReserve(false)}/>}
  </>
}
