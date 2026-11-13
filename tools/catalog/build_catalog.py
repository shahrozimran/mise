"""Build the offline catalog from USDA SR Legacy CSV data, without an API key.

Download the SR Legacy CSV zip from https://fdc.nal.usda.gov/download-datasets/
and extract it, then run:
python tools/catalog/build_catalog.py path/to/extracted/directory
"""
import csv
import hashlib
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
DATA = pathlib.Path(sys.argv[1])

def read(name):
    with open(DATA / name, encoding="utf-8-sig", newline="") as stream:
        yield from csv.DictReader(stream)

categories = {row['id']: row['description'] for row in read('food_category.csv')}
foods = {}
for row in read('food.csv'):
    name = row['description']
    foods[row['fdc_id']] = dict(
        id='fdc-' + row['fdc_id'], name=name, aliases=[],
        category=categories.get(row['food_category_id'], 'Other'),
        state='raw' if re.search(r'\braw\b', name, re.I) else 'cooked' if re.search(r'cooked|boiled|roasted|fried', name, re.I) else 'prepared',
        nutrients=dict(kcal=None, protein=None, carbs=None, fat=None, fiber=None),
        measures=[], source='USDA SR Legacy', sourceId=row['fdc_id'], sourceVersion='2018-04',
    )

nutrients = {'1008': 'kcal', '1003': 'protein', '1005': 'carbs', '1004': 'fat', '1079': 'fiber'}
for row in read('food_nutrient.csv'):
    if row['fdc_id'] in foods and row['nutrient_id'] in nutrients and row['amount']:
        foods[row['fdc_id']]['nutrients'][nutrients[row['nutrient_id']]] = float(row['amount'])

for row in read('food_portion.csv'):
    food = foods.get(row['fdc_id'])
    if food is None or not row['amount'] or not row['gram_weight']:
        continue
    amount, grams = float(row['amount']), float(row['gram_weight'])
    if min(amount, grams) <= 0:
        continue
    label = row['modifier'] or row['portion_description'] or 'portion'
    unit = 'piece'
    for pattern, candidate in [(r'\bcup\b', 'cup'), (r'\btbsp\b|tablespoon', 'tbsp'), (r'\btsp\b|teaspoon', 'tsp'), (r'\bclove\b', 'clove'), (r'\bmedium\b', 'medium'), (r'\blarge\b', 'large'), (r'\bsmall\b', 'small')]:
        if re.search(pattern, label, re.I):
            unit = candidate
            break
    measure = dict(id='sr-' + row['id'], label=label, unit=unit, amount=amount, grams=grams)
    if unit in ['cup', 'tbsp', 'tsp']:
        measure['convention'] = 'us'
    food['measures'].append(measure)

# These aliases are attached to exact USDA descriptions, never to approximate matches.
featured = [
    ('Chicken, broiler or fryers, breast, skinless, boneless, meat only, raw', 'Chicken breast, raw', ['chicken', 'chicken breast']),
    ('Rice, white, long-grain, regular, raw, enriched', 'White rice, dry', ['rice', 'white rice', 'dry rice']),
    ('Onions, raw', 'Onion, raw', ['onion', 'onions']),
    ('Oil, olive, salad or cooking', 'Olive oil', ['olive oil', 'oil']),
    ('Tomatoes, red, ripe, raw, year round average', 'Tomato, raw', ['tomato', 'tomatoes']),
    ('Egg, whole, raw, fresh', 'Egg, whole, raw', ['egg', 'eggs']),
    ('Garlic, raw', 'Garlic, raw', ['garlic']),
    ('Ginger root, raw', 'Ginger, raw', ['ginger']),
    ('Yogurt, plain, whole milk', 'Plain yogurt', ['yogurt', 'yoghurt', 'dahi']),
    ('Lentils, raw', 'Lentils, dry', ['lentils', 'dal', 'daal']),
    ('Chickpeas (garbanzo beans, bengal gram), mature seeds, raw', 'Chickpeas, dry', ['chickpeas', 'chana']),
    ('Wheat flour, whole-grain (Includes foods for USDA\'s Food Distribution Program)', 'Whole-wheat flour', ['whole wheat flour', 'atta']),
    ('Spinach, raw', 'Spinach, raw', ['spinach', 'palak']),
    ('Broccoli, raw', 'Broccoli, raw', ['broccoli']),
    ('Carrots, raw', 'Carrot, raw', ['carrot', 'carrots']),
    ('Potatoes, flesh and skin, raw', 'Potato, raw', ['potato', 'potatoes']),
    ('Bananas, raw', 'Banana, raw', ['banana', 'bananas']),
    ('Apples, raw, with skin (Includes foods for USDA\'s Food Distribution Program)', 'Apple, with skin', ['apple', 'apples']),
    ('Oats (Includes foods for USDA\'s Food Distribution Program)', 'Oats, dry', ['oats', 'oatmeal']),
    ('Butter, salted', 'Butter, salted', ['butter']),
    ('Spices, turmeric, ground', 'Turmeric, ground', ['turmeric', 'haldi']),
    ('Spices, cumin seed', 'Cumin seed', ['cumin', 'jeera']),
    ('Salt, table', 'Table salt', ['salt']),
    ('Sugars, granulated', 'White sugar', ['sugar']),
    ('Beverages, water, tap, drinking', 'Water', ['water']),
]
ordered = []
for description, short, aliases in featured:
    matches = [f for f in foods.values() if f['name'] == description]
    if not matches:
        raise ValueError('Missing exact featured food: ' + description)
    food = matches[0]
    food['aliases'] = aliases + [food['name']]
    food['name'] = short
    ordered.append(food)
ids = {f['id'] for f in ordered}
ordered.extend(f for f in foods.values() if f['id'] not in ids)
output = ROOT / 'apps/mobile/src/data/catalog.json'
output.parent.mkdir(parents=True, exist_ok=True)
payload = json.dumps(ordered, separators=(',', ':'), ensure_ascii=False)
output.write_text(payload, encoding='utf-8')
manifest = dict(version='usda-sr-2018-04-v1', count=len(ordered), source='USDA FoodData Central SR Legacy 2018-04', license='CC0-1.0', url='https://fdc.nal.usda.gov/download-datasets/', sha256=hashlib.sha256(payload.encode()).hexdigest())
(output.parent / 'catalog-manifest.json').write_text(json.dumps(manifest, indent=2), encoding='utf-8')
print(f'Built {len(ordered)} foods, {len(payload.encode()):,} bytes. SHA256 {manifest["sha256"]}')
