const foodViews = { stock:'Stock', waste:'Waste log', margins:'Dish margins' };
const foodQty = new Intl.NumberFormat('en-IN', { maximumFractionDigits:6 });
const foodMoney = new Intl.NumberFormat('en-IN', { style:'currency', currency:'INR' });
const foodTime = new Intl.DateTimeFormat('en-IN', { dateStyle:'medium', timeStyle:'short', timeZone:'Asia/Kolkata' });
const foodAmount = paise => paise == null ? '—' : foodMoney.format(paise / 100);

function renderFoodInventoryTabs(view) {
  if (!data.foodCosting) return '';
  return `<div class="toolbar food-toolbar"><div class="segment-control">${Object.entries(foodViews).map(([id,label]) =>
    `<button class="${view === id ? 'active' : ''}" data-food-action="view" data-id="${id}" aria-pressed="${view === id}">${label}</button>`).join('')}</div></div>`;
}

function renderFoodWaste() {
  const entries = data.foodCosting.waste;
  const recordedLoss = entries.reduce((sum, entry) => sum + (entry.lossPaise ?? 0), 0);
  const uncosted = entries.filter(entry => entry.lossPaise == null).length;
  return `<article class="panel"><div class="panel-header"><div class="panel-title"><h2>Waste log</h2>
    <p>${entries.length} recent entries${entries.length > uncosted ? ` · ${foodAmount(recordedLoss)} recorded ingredient loss` : ''}${uncosted ? ` · ${uncosted} without a cost` : ''}</p></div></div>
    ${entries.length ? `<div class="table-wrap"><table class="data-table food-table"><thead><tr><th>Ingredient</th><th>Waste</th><th>Quantity</th><th>Stock</th><th>Cost at recording</th><th>Recorded</th></tr></thead><tbody>
    ${entries.map(entry => `<tr><td><strong>${escapeHtml(entry.name)}</strong></td>
      <td><strong>${escapeHtml(entry.kind)}</strong><small>${escapeHtml(entry.reason)}</small></td>
      <td>${foodQty.format(entry.quantity)} ${escapeHtml(entry.unit)}</td>
      <td>${entry.alreadyDeducted ? 'Already issued' : 'Deducted'}</td>
      <td>${entry.lossPaise == null ? 'Cost unavailable' : foodAmount(entry.lossPaise)}</td>
      <td>${foodTime.format(new Date(entry.recordedAt))}<small>${escapeHtml(entry.recordedBy.name)}</small></td></tr>`).join('')}</tbody></table></div>`
    : '<div class="empty-state compact"><p>No waste recorded yet. Use Record waste to log spoilage or preparation waste.</p></div>'}</article>`;
}

function renderMarginRows() {
  const query = (state.dishQuery || '').trim().toLowerCase();
  const channel = state.dishChannel || '';
  const dishes = data.foodCosting.dishes.filter(dish => (!channel || dish.channel === channel)
    && (!query || `${dish.name} ${dish.category}`.toLowerCase().includes(query)));
  if (!dishes.length) return '<div class="empty-state compact"><p>No dishes match this search.</p></div>';
  const page = Math.min(state.dishPage || 0, Math.ceil(dishes.length / 20) - 1);
  const start = page * 20;
  return `<div class="table-wrap"><table class="data-table food-table"><thead><tr><th>Dish</th><th>Selling price</th><th>Ingredient cost</th><th>Gross profit</th><th>Margin</th><th></th></tr></thead><tbody>
    ${dishes.slice(start, start + 20).map(dish => `<tr><td><strong>${escapeHtml(dish.name)}</strong><small>${escapeHtml(dish.category)} · ${escapeHtml(dish.channel)}</small></td>
      <td>${foodAmount(dish.pricePaise)}</td>
      <td>${dish.costPaise == null ? (dish.recipe.length ? `${dish.missing} cost${dish.missing === 1 ? '' : 's'} needed` : 'Recipe needed') : foodAmount(dish.costPaise)}</td>
      <td>${foodAmount(dish.grossPaise)}</td><td>${dish.margin == null ? '—' : `${dish.margin.toFixed(1)}%`}</td>
      <td><button class="btn btn-small" data-food-action="recipe" data-id="${escapeHtml(dish.id)}">${dish.recipe.length ? 'Edit recipe' : 'Add recipe'}</button></td></tr>`).join('')}
    </tbody></table></div>
    <div class="food-pagination"><span>${start+1}–${Math.min(start+20, dishes.length)} of ${dishes.length} dishes</span>
      <button class="btn btn-small" data-food-action="page" data-id="${page-1}" ${page <= 0 ? 'disabled' : ''}>Previous</button>
      <button class="btn btn-small" data-food-action="page" data-id="${page+1}" ${start+20 >= dishes.length ? 'disabled' : ''}>Next</button></div>`;
}

