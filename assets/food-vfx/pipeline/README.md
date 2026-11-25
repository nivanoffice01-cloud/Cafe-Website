# Professional food asset pipeline — preparation only

No food geometry is generated here. The rejected study at commit `2b1b923` remains untouched. These tools are isolated from the application; no route, menu, reservation, backend or dependency changes are required.

`import-ready-studio.blend` contains three area softboxes, a forest-green shadow surface, an orbiting camera with a tracked depth-of-field target, and five animated ingredient parent empties. It contains **zero food meshes**. Lighting is a starting setup, not visually qualified for a purchased asset.

## Verified environment

Blender 4.5.9 LTS at `/private/tmp/mangosteen-food-tools/Blender.app/Contents/MacOS/Blender`; Apple M4 Metal device. This temporary application location is not permanent. Existing Cycles Metal qualification remains valid; this phase does not repeat the rejected food render.

## Import contract

1. Obtain approval for the asset and its website distribution licence. Keep receipt, original download and licence outside `public/`.
2. In a copy of the vendor file, normalize units to metres, centre the approximately 32 cm pizza at the origin and put its assembled base at Z=0. Preserve UVs, normals and vendor materials. Apply necessary transforms and bake vendor constraints before binding. Do not destructively modify the original source.
3. Copy `production.json` to `approved.json`. Set `asset` and `licenseEvidence` to paths relative to this config. Map exact object names to `dough`, `sauce`, `mozzarella`, `vegetables`, `herbs`. A fused scan cannot satisfy this contract simply by renaming it.
4. Use separately selectable, textured meshes with complete underside surfaces. The importer rejects missing roles, duplicate assignments, absent textures, unmapped mesh props, absent UVs/materials and animated/constrained source objects. Structural validation does not prove artistic quality or that an asset licence is adequate.
5. Source types accepted: BLEND, GLB/glTF, FBX. Native materials are retained. MAX/Corona-only materials need conversion before this stage. Food subsurface scattering and displacement should remain in the Blender source; do not assume glTF preserves them.

```sh
BLENDER=/private/tmp/mangosteen-food-tools/Blender.app/Contents/MacOS/Blender
"$BLENDER" --background --factory-startup --python assets/food-vfx/pipeline/prepare_scene.py -- --config assets/food-vfx/pipeline/approved.json --output /path/to/working-storage/pizza-production.blend
```

To recreate the empty studio, add `--rig-only`; the supplied config deliberately has no food asset. It is not a finished pizza experience.

## Animation and material handoff

Timeline: frames 1–241 at 30 FPS (8 seconds). First 40% separates layers; middle 20% holds the exploded pose while the camera continues moving; last 40% assembles. Camera orbit totals 36 degrees. Offsets and twists are per-role configuration. The parent rigs preserve the assembled world transforms. Individual vegetable/herb meshes remain independently selectable for later per-piece choreography.

The studio is sized for a 32 cm asset. After import, inspect clipping, ingredient collisions, underside coverage, shadow softness and camera framing before any export. Adjust camera distance for portrait separately after an actual asset is approved.

Before a public glTF export: bake base colour to sRGB; normal, roughness, metallic and AO to non-colour maps; preserve thin-leaf alpha; use OpenGL tangent-space normals. Keep unbaked displacement and SSS in source files. Bake displacement into geometry or normals where required. Proposed starting budgets: 150–300k visible desktop triangles, 50–100k mobile; 2K desktop / 1K mobile delivery maps, with selective 4K for a close-up crust. These are targets, not achieved measurements. Check the acquired model before reducing it.

Export the parent and ingredient animation as one synchronized 8-second clip, not five automatically playing actions. `bindScrollClip(mixer, clip, THREE.LoopOnce)` returns a seek function accepting clamped 0–1 progress; wire that into the isolated lab only after approval. `scrollViewports` defaults to 4 and is a future layout setting, not a currently registered scroll handler. Set clip time from scroll progress instead of accumulated delta so reversal is deterministic. Reduced-motion users must retain an assembled static view and explicit controls.

## Verification

```sh
node --test assets/food-vfx/pipeline/scroll-sync.test.mjs
```

The tests use the real installed Three.js AnimationMixer and check forward seeking, the final endpoint, reverse seeking and invalid input. Blender successfully saves the rig using the Metal GPU configuration. No vendor import, PBR bake, final glTF export, production render or browser performance claim is possible before an approved asset is acquired. No food assets were purchased or uploaded.
