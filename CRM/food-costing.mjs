import { createHash } from 'node:crypto'

export const foodRoles = ['Owner', 'Manager']
const fail = message => { throw Object.assign(new Error(message), { status:409 }) }
const paise = rupees => Math.round(rupees * 100)
const units = 1000000n

function decimal(value, places, label, allowZero = false) {
  const text = String(value ?? '').trim()
  if (!new RegExp(`^(?:\\d{1,6}(?:\\.\\d{1,${places}})?|\\.\\d{1,${places}})$`).test(text) || (!allowZero && Number(text) === 0)) {
    fail(`Enter a valid ${label} with up to ${places} decimal places.`)
  }
  return Number(text)
}

function extendedCost(ingredients) {
  const total = ingredients.reduce((sum, line) => sum + BigInt(line.unitCostPaise) * BigInt(Math.round(line.quantity * Number(units))), 0n)
  return Number((total + units / 2n) / units)
}

function dishes(state, catalog) {
  const pos = state.menuItems.map(item => ({ ...item, id:`pos:${item.id}`, channel:'POS',
    recipe:state.recipes.filter(line => line.menuItemId === item.id) }))
  const qr = [...catalog.entries()].map(([key, item]) => ({ ...item, id:`qr:${key}`, channel:'Website / QR',
    recipe:state.publicDishRecipes?.[key] || [] }))
  return [...qr, ...pos]
}

function revision(recipe) {
  const lines = recipe.map(({ inventoryItemId, quantity }) => [inventoryItemId, quantity]).sort(([a], [b]) => a - b)
  return createHash('sha256').update(JSON.stringify(lines)).digest('hex')
}

export function foodPayload(state, catalog) {
  const inventory = state.inventory.map(({ id, name, unit, unitCostPaise }) => ({ id, name, unit, unitCostPaise:unitCostPaise ?? null }))
  const byId = new Map(inventory.map(item => [item.id, item]))
  return { inventory, waste:(state.foodWaste || []).slice(0, 100), dishes:dishes(state, catalog).map(dish => {
    const lines = dish.recipe.map(line => ({ inventoryItemId:line.inventoryItemId, quantity:line.quantity,
      unitCostPaise:byId.get(line.inventoryItemId)?.unitCostPaise ?? null }))
    const missing = lines.filter(line => line.unitCostPaise === null).length
    const costPaise = lines.length && !missing ? extendedCost(lines) : null
    const pricePaise = paise(dish.price)
    const grossPaise = costPaise === null ? null : pricePaise - costPaise
    return { id:dish.id, name:dish.name, category:dish.category, channel:dish.channel, pricePaise,
      recipe:lines, revision:revision(dish.recipe), missing, costPaise, grossPaise,
      margin:grossPaise === null || !pricePaise ? null : grossPaise / pricePaise * 100 }
  }) }
}

export function saveIngredient(state, body) {
  const blank = body.unitCost == null || String(body.unitCost).trim() === ''
  const unitCostPaise = blank ? null : paise(decimal(body.unitCost, 2, 'unit cost', true))
  if (body.id != null) {
    const item = state.inventory.find(entry => entry.id === body.id)
    if (!item) fail('Ingredient not found.')
    item.unitCostPaise = unitCostPaise
    return { id:item.id }
  }
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const unit = typeof body.unit === 'string' ? body.unit.trim() : ''
  if (!name || name.length > 100 || !unit || unit.length > 16) fail('Enter an ingredient name and stock unit.')
  if (state.inventory.some(item => item.name.toLowerCase() === name.toLowerCase())) fail('An ingredient with this name already exists.')
  const quantity = decimal(body.quantity ?? '0', 6, 'stock quantity', true)
  const reorderLevel = decimal(body.reorderLevel ?? '0', 6, 'reorder level', true)
  const id = Math.max(0, ...state.inventory.map(item => item.id)) + 1
  state.inventory.push({ id, name, unit, quantity, reorderLevel, low:quantity <= reorderLevel, unitCostPaise })
  return { id }
}

export function saveRecipe(state, catalog, body) {
  const dish = dishes(state, catalog).find(item => item.id === body.dishId)
  if (!dish) fail('Dish not found.')
  if (revision(dish.recipe) !== body.revision) fail('This recipe changed. Refresh and review it before saving.')
  if (!Array.isArray(body.ingredients) || body.ingredients.length > 60) fail('A recipe supports up to 60 ingredients.')
  const recipe = body.ingredients.map(line => {
    const inventoryItemId = line?.inventoryItemId
    if (!state.inventory.some(item => item.id === inventoryItemId)) fail('Select a valid ingredient for each line.')
    return { inventoryItemId, quantity:decimal(line.quantity, 6, 'quantity per serving') }
  })
  if (new Set(recipe.map(line => line.inventoryItemId)).size !== recipe.length) fail('Use each ingredient once in the recipe.')
  const key = dish.id.slice(dish.channel === 'POS' ? 4 : 3)
  if (dish.channel === 'POS') {
    const menuItemId = Number(key)
    state.recipes = state.recipes.filter(line => line.menuItemId !== menuItemId)
      .concat(recipe.map(line => ({ ...line, menuItemId })))
  } else {
    state.publicDishRecipes ||= {}
    state.publicDishRecipes[key] = recipe
  }
  return { saved:true }
}

export function recordWaste(state, body, user, now = new Date()) {
  const id = body.requestKey
  if (typeof id !== 'string' || !/^[A-Za-z0-9_-]{8,100}$/.test(id)) fail('Invalid waste request. Reopen the form and try again.')
  state.foodWaste ||= []
  const previous = state.foodWaste.find(entry => entry.id === id)
  if (previous) {
    if (previous.recordedBy.id !== user.id) fail('This waste request already exists.')
    return { id }
  }
  const ingredient = state.inventory.find(item => item.id === body.ingredientId)
  if (!ingredient) fail('Select a valid ingredient.')
  if (!['Spoilage','Preparation waste'].includes(body.kind)) fail('Choose spoilage or preparation waste.')
  const quantity = decimal(body.quantity, 6, 'waste quantity')
  const reason = typeof body.reason === 'string' ? body.reason.trim() : ''
  if (reason.length < 3 || reason.length > 160) fail('Enter a reason of 3–160 characters.')
  const alreadyDeducted = body.kind === 'Preparation waste' && body.alreadyDeducted === true
  if (!alreadyDeducted) {
    if (ingredient.quantity + 1e-9 < quantity) fail(`Only ${ingredient.quantity} ${ingredient.unit} of ${ingredient.name} is in stock.`)
    ingredient.quantity = Math.max(0, Number((ingredient.quantity - quantity).toFixed(9)))
    ingredient.low = ingredient.quantity <= ingredient.reorderLevel
  }
  const unitCostPaise = ingredient.unitCostPaise ?? null
  state.foodWaste.unshift({ id, ingredientId:ingredient.id, name:ingredient.name, unit:ingredient.unit, quantity,
    kind:body.kind, reason, alreadyDeducted, unitCostPaise,
    lossPaise:unitCostPaise === null ? null : extendedCost([{ unitCostPaise, quantity }]),
    recordedAt:now.toISOString(), recordedBy:{ id:user.id, name:user.name } })
  return { id }
}
