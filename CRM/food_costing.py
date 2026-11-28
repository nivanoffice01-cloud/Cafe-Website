"""Waste logging and per-serving food costs for the local CRM."""
import hashlib
import json
import re
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path

from corrections import paise
from floor import stamp

ROLES = ('Owner', 'Manager')
CATALOG = {
    f"qr:{category['name']}|{item['name']}": dict(item, category=category['name'])
    for category in json.loads(Path(__file__).with_name('menu-catalogue.json').read_text(encoding='utf-8'))
    for item in category['items']
}


def decimal(value, places, label, allow_zero=False):
    text = str(value if value is not None else '').strip()
    if not re.fullmatch(rf'(?:[0-9]{{1,6}}(?:\.[0-9]{{1,{places}}})?|\.[0-9]{{1,{places}}})', text) or (not allow_zero and Decimal(text) == 0):
        raise ValueError(f'Enter a valid {label} with up to {places} decimal places.')
    return float(text)


def extended_cost(ingredients):
    total = sum((Decimal(str(line['quantity'])).quantize(Decimal('0.000001'), rounding=ROUND_HALF_UP)
                 * line['unitCostPaise'] for line in ingredients), Decimal(0))
    return int(total.quantize(Decimal('1'), rounding=ROUND_HALF_UP))


def revision(recipe):
    pairs = sorted((line['inventoryItemId'], line['quantity']) for line in recipe)
    return hashlib.sha256(json.dumps(pairs, separators=(',', ':')).encode()).hexdigest()


def pos_recipes(connection):
    recipes = {}
    for row in connection.execute('SELECT menu_item_id,inventory_item_id,quantity FROM recipes'):
        recipes.setdefault(row['menu_item_id'], []).append(dict(inventoryItemId=row['inventory_item_id'], quantity=row['quantity']))
    return recipes


def payload(connection):
    inventory = [dict(row) for row in connection.execute('''SELECT i.id,i.name,i.unit,c.unit_cost AS unitCostPaise
        FROM inventory_items i LEFT JOIN ingredient_costs c ON i.id=c.ingredient_id ORDER BY i.name''')]
    costs = {item['id']: item['unitCostPaise'] for item in inventory}
    pos = pos_recipes(connection)
    qr = {row['dish_id']: json.loads(row['recipe']) for row in connection.execute('SELECT dish_id,recipe FROM public_dish_recipes')}
    dishes = []
    items = [(key, item, 'Website / QR', qr.get(key, [])) for key, item in CATALOG.items()]
    items.extend((f"pos:{row['id']}", row, 'POS', pos.get(row['id'], []))
                 for row in connection.execute('SELECT id,name,category,price FROM menu_items ORDER BY category,name'))
    for key, item, channel, recipe in items:
        lines = [dict(line, unitCostPaise=costs.get(line['inventoryItemId'])) for line in recipe]
        missing = sum(line['unitCostPaise'] is None for line in lines)
        cost = extended_cost(lines) if lines and not missing else None
        price = paise(item['price'])
        gross = price - cost if cost is not None else None
        dishes.append(dict(id=key, name=item['name'], category=item['category'], channel=channel,
                           pricePaise=price, recipe=lines, revision=revision(recipe), missing=missing,
                           costPaise=cost, grossPaise=gross, margin=gross / price * 100 if gross is not None and price else None))
    waste = [json.loads(row['payload']) for row in connection.execute('SELECT payload FROM food_waste ORDER BY rowid DESC LIMIT 100')]
    return dict(inventory=inventory, dishes=dishes, waste=waste)


def save_ingredient(connection, body):
    cost = body.get('unitCost')
    unit_cost = None if cost is None or str(cost).strip() == '' else paise(decimal(cost, 2, 'unit cost', True))
    ingredient_id = body.get('id')
    if ingredient_id is None:
        name, unit = body.get('name'), body.get('unit')
        if not isinstance(name, str) or not 1 <= len(name.strip()) <= 100 or not isinstance(unit, str) or not 1 <= len(unit.strip()) <= 16:
            raise ValueError('Enter an ingredient name and stock unit.')
        if connection.execute('SELECT 1 FROM inventory_items WHERE lower(name)=lower(?)', (name.strip(),)).fetchone():
            raise ValueError('An ingredient with this name already exists.')
        quantity = decimal(body.get('quantity', '0'), 6, 'stock quantity', True)
        reorder = decimal(body.get('reorderLevel', '0'), 6, 'reorder level', True)
        ingredient_id = connection.execute('INSERT INTO inventory_items(name,unit,quantity,reorder_level,created_at) VALUES(?,?,?,?,?)',
                                           (name.strip(), unit.strip(), quantity, reorder, stamp())).lastrowid
    elif type(ingredient_id) is not int or not connection.execute('SELECT 1 FROM inventory_items WHERE id=?', (ingredient_id,)).fetchone():
        raise ValueError('Ingredient not found.')
    if unit_cost is None:
        connection.execute('DELETE FROM ingredient_costs WHERE ingredient_id=?', (ingredient_id,))
    else:
        connection.execute('''INSERT INTO ingredient_costs(ingredient_id,unit_cost) VALUES(?,?)
            ON CONFLICT(ingredient_id) DO UPDATE SET unit_cost=excluded.unit_cost''', (ingredient_id, unit_cost))
    return dict(id=ingredient_id)


