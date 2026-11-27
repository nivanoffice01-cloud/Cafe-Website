// Decorative material treatment of the existing schematic footprint, not a survey.
// None of these objects is seating inventory or an interaction target.
export const rooftopPlanters = [
  { x: 40, y: 40, width: 66, height: 66, rotation: 0, asset: 'rooftop-planter-square-v4' },
  { x: 365, y: 40, width: 165, height: 50, rotation: 0, asset: 'rooftop-planter-trough-v4' },
  { x: 695, y: 40, width: 165, height: 50, rotation: 180, asset: 'rooftop-planter-trough-v4' },
  { x: 40, y: 345, width: 120, height: 54, rotation: 90, asset: 'rooftop-planter-trough-v4' },
  { x: 1000, y: 300, width: 160, height: 54, rotation: 90, asset: 'rooftop-planter-trough-v4' },
  { x: 967, y: 520, width: 92, height: 92, rotation: -20, asset: 'rooftop-planter-square-v4' },
] as const

export function RooftopEnvironment({ uid, entry }: { uid: string; entry: string }) {
  const posts = [55, 155, 255, 355, 455, 555]
  return <>
    <defs>
      <pattern id={`${uid}-roof-paving`} width="180" height="180" patternUnits="userSpaceOnUse"><image href="/images/reservation/rooftop-stone-v4.webp" width="180" height="180"/></pattern>
      <linearGradient id={`${uid}-roof-light`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#ffe4b7" stopOpacity=".14"/><stop offset=".48" stopColor="#ffdfaa" stopOpacity=".015"/><stop offset="1" stopColor="#10261c" stopOpacity=".16"/></linearGradient>
      <linearGradient id={`${uid}-roof-cap`} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#7e8771"/><stop offset=".4" stopColor="#596652"/><stop offset="1" stopColor="#3e4b3c"/></linearGradient>
      <filter id={`${uid}-roof-rail-shadow`} x="-15%" y="-15%" width="135%" height="135%"><feDropShadow dx="3" dy="5" stdDeviation="2" floodColor="#101b15" floodOpacity=".28"/></filter>
      <filter id={`${uid}-roof-planter-shadow`} x="-35%" y="-40%" width="185%" height="205%"><feDropShadow dx=".5" dy="1.5" stdDeviation="1" floodColor="#0a1610" floodOpacity=".45"/><feDropShadow dx="3" dy="6" stdDeviation="3" floodColor="#0d1d13" floodOpacity=".3"/></filter>
    </defs>
    <g className="reservation-floor" aria-hidden="true" pointerEvents="none">
      <rect width="1040" height="580" fill={`url(#${uid}-roof-paving)`}/>
      <rect width="1040" height="580" fill={`url(#${uid}-roof-light)`}/>
      <g className="rooftop-boundary" filter={`url(#${uid}-roof-rail-shadow)`}>
        {/* Existing U-shaped boundary retained; metal finish references the café photos. */}
        <path d="M24 580V24H1016V580" fill="none" stroke="#cbd1c2" strokeWidth="11"/>
        <path d="M24 580V24H1016V580" fill="none" stroke="#ebebda" strokeWidth="6"/>
        {posts.flatMap(y => [24, 1016].map(x => <rect key={`${x}-${y}`} x={x - 7} y={y - 6} width="14" height="12" rx="1" fill="#e7e8d8" stroke="#a4ad9c" strokeWidth=".8"/>))}
        {[85, 230, 375, 520, 665, 810, 955].map(x => <rect key={x} x={x - 6} y="17" width="12" height="14" rx="1" fill="#e7e8d8" stroke="#a4ad9c" strokeWidth=".8"/>)}
        <path d="M24 580V24H1016V580" fill="none" stroke={`url(#${uid}-roof-cap)`} strokeWidth="4"/>
        <path d="M21 580V21H1013" fill="none" stroke="#e1dfbe" strokeWidth=".8" opacity=".65"/>
      </g>
      <rect x="390" y="552" width="260" height="26" rx="13" fill="#f4efdf" opacity=".94"/>
      <text x="520" y="569" textAnchor="middle" fill="#2e3e31" fontSize="9" letterSpacing="2.5">{entry}</text>
    </g>
    <g className="rooftop-architectural-planters" aria-hidden="true" pointerEvents="none">
      {rooftopPlanters.map((plant, i) => <g key={i} className="reservation-plant" transform={`translate(${plant.x} ${plant.y})`} filter={`url(#${uid}-roof-planter-shadow)`}>
        <image className="reservation-plant-art" href={`/images/reservation/${plant.asset}.webp`} x={-plant.width / 2} y={-plant.height / 2} width={plant.width} height={plant.height} transform={`rotate(${plant.rotation})`} preserveAspectRatio="none"/>
      </g>)}
    </g>
  </>
}
