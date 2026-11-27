# Pizza production recommendation — 25 November 2026

## Decision

**Retain the M3D Scans Fab pack as the preferred finished-pizza asset. Use Blender Cycles/Metal for the hero animation, with separately acquired detailed ingredients.** Lack of separate toppings does not disqualify the pack. It does limit what can be animated without editing the source geometry.

The recommended four-asset basket is **₹6,586.53 Personal or ₹11,227.02 Professional before tax**, at the verified current prices. This is an asset acquisition subtotal, not a quote for finished production or any commissioned sculpting. No purchase has been made. The economical first purchase, if approved, is the pizza pack alone for source inspection; acquire the supporting ingredients after that inspection confirms a useful base.

## Fab pizza pack verification

[Product](https://www.fab.com/listings/ce6ebbf1-94f4-4f5c-b3c8-71fa9acf0e7f) · [Visual evidence](ingredient-comparison.png)

| Requirement | Finding | Confidence / limit |
|---|---|---|
| Visual quality | Inspected eight public preview images, including close angles, scene layout and diagnostic views. Convincing irregular crust, baked colour variation and food silhouettes. | Strong candidate for a complete-pizza hero; seller renders are not our own Cycles qualification. |
| Blender support | Public product metadata explicitly includes `.blend`, FBX, OBJ and Unreal Engine. | Format support verified; Blender version, packed textures and shader correctness require the purchased file. |
| Textures | Seller specifies 2K PBR. | Map files and texel density not independently measured. Do not claim 4K/8K source detail or assume extreme macro shots will hold up. |
| Geometry | Seller-linked Sketchfab metadata reports 191,684 faces / 95,874 vertices for its pack preview. | Pack-viewer totals, not a single pizza's production budget. Preview has zero animations. |
| Independent ingredients | Gallery lays out whole pizzas, slices, calzones and props. No isolated dough/sauce/melted-cheese demonstration. | **Unknown**, not proven single mesh and not proven separable. Source geometry is behind purchase. |
| Commercial use | Product metadata identifies Fab Standard licences. | See licensing conditions below. |
| Exploded assembly | Separate complete objects/slices are plausible, but full ingredient-layer separation is unverified. | Best treated as a finished hero plus ingredient choreography until source inspection. |

The public interactive Sketchfab viewer was opened in local Playwright, but displayed a viewer error; [failure screenshot](previews/fab-live-viewer.png) is retained. No interactive topology inspection is claimed. Public multi-angle images and metadata were usable. No account restriction was bypassed and no paid source model was extracted from a viewer.

## Recommended ingredient combination and cost

Current Fab public listing metadata was read directly for all four products. Both tiers are Standard licences; listing identifiers and price evidence are saved in the adjacent JSON files. Taxes are excluded. Sale prices may change; pizza and basil discounts currently end 2 December 2026 at 04:59 UTC.

| Asset | Intended role | Personal INR | Professional INR |
|---|---|---:|---:|
| [M3D Scans Pizza Pack](https://www.fab.com/listings/ce6ebbf1-94f4-4f5c-b3c8-71fa9acf0e7f) | Finished baked pizza, crust reference, whole/slice camera shots | 2,273.19 | 4,547.03 |
| [HQ3DMOD Basil leaves](https://www.fab.com/listings/4fac6724-2f84-4ff5-9421-2e707118a22c) | Airborne herbs and final garnish | 417.18 | 556.39 |
| [Tomato Slices](https://www.fab.com/listings/55e6e81f-af14-474e-b161-55848d12cb6f) | Independent tomato slices for ingredient motion | 1,576.84 | 2,319.32 |
| [ZB-Vision Mozzarella 001](https://www.fab.com/listings/cd8df092-56a3-4dfc-89a9-811d9451c0d2) | Fresh cheese ingredient close-ups / source for artist adaptation | 2,319.32 | 3,804.28 |
| **Acquisition subtotal** | **Four assets** | **6,586.53** | **11,227.02** |

The pizza-only qualification purchase would be ₹2,273.19 / ₹4,547.03. The other three assets add ₹4,313.34 / ₹6,679.99. No currency conversion estimate is used. Do not assume Personal eligibility: the applicable purchaser/entity must satisfy the licence tier rules.

### Ingredient quality and compatibility

- **Basil:** scanned, 4K PNG base colour/metallic/roughness/OpenGL normal; 3,910 quads; BLEND/FBX. Preview shows convincing veins, curved blades and uneven edges. One model part is listed: the connected sprig can be animated independently from the pizza; individual leaf detachment is not yet verified. Normal variations and edited copies can avoid obvious repeated silhouettes.
- **Tomato:** 4,176 quads; 4K base colour/AO/metallic/normal/roughness/height/specular; BLEND/FBX/OBJ and converted glTF/GLB/USDZ. Preview shows actual cut-face cavities and seeds. Source inspection must establish thickness, underside quality and whether multiple slices are separate objects.
- **Mozzarella:** scanned 8K base colour/roughness/normal, 1K/29K/470K polygon LODs; BLEND/FBX/OBJ/MAX listed. The description explicitly says Corona shaders only, despite Blender format availability. Budget for Cycles material conversion. The preview is fresh mozzarella balls, **not melted browned cheese or a stretch simulation**.

These are candidate assets with inspected seller previews. No claim is made that their purchased files have been rendered or that their ingredients exactly match Mangosteen's served dish. Actual dish data stays unchanged.

## Combining ingredients with a potentially fused pizza

1. Preserve the original licensed scan. In a working copy, inspect connected components, material assignments, UVs and underside coverage.
2. If toppings are separate source objects, bind them to the existing ingredient rigs. Add the purchased basil/tomato/cheese where the composition benefits.
3. If the scan is fused, retain it for the assembled hero. For a garnish/ingredient-arrival shot, move the independently acquired ingredients in true 3D and land them on selected locations. Match size, roasting, roughness and lighting; avoid doubling toppings already baked into the scan texture.
4. For an exact five-layer dough/sauce/melted-cheese explosion, an artist must isolate/reconstruct surfaces, repair exposed holes and undersides, and rebake affected textures. Buying fresh cheese does not solve cooked-cheese geometry. Do not use colour masking or duplicated scan shells to pretend those surfaces exist.
5. If source adaptation is impractical, commission those specific layers or change the approved shot to ingredient choreography around the finished pizza. That is a distinct creative decision, not an undisclosed downgrade of the original assembly requirement.

**Unpriced work:** sauce layer, cooked-cheese reconstruction, optional cheese-stretch simulation, mesh/texture repair. No honest fixed total for a fully separated final production can be given before source inspection or an artist quote. None has been commissioned or contacted.

## Recommended hybrid production approach

| Approach | Strength | Limitation | Decision |
|---|---|---|---|
| All food rendered live in Three.js | Free camera and direct ingredient interaction | Expensive subsurface/transmission/shadows; requires optimised assets and extraction safeguards | Optional final-object interaction after qualification |
| Cycles-rendered moving 3D scene, reversible frame playback | Highest control of materials, soft shadows, depth of field and ingredient movement on ordinary phones | Fixed camera path; delivery and decoded-frame memory need limits | **Primary hero technique** |
| Hybrid | Cycles hero plus useful real-time interactions | Real-time camera cannot move freely inside pre-rendered frames | **Recommended overall pipeline** |

The hero should be an actual animated Blender scene: independent meshes follow trajectories, the camera changes viewpoint, ingredients occlude each other and cast moving shadows. Render every delivered moment from that scene. Do not duplicate static photographs or simulate motion with image scaling.

Suggested shot: begin on the baked crust at a restrained angle; move into a deliberate ingredient separation/arrival composition supported by the acquired geometry; finish in a complete hero pose. The full-layer shot is gated by the source inspection above. Keep the camera and ingredient transforms deterministic so reversing scroll reverses the same animation.

Use the existing Metal environment, studio lights and reversible rig. Establish a neutral 100% crop material check before stylized forest-green lighting. Render a small set of frames first to judge crust and cheese; then a short motion segment for temporal noise, shadow contact and focus. Only after that render desktop and independently framed portrait sequences.

### Delivery strategy and budgets to validate

- Start with one approximately 8-second sequence at 24 FPS (192 rendered samples), 1920×1080 desktop. Frame a separate portrait camera; begin mobile delivery at 720×1280. Choose final sampling, dimensions and Cycles sample count from the acquired asset's actual test render.
- Render lossless source frames on adequate working storage, then derive WebP/AVIF delivery frames. Stream to disk in batches; retain native Blender and master renders privately. Keep an MP4 for review/fallback, but do not rely on arbitrary HTML video seeking for responsive reverse scrubbing.
- Map normalized scroll progress directly to frame index. Decode the visible frame and its neighbours; prioritize the direction of travel, cancel obsolete fetches and close evicted ImageBitmaps. Never decode the entire sequence into RAM.
- Illustrative memory arithmetic: one RGBA 1920×1080 frame is about 7.9 MiB; twelve decoded frames are about 95 MiB before compositor overhead. One 720×1280 frame is about 3.5 MiB; eight frames are about 28 MiB. These are calculations, not device measurements.
- Initial compressed-delivery targets: approximately 20–35 MB desktop / 10–18 MB mobile for the complete sequence, with under 2 MB needed for a useful first view. These are provisional budgets; difficult food textures may require a different tradeoff.
- Real-time objects should be reserved for useful inspection or controls. A phase-matched switch to a loaded low-poly approved object at the settled final pose is possible, but only if materials/framing match. Do not add a generic primitive pizza to fill this role.
- Respect reduced motion, support keyboard/touch controls and pause work offscreen. Serve a meaningful assembled render while loading; keep menu and reservation actions immediately available.

No long render or new website integration was started. The previous 14.1-second Metal test used the rejected procedural study, so it is not a reliable forecast for the new scanned assets. Current 4.17 GiB free is still below the 30 GB working-storage target; additional approved storage is needed before a full high-resolution render/bake run.

## Licence conditions

The binding [Fab EULA](https://www.fab.com/eula) was loaded in a local browser, including its full agreement (dated 1 October 2024). Sections 2, 4, 5 and 6 distinguish tier eligibility, rendered media, project distribution and content restrictions.

Commercial rendered images/video are allowed under the Standard licence. This supports the Cycles-rendered website approach. Interactive distribution is also allowed as a project dependency, but end users must be restricted from extracting or using the content outside the project; distributing standalone source assets is prohibited. A publicly downloadable GLB is not automatically compliant merely because it is compressed. For paid real-time meshes, confirm the intended packaging/protection with the licensor or use rendered output instead. No blanket raw-asset redistribution permission is claimed.

Both tiers grant the same usage scope. Personal eligibility depends on the purchaser and controlled entities' prior-12-month digital-content-industry gross revenue not exceeding US$100,000, including relevant funds raised. Preserve receipts and the applicable licence. Respect the NoAI restrictions on training/datasets/development; ordinary Blender rendering is the proposed workflow. No seller correspondence or custom permission has been obtained.

## Expected quality and remaining gate

This combination has a credible route to premium food-advertising visuals: natural scan detail, higher-resolution ingredient surfaces and offline path-traced lighting. It is substantially more promising than the rejected procedural study. It is **not yet proven advertising-quality at our final camera distance**. The pack's 2K textures may limit extreme crust close-ups, and cooked-cheese/sauce separation remains unresolved. A short source-based qualification render is the next meaningful acceptance test, after purchase approval and adequate storage.

Website code, routes, menu, QR ordering, reservations, backend, original photos and Git history remain unchanged. No assets purchased, no external uploads, no deployment.