def save_recipe(connection, body):
    key = body.get('dishId')
    pos_id = None
    if not isinstance(key, str):
        raise ValueError('Dish not found.')
    if re.fullmatch(r'pos:[0-9]{1,15}', key) and connection.execute('SELECT 1 FROM menu_items WHERE id=?', (int(key[4:]),)).fetchone():
        pos_id = int(key[4:])
        current = pos_recipes(connection).get(pos_id, [])
    elif key in CATALOG:
        row = connection.execute('SELECT recipe FROM public_dish_recipes WHERE dish_id=?', (key,)).fetchone()
        current = json.loads(row['recipe']) if row else []
    else:
        raise ValueError('Dish not found.')
    if body.get('revision') != revision(current):
        raise ValueError('This recipe changed. Refresh and review it before saving.')
    ingredients = body.get('ingredients')
    if not isinstance(ingredients, list) or len(ingredients) > 60:
        raise ValueError('A recipe supports up to 60 ingredients.')
    valid_ids = {row['id'] for row in connection.execute('SELECT id FROM inventory_items')}
    recipe = []
    for line in ingredients:
        ingredient_id = line.get('inventoryItemId') if isinstance(line, dict) else None
        if type(ingredient_id) is not int or ingredient_id not in valid_ids:
            raise ValueError('Select a valid ingredient for each line.')
        recipe.append(dict(inventoryItemId=ingredient_id, quantity=decimal(line.get('quantity'), 6, 'quantity per serving')))
    if len({line['inventoryItemId'] for line in recipe}) != len(recipe):
        raise ValueError('Use each ingredient once in the recipe.')
    if pos_id is not None:
        connection.execute('DELETE FROM recipes WHERE menu_item_id=?', (pos_id,))
        connection.executemany('INSERT INTO recipes(menu_item_id,inventory_item_id,quantity) VALUES(?,?,?)',
                               [(pos_id, line['inventoryItemId'], line['quantity']) for line in recipe])
    else:
        connection.execute('''INSERT INTO public_dish_recipes(dish_id,recipe) VALUES(?,?)
            ON CONFLICT(dish_id) DO UPDATE SET recipe=excluded.recipe''', (key, json.dumps(recipe)))
    return dict(saved=True)


def record_waste(connection, body, user):
    key = body.get('requestKey')
    if not isinstance(key, str) or not re.fullmatch(r'[A-Za-z0-9_-]{8,100}', key):
        raise ValueError('Invalid waste request. Reopen the form and try again.')
    previous = connection.execute('SELECT payload FROM food_waste WHERE id=?', (key,)).fetchone()
    if previous:
        if json.loads(previous['payload'])['recordedBy']['id'] != user['id']:
            raise ValueError('This waste request already exists.')
        return dict(id=key)
    ingredient_id = body.get('ingredientId')
    if type(ingredient_id) is not int:
        raise ValueError('Select a valid ingredient.')
    ingredient = connection.execute('''SELECT i.*,c.unit_cost FROM inventory_items i
        LEFT JOIN ingredient_costs c ON i.id=c.ingredient_id WHERE i.id=?''', (ingredient_id,)).fetchone()
    if not ingredient:
        raise ValueError('Select a valid ingredient.')
    kind, reason = body.get('kind'), body.get('reason')
    if kind not in ('Spoilage', 'Preparation waste'):
        raise ValueError('Choose spoilage or preparation waste.')
    if not isinstance(reason, str) or not 3 <= len(reason.strip()) <= 160:
        raise ValueError('Enter a reason of 3–160 characters.')
    quantity = decimal(body.get('quantity'), 6, 'waste quantity')
    deducted = kind == 'Preparation waste' and body.get('alreadyDeducted') is True
    timestamp = stamp()
    if not deducted:
        if ingredient['quantity'] + 1e-9 < quantity:
            raise ValueError(f"Only {ingredient['quantity']:g} {ingredient['unit']} of {ingredient['name']} is in stock.")
        remaining = max(0, round(ingredient['quantity'] - quantity, 9))
        connection.execute('UPDATE inventory_items SET quantity=? WHERE id=?', (remaining, ingredient_id))
        connection.execute('INSERT INTO inventory_movements(inventory_item_id,quantity,reason,created_by,created_at) VALUES(?,?,?,?,?)',
                           (ingredient_id, -quantity, f"{kind}: {reason.strip()}", user['id'], timestamp))
    price = ingredient['unit_cost']
    entry = dict(id=key, ingredientId=ingredient_id, name=ingredient['name'], unit=ingredient['unit'],
                 quantity=quantity, kind=kind, reason=reason.strip(), alreadyDeducted=deducted, unitCostPaise=price,
                 lossPaise=extended_cost([dict(unitCostPaise=price, quantity=quantity)]) if price is not None else None,
                 recordedAt=timestamp, recordedBy=dict(id=user['id'], name=user['name']))
    connection.execute('INSERT INTO food_waste(id,payload) VALUES(?,?)', (key, json.dumps(entry)))
    return dict(id=key)
