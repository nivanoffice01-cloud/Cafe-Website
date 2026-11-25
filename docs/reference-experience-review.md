# Mangosteen /reference-experience — implementation and visual review

Date: 25 November 2026. Branch: `mangosteen-reference-experience`.
Base commit: `36d51ed` on `mangosteen-claude-vfx`; `2b1b923` remains an ancestor. Existing untracked food-asset research/pipeline work was preserved.

Local development: http://localhost:5173/reference-experience

Production-build preview: http://127.0.0.1:4174/reference-experience

## Reference inspection

Inspected https://palazzo.framer.website/ with local Playwright/Chromium at 1440×1000 and 390×844. Captured full-page and section screenshots, desktop table drag, mobile navigation, glass wipe, card interaction and browser video. Measurements came from the rendered page; no proprietary source code, 3D models, textures or food photographs were imported.

| Reference feature | Observed composition | Original implementation |
| --- | --- | --- |
| Navigation | Transparent fixed header, italic wordmark, pill booking action; mobile full-screen serif navigation | Scoped header/drawer, focus trap, Escape, body scroll lock and focus restoration |
| Hero | Graphite cloth, circular walnut table anchored beyond right edge; large serif course text; direct table rotation | Original Blender-rendered cloth, existing CC0 wood, independently positioned food plates; pointer-angle rotation, damped snap, keyboard controls and shortest-direction wrapping |
| Mobile hero | Text above a large cropped circular table; active plate at top of table | Dedicated 760px table composition, 205px dish frames, 44px heading and mobile controls |
| Statement | Oversized mixed roman/italic lines; blur sharpens while scrolling | GSAP ScrollTrigger blur/opacity tied to natural scroll, reversible on return |
| Menu | Dark panel, large left heading, numbered ruled rows, dish hover previews | Existing verified names/prices/descriptions, five photographic highlights; every menu action uses the approved menu route |
| Café imagery | Full-bleed photography, offset secondary photograph, parallax | Actual Mangosteen photographs with independently moving inset and responsive photo delivery |
| Glass | Frosted photograph, oversized italic invitation, pointer erases fog | Canvas destination-out brush, persistent erased trail, keyboard clear/restore alternative |
| Occasion cards | Side-by-side image and physical-looking card; perspective tilt | Real café photograph and original invitation card with pointer-driven perspective |
| Booking | Cloth-backed split layout, pill selections and rounded form | Date/party/time selections validated and passed into the existing reservation dialog |
| Footer | Four compact columns then oversized wordmark; two mobile columns | Existing address, hours, directions, photo gallery and ordering links |

Reference desktop headline measured about 76px; mobile about 44px. The reference has eight tasting courses and wine pairing, private-dining and paid gift-card products. Mangosteen does not have verified equivalent products in the repository. These are deliberately represented by existing dish details, gathering requests and an invitation card; no wine, tasting-menu, private-room availability or voucher sale is fabricated.

## Implementation boundary

New files are isolated under `src/features/reference-experience/` and `public/reference-experience/`. `src/app/App.tsx` adds only the lazy route. `ReservationDialog.tsx` accepts an optional validated date/time/party prefill; existing defaults, presentation, seating logic, submission API and confirmation wording are retained. No other business component or data source changed.

Homepage, `/experience`, `/claude-vfx-lab`, approved `/menu` routes, table QR context, CRM, authentication and backend remain available. No deployment, purchase, external asset upload or real customer submission was performed.

## Assets and rights

- Café photographs: existing user-supplied Mangosteen originals and gallery images. `dining-1920.jpg` and `dining-detail-960.jpg` are resized derivatives of originals 1 and 3; original files remain intact. No fictional interior is used.
- Food: existing five individually mapped licensed illustrative photographs from `src/data/menuPhotos.ts`; provenance remains in `public/images/menu/README.md`. The new hero explicitly labels these illustrative. No claim that the plates depict actual Mangosteen servings.
- Wood: existing CC0 Poly Haven material; provenance in `public/materials/architectural/PROVENANCE.md`.
- Linen: newly authored Blender geometry/material/lighting, rendered with Cycles/Metal; reproducible script `scripts/render-reference-linen.py`. It is decorative cloth, not a food-model replacement.
- Instrument Serif regular/italic: Google Fonts, SIL Open Font License, included beside the font files. Supporting type uses the existing Manrope font.
- No reference-site asset is shipped. Reference screenshots/video are local comparison evidence only.

