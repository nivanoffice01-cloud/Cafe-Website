"""Derive camera guides from the existing artwork without editing source images."""
import json
from pathlib import Path
from PIL import Image, ImageChops, ImageFilter
root = Path(__file__).resolve().parent.parent
assets = root / 'public/supplied-frontend/assets'
prefix = 'cbdc90f7-305e-43cc-aa98-fda0e5bfcc52'
metadata = json.loads((assets / f'{prefix}_meta.json').read_text())
threshold = lambda cutoff: [255 if value > cutoff else 0 for value in range(256)]
output = {}
for name, clip in metadata['clips'].items():
    frames, sheet, sheet_index = [], None, -1
    for index in range(clip['count']):
        current_sheet = index // clip['perSheet']
        if current_sheet != sheet_index:
            if sheet is not None:
                sheet.close()
            sheet = Image.open(assets / f'{prefix}_sheet-{name}{current_sheet}.webp').convert('RGB')
            sheet_index = current_sheet
        local = index % clip['perSheet']
        x, y = local % clip['cols'] * clip['frameW'], local // clip['cols'] * clip['frameH']
        frame = sheet.crop((x, y, x + clip['frameW'], y + clip['frameH']))
        frame.thumbnail((135, 240))
        red, green, blue = frame.split()
        mask = ImageChops.multiply(ImageChops.subtract(red, green).point(threshold(12)), ImageChops.subtract(red, blue).point(threshold(25)))
        mask = ImageChops.multiply(mask, red.point(threshold(65))).filter(ImageFilter.MinFilter(3))
        box = mask.getbbox()
        crop = clip['crop']
        frames.append([
            round(crop[0] + box[0] / frame.width * crop[2]),
            round(crop[1] + box[1] / frame.height * crop[3]),
            round(crop[0] + box[2] / frame.width * crop[2]),
            round(crop[1] + box[3] / frame.height * crop[3]),
        ] if box else clip['bounds'][index])
    sheet.close()
    output[name] = frames
(root / 'src/features/supplied-frontend/mobile-food-bounds.ts').write_text('// Food-centred camera guides. Regenerate with scripts/derive-mobile-food-framing.py.\nexport const mobileFoodBounds = ' + json.dumps(output, separators=(',', ':')) + ' as const\n')
print(f'Wrote {sum(map(len, output.values()))} camera guides.')
