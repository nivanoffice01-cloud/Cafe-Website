# Mangosteen reservation redesign — review

26 November 2026. Branch: `mangosteen-authentic-content`.
Checkpoint: `checkpoint/reservation-before-15ec00e` at
`15ec00e8818b64074bd8ca4084083429fc327a97`. Existing untracked
`src/components/FullMenuDialog.tsx` remains untouched.

**Inspect locally:** http://localhost:5173/contact#book

**Review gallery:** [Screenshots and recordings](index.html).

## Implemented

- Full-screen cream-and-forest reservation experience using the exact approved
  site header, existing Cormorant/Manrope fonts and pill button language.
- Editorial “Find your perfect table.” heading and four controls together.
- Independently selectable SVG tables/chairs with wood texture, generated
  decorative cane-chair/palm sprites and exactly the configured seat counts.
- Area switching, guest-capacity filtering, table-to-seat-preference selection,
  individually adjustable seats, zoom/native pan and accessible list alternative.
- Genuine indoor/rooftop photographic previews labelled as area photographs.
- Guest details with unchanged submission function, pending confirmation with
  the real API receipt, copy/local-save/delete controls and 30-day retention.
- Scoped reveal/selection/closing motion; no new animation dependency, WebGL,
  Blender, generated venue interiors, heavy models or frame sequences.
- Dedicated mobile layout with sticky continuation, full-size individual seat
  controls, enlarged zoom controls below the map, and compact review summary.
- Focus containment/restoration, Escape, background inert and scroll lock,
  mobile navigation handling and reduced motion.
- `/contact#book` supports fresh access and in-page reopening.

## Screenshots

Full-content captures preserve desktop/mobile width; viewport height was enlarged
for the full-content screenshots. Normal viewport interactions were tested
separately at the dimensions in `verification.json`. No phone frame or fake
status bar is included.

- [Desktop rooftop](after/desktop-rooftop-full.jpg)
- [Desktop indoor](after/desktop-inside-full.jpg)
- [Mobile rooftop](after/mobile-rooftop-full.jpg)
- [Mobile indoor](after/mobile-inside-full.jpg)
- [Tablet](after/tablet-full.jpg)
- [Desktop guest details](after/desktop-guest-details-full.jpg)
- [Mobile guest details](after/mobile-guest-details-full.jpg)
- [Desktop confirmation](after/desktop-confirmation-full.jpg)
- [Mobile confirmation](after/mobile-confirmation-full.jpg)
- [API failure state](after/submission-error-mobile.jpg)

## Recordings

- [Complete desktop workflow — MP4](recordings/desktop-reservation.mp4)
- [Complete mobile workflow — MP4](recordings/mobile-reservation.mp4)
- [Desktop motion contact sheet](recordings/desktop-contact-sheet.jpg)
- [Mobile motion contact sheet](recordings/mobile-contact-sheet.jpg)

Recordings show homepage entry, seating choice, individual seat adjustment,
indoor switching, guest details, actual submission to a disposable local CRM,
pending confirmation and return. Synthetic review guests only. MP4/H.264 encoded
with FFmpeg, fast-start enabled. Duplicate intermediate WebM encodes removed.

## Preserved business rules and mapping

The existing `src/data/seating.ts` and `CRM/server.py` are unchanged. There are
8 rooftop groups / 28 seat IDs and 7 indoor groups / 26 seat IDs. Exact labels,
IDs, capacities and relative rows/columns are retained. The visual map is not a
second database. [Identifier mapping](seating-identifier-mapping.json) includes
coordinates, furniture type, dimensions and accessibility labels. See
[configuration documentation](../../src/features/reservations/README.md).

Selecting a table selects N *seat preferences* for N guests; the visitor can
adjust each seat. This does not reserve an entire table exclusively. Dates remain
today through day 13, arrivals 5–9 PM in one-hour intervals, and parties 1–6.
Smaller groups are muted; no live inventory or fabricated unavailable status.
Requests retain the existing idempotency key, API payload and staff-confirmation
workflow. [Submission function preservation](submission-preservation.json).

