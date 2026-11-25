# Architectural entrance study — Milestone 1

## Scope and reference evidence

The prototype is isolated at `/experience`. The homepage and business components are unchanged. The entrance is an architectural interpretation, not a surveyed digital twin. No later environments or exploration modes are implemented before visual approval.

The six-environment concept board was supplied on 25 November 2026 and is preserved at `artifacts/mangosteen-architectural-3d-review/refinement/concept-board.png`. This refinement builds on preserved commit `aaa1d6d`; it does not replace the project or continue into later environments. See `architectural-refinement-review.md` for the comparison and remaining visual gaps.

Reviewed originals: all four `public/images/highres/mangosteen_original_*_8k.jpg` files and all six `public/images/gallery/cafe-*` photographs. Original 2 is a plated-food composition, not architectural evidence. The other images establish the following inventory:

| Element | Evidence | Prototype treatment |
|---|---|---|
| Vertical dark timber façade | Original 4 | Independent narrow cladding boards |
| Illuminated script sign | Original 4, existing CRM brand lockup | Existing handwritten brand artwork on a separate sign mesh; this lockup includes a fruit emblem, unlike the exterior sign in the board |
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

Architecture, furniture, distant palms and trailing foliage are authored locally. Wood and stone now use CC0 diffuse, normal and roughness maps from Poly Haven. Foreground plants use the CC0 Calathea Orbifolia model, with five variations instanced across ten placements. See `public/materials/architectural/PROVENANCE.md`. No paid APIs, external uploads or generated café photographs were used. Three.js and its bundled helpers are MIT licensed. Existing café photographs are user-supplied reference assets and remain unchanged.

The model source is `environment/buildEnvironment.ts`, supported by `geometry/primitives.ts`, `environment/botanicalAssets.ts` and `materials/library.ts`. The exported snapshot is `public/models/architectural/mangosteen-entrance-study.glb`. Architecture is assembled at runtime; only the small botanical glTF and material maps are downloaded. The complete exported GLB is an interchange deliverable, not a runtime download.

Blender is not installed locally. The installed Three.js modelling/export path was used, avoiding an additional system installation. No Blender source file exists.

## Lighting and performance design

Lighting is configurable in `lighting/setup.ts`: hemisphere fill, a shadow-casting directional source, warm pendant/entry lights and two desktop shadow-casting spots. A prefiltered Three.js RoomEnvironment supplies approximate material reflections, not a measured café environment or baked GI. Static shadow maps refresh only when scene geometry loads. ACES tone mapping and sRGB output are consistent. Materials are shared; architecture is batched by material and foreground plants are instanced. Exterior builds first; dining and botanical assets load progressively. Rendering pauses while the camera is stationary or the document is hidden. Desktop pixel ratio is capped at 1.5 and mobile at 1.25; mobile omits the two spot shadow maps.

This remains a PBR study. Botanical maps include authored ambient occlusion/roughness data, but the architecture has no baked indirect lighting or scene-wide ambient occlusion. There is no KTX2, Draco/Meshopt, distance LOD or feedback-driven adaptive quality. Those limitations and the simplified architectural/furniture geometry still visibly limit realism.

## Verification and review

Run `npm run build`, then `npm run preview -- --host 127.0.0.1 --port 4173`, then `node scripts/review-architecture.mjs`. Evidence is saved under `artifacts/mangosteen-architectural-3d-review/`. It includes five desktop and five portrait checkpoints, forward/reverse recordings, network bytes, CPU render-submission measurements, frame intervals and the exported GLB. Production preview avoids development reloads interrupting the capture.

The original review used headless Chromium/SwiftShader. The refinement capture supports headed Chrome and records the actual renderer string. Mobile viewport results on a desktop GPU are not physical-phone benchmarks. CPU render timing does not measure GPU completion. Final capture uses production preview; network bytes include font responses. Checkpoints assert the actual camera progress; playback must reach at least 97% before the script accepts its recording.

The prototype demonstrates real perspective, geometry occlusion and reversible camera translation. It is not claimed to meet the requested photorealistic visual standard. Façade proportions, custom furnishings, trailing foliage, architectural detailing and bounced lighting still need refinement. Stop here for the user's Milestone 1 visual decision; do not build later milestones automatically.
