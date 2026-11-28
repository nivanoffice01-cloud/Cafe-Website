// Publicly listed menu snapshot. Prices are indicative and may change at the cafe.
import fullMenu from '../CRM/menu-catalogue.json' with { type: 'json' }

export { fullMenu }
export const fullMenuCount = fullMenu.reduce((sum, category) => sum + category.items.length, 0)
