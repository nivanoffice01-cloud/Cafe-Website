import { Suspense, lazy } from 'react'
import { PageTransitions } from './PageTransitions'

const HomePage = lazy(() => import('../pages/HomePage').then((module) => ({ default: module.HomePage })))
const MenuExperiencePage = lazy(() => import('../pages/MenuExperiencePage').then((module) => ({ default: module.MenuExperiencePage })))
const ArchitecturalExperiencePage = lazy(() => import('../features/architectural-experience/ArchitecturalExperiencePage'))
const ClaudeVfxLabPage = lazy(() => import('../features/claude-vfx-lab/ClaudeVfxLabPage'))
const ReferenceExperiencePage = lazy(() => import('../features/reference-experience/ReferenceExperiencePage'))

function Routes() {
  const pathname = window.location.pathname.replace(/\/$/, '') || '/'
  const fallback = <div style={{ minHeight: '100svh', background: '#0b100c' }} />
  if (pathname === '/reference-experience') return <Suspense fallback={fallback}><ReferenceExperiencePage /></Suspense>
  if (pathname === '/claude-vfx-lab') return <Suspense fallback={fallback}><ClaudeVfxLabPage /></Suspense>
  if (pathname === '/experience') return <Suspense fallback={fallback}><ArchitecturalExperiencePage /></Suspense>
  if (pathname === '/m' || pathname === '/menu' || pathname.startsWith('/menu/')) return <Suspense fallback={fallback}><MenuExperiencePage /></Suspense>
  return <Suspense fallback={fallback}><HomePage /></Suspense>
}

export default function App(){return <PageTransitions><Routes/></PageTransitions>}