## Regression and performance results

- `npm run check`: production build, TypeScript, CRM JavaScript syntax and **all
  nine existing backend tests pass**. [Build/test log](build-and-tests.log).
- Real browser checks: 320×568, 360×800, 390×844, 430×932, 768×1024, 1024×768,
  1440×900 and 1920×1080. No horizontal page overflow or JavaScript/console errors
  in the positive workflow. [Detailed results](verification.json).
- All table/seat IDs compared against the unchanged backend allow-list. Both maps,
  suitable-capacity filtering, date/time changes, table/individual-seat selection,
  back persistence, phone/email validation, keyboard activation, list, zoom,
  mobile navigation and focus loop pass.
- API 503 simulation remains an error, never a confirmation. Local fallback,
  explicit deletion, reduced-motion close and mobile header entry pass.
  [Failure/privacy checks](failure-and-preservation-checks.json).
- Menu search, persistent favourites, dish selection, all 131 dishes / 13
  categories, QR alias, Table 4 demo order, real pending reservation, CRM owner
  login, dashboard, order queue and reservation record pass against disposable
  SQLite databases. [Business regression](business-after/results.json).
- Homepage and menu screenshots at 390px and 1440px are **pixel-identical** in
  before/after samples. Protected source hashes also match, excluding the sole
  export of the unchanged header for reuse. [Visual comparison](visual-preservation.json),
  [protected hashes](protected-before.json).
- Three optimized reservation illustration assets transfer approximately 159 KB
  including local HTTP overhead. Chrome touch-viewport emulation with 4× CPU
  slowdown sampled 2 seconds at approximately 16.6 ms mean frame interval, with
  no sample interval over 34 ms. Two dev-page startup long tasks were observed
  (68/79 ms). This is local headless measurement, not a physical-phone, production
  Core Web Vitals or animation-FPS guarantee. Full resource/frame data is in
  `verification.json`.
- Local CRM on port 4173 was stopped. Its 27-table schema was checked read-only
  and already matched. The existing API was started **without initialization,
  migrations or reseeding**. Automated submissions did not touch its database;
  its original modification time remained 23 November. Normal manual submissions
  through the local page will reach that existing local CRM.

## Modified implementation files

- `src/components/ReservationDialog.tsx`
- `src/styles/reservation.css`
- `src/features/reservations/layout.ts`
- `src/features/reservations/SeatingMap.tsx`
- `src/features/reservations/ReservationIcon.tsx`
- `src/features/reservations/README.md`
- `src/features/supplied-frontend/SuppliedDesign.tsx` — unchanged header export only.
- `src/features/supplied-frontend/SuppliedFrontendPage.tsx` — reservation-only header
  reuse, booking hash handling and close integration.
- `public/images/reservation/` — three optimized illustration assets and provenance.
- `scripts/review-reservation-experience.mjs`
- `scripts/verify-reservation-redesign-business.mjs`
- This review directory.

No homepage markup, burger animation, food animation, marketing transitions,
menu data/UI, QR model, reservation API, database schema, authentication or CRM
source was redesigned. Existing automated tests were not edited. No dependency
was added. No deployment performed.

## Visual limits requiring owner input

The existing layout is a schematic, not an owner-surveyed architectural plan.
Exact dimensions, table-specific furniture shape, floor finish, planting/railings
and entrance geometry cannot be verified. Positions follow the original grid;
materials and greenery are decorative illustrations. Rectangular table styling
follows the genuine photographs; round-table rendering is supported but not
assigned to an unverified group. No additional table, capacity or entrance was
introduced. Exact table photographs remain unavailable, so previews are labelled
by area. City views, exclusive table ownership and live availability are not
claimed. This is ready for visual review, not a claim of a surveyed reconstruction.

Chrome desktop/touch emulation was tested. Physical iOS/Android devices and Safari/
Firefox were not available for this run. Panning uses native scrolling when zoomed.

Generated assets use the built-in image-generation tool. Their saved paths,
transparency, dimensions and exact prompts are in
[asset provenance](../../public/images/reservation/README.md).
