# Rooftop map visual refinement — 27 November 2026

Starting checkpoint: `d1f4f64`. Scope: rooftop SVG/environment and rooftop-only assets/styles. No deployment or production booking.

## Visual changes

- New fine-grained grey flagstone, 180-unit repeat rather than the prior 240-unit repeat. No pale cream wash; restrained warm upper-left illumination and deeper natural floor tones.
- New transparent walnut tabletop sprites with small bevels, a separate shallow edge/base and layered compact contact shadows beneath all eight tables. Individual cane-chair sprites use tight and soft shadows in a common direction; the 28 chairs retain their exact existing anchors and rotations.
- Scattered plants replaced with substantial grey trough/square planters and realistic foliage, composing the existing perimeter. Every planter bounding box was checked against all expanded chair/table hit targets and the existing entry; none intersects.
- Pale metal boundary detail and a darker cap reference genuine café railing photographs. The original U-shaped schematic edge is retained. Post locations, finishes and planter placement are decorative, not a surveyed architectural reconstruction.
- Forest-green/ivory paired table selection, subtle tabletop hover/elevation and marker opacity feedback. Reduced-motion preferences keep the map static. All existing map controls, touch panning, list alternative and individual-seat controls remain intact.

The six new assets are photographic-style AI illustrations, not documentary café furniture photographs. Genuine source/reference photos and all previous asset versions are unchanged. `ASSET-AUDIT.md` documents the source inspection; `sources.json`/`assets.json` record generation sources, delivered dimensions, transparency, bytes and hashes. Selected WebP delivery total: 633,398 bytes. No Blender, heavy 3D renderer or new dependency.

## Preservation and checks

`node scripts/verify-rooftop-map-v4.mjs` passed:

- Rooftop-specific validation at 320/390/768/1440/1920px: exact eight group / 28 seat transforms, capacities, planter clearances, green/ivory state styling and no page overflow or image failures.
- Full existing reservation regression reused without changing its source: seven widths / both zones, 15 groups and 54 seats, individual seat adjustment, capacity filtering, back persistence, keyboard interaction and sticky continuation.
- A real pending request for deliberately selected D1-2/3/4/5 seats reached an isolated disposable CRM and appeared in its authenticated data. No live reservation was created.
- Real emulated touch swipes panned the map 333px horizontally and scrolled the page 268px vertically. Area switching/reduced-motion behavior passed.
- Protected source hashes for the reservation page/styles/controls, original seating/layout data, menu, marketing, API and backend remain unchanged. The complete SeatingMap hook/state/handler section before JSX is byte-identical.
- Matching indoor screenshot compared to the previous approved version is pixel-identical; `indoor-pixel-preservation.json` records this result.
- No browser runtime/console errors. The initial reused test exposed an empty unused SVG image definition, which was removed before the final passing run.

`npm run build` and all 9 existing backend tests passed. Desktop/mobile checks use Chrome and mobile emulation; physical-device visual approval remains outstanding. Test scripts and reports are provided; no 60 FPS or Core Web Vitals claim is made.

## Approval previews

- `comparison-1440.jpg`: side-by-side desktop map before/after, same viewport and G1 / two-guest selection.
- `comparison-390.jpg`: matching mobile comparison.
- `after/map-1440.png`: desktop rooftop map.
- `after/mobile-map-screen.png`: mobile map with unchanged surrounding page and sticky continuation.
- `after/overview-mobile.png`: compact full-plan option.
- `after/page-1440.png`: complete desktop reservation context.

Local URL: `http://127.0.0.1:5173/contact#book`. The illustrated-schematic disclosure remains visible. Ready for user visual review, not marked visually approved.
