# Entrance audit and capture plan

Status: BLOCKED — no approved spatial entrance prototype. The rejected feature is archived in commit 1c960ac. Earlier reports describing its projection portal as an acceptable architectural entrance are superseded by this audit.

## Source findings

- `mangosteen_original_4_8k.jpg`: upward-looking street facade photograph. Signage, canopy, upper-level railing, plants and illuminated glazing are visible. It does not identify the customer access path or threshold.
- `mangosteen_original_1_8k.jpg`: indoor table and pendant-light view. It does not establish the connection to street access.
- `mangosteen_original_3_8k.jpg`: indoor room/counter view. Some furnishings are recognizable in other photographs, but camera positions, distances and connecting access coverage are missing.
- `mangosteen_original_2_8k.jpg`: food/table detail; unsuitable for architectural reconstruction.
- Gallery 07: additional room view. Gallery 14 and 16: terrace views with railing and seating. These document spaces but do not establish entrance continuity.
- Optimized and enhanced copies are derivatives, not additional camera observations. Existing generated frame sequences are not independent reconstruction evidence.
- No calibrated depth map, panorama, measured model or overlapping entrance survey was found. Existing short promotional video is not established as uninterrupted coverage of the access route.

The actual entrance type, threshold dimensions, camera extrinsics and street-to-interior relationship remain unknown. Do not infer an opening from the facade sign or invent a door/stair/lift.

## Technology decision

| Method | Current evidence | Decision |
| --- | --- | --- |
| Camera projection | Sparse separate views, no calibrated surfaces or hidden-surface coverage | Cannot support crossing the entrance; a small view offset alone does not meet acceptance |
| Photogrammetry | Insufficient overlapping entrance photographs and no scale references | Do not attempt an accurate reconstruction from these sources |
| Gaussian splatting | No dense multiview access-route capture | Unsupported until capture |
| Measured 3D | No plan, measurements or threshold survey | Missing geometry cannot be invented |
| Connected photo viewer | Existing room photographs | Useful browsing only; not an architectural walkthrough |

The ERA reference provides a direction for spatial coherence, occlusion and readable movement. Its assets and layout cannot supply missing Mangosteen geometry. The live page was revisited; its text/image response alone cannot verify camera motion or reconstruction technology.

## Capture stations — define on site along the REAL customer route

Do a scouting walk first and annotate a simple route sketch. Record whether each access segment is street, corridor, stair, lift, landing or threshold. Stations below are relational instructions, not claimed existing locations.

| Station | Camera position | Viewing directions and deliverables |
| --- | --- | --- |
| A | Public approach, about 4–6 m before actual building access | Forward toward access; left/right obliques; reverse toward approach |
| B | About 2 m before actual access opening | Forward plus 30-degree left/right views, including floor and ceiling boundaries |
| C | At actual building access | Forward, backward and both sides; show opening edges and passage continuity |
| D series | Along every real corridor/stair/landing/lift segment | Capture every 0.5–1 m and immediately before/after each turn; include reverse views. Record lift entry/exit as separate verified spaces if movement cannot be reconstructed |
| E | About 2 m before café threshold | Forward, left/right oblique, reverse; include threshold and visible room together |
| F | At café threshold | Forward/backward, jambs or open boundary, floor, ceiling; do not invent a door if absent |
| G | About 1 m inside café | Forward and backward through threshold; overlapping views of both sides |
| H | About 3 m inside café | Forward toward first seating area and backward to G/F |
| I | First indoor exploration position | Full room coverage and reverse view toward H; connect terrace only along the actual route |

## Still-photo acquisition

Use original full-resolution files, one fixed lens and no digital zoom, portrait mode or beauty filters. Prefer a normal-wide lens with locked exposure/focus/white balance for each lighting zone. Keep camera height approximately 1.5–1.6 m. Record camera/lens settings and station IDs.

For reconstruction, take incremental photographs along both sides of the walking path with about 80% adjacent overlap and 60–70% overlap between passes. Include oblique views, not only forward-facing shots. Photograph floor/wall junctions and overhead structures. Cover surfaces revealed behind plants, columns and furniture from adjacent angles. Avoid moving guests and changing furniture during capture. Keep originals with metadata; do not upscale or retouch them.

## Walkthrough video

Record continuous 4K landscape footage from A through the real access route to I at a slow, steady pace, approximately 0.3–0.5 m/s. Use a gimbal if available and constant camera height. Hold 3 seconds at start, threshold and finish; take turns slowly. Record a reverse pass as well. Record a separate portrait take for mobile composition. Avoid cuts, speed ramps and automatic lens switching. If a lift is involved, document it honestly; do not splice it into a fictional walkable corridor.

Video is evidence and a possible source of multiview frames. A finished video alone is not evidence of interactive 3D reconstruction.

## 360 capture

Capture original equirectangular panoramas at A, C, every access turn/landing, E, F where safe, H and I. Add nodes at terrace/indoor junctions and each exploration area. Use consistent height and mark camera centre locations on the route sketch. Export at least 8K-wide panoramas where equipment permits. Panoramas permit rotational exploration, not free translation without depth or multiview coverage.

## Measurements

Record passage widths, opening widths/heights, ceiling heights, threshold level changes, column locations and distances between camera stations. If applicable, record stair rise/run, landings and lift-door dimensions. Include two or more measured reference distances in each reconstruction segment, using removable markers where permitted. Photograph a labelled sketch with station directions and connections; cardinal compass direction is useful but not required if relative orientation is recorded.

## Next prototype gate

Create an isolated entrance prototype only after capture establishes a connected path. First demonstrate an untextured measured/reconstructed scene with camera frusta, scale references and near/far features moving differently. Then apply authentic textures and verify that the camera crosses the real threshold without exposed gaps, warping or invented surfaces. Review forward/reverse playback and checkpoints before touching other sections. If reconstruction fails, report the missing coverage rather than substitute a scaling photograph.
