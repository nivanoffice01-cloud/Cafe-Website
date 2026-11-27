type Name = 'calendar' | 'clock' | 'guests' | 'pin' | 'arrow' | 'check' | 'leaf' | 'back'
const paths: Record<Name, string> = {
  calendar: 'M7 3v4m10-4v4M4 10h16M5 5h14a1 1 0 011 1v14H4V6a1 1 0 011-1zM8 14h2m4 0h2m-8 3h2',
  clock: 'M12 7v5l3 2M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  guests: 'M16 21v-3a4 4 0 00-4-4H6a4 4 0 00-4 4v3m20 0v-3a4 4 0 00-3-3.87M13 3.13a4 4 0 010 7.75M13 7a4 4 0 11-8 0 4 4 0 018 0z',
  pin: 'M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1116 0zM15 10a3 3 0 11-6 0 3 3 0 016 0z',
  arrow: 'M4 12h16m-6-6l6 6-6 6', check: 'M5 12l4 4L19 6',
  leaf: 'M5 19C2 8 10 3 20 3c0 11-7 18-15 16zM5 19L16 8',
  back: 'M20 12H4m6-6l-6 6 6 6',
}
export function ReservationIcon({ name }: { name: Name }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]}/></svg>
}
