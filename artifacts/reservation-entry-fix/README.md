# Existing booking entry — stylesheet ownership fix

Inspect: http://localhost:5173/contact#book

Checkpoint: `checkpoint/booking-entry-before-de3333c` (`de3333c`).

The reported screenshot mixes the new booking controls with obsolete dark-modal
styling. Fresh sessions and native Chrome inspection showed the current full-screen
experience at the existing reservation entry. No separate old reservation route
or second active booking implementation was found.

The reservation component now imports its own complete stylesheet; the global
import is removed from `src/main.tsx`. Its appearance no longer depends solely on
an app-entry stylesheet import. Every caller receives the same full-screen
reservation, photographic seating map and four interactive pickers. There is no
new route, booking system, data model or redesign in this fix.

Verified on both `localhost:5173` and `127.0.0.1:5173`:

- Homepage header booking action.
- Contact-page reservation button.
- Direct `/contact#book` access.
- Mobile navigation booking action.
- Four correctly styled controls and working area picker.
- Ivory full-viewport layout, no old photographic header pseudo-element.
- No browser runtime errors.

Fresh-source captures are in `before-*`; these do not reproduce the user's stale
screen. Verified final screenshots are `after-*`. Raw metrics: `results.json`.

Run `node scripts/verify-reservation-entry.mjs`. `npm run check` passes the
production build, TypeScript, CRM JavaScript syntax and all nine backend tests.
No business handlers, seating configuration, menu, CRM or backend were changed.
No deployment. The user's untracked `FullMenuDialog.tsx` remains untouched.
