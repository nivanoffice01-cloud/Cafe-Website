import { Suspense, lazy } from 'react'
const HoldingPage = lazy(() => import('../features/marketing/pages/HoldingPage'))
const MenuExperiencePage = lazy(() => import('../pages/MenuExperiencePage').then((module) => ({ default: module.MenuExperiencePage })))

function Routes() {
  const pathname = window.location.pathname.replace(/\/$/, '') || '/'
  const fallback = <div style={{ minHeight: '100svh', background: '#0b100c' }} />
  if (pathname === '/m' || pathname === '/menu' || pathname.startsWith('/menu/')) return <Suspense fallback={fallback}><MenuExperiencePage /></Suspense>
  return <Suspense fallback={fallback}><HoldingPage /></Suspense>
}

export default function App() { return <Routes /> }
