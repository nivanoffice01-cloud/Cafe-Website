import { fullMenu } from '../../data/fullMenu'
import { cafe } from '../../data/cafe'

const highlights = [
  ['mg-burger', 'Burger & sandwich', 'Mangosteen chicken burger'],
  ['mg-truffle-pasta', 'Pasta', 'Pesto cream Pasta'],
  ['mg-margherita', 'Pizza & Pide', 'Margarita'],
  ['mg-cold-brew', 'Shakes', 'Oreo Shake'],
  ['mg-panna-cotta', 'Desserts', 'Duo chocolate cheese cake'],
  ['mg-basil-cooler', 'Mocktail & Coolers', 'Virgin mojito'],
] as const

export function dishDestination(id: string) {
  const match = highlights.find(([key]) => key === id)
  return match ? `/menu?${new URLSearchParams({ category: match[1], dish: match[2] })}` : '/menu'
}

type Entry = { id?: string; name?: string; price?: string; tag?: string; desc?: string; [key: string]: unknown }
type DesignContent = {
  Rg: Entry[]; Bg: { group: string; items: Entry[] }[]
  Qg: Entry[]; Vg: Entry[]; Hh: Entry[]; Lh: Record<string, unknown>
  o_: Entry[]; s_: Entry[]; c_: Entry[]
}

// Only business facts are adapted. Supplied composition, imagery and motion stay intact.
export function applyVerifiedContent(content: DesignContent) {
  for (const [id, category, name] of highlights) {
    const dish = fullMenu.find(c => c.name === category)?.items.find(item => item.name === name)
    const target = content.Rg.find(item => item.id === id)
    if (dish && target) Object.assign(target, {
      name: dish.name, price: `₹${dish.price}`, desc: dish.description || 'See the full menu for details.', tag: 'illustrative photo',
    })
  }
  content.Bg.splice(0, content.Bg.length, ...[
    ['Shakes & Coolers', ['Oreo Shake', 'Kit-kat shake', 'Virgin mojito']],
    ['The Kitchen', ['Margarita', 'Pesto cream Pasta', 'Mangosteen chicken burger']],
    ['Sweet & Cold', ['Duo chocolate cheese cake', 'Chocolate Cheesecake', 'Kiwi mojito']],
  ].map(([group, names]) => ({
    group: group as string,
    items: (names as string[]).flatMap(name => {
      const dish = fullMenu.flatMap(category => category.items).find(item => item.name === name)
      return dish ? [{ name: dish.name, price: `₹${dish.price}` }] : []
    }),
  })))
  Object.assign(content.Qg[0], { address: cafe.address, hours: [{ day: 'Daily', time: cafe.hours }] })
  content.c_.splice(0, content.c_.length,
    { icon: 'ri-map-pin-line', label: 'Visit', value: cafe.address },
    { icon: 'ri-time-line', label: 'Hours', value: cafe.hours },
    { icon: 'ri-restaurant-line', label: 'Menu', value: '131 dishes · 13 categories' },
  )
  content.Lh.layersBody = 'A cinematic burger composition, separated into individual visual layers.'
  content.Lh.upgradeBody = 'Explore the animation. Find your next favourite in our actual menu.'
  content.Hh[1].body = content.Lh.layersBody
  content.Hh[2].body = content.Lh.upgradeBody
  content.o_.splice(0, content.o_.length,
    { no: '01', title: 'Around the table', body: 'Explore our existing menu, from small plates to something sweet.' },
    { no: '02', title: 'Make yourself at home', body: 'Wooden tables, woven pendant lights and greenery throughout the café.' },
    { no: '03', title: 'Above the city', body: 'Discover Mangosteen in Bicholi Mardana, Indore.' },
  )
  content.s_.splice(0, content.s_.length,
    { year: '01', text: 'Find us in Bicholi Mardana, near Mayank Blue Water Park Road.' },
    { year: '02', text: 'Explore the menu and choose something for the table.' },
    { year: '03', text: 'Request your preferred seating. Our team confirms your reservation.' },
  )
}
