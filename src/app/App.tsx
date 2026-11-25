import { Suspense, lazy } from 'react'

const HomePage = lazy(() => import('../pages/HomePage').then((module) => ({ default: module.HomePage })))
const MenuExperiencePage = lazy(() => import('../pages/MenuExperiencePage').then((module) => ({ default: module.MenuExperiencePage })))
const ArchitecturalExperiencePage = lazy(() => import('../features/architectural-experience/ArchitecturalExperiencePage'))

export default function App() {
  const pathname = window.location.pathname.replace(/\/$/, '') || '/'
  const fallback = <div style={{ minHeight: '100svh', background: '#0b100c' }} />
  if (pathname === '/experience') return <Suspense fallback={fallback}><ArchitecturalExperiencePage /></Suspense>
  if (pathname === '/m' || pathname === '/menu' || pathname.startsWith('/menu/')) return <Suspense fallback={fallback}><MenuExperiencePage /></Suspense>
  return <Suspense fallback={fallback}><HomePage /></Suspense>
}
