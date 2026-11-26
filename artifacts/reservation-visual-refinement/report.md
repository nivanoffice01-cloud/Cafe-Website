# Reservation visual refinement

Local inspection: http://localhost:5173/contact#book

Recoverable checkpoint: `checkpoint/reservation-visual-before-cc0638c` at `cc0638c`.
The existing untracked `src/components/FullMenuDialog.tsx` remains untouched.

## What changed visually

- Textured rectangles are replaced by transparent photographic-style tabletop
  assets; cane chairs use beige linen/cane textures and lounge seats use separate
  upholstery sprites. Every table and seat remains an independent SVG target.
- Rooftop flooring uses irregular grey-green stone, following the genuine rooftop
  preview; indoor flooring uses neutral square tile/terrazzo. The repetitive wood
  plank floor is no longer active. Texture scale follows the furniture scale.
- Repeated palm borders are removed. Eight individually placed planters use two
  cutout types, varied sizes and orientations, and soft contact shadows. They sit
  at the perimeter, clear of seating groups and the central route.
- Large names/capacities over furniture are removed. Small ID markers show the
  unchanged IDs. Hover/focus shows the full name and capacity in the map header;
  selection continues to update the existing preview and seat preferences.
- Selection uses a fine forest/champagne outline with smaller seat checks.
  Layered contact shadows, restrained warm lighting and bounded GSAP entrance
  motion give the map depth without a 3D engine. Preview text uses a masked
  selection reveal. Reduced motion remains static and immediately usable.
- The genuine café photograph is larger. The preview's enclosing booking-card
  border/background is removed, with editorial spacing and existing typography
  and buttons retained. Zoom controls sit below the drawing so no seat is covered.

## Scope and preservation

Only `src/features/reservations/SeatingMap.tsx`, reservation-scoped rules in
`src/styles/reservation.css`, decorative asset files and review tooling/docs are
changed. The reservation component, controls, handlers and submission function are
byte-identical. Layout configuration, all table/chair coordinates, capacities,
54 seat IDs, backend, API, CRM, menu, homepage and navigation are unchanged.
Source hashes are checked against `protected-before.json`.

The map retains its schematic disclosure. Stone/tile materials and furniture
sprites are reference-based illustrations, not extracted photographs of those
exact tables, surveyed dimensions, or verified planting positions. Genuine café
photographs remain unchanged and are still labelled area previews.

## Visual evidence

Before and after screenshots use identical viewport dimensions and selections:
4 guests, rooftop Garden 02 / indoor Dining 02. The review also includes map-only
captures to compare furniture, flooring, greenery, labels and shadows clearly.

- 1920 × 1080 desktop
- 1440 × 1000 laptop
- 390 × 844 mobile

[Open before/after gallery](index.html).

## Verification

See `verification.json` for measured viewport widths, preserved SVG coordinates,
seat counts, hover labels, capacity filtering, selection, keyboard use, back
navigation, reduced-motion screenshots and normal-motion recording results.

**Passed:** no JavaScript/console errors in the visual run, no unintended page
overflow across all six tested sizes, and every protected source hash matches.

`npm run check` includes the production build, TypeScript, CRM JavaScript syntax
and all nine existing backend tests; all pass. Output: `build-and-tests.log`.

The existing business regression is reused without changing its source; a
short-lived runner changes only the output directory. It verifies menu/search,
persistent favourites, selection, QR alias and Table 4 ordering, pending reservation
submission, CRM owner login and the resulting order/reservation records. All
requests are forwarded to a disposable SQLite fixture, never the real database.
Results: `business-after/results.json`.

No new runtime dependency, Blender, WebGL, paid asset or deployment.

## Asset provenance and limits

The eight new optimized WebP files are under `public/images/reservation/`, using
`*-v2` names. Original PNGs remain in the Codex image library; old files remain
recoverable. Exact paths, dimensions and byte sizes: `assets.json`. Full prompts
and built-in image-generation provenance:
[PHOTOGRAPHIC-V2.md](../../public/images/reservation/PHOTOGRAPHIC-V2.md).

The physical seating plan is still unverified. Physical mobile devices and
Safari/Firefox are not covered by the local Chrome checks. The refinement is
provided for visual approval; a passing build is not treated as creative approval.
