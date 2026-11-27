# Entrance refinement review — 25 November 2026

Status: a working refinement for visual review, **not a photorealistic acceptance claim**. Local URL: http://localhost:5173/experience. Branch: `mangosteen-architectural-3d`. Baseline `aaa1d6d` remains in history. No deployment and no later-environment development.

## Six-environment concept audit

| Reference environment | Visual specification | Current treatment and remaining gap |
|---|---|---|
| 01 Exterior | Close upward façade composition, vertical walnut boards, flowing script, dense trailing greenery, cream sails, arches and glazing | Closer eye-level camera, taller board fascia, existing handwritten logo, hanging leaves and actual sagging fabric geometry. Still lacks the board's organic canopy tailoring, finely modelled fixtures, lush foliage variety and believable broader building context. The reused lockup includes a fruit emblem absent from the board's sign. |
| 02 Entrance | Enclosed planted passage, tiled route, framed glass doors, floor-level light strips, warm ceiling spots | Real posts, beams, glass sides, strips, entry lights and textured plant instances provide occlusion along a continuous path. Central placement, width and connectivity are inferred. Door hardware, glazing reflections, junction detailing and architectural bounced light remain simplified. |
| 03 Main dining | Cane furniture, crossed table legs, cylindrical woven lights, wood columns, curved metal ceiling, windows and a layered lived-in interior | Existing geometry refined with curved chair backs, scanned timber/stone maps, pendant-positioned lighting and desktop shadow spots. Blank back/right walls, generic furniture proportions, ceiling surfaces and missing material ageing keep it below the reference. |
| 04 Lounge | Tan upholstered banquettes, small tables and dense planted window edge | Reviewed only. Not built or changed; outside the current entrance approval boundary. |
| 05 Counter | Illustrated front panel, espresso equipment, food display and detailed work surfaces | Reviewed only. Not built or changed. The original artwork/equipment needs a separate approved modelling pass. |
| 06 Rooftop | Evening skyline, string lights, fabric shades and layered open-air seating | Reviewed only. Not built or changed. A surveyed connection and separate approved model are required later. |

## Changes in this pass

- Retained actual camera translation through independent geometry. No photo portal, expanding mask, crossfade or scene photograph is used for the walkthrough.
- Corrected the sign's source aspect ratio and raised the façade above the entry cover so its lettering remains visible.
- Replaced the coarse canopy colour grid with a fine fabric bump surface.
- Added licensed 1K wood/stone PBR maps and five Calathea mesh variations, instanced across ten foreground/entry planters.
- Added dense trailing leaf meshes and finer distant palm fronds; these remain procedural studies.
- Cleared the first table row from the entrance and added a physically framed vestibule. Camera eye height remains 1.64 m, following an unobstructed central path.
- Reduced the large introductory overlay; all existing menu/reservation actions remain.
- Corrected programmatic scrolling to use explicit instantaneous steps within the camera's eased animation. Browser-managed scrolling must not compete with the animation loop.
- Cached static shadow maps; desktop uses two local shadow spots, mobile uses a lighter lighting configuration. Plant geometry/textures are shared.

## Rendering pipeline evaluation

Procedural geometry is sufficient to validate connectivity, scale relationships, occlusion and camera motion. It is **not sufficient in its present authored detail to reproduce this concept board photorealistically**. A detailed model and lightmap pass is still needed: tailored sail seams and fixings, curved cane joinery, glazing frames/hardware, denser varied hanging foliage, and resolved wall/ceiling junctions.

Blender is not installed. No Blender bake or architectural global illumination has been produced in this pass. Installing Blender alone would not supply the missing model detail or a measured lighting solution. The useful next pipeline is to refine the exported GLB in Blender, create non-overlapping lightmap UVs, bake indirect light/AO, then retain the current real-time camera and business-feature adapters. The current RoomEnvironment is an approximation for material reflection, not a claim of physically accurate café reflections. Botanical AO is present in its authored maps; scene-wide AO is absent.

Dimensions and the vestibule connection remain inferred from photographs and the approved concept interpretation. Original café photographs and business data are unchanged. This is not an as-built digital twin.

## Evidence

Review directory: `artifacts/mangosteen-architectural-3d-review/refinement/`.

- `before/`: baseline screenshots from `aaa1d6d`.
- `after/{desktop,mobile}-{0,25,50,75,100}.png`: revised camera path.
- `after/{desktop,mobile}-matched-*.png`: old camera positions/targets replayed against the revised model for like-view comparison. New Chrome capture may differ in scrollbar width and rasterization from the old Chromium capture.
- `after/*-furniture-detail.png`: chair, table and lighting detail.
- `after/*-wireframe.png`: real geometry evidence.
- `after/*-entrance.mp4`: checkpoints, complete forward/reverse playback and detail views.
- `after/*-performance.json`: raw network, renderer, draw counts, timing and playback-coverage evidence. No phone-performance claim should be inferred from a desktop GPU at a mobile viewport.
- `index.html` and comparison images: browse the concept, matching views and recordings together.

Capture with:

```sh
npm run build
npm run preview -- --host 127.0.0.1 --port 4173
ARCHITECTURE_REVIEW_DIR=artifacts/mangosteen-architectural-3d-review/refinement/after ARCHITECTURE_HEADED=1 ARCHITECTURE_BROWSER=chrome node scripts/review-architecture.mjs
```

## Regression and remaining acceptance work

TypeScript/production build and all 9 existing backend tests pass. Vite warns about the isolated Three.js route exceeding the 700 kB uncompressed chunk threshold (about 719 kB, 185 kB gzip). No new dependencies were introduced in this refinement.

Mobile menu checks cover landing, 131 dishes, category browser, Table 4 context through `/menu` and `/m`, search, persisted favourites, selection, demo-order action, reservation dialog and seating map. Browser evidence is in `artifacts/frontend-reset-regression/refinement/`. Backend tests cover reservation validation/idempotency, demo orders reaching the kitchen, invalid table QR rejection, authentication and permissions. No production orders or reservations were submitted.

The final entrance interaction check passes Enter, Return during the end of automatic movement, Skip, reservation opening and the `/menu` link. Pointer interaction now cancels automatic movement, fixing the return-button race found during review. Evidence: `refinement/entrance-interactions.json`.

Six of seven protected-page screenshots are pixel-identical to the earlier architectural baseline. The category-browser capture differs during its existing 250 ms entrance animation; no pixel-equivalence claim is made for that frame. All protected page/component/data/backend source files have an empty diff against `aaa1d6d`.

The measured, progress-asserted Chrome run transferred approximately 5.24 MB and had an 8.3 ms median rAF interval on Apple M4 for both viewport sizes. Full details and P95 values are in `refinement/performance-summary.md`. The final pointer-interruption fix was tested afterward and does not change scene geometry or the recorded camera path.

Visual approval is outstanding. Real-phone testing, scene-wide baked lighting, model/texture compression and more detailed architectural assets are also outstanding. Do not proceed into the lounge, counter or rooftop from this review without the user's decision.
