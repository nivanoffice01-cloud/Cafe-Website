# Interactive reservation controls

Inspect: http://localhost:5173/contact#book

Checkpoint: `checkpoint/reservation-controls-before-baa930a` (`baa930a`).

The four native dropdown presentations are replaced with:

- Genuine photo choices for rooftop/indoor seating.
- Calendar with month navigation and exactly the original 14-day request window.
- Five existing arrival times as selectable buttons.
- Guest +/- counter, retaining the original 1–6 limit and capacity filtering.

Desktop uses anchored pickers; mobile uses safe-area-aware bottom sheets. Native
HTML dialogs render above clipping/animation layers. Outside dismissal, Escape,
explicit Tab containment, arrow navigation for dates, focus restoration and
reduced-motion support are covered. No additional dependency or animation engine.

Reselecting the current area preserves seats. Actual area/guest changes use the
original callbacks and clear preferences as before. Date/time changes, pending
confirmation, validation, request idempotency and backend integration are retained.
The seating map, chair assets, coordinates, menu, homepage and CRM are unchanged.

`src/features/reservations/BookingControls.tsx` contains the picker UI. Parent
`ReservationDialog.tsx` changes are limited to importing/rendering that component
with the original state and callbacks. The submission function is byte-identical.

Verification: `node scripts/verify-booking-controls.mjs`.

- 320×568, 390×844, 768×1024, 1024×768, 1440×1000.
- All pickers fit the viewport without horizontal overflow.
- Date bounds/month navigation, guest limits, selection, focus loop, Escape,
  backdrop dismissal and details/back persistence pass.
- Real reservation API submission verified through a disposable SQLite CRM;
  date, 20:00 time, four guests and D2-1…D2-4 arrive with a Pending receipt.
- No JavaScript/console errors in the browser run.
- Production build, TypeScript and all nine existing backend tests pass.

Results: `results.json`; build/tests: `build-and-tests.log`.
Screenshots: `area-*`, `date-*`, `time-*`, `guests-*` (desktop/mobile).
No deployment. Existing untracked `FullMenuDialog.tsx` remains untouched.
