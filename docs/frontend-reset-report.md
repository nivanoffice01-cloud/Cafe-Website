# Frontend reset report

Date: 2026-11-25 (Asia/Kolkata)

## Git protection

- Active branch: `mangosteen-architectural-3d`
- Protected source branch: `mangosteen-era-immersive` at `1c960ac`
- Preserved cinematic branch: `mangosteen-cinematic-vfx` at `59ee17c`
- Backup branch: `backup/mangosteen-pre-architectural-reset-20261125`
- Backup commit: `4efaffd` (`backup frontend before architectural reset`)
- Full workspace archive: `/private/tmp/Cafe-Website-pre-architectural-reset-2026-11-25.tar.gz`
- Archive SHA-256: `d2a1ee795137421ef6d3a8c598ed4401ec8af327dcc2a4952abff84e62b5b961`

No branches were deleted and no Git history was rewritten.

## Active frontend cleanup

Removed from the active application:

- Eight-chapter cinematic route, manifests, canvas, frame sequence, progress hook, and sequence loader.
- ERA-inspired `/experience` route and immersive entrance components.
- Rectangular portal, viewpoint explorer, photographic transition, and experimental scene implementations.
- Experimental global/luxury/cinematic styles.
- Obsolete homepage gallery/reveal components and inactive legacy menu presentations.
- Cinematic processing, rendering, continuity, and QA scripts.
- Cinematic pipeline, asset, motion, provenance, and entrance experiment documents.
- Cinematic-only npm scripts.

The `/experience` route is no longer registered. Unknown routes now resolve to the temporary holding homepage.

## Archived experimental assets

The following were moved out of the public build, not permanently deleted:

- 1,059 generated cinematic delivery files from `public/cinematic/`.
- Cinematic posters and generated transition imagery from `public/images/cinematic/`.
- Chapter source footage and source documentation from `cinematic-source/`.
- Cinematic and ERA visual-review screenshots, recordings, contact sheets, storyboards, and performance reports.

Local archive: `archives/rejected-frontends/2026-11-25/` (ignored by Git, approximately 407 MB). The full pre-cleanup tar archive also contains these files.

## Retained protected functionality

- Approved `MenuExperiencePage` and botanical mobile menu styling.
- 131 dishes across 13 menu categories, with names, descriptions, prices, and dish imagery unchanged.
- Menu search, favourites, dish details, selection, and table-order flow.
- `/menu`, `/menu/*`, and `/m` QR routes, including table-specific query context.
- Reservation dialog, seating plans, selection rules, validation, and CRM submission.
- CRM, order management, database, backend APIs, authentication, and integrations.
- Business contact/map data and QR generation/deployment support scripts.
- `three` dependency retained for the future architectural implementation.

## Retained genuine and business assets

- `public/images/highres/mangosteen_original_1_8k.jpg` through `mangosteen_original_4_8k.jpg`.
- All six files in `public/images/gallery/`.
- All seven current files in `public/images/experience/`.
- All 22 current menu, menu-AI, and menu-UI image assets.
- Brand marks embedded in protected UI components and genuine café video in `public/media/`.

## Clean foundation

- Temporary homepage contains only the Mangosteen mark, forest-green background, champagne typography, Explore Menu, and Reserve a Table actions.
- No cinematic or immersive animation is registered.
- `src/features/architectural-experience/` contains isolated empty boundaries for components, environment, geometry, materials, lighting, camera, navigation, interactions, animation, styles, config, types, and tests.

## Regression evidence

Evidence directory: `artifacts/frontend-reset-regression/`

Before and after captures include the mobile menu landing screen, category browser, Table 4 context, search results, selected dish/order screen, and reservation dialog at 390 × 844 with 2× device scale.

Post-cleanup browser checks:

- Menu landing and 131-dish count: pass.
- 13 category data set plus All/Favourites navigation: pass.
- `/menu?table=4` context: pass.
- `/m?table=4` QR alias context: pass.
- Search for Margarita: pass.
- Favourite persistence: pass.
- Dish selection persistence and demo-order action: pass.
- Reservation dialog and seating map: pass.
- Browser console/page errors: none.

The menu landing, Table 4 landing, search results, and reservation screenshots are byte-identical before and after cleanup. The interactive selection capture has SSIM 0.9969; its small difference is transient UI rendering. The full-page category capture is affected by Playwright's fixed bottom-navigation stitching, while the underlying menu source and protected stylesheet are unchanged.

## Build and automated tests

- `npm run build`: pass.
- TypeScript project build: pass (part of `npm run build`).
- Vite production build: pass.
- CRM JavaScript syntax check: pass.
- CRM/backend tests: 9 passed, 0 failed.
- Public demo order reaches kitchen and remains idempotent: pass.
- Unknown table QR rejection: pass.
- Reservation validation/idempotency and seat validation: pass.
- Authentication, authorization, CSRF, session, rate-limit, and trusted-proxy tests: pass.
- Dedicated lint command: not configured in `package.json`.

## Local inspection

- Homepage: `http://127.0.0.1:5173/`
- Approved menu: `http://127.0.0.1:5173/menu`
- Table 4 QR flow: `http://127.0.0.1:5173/m?table=4`

The current Vite server is running from `/Users/shekharchouhan/Documents/GitHub/Cafe-Website`.