### Remaining assets needed for closer photographic fidelity

| Suggested file | Specification | Purpose |
| --- | --- | --- |
| `margarita-overhead.webp` | 1600×1600, transparent background, whole actual pizza/plate, camera exactly overhead, soft upper-left studio key, no cropped rim | Hero plate |
| `pesto-overhead.webp` | Same dimensions/light/camera, actual pasta on its full plate | Hero plate |
| `burger-overhead.webp` | Same dimensions/light/camera, actual complete serving | Hero plate |
| `mojito-overhead.webp` | Same dimensions/light/camera, complete glass with realistic transparency and separate shadow if possible | Hero plate |
| `cheesecake-overhead.webp` | Same dimensions/light/camera, actual plated dessert | Hero plate |
| `graphite-linen-photo.webp` | 2400×1600 or larger, fine sharply resolved weave, natural irregular folds, soft directional light; licensed original | Closer photographic cloth finish |
| `walnut-table-overhead.webp` | 2048×2048, circular radial-grain walnut surface, consistent overhead light, alpha outside rim | Closer radial wood finish |

Current food images are circular crops, not clean overhead cutouts. Their embedded tabletops and camera angles are visibly different from the reference. The original rendered cloth and existing plank-grain wood also differ from the reference materials. These prevent a claim of pixel-perfect photographic parity. No unauthorized assets were used to conceal those gaps.

## Verification and evidence

Commands:

```sh
npm run check
node scripts/review-reference-experience.mjs
npm run preview -- --host 127.0.0.1 --port 4174
REVIEW_URL=http://127.0.0.1:4174 node scripts/review-reference-experience.mjs
node scripts/record-reference-experience.mjs
```

- Production build and TypeScript pass; CRM JavaScript syntax check passes; all nine existing CRM tests pass, including order idempotency/table validation and reservation validation/seating rules.
- Responsive screenshot/overflow/image checks: 320×568, 360×800, 390×844, 768×1024, 1024×768, 1440×1000 and 1920×1080.
- Browser checks cover forward/reverse dish selection, pointer rotation, mobile horizontal touch rotation, details switch, actual pixel erasure, glass clear/restore, perspective tilt, reservation prefill, mobile navigation focus/scroll handling, reduced motion, approved menu search/favourites/selection, Table 4 context, 131 dishes/13 categories and unchanged homepage reservation defaults.
- No browser JavaScript errors or failed HTTP responses in the successful regression run. Customer-facing order/reservation submission was not performed; integration mutations are exercised by existing isolated backend tests.
- Final machine-readable results: `artifacts/reference-experience/local/test-results.json`.
- Desktop/mobile hero and section screenshots: `artifacts/reference-experience/local/`.
- Reference comparison screenshots and original browser recordings: `artifacts/reference-experience/reference/`.
- Full forward/reverse local recordings: `local/desktop-journey.mp4` and `local/mobile-journey.mp4` (WebM sources retained). MP4 conversion uses FFmpeg `h264_videotoolbox` and `+faststart`.
- `local/performance.json` records network bytes and frame timings. Initial development capture: approximately 5.71 MB initial / 5.88 MB full journey; median and p95 animation-frame interval 16.7 ms, zero intervals over 50 ms. Desktop M4 headless Chromium with recording active, mobile viewport emulation; not a phone, Safari, GPU-time or field Core Web Vitals certification. Final production-build measurements: desktop 2.33 MB initial / 2.50 MB full journey; mobile 2.81 MB initial / 2.98 MB full journey. Raw results are in `local/production-transfer.json`.

Visual iterations corrected the table rotation origin, active plate alignment, overly strong wood rings, incomplete first eraser stroke, overlapping invitation-card text and full-revolution wraparound. Sharper responsive café photography was added after the first recording; final screenshots reflect that derivative while the motion choreography is unchanged.

## Limitations

The page is an original reference-based implementation for visual review, not an assertion of identical production art quality. Asset differences above remain visible. Its five highlighted dishes are not the reference's eight-course tasting menu. The preserved reservation workflow intentionally differs from the reference's external booking provider. Chrome desktop and emulated mobile are tested; physical iOS/Android, Safari/Firefox and real network/field performance remain unverified. No new business products or availability claims were invented.
