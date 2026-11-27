# Reservation visual refinement — 27 November 2026

Recoverable starting checkpoint: `7cc78fc872adcdac4239032a9de49cd861936b00`. Existing work and all earlier assets retained. No deployment.

## Photo audit and assets

`ASSET-REQUIREMENTS.md` was written after inspecting the original café photographs and before replacing assets. The genuine rooftop reference shows grey irregular flagstone; indoors shows pale large-format tiles; furniture shows smooth timber, cane backs, walnut frames and cream cushions. The active map already used photo-matched stone/tile rather than wood flooring, so these textures were retained, with rooftop scale corrected from a 340 to 240 unit patch and gentler surface contrast.

Five new transparent WebP assets replace the chunky plank tabletops and bulky chair art and introduce varied botanical cutouts. Total new delivery size: 226,768 bytes. `assets.json` records source PNGs, output dimensions, alpha and hashes. These are decorative AI-created photographic-style illustrations, not photographs of actual Mangosteen furniture. PNG originals remain in the generation library; v1/v2 project assets are untouched.

One consistent cream-cushion cane-chair sprite is used for all 54 existing seat IDs, including lounge/sofa-named groups. Actual lounge upholstery is unverified; a verified lounge photo is still required before claiming specific sofa furniture. No new table positions, chairs, capacities, entrances or inventory are introduced. The schematic disclosure and area-preview labels remain visible.

## Presentation changes

- Smooth walnut tabletops, finer cane chairs, compact contact shadows and quiet ID-only markers.
- Six individually positioned rooftop plants and four indoor plants, using varied shapes/scales/rotations, away from seating and the existing schematic entry.
- Larger genuine photographic preview with corrected responsive `sizes` so the browser requests sharp enough sources. Existing editorial fonts, cream/forest palette and button treatment retained.
- Coordinated GSAP map/plant/photo entrance on area switching; mask and opacity states cleaned up; reduced motion remains static.
- Mobile native panning with approximately 44px chair hit areas, an optional Fit plan / Explore view, keyboard-focusable map region and the existing list alternative. Table and chair coordinates are unchanged. Selected groups are centred within the scroller without scrolling the page.
- Mobile sticky Continue to Details, safe-area spacing and sufficient page padding. Individual seat controls remain fully available; continuation still requires exactly the existing guest count within one group.

## Verification

`node scripts/verify-reservation-refinement-v3.mjs` passed:

- 320/390/600/768/1024/1440/1920px, both areas: 14 layouts, no page overflow or JavaScript/console errors.
- All 15 group IDs, 54 seat IDs, chair/table transforms and capacities verified against unchanged layout/config data.
- Area/date/time/guest controls, capacity filtering, keyboard activation, individual seat deselection/reselection, disabled continuation while incomplete and back persistence verified.
- A real request with tomorrow's date, 8 PM, four guests and deliberately adjusted seats D1-2/3/4/5 reached a disposable CRM and appeared in the authenticated reservation data as pending. No live booking submitted.
- Protected source hashes remain byte-identical: homepage, menu, QR/seating config, typography, booking controls, API adapter and backend. The entire ReservationDialog state/handlers/submission section before JSX is byte-identical.
- The initial test run carried the indoor selection across viewport changes; the fixture was corrected to reload between viewports. This was test state, not a seating-data change.

`node scripts/verify-reservation-touch-motion.mjs` passed:

- Actual emulated touch swipe panned the map 324px horizontally; vertical swipe scrolled the page 265px without gesture trapping.
- Area-photo transition measured intermediate opacity 0.6348 and a partial mask, ending at opacity 1 with mask cleared.
- Native list selection and sticky action verified in mobile emulation. No runtime errors.

`npm run build` passed after final animation adjustment, including TypeScript and public assets. All 9 existing backend tests passed. Browser verification uses local Chrome and mobile emulation, not physical iOS/Android hardware. No new dependencies, Blender or WebGL introduced.

## Visual review

- `comparison-1440.jpg` and `comparison-390.jpg`: before/after at the same viewport and default two-guest, unselected state.
- `after/rooftop-1920.png`: full desktop composition with selected table.
- `after/mobile-seating-390.png`: mobile map with native panning and fixed continuation.
- `after/mobile-preview-390.png`: genuine area photo and seat preferences.
- `after/inside-map-1440.png`: indoor plan.
- Additional area/viewports, guest details and genuine pending-confirmation screens are included under `after/`.

Local inspection: `http://127.0.0.1:5173/contact#book`. Visual approval remains with the user.
