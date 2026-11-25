# Architectural entrance study — Milestone 1

## Scope and reference evidence

The prototype is isolated at `/experience`. The homepage and business components are unchanged. The entrance is an architectural interpretation, not a surveyed digital twin. No later environments or exploration modes are implemented before visual approval.

The six-environment concept board was not present in the supplied attachment directory (only the text brief was supplied). Visual comparison against that board remains outstanding.

Reviewed originals: all four `public/images/highres/mangosteen_original_*_8k.jpg` files and all six `public/images/gallery/cafe-*` photographs. Original 2 is a plated-food composition, not architectural evidence. The other images establish the following inventory:

| Element | Evidence | Prototype treatment |
|---|---|---|
| Vertical dark timber façade | Original 4 | Independent narrow cladding boards |
| Illuminated script sign | Original 4 | Transparent lettering texture on separate sign mesh; exact script tracing remains outstanding |
| Repeated curved window heads | Original 4, gallery 07 | Curved tubular frames |
| Fabric shades and dark frame | Original 4 | Subdivided sagging fabric meshes |
| Exposed beams / metallic curved ceiling | Originals 1, 3; gallery 07 | Independent beams and curved metallic panels |
| Cylindrical woven pendants | Originals 1, 3; gallery 07 | Rings, vertical weave rods, bulb and suspension |
| Wood tables / crossed metal legs | Original 1, gallery 06/07/14/18 | Rounded tabletops and crossed leg assemblies |
| Cane armchairs / pale cushions | Gallery 06/07/18 | Rounded seat, tubular frame, woven back and cushion |
| Pale interior floor tiles | Originals 1, 3 | Individual tiles and joints |
| Dense tropical planting | All architectural originals | Curved leaf meshes, stems and planters; botanical realism remains below reference |
| Tan seating, graphic counter, rooftop | Originals 1,3; gallery 14/16/19 | Recorded for later milestones, not built |

## Approximate details

- All metre dimensions, façade width, room depth, structural spacing and furniture locations are inferred.
- The prototype begins on an inferred café-level arrival deck. It does not reconstruct street-to-rooftop stairs or lift access.
- The central entrance, vestibule and its connection into dining are inferred and authorized by the brief.
- Camera eye height is 1.64 m. The path occupies a clear central corridor; furniture is outside that corridor.
- The back wall is unresolved. No counter, lounge or neighbouring landmarks are invented for this milestone.
- Camera control points are editable in `src/features/architectural-experience/config/layout.ts`.

## Material and asset provenance

All new geometry and wood, stone and cane texture studies are authored locally in source code. No commercial models, paid APIs, external asset uploads or generated café photographs were used. Three.js and its bundled helpers are MIT licensed. Existing café photographs are user-supplied project assets; they are used for reference and the WebGL failure fallback only.

The model source is `environment/buildEnvironment.ts`, supported by `geometry/primitives.ts` and `materials/library.ts`. The exported snapshot is `public/models/architectural/mangosteen-entrance-study.glb`. The scene is procedurally assembled at runtime, so no GLB download is required to enter the route. The export is an editable interchange deliverable rather than the runtime loader.

Blender is not installed locally. The installed Three.js modelling/export path was used, avoiding an additional system installation. No Blender source file exists.

## Lighting and performance design

Lighting is configurable in `lighting/setup.ts`: hemisphere fill, one shadow-casting directional source, and warm local lights. ACES tone mapping and sRGB output are consistent. Materials are shared; geometry is batched by material within modules. Exterior builds first; dining builds after the first render opportunity. Rendering pauses while the camera is stationary or the document is hidden. Desktop pixel ratio is capped at 1.5 and mobile at 1.25.

This is an initial PBR study. It does not yet have baked indirect lighting, ambient occlusion textures, scanned material maps, KTX2 compression, Draco/Meshopt compression, or production botanical assets. These omissions visibly limit realism.

## Verification and review

Run `npm run build`, then `npm run preview -- --host 127.0.0.1 --port 4173`, then `node scripts/review-architecture.mjs`. Evidence is saved under `artifacts/mangosteen-architectural-3d-review/`. It includes five desktop and five portrait checkpoints, forward/reverse recordings, network bytes, CPU render-submission measurements, frame intervals and the exported GLB. Production preview avoids development reloads interrupting the capture.

Measurements from headless Chromium using SwiftShader on this development machine are not physical-phone benchmarks. CPU render timing does not measure GPU completion. Final capture uses the production preview; network bytes include the font responses.

The prototype demonstrates real perspective, geometry occlusion and reversible camera translation. It is not claimed to meet the requested photorealistic visual standard. Exact signage, mature foliage, richer material maps, contact lighting and reference-board fidelity still need review/refinement. Stop here for the user's Milestone 1 visual decision; do not build Milestones 2–5 automatically.
