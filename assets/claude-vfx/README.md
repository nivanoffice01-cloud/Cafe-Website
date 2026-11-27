# Claude VFX lab: pizza assets

Route `/claude-vfx-lab`. Credits and licences: `public/claude-vfx/credits.txt` (keep it linked; CC BY requires it).

## Rebuild
Put the originals named in credits.txt in one folder as `pizzaA.jpg`, `basilpizza.jpg`, `tomC.jpg` (section F), `tomW3.jpg` (A1), and Dale Cruse "Pizza (48835283632)" as `pizzaB.jpg` (read by the script, not present in the final pixels). Needs Python with numpy and opencv, plus `cwebp`.

    python pipeline/extract_layers.py <source-dir> public/claude-vfx src/features/claude-vfx-lab/layers.json

## Layers in use
| Layer | Origin | Standard |
|---|---|---|
| Baked crust and sauce | Photograph; area under cheese reconstructed from its own sauce | Good |
| 14 mozzarella pieces | Photograph, about 250 px each, baked rather than fresh | Adequate at distance |
| 4 basil leaves, 2 cut and 3 whole tomatoes | Photographs, 500 px or more | Good |
| Raw dough | Procedural, following the photographed crust relief | Weakest layer: replace first |
| Underside, crumb wall, cheese strands, flames, steam | Shader | Acceptable; not photographs |

## Shoot list to reach final-ad quality
All: RGB + straight alpha, 16-bit PNG or TIFF master, sRGB, colour bled 16 px past the matte, no baked drop shadow, soft key from upper left at 45 degrees, polarised fill, matched 5200 K.

Overhead registered set: one pizza, locked tripod, 100 mm lens, identical framing, 4096 x 4096:
1. `dough-raw`: stretched and floured.
2. `dough-sauce-raw`: same dough, sauced.
3. `dough-sauce-cheese-raw`: same dough, torn fior di latte added.
4. `pizza-baked`: the same pizza straight from the oven, uncut.
5. `slice-cut`: wedge separated, with a separate 2048 px side view of the crumb wall.

Isolated pieces, 1536 px on the long edge:
6. Torn fresh mozzarella: 8 shapes, front and back.
7. Genovese basil: 6 leaves, top and underside, plus one sprig.
8. Cherry tomato: 2 whole at 3 angles, 4 halves, cut face and skin side.
9. Cheese pull: 1 macro plate on black, 3000 px wide.
