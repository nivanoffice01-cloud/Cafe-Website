# Milestone 1 review — 25 November 2026

Open http://127.0.0.1:5173/experience for the development prototype, or http://127.0.0.1:4173/experience for the tested production preview.

Use natural scrolling or Enter Mangosteen to travel from the façade through the entrance into the dining aisle. Reverse scrolling follows the same path backwards. Skip Entrance goes directly to the interior. Menu and Reserve remain accessible throughout.

## Evidence

- `desktop-0.png` through `desktop-100.png`: 1920 × 1080 checkpoints at 25% intervals.
- `mobile-0.png` through `mobile-100.png`: 390 × 844 checkpoints.
- `desktop-entrance.mp4` and `mobile-entrance.mp4`: actual browser captures containing checkpoints followed by forward/reverse movement.
- `desktop-performance.json` and `mobile-performance.json`: raw transfer, frame interval, render-submission timing and renderer measurements.
- `../../public/models/architectural/mangosteen-entrance-study.glb`: exported 17 MB geometry/material snapshot (not required by the runtime).
- Protected workflow comparison: `../frontend-reset-regression/architectural/` against `../frontend-reset-regression/after/`.

## Outcome

Real geometric depth, perspective camera translation, occlusion, and a connected entrance are implemented. The façade, structural bays, canopy, floor, windows, chairs, tables, pendants and planters are geometry. Photographs are not the environment. Lettering and material patterns are textures.

Visual acceptance is **pending**. This procedural study does not meet the requested photorealistic finish. Foliage, exact signage, rear-wall treatment, material richness, subtle indirect lighting and façade composition need further art direction. The supplied attachment contained no concept-board image, so fidelity to it could not be assessed. No claim of a measured café reconstruction is made.

Desktop production-preview network transfer was 358,169 bytes in the recorded run. Batched scene draw calls fell from 445 to 47. The desktop median frame interval was approximately 367 ms, with p95 approximately 483 ms, under headless Chromium SwiftShader software rendering with video capture. This is poor measured playback and is not a physical-device or hardware-GPU result. A 60 FPS claim is not supported.

The runtime uses an on-demand render loop, shared materials, static geometry batches, deferred dining construction, adaptive pixel-ratio caps and resource disposal. More performance work is required before production approval.

The portrait run transferred the same 358,169 bytes. Its median frame interval was 83.4 ms and p95 was 150 ms in the same software-rendered capture environment. Both runs recorded zero console errors.

## Regression

- `npm run check`: production build, TypeScript and CRM syntax check passed; 9 backend tests passed.
- Protected homepage, menu, QR, reservation, CRM, API and data source files have no diff from `81359ad`.
- Menu landing, Table 4 landing and search screenshots are pixel-identical to the cleanup baseline.
- Browser checks passed: 131 dishes, 13 categories, search, favourite persistence, dish selection, table ordering action, `/m?table=4`, reservation opening and seat-map access.
- Architecture captures report no JavaScript console errors.

No deployment was performed. Milestones 2–5 remain unimplemented pending the first visual decision. See `docs/architectural-reference.md` for source provenance and all inferred architectural assumptions.
