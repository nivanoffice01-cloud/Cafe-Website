"""Read-only asset inventory plus labelled contact sheets; originals stay untouched."""
from pathlib import Path
from PIL import Image, ImageOps, ImageDraw, ImageFont
import csv
import hashlib
import html
import json
import math
import textwrap

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'artifacts/mangosteen-clean-rebuild'
OUT.mkdir(parents=True, exist_ok=True)
EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp', '.avif', '.svg', '.mp4', '.mov', '.glb', '.gltf', '.blend'}

def classification(path):
    s = path.as_posix()
    if '/images/highres/' in s or '/images/gallery/' in s:
        return '01-cafe-photographs', 'Existing Mangosteen cafe/food source photograph. Repository README attributes cafe photos to the Mangosteen Zomato gallery; highres files have large dimensions but limited original detail. Not independently authenticated.'
    if '/images/menu/' in s:
        return '03-stock-food', 'Illustrative Pexels food photograph; NOT an actual Mangosteen serving. See public/images/menu/README.md.'
    if '/images/menu-ai/' in s:
        return '04-generated-menu', 'AI-generated category illustration; NOT a genuine cafe or dish photograph.'
    if '/images/mobile/' in s or '/images/retained/' in s:
        return '02-cafe-derivatives', 'Existing responsive/cropped derivative. Source retained separately; not a distinct original.'
    if '/images/experience/' in s:
        if 'enhanced' in path.name:
            return '02-cafe-derivatives', 'AI-assisted restoration of supplied cafe imagery (per legacy README); may reinterpret fine architectural details. Protected shared hero retained unchanged, not a camera original.'
        return '02-cafe-derivatives', 'Existing photographic derivative/enhancement. Processing provenance not fully verified. Shared menu/reservation hero retained unchanged.'
    if path.name == 'mango-dish.jpg':
        return '05-unverified', 'Existing food photograph; source/venue provenance unverified. Retained, not labelled genuine.'
    if 'brand' in s or path.suffix == '.svg':
        return '06-brand', 'Existing brand asset.'
    if '/menu-ui/' in s or 'login-poster' in s:
        return '07-interface', 'Existing decorative/interface asset, not evidence of genuine cafe architecture.'
    if path.suffix in {'.mp4', '.mov'}:
        return '08-video', 'Supplied 30-second portrait cafe film per legacy README; retained unchanged. Acquisition rights not independently authenticated.'
    return '09-source', 'Preserved experimental source/model asset; outside active marketing build.'

assets = []
for folder in ['public', 'CRM/dist/assets', 'assets']:
    for p in sorted((ROOT / folder).rglob('*')):
        if p.is_file() and p.suffix.lower() in EXTENSIONS:
            group, status = classification(p.relative_to(ROOT))
            dimensions = ''
            if p.suffix.lower() in {'.jpg', '.jpeg', '.png', '.webp', '.avif'}:
                with Image.open(p) as im: dimensions = f'{im.width} x {im.height}'
            assets.append({'path': str(p.relative_to(ROOT)), 'group': group, 'dimensions': dimensions,
                           'bytes': p.stat().st_size, 'sha256': hashlib.sha256(p.read_bytes()).hexdigest(), 'provenance': status})
(OUT / 'asset-inventory.json').write_text(json.dumps(assets, indent=2))
with (OUT / 'asset-inventory.csv').open('w') as f:
    writer = csv.DictWriter(f, fieldnames=list(assets[0])); writer.writeheader(); writer.writerows(assets)

font_path = '/System/Library/Fonts/Supplemental/Arial.ttf'
font = ImageFont.truetype(font_path, 18)
small = ImageFont.truetype(font_path, 15)
title_font = ImageFont.truetype(font_path, 30)
groups = [
    ('01-cafe-photographs', 'Mangosteen cafe and food photographs - existing source library'),
    ('02-cafe-derivatives', 'Cafe crops and enhancements - derivatives, not additional originals'),
    ('03-stock-food', 'Licensed illustrative food photos - NOT Mangosteen servings'),
    ('04-generated-menu', 'AI menu illustrations - NOT genuine photographs'),
    ('05-unverified', 'Food photography with unverified provenance - retained for review'),
]
sections = []
for group, title in groups:
    items = [a for a in assets if a['group'] == group and a['dimensions']]
    if not items: continue
    width, cell_w, cell_h = 1600, 400, 340
    board = Image.new('RGB', (width, 94 + math.ceil(len(items) / 4) * cell_h), '#f2ebdf')
    draw = ImageDraw.Draw(board)
    draw.text((24, 20), title, fill='#172014', font=title_font)
    draw.text((24, 60), 'All original files preserved. Full paths and SHA-256 checksums are in asset-inventory.csv.', fill='#514e46', font=small)
    for i, a in enumerate(items):
        x, y = (i % 4) * cell_w + 16, (i // 4) * cell_h + 94
        with Image.open(ROOT / a['path']) as im:
            thumb = ImageOps.contain(ImageOps.exif_transpose(im).convert('RGB'), (368, 240))
            board.paste(thumb, (x + (368 - thumb.width) // 2, y + (240 - thumb.height) // 2))
        lines = textwrap.wrap(a['path'].removeprefix('public/'), width=39)
        for row, line in enumerate(lines): draw.text((x, y + 246 + row * 20), line, fill='#172014', font=font)
        draw.text((x, y + 306), a['dimensions'], fill='#605a4e', font=small)
    board.save(OUT / f'contact-sheet-{group}.jpg', quality=92)
    sections.append(board)
combined = Image.new('RGB', (1600, sum(b.height for b in sections)), '#f2ebdf')
offset = 0
for board in sections: combined.paste(board, (0, offset)); offset += board.height
combined.save(OUT / 'all-cafe-and-food-contact-sheet.jpg', quality=92)

rows = ''.join(f'<tr><td><a href="../../{html.escape(a["path"])}">{html.escape(a["path"])}</a></td><td>{a["dimensions"]}</td><td>{a["bytes"]:,}</td><td>{html.escape(a["provenance"])}</td></tr>' for a in assets)
images = ''.join(f'<figure><h2>{html.escape(title)}</h2><a href="contact-sheet-{group}.jpg"><img src="contact-sheet-{group}.jpg" alt="{html.escape(title)}"></a></figure>' for group, title in groups)
(OUT / 'asset-inventory.html').write_text(f'''<!doctype html><meta charset="utf-8"><title>Mangosteen retained asset review</title>
<style>body{{margin:32px;background:#f2ebdf;color:#172014;font:16px/1.5 Arial}}img{{width:100%;height:auto}}figure{{margin:40px 0}}table{{border-collapse:collapse;width:100%}}td,th{{padding:10px;text-align:left;border-bottom:1px solid #ccc;overflow-wrap:anywhere}}a{{color:#304b36}}</style>
<h1>Mangosteen retained visual assets</h1><p>{len(assets)} retained visual/source assets. Genuine-source cafe photos, derivatives, stock food photography and AI illustrations are separated below. No stock or generated food is presented as a genuine Mangosteen serving.</p>
<p><a href="asset-inventory.csv">CSV inventory</a> · <a href="asset-inventory.json">Checksums and provenance</a> · <a href="all-cafe-and-food-contact-sheet.jpg">Combined contact sheet</a></p>{images}
<h2>Complete retained asset inventory</h2><table><tr><th>Path</th><th>Dimensions</th><th>Bytes</th><th>Provenance / use</th></tr>{rows}</table>''')
print(f'Inventoried {len(assets)} assets; created {len(sections)} labelled sheets and combined sheet ({combined.width}x{combined.height}).')