function renderDishMargins() {
  return `<article class="panel"><div class="panel-header"><div class="panel-title"><h2>Dish margins</h2>
    <p>Per-serving estimates using selling price and ingredient costs. Excludes labour and overhead.</p></div></div>
    <div class="panel-body food-margin-filters">
      <label class="field">Search dishes<input id="food-dish-search" type="search" value="${escapeHtml(state.dishQuery || '')}" placeholder="Dish or category"></label>
      <label class="field">Menu<select id="food-dish-channel">${[['','All dishes'],['Website / QR','Website / QR'],['POS','POS']].map(([value,label]) =>
        `<option value="${value}" ${(state.dishChannel || '') === value ? 'selected' : ''}>${label}</option>`).join('')}</select></label>
    </div><div id="food-margin-rows">${renderMarginRows()}</div></article>`;
}

function foodModal(title, subtitle, action, fields, attributes = '') {
  openModal(title, subtitle, `<form id="food-costing-form" data-operation="${action}" ${attributes}>${fields}
    <p class="form-error" data-food-error role="alert" hidden></p></form>`,
    '<button class="btn" data-action="close-modal">Cancel</button><button class="btn btn-primary" type="submit" form="food-costing-form">Save</button>');
}

function openFoodIngredient(id) {
  const item = data.foodCosting.inventory.find(row => row.id === id);
  const costValue = item?.unitCostPaise == null ? '' : item.unitCostPaise / 100;
  foodModal(item ? 'Set ingredient cost' : 'Add ingredient', item ? escapeHtml(item.name) : '', 'ingredient', `<div class="form-grid">
    ${item ? '' : '<label class="field">Ingredient name<input name="name" required maxlength="100"></label><label class="field">Stock unit<input name="unit" required maxlength="16" placeholder="kg, L or pcs"></label><label class="field">Opening stock<input name="quantity" type="number" min="0" max="999999.999999" step="0.000001" value="0" required></label><label class="field">Reorder level<input name="reorderLevel" type="number" min="0" max="999999.999999" step="0.000001" value="0" required></label>'}
    <label class="field full">Cost (₹) per ${item ? escapeHtml(item.unit) : 'stock unit'}<input name="unitCost" type="number" step="0.01" min="0" max="999999.99" value="${costValue}" placeholder="Leave blank if unknown"></label>
    </div>`, item ? `data-id="${item.id}"` : '');
}

function wasteStockLabel(form) {
  const entry = data.inventory.find(item => item.id === Number(form.elements.ingredientId.value));
  form.querySelector('[data-waste-unit]').textContent = entry ? `(${entry.unit})` : '';
  form.querySelector('[data-waste-stock]').textContent = entry ? `${foodQty.format(entry.quantity)} ${entry.unit} currently in stock` : '';
  const already = form.elements.alreadyDeducted;
  already.disabled = form.elements.kind.value !== 'Preparation waste';
  already.closest('label').hidden = already.disabled;
  if (already.disabled) already.checked = false;
}

function openFoodWaste() {
  foodModal('Record waste', '', 'waste', `<div class="form-grid">
    <label class="field">Type<select name="kind"><option>Spoilage</option><option>Preparation waste</option></select></label>
    <label class="field">Ingredient<select name="ingredientId" required><option value="" selected disabled>Select ingredient</option>${data.foodCosting.inventory.map(item =>
      `<option value="${item.id}">${escapeHtml(item.name)} · ${escapeHtml(item.unit)}</option>`).join('')}</select></label>
    <label class="field">Quantity <span data-waste-unit></span><input name="quantity" type="number" step="0.000001" min="0.000001" max="999999.999999" required><small data-waste-stock></small></label>
    <label class="field full">Reason<textarea name="reason" minlength="3" maxlength="160" required placeholder="What was discarded?"></textarea></label>
    </div><label class="check-row" hidden><input name="alreadyDeducted" type="checkbox"> Already deducted from stock for preparation</label>`,
    `data-key="${crypto.randomUUID()}"`);
  wasteStockLabel(document.getElementById('food-costing-form'));
}

