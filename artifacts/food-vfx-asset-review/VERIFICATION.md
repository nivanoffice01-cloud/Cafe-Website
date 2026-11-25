# Verification and handoff

25 November 2026. Active branch: `mangosteen-food-vfx-lab`. Commit `2b1b923` remains intact and is the baseline. No Git history was rewritten and no branch was removed.

## Passed

- `npm run check`: TypeScript / Vite production build, CRM JavaScript syntax check, all **9** CRM unit/integration tests.
- Existing tests cover CSRF/authentication, kitchen permissions, order delivery/idempotency, invalid table QR rejection, reservation validation/idempotency, duplicate/invented seats, session persistence and rate limiting.
- `node --test assets/food-vfx/pipeline/scroll-sync.test.mjs`: **2 tests passed**, including actual Three.js AnimationMixer forward/end/reverse seeks.
- Blender 4.5.9 saved `assets/food-vfx/pipeline/import-ready-studio.blend` with GPU/Metal configured, 241 frames, no imported food objects.
- Reopened studio using `verify_studio.py`: only mesh is the studio shadow plane; three lights; correct camera; ingredient rig heights at frames 1, 121, 241 and reverse matched expectations.
- `git diff 2b1b923 -- src public CRM package.json package-lock.json`: empty. Protected application code, menu assets, QR context, reservations, backend and dependencies were not edited.

## Limits

- Existing architectural JS bundle remains 719.28 kB minified; Vite emits its existing >700 kB chunk warning. Not changed in this phase.
- No browser visual regression run on the website: application files are unchanged. No new browser food experience is claimed.
- No vendor model has been imported or artistically approved; materials, final exports, portrait framing and performance still require an acquired professional asset.
- No new render-time/FPS measurements claimed. Previous M4 Cycles result relates to the rejected study only.
- Six candidates were investigated, but none proves all separated ingredient requirements. Some texture dimensions, formats, licences and live prices remain unverified and are explicitly identified in the shortlist.
- Storage target remains unmet: about 1.0 GiB free at final check. No cleanup or relocation occurred.

## Files added

`assets/food-vfx/pipeline/`: config, Blender studio builder, saved empty studio, Blender verification script, Three.js scroll adapter/tests and usage README.

`artifacts/food-vfx-asset-review/`: storage audit, asset shortlist, this report, visual comparison HTML, vendor previews/source URLs and public Fab/Sketchfab metadata evidence.

No new website route, dependency installation, paid request, asset purchase, external upload or deployment. The next decision is approval of a selective cleanup/relocation plan and asset qualification—not approval to present a fused pizza scan as an exploded ingredient model.
