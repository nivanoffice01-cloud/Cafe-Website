# Pizza food-VFX qualification — not approved

25 November 2026. The working website has not been modified. `/food-vfx-lab` is **not implemented**: the food asset has not passed the user's visual-quality gate.

## Work completed

- Created the isolated `mangosteen-food-vfx-lab` branch from `8fb3f23`. The architectural branch and its commits are preserved.
- Installed official Blender 4.5.9 LTS, Apple Silicon, in `/private/tmp/mangosteen-food-tools/Blender.app`. This temporary installation can be removed by the operating system; it is not a permanent Applications installation.
- Verified Cycles detects and uses `Apple M4 (GPU - 10 cores)` through Metal. Host has 16 GB unified memory.
- Authored a Blender source scene using custom radial food meshes, detailed leaf geometry/veins, volumetric remeshing of mozzarella, procedural colour/roughness/bump shading, subsurface scattering, area lighting and independent ingredient keyframes.
- Rendered two 1600 × 1200 qualification stills at 64 Cycles samples, with denoising. Corrected an initially overexposed lighting setup and anisotropic texture mapping before the second inspection.
- Rejected the resulting asset. No Three.js scene, placeholder route, homepage/menu changes, purchases, external uploads or deployment were performed.

## Visual rejection

The second render is at `artifacts/food-vfx-lab/qualification-assembled.png` relative to the repository root.

The rim lacks convincing large baked blisters, char microstructure, crust fissures and natural crumb. Cheese remains too planar and uniformly distributed. Tomato cut faces and pepper strips lack convincing biological structure. Surface noise and subsurface shading do not replace those missing details. This asset must not be presented as advertising-quality food.

`pizza-study-unapproved.blend` and `create_pizza.py` are diagnostic source files, not accepted production assets. Frames 1/100/200 encode assembled/exploded/reassembled poses; there is no browser scroll experience. Procedural Blender materials have not been baked into production glTF textures. No finished GLB or animation recording is claimed.

## Exact required production asset

The next suitable source must be `mangosteen-pizza-production.blend`, with packed or relative textures, metre units, complete undersides and the following independently selectable meshes:

| Object group | Required detail |
|---|---|
| `Pizza_Dough` | Sculpted irregular baked crust, asymmetric inflated blisters, charred areas, fissures, porous crumb and a finished underside; not a torus/ring around a flat disc |
| `Pizza_Sauce` | Separate cooked tomato layer with irregular thickness, glossy pulp and a finished surface/underside when lifted away |
| `Pizza_Mozzarella_*` | Visibly melted curds with folds, browned bubbles, oil/gloss variation and plausible thickness; not flat repeated disks |
| `Pizza_Vegetable_*` | Individually modelled cut tomatoes and peppers/other selected vegetables, including flesh, skin, seeds/cavities, moisture and roasting variation |
| `Pizza_Herb_*` | Curved basil/herb leaves with central and secondary veins, natural edge variation and suitable translucency |

Required texture sources: 4K base colour without baked illumination, roughness, OpenGL normal, 16-bit displacement where needed, and food subsurface/thickness masks. Each ingredient must have UVs and meaningful pivots. The assembled pose and exploded offsets must be documented. A single photogrammetry shell of a cooked pizza is insufficient for an exploded assembly unless missing surfaces are reconstructed.

Licence evidence must name the creator, source URL, licence version and permitted commercial distribution inside a public WebGL application. No paid candidate has been verified sufficiently to recommend a purchase.

After asset acceptance: bake desktop/mobile glTF materials, create simplified meshes while preserving silhouette, export independent ingredient nodes, then implement the isolated scroll-controlled scene. Initial proposed budgets are 150–300k visible desktop triangles and 50–100k mobile triangles, subject to visual checks and actual device measurements—not measured achievements.

## Tools, storage and measurements

The successful second Cycles render took **14.10 seconds including image saving**, after initial Metal kernel compilation. Blender reported peak device memory around **3,326 MB**. These are offline-render measurements, not website FPS, GPU frame times or mobile performance.

Available space rose to 4.8 GiB before setup, then fell to about 331 MiB during the modelling/render test. Source and evidence occupy about 53 MiB; the Blender application occupies about 797 MiB. The other change in free space was not attributed or investigated. Only the installer downloaded for this task was deleted after verification. User files, backups and prior review evidence were not removed.

A workspace with approximately 20 GB free remains the practical recommendation for bakes, exports and recordings. Do not begin large bakes while the volume is nearly full.

Reproduce the diagnostic render, only with sufficient space:

```sh
/private/tmp/mangosteen-food-tools/Blender.app/Contents/MacOS/Blender --background --factory-startup --python assets/food-vfx/pizza/create_pizza.py
```

All frontend/backend source remains unchanged from `8fb3f23`. Build/browser regression tests were not repeated for this offline-only qualification, and no production integration is claimed.