function recipeRow(line = {}) {
  const options = data.foodCosting.inventory.map(item => `<option value="${item.id}" ${item.id === line.inventoryItemId ? 'selected' : ''}>
    ${escapeHtml(item.name)} (${escapeHtml(item.unit)})${item.unitCostPaise === null ? ' · cost needed' : ''}</option>`).join('');
  return `<div class="food-recipe-row" data-recipe-row><label class="field">Ingredient<select name="recipeIngredient" required>
    <option value="" disabled ${line.inventoryItemId ? '' : 'selected'}>Select ingredient</option>${options}</select></label>
    <label class="field">Qty per serving<input name="recipeQuantity" type="number" step="0.000001" min="0.000001" max="999999.999999" required value="${line.quantity ?? ''}"></label>
    <button type="button" class="btn btn-small" data-food-action="remove-line">Remove</button></div>`;
}

function openFoodRecipe(id) {
  const dish = data.foodCosting.dishes.find(item => item.id === id);
  if (!dish) return;
  foodModal('Edit recipe', `${escapeHtml(dish.name)} · ${foodAmount(dish.pricePaise)}`, 'recipe',
    `<p class="floor-note">${dish.channel === 'POS' ? 'Quantities per serving also control POS stock deduction.' : 'Enter quantities for one serving in each ingredient’s stock unit.'}</p>
    <div id="food-recipe-lines">${dish.recipe.length ? dish.recipe.map(recipeRow).join('') : recipeRow()}</div>
    <button type="button" class="btn btn-small" data-food-action="add-line">Add ingredient line</button>`,
    `data-id="${escapeHtml(dish.id)}" data-revision="${dish.revision}"`);
}

function updateMarginRows() {
  const results = document.getElementById('food-margin-rows');
  if (results) results.innerHTML = renderMarginRows();
}

document.addEventListener('input', event => {
  if (event.target.id !== 'food-dish-search') return;
  state.dishQuery = event.target.value;
  state.dishPage = 0;
  updateMarginRows();
});

document.addEventListener('change', event => {
  if (event.target.id === 'food-dish-channel') {
    state.dishChannel = event.target.value;
    state.dishPage = 0;
    updateMarginRows();
  }
  const form = event.target.form;
  if (form?.dataset.operation === 'waste' && ['ingredientId','kind'].includes(event.target.name)) wasteStockLabel(form);
});

document.addEventListener('click', event => {
  const button = event.target.closest('[data-food-action]');
  if (!button) return;
  const { foodAction:action, id } = button.dataset;
  if (action === 'view') { state.foodView = id; refreshPage(); }
  else if (action === 'page') { state.dishPage = Number(id); updateMarginRows(); }
  else if (action === 'ingredient') openFoodIngredient(Number(id));
  else if (action === 'waste') openFoodWaste();
  else if (action === 'recipe') openFoodRecipe(id);
  else if (action === 'add-line') document.getElementById('food-recipe-lines').insertAdjacentHTML('beforeend', recipeRow());
  else if (action === 'remove-line') button.closest('[data-recipe-row]').remove();
});

document.addEventListener('submit', async event => {
  const form = event.target;
  if (form.id !== 'food-costing-form') return;
  event.preventDefault();
  const button = document.querySelector('[form="food-costing-form"]');
  button.disabled = true;
  const { operation, id, revision, key } = form.dataset;
  const fields = Object.fromEntries(new FormData(form));
  let body;
  if (operation === 'recipe') body = { dishId:id, revision, ingredients:[...form.querySelectorAll('[data-recipe-row]')].map(row => ({
    inventoryItemId:Number(row.querySelector('[name=recipeIngredient]').value), quantity:row.querySelector('[name=recipeQuantity]').value,
  })) };
  else if (operation === 'waste') body = { ...fields, ingredientId:Number(fields.ingredientId), alreadyDeducted:fields.alreadyDeducted === 'on', requestKey:key };
  else body = id ? { id:Number(id), unitCost:fields.unitCost } : fields;
  try {
    await api(`/api/food-costing/${operation}`, { method:'POST', body:JSON.stringify(body) });
    closeModal();
    if (operation === 'waste') state.foodView = 'waste';
    await syncAndRender();
    showToast({ waste:'Waste recorded.', ingredient:'Ingredient saved.', recipe:'Recipe saved.' }[operation]);
  } catch (error) {
    const notice = form.querySelector('[data-food-error]');
    notice.textContent = error.message;
    notice.hidden = false;
    button.disabled = false;
  }
});
