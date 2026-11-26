# Reservation presentation

Local entry: http://localhost:5173/contact#book

The approved marketing header is reused without changing its markup or design.
The full-screen experience replaces the old three-column modal, retaining the
public CRM API, request idempotency key, local privacy/retention controls, manual
confirmation status and reservation validation rules.

## Sources of truth

- `src/data/seating.ts`: authoritative existing app configuration. **Schematic,
  not owner-surveyed**. Never treat the visual illustration as inventory.
- `CRM/server.py` → `PUBLIC_SEATING`: unchanged backend allow-list.
- `layout.ts`: presentation mapping derived from the source above. Grid columns
  1/2/3 remain left/centre/right; grid rows 1/2/3 remain top/middle/bottom.
  Coordinates use the SVG's 1040×580 coordinate system. No independent database.
- `SeatingMap.tsx`: tables, chairs, cushions and decorative elements are separate
  SVG elements. Every group has exactly its configured number of seats.
- `src/components/ReservationDialog.tsx`: existing state/submission functions,
  new presentation and table-to-seat-preference shortcut.
- `src/styles/reservation.css`: scoped presentation and responsive motion.

Every visual group contains ID, label, zone, capacity, seat IDs, x/y, rotation,
furniture type, width/height, photo key and accessible label. To change physical
arrangement after owner verification, update the source grid/layout mapping; do
not change backend identifiers. Furniture shapes, finishes and planting are
illustrative, not measured architectural facts.

## Identifier mapping

| Area | Display name | Backend ID | Capacity | Seat identifiers |
|---|---|---|---:|---|
| Rooftop | Railside 01 | R1 | 2 | R1-1 … R1-2 |
| Rooftop | Railside 02 | R2 | 2 | R2-1 … R2-2 |
| Rooftop | Railside 03 | R3 | 2 | R3-1 … R3-2 |
| Rooftop | Garden 01 | G1 | 4 | G1-1 … G1-4 |
| Rooftop | Garden 02 | G2 | 4 | G2-1 … G2-4 |
| Rooftop | Canopy 01 | C1 | 6 | C1-1 … C1-6 |
| Rooftop | Lounge 01 | L1 | 4 | L1-1 … L1-4 |
| Rooftop | Lounge 02 | L2 | 4 | L2-1 … L2-4 |
| Inside | Window 01 | W1 | 4 | W1-1 … W1-4 |
| Inside | Window 02 | W2 | 4 | W2-1 … W2-4 |
| Inside | Dining 01 | D1 | 6 | D1-1 … D1-6 |
| Inside | Dining 02 | D2 | 4 | D2-1 … D2-4 |
| Inside | Sofa 01 | S1 | 4 | S1-1 … S1-4 |
| Inside | Sofa 02 | S2 | 2 | S2-1 … S2-2 |
| Inside | Bar side | B1 | 2 | B1-1 … B1-2 |

`area` is submitted unchanged as `The rooftop` / `Inside Mangosteen`; `table`
is the display label, and `seats` is the exact identifier array. QR ordering
`Table 4` remains a separate, unchanged model.

## Interaction and constraints

- Four controls are present together: area, date, arrival, guests.
- Dates: today through day 13; arrivals: 5/6/7/8/9 PM; party: 1–6.
- Changing area or party clears seats, as before.
- Clicking a table selects its first N existing seat IDs for N guests; the UI
  explains this and exposes individual toggles. This is a seat preference,
  **not an exclusive whole-table booking**.
- Choosing a different group starts a new selection; selections cannot span
  groups or exceed the party size. Smaller groups are muted, not "unavailable".
- Continuation requires exactly N seats in one group. Back preserves all form
  and seating values while the experience is open.
- Confirmation displays the real API receipt/reference and Pending status.
  A failed API call stays on the form with an error and local-save/copy options.
- Local copies retain the existing 30-day expiry and explicit remove action.
- Native phone regex escaping was corrected for current browser `v` syntax;
  permitted characters and length (7–24) are unchanged.
- Map zoom uses native scroll panning, not a heavy rendering engine. The list
  alternative and preview seat toggles provide full-size touch controls.
- Keyboard activation, focus containment/restoration, Escape, background inert,
  mobile navigation containment and reduced-motion alternatives are supported.

## Verified vs unverified

Verified against code/API: all 15 group IDs, 54 seat IDs, capacities, area names,
relative schematic grid locations, guest/date/time rules and pending workflow.
The original café photographs show wood tables, cane chairs, planting and indoor/
rooftop areas. Existing area photos remain untouched and are labelled previews.

Unverified physical details: exact coordinates/dimensions, furniture shape at each
named group, floor finish, planting/railing positions and entrance geometry.
The existing bottom entry/orientation convention is retained as schematic only.
Exact table photographs and owner-surveyed plan are unavailable. No live
availability, views or exact-table photographic match is claimed.

## Verification commands

```sh
npm run check
node scripts/verify-reservation-redesign-business.mjs after
node scripts/review-reservation-experience.mjs
```

Browser scripts run the real CRM against disposable temporary SQLite databases.
They never use the production database. Existing tests remain unchanged. Browser
recordings/screenshots/reports live in `artifacts/reservation-redesign/`.
