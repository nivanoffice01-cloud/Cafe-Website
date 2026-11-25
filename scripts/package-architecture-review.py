"""Build labelled comparison sheets from untouched browser screenshots."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import json
import statistics

root = Path('artifacts/mangosteen-architectural-3d-review/refinement')
font = ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc', 24)

def panel(path, width=960, height=540, label=''):
    original = Image.open(path).convert('RGB')
    original.thumbnail((width, height))
    result = Image.new('RGB', (width, height + 48), '#101810')
    result.paste(original, ((width-original.width)//2, 48+(height-original.height)//2))
    ImageDraw.Draw(result).text((18, 12), label, font=font, fill='#e7d1a7')
    return result

def row(left, right, name):
    image = Image.new('RGB', (left.width+right.width, max(left.height,right.height)), '#101810')
    image.paste(left,(0,0));image.paste(right,(left.width,0));image.save(root/name, quality=92)

row(panel(root/'concept-board.png',label='Approved concept board'),panel(root/'after/desktop-0.png',label='Actual browser render — current refinement'),'concept-versus-render.jpg')
for progress in [0,25,50,75,100]:
    row(panel(root/f'before/desktop-{progress}.png',label=f'Before — aaa1d6d — {progress}%'),panel(root/f'after/desktop-matched-{progress}.png',label=f'After — same camera position and target — {progress}%'),f'comparison-{progress}.jpg')

labels=['Exterior façade','Entrance approach','Entrance midpoint','Dining approach','Dining arrival','Furniture and lighting']
files=['desktop-0.png','desktop-25.png','desktop-50.png','desktop-75.png','desktop-100.png','desktop-furniture-detail.png']
sheet=Image.new('RGB',(1920,588*3),'#101810')
for i,(name,label) in enumerate(zip(files,labels)):
    sheet.paste(panel(root/'after'/name,label=label),((i%2)*960,(i//2)*588))
sheet.save(root/'refined-contact-sheet.jpg',quality=93)

rows=[]
for device in ['desktop','mobile']:
    result=json.loads((root/f'after/{device}-performance.json').read_text())
    times=sorted(result['frameIntervalsMs'])
    rows.append(f"| {device} | {result['initialBytes']:,} | {result['fullBytes']:,} | {statistics.median(times):.2f} ms | {times[int(len(times)*.95)]:.2f} ms | {result['stats']['drawCalls']} | {result['stats']['triangles']:,} |")
(root/'performance-summary.md').write_text('''# Measured local playback

25 November 2026. Headed Chrome, ANGLE Metal, Apple M4. Desktop 1920×1080; mobile-sized viewport 390×844. Device scale factor 1. These are not physical-phone benchmarks. rAF intervals measure browser cadence; render CPU samples are not GPU completion timings. Recording was active during measurement.

| Viewport | Initial bytes | Full bytes | Median frame interval | P95 frame interval | Draw calls | Triangles |
|---|---:|---:|---:|---:|---:|---:|
'''+'\n'.join(rows)+'''

Both captures passed 0/25/50/75/100% camera checkpoint assertions and reached over 99% during continuous forward/reverse playback. No console, page or asset errors were recorded. Initial/full transfer includes JavaScript, CSS, fonts and locally served PBR/model assets. It excludes the exported GLB, which is never a runtime scene download. Local response sizes are not a guarantee of production compressed transfer sizes or Core Web Vitals.

Earlier screenshots from a Chrome run that failed to advance through the path were replaced. Only the current progress-asserted measurements are reported here.
''')

comparisons=''.join(f'<figure><img loading="lazy" src="comparison-{p}.jpg" alt="Before and after at matching camera viewpoint {p} percent"><figcaption>Matching camera viewpoint — {p}% of the original path.</figcaption></figure>' for p in [0,25,50,75,100])
(root/'index.html').write_text('''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Mangosteen entrance refinement review</title><style>body{margin:0;background:#101810;color:#eee4d3;font:16px/1.6 system-ui}main{max-width:1500px;margin:auto;padding:32px}h1,h2{font-family:Georgia,serif;font-weight:400}a{color:#e1bf80}img,video{display:block;width:100%;height:auto}figure{margin:30px 0}figcaption{padding:12px 0;color:#c8c4b7}.videos{display:grid;grid-template-columns:2fr 1fr;gap:24px}.videos video{max-height:750px}.note{max-width:900px}@media(max-width:700px){main{padding:18px}.videos{grid-template-columns:1fr}}</style><main><h1>Mangosteen · Entrance refinement</h1><p class="note">25 November 2026 · baseline aaa1d6d preserved · /experience only · no deployment.</p><p class="note"><strong>Visual approval outstanding.</strong> This is genuine 3D geometry and continuous camera movement. It remains below the concept board's photorealistic standard, particularly in architectural detail, furniture, trailing foliage and indirect lighting. The vestibule and dimensions are inferred.</p><p><a href="../../../docs/architectural-refinement-review.md">Full audit and limitations</a> · <a href="performance-summary.md">Measured performance</a> · <a href="http://localhost:5173/experience">Open local experience</a></p><figure><img src="concept-versus-render.jpg" alt="Approved concept board beside actual browser render"></figure><h2>Refined viewpoints</h2><img src="refined-contact-sheet.jpg" alt="Exterior, entrance and dining contact sheet"><h2>Before and after · matching cameras</h2>'''+comparisons+'''<h2>Desktop and mobile recordings</h2><p>Includes checkpoint captures, a continuous forward/reverse journey, matched viewpoints and wireframe review.</p><div class="videos"><video controls preload="metadata" src="after/desktop-entrance.mp4"></video><video controls preload="metadata" src="after/mobile-entrance.mp4"></video></div><h2>Mobile and geometry evidence</h2><div class="videos"><img loading="lazy" src="after/desktop-wireframe.png" alt="Desktop wireframe showing actual scene geometry"><img loading="lazy" src="after/mobile-0.png" alt="Mobile entrance"></div><p>No photos are expanded or crossfaded to simulate the walkthrough. Scanned botanical/wood/stone assets are CC0; the original café photographs remain unchanged.</p></main></html>''')
