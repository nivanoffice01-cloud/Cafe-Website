# Clean marketing boundary

Only the static temporary holding page is implemented. The other directories are intentionally empty boundaries for the future design, not an animation scaffold.

Menu routes remain in `src/pages/MenuExperiencePage.tsx`; reservations remain in `src/components/ReservationDialog.tsx`. Their CSS, data and API clients are protected. CRM and backend continue independently.

Marketing styles are imported locally and must be class-scoped. Do not add global scroll controllers or route wrappers around business interfaces.

Legacy implementation: branch `mangosteen-legacy-frontend-backup`, commit `a89e67c`. Local archived source/assets: `archives/rejected-frontends/complete-reset-2026-11-25/`. Prior cinematic sequences remain in the existing sibling archive.
