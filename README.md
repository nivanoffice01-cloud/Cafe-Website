# Mangosteen Cafe

A React, TypeScript and Vite application with an isolated cinematic marketing
homepage and the approved digital menu. The active homepage restores the supplied
Mangosteen frontend, including its reversible canvas burger sequence and editorial
poster compositions. Its styles are scoped; the existing business UI stays separate.
The menu and cafe facts remain
existing frontend data. Reservation requests
are sent to the separate SQLite-backed CRM in `CRM/` and enter its reservation
queue as **Pending** for staff confirmation.

The repository also contains the separate, local-first customer relationship
management application in [`CRM/`](CRM/README.md). The public cafe website and
the private CRM have independent startup commands and dependencies.

## Run locally

```sh
npm install
npm run dev
```

In a second terminal, start the CRM first:

```sh
cd CRM
./run-local.sh
```

Vite proxies `/crm-api` to `http://127.0.0.1:4173` during local development.
For deployment, set `VITE_CRM_API_URL` to the public CRM API origin or configure
the same `/crm-api` reverse-proxy path.

## Build

```sh
npm run build
```

## Verify

```sh
npm run check
```

This builds the website and runs the CRM integration tests against an isolated
temporary database.

## Marketing architecture and recovery

Current branch: `mangosteen-authentic-content`.
Approved design checkpoint: `checkpoint/approved-design-d7a8e55` at `d7a8e55`.
Design restoration branch: `mangosteen-supplied-frontend`.
Previous cinematic branch: `mangosteen-clean-rebuild`.
Legacy backup: `mangosteen-legacy-frontend-backup` at `a89e67c`.
Clean foundation: `checkpoint/clean-foundation-080966f` at `080966f`.
First implementation milestone: `8767a96`.

The subsequent supplied-design restoration is on `mangosteen-supplied-frontend`.
Its backup is `checkpoint/before-supplied-frontend-c035d43` at `c035d43`.
See [the restoration notes](src/features/supplied-frontend/README.md) and
`artifacts/supplied-frontend-review/` for the current implementation and evidence.

The content update replaces the café imagery with retained original photographs
without changing the approved design or animation. Its comparison, verified
business sources and complete missing-food-photo inventory are in
`artifacts/mangosteen-authentic-content-review/`. All 131 dish records and 13
categories remain the existing indicative catalogue. Genuine named dish photos,
current owner-approved prices, missing descriptions and dietary details still
need the café's source material; no food identity was guessed from photographs.

```text
src/app/                       Minimal route selection; no transition wrapper
src/features/marketing/        Preserved inactive previous marketing implementation
src/features/supplied-frontend/  Active supplied design with protected business adapters
src/pages/MenuExperiencePage.tsx  Protected approved digital menu
src/components/ReservationDialog.tsx  Protected reservation interface
src/data/                      Existing menu, seating and business information
src/lib/                       Reservation and order API clients
src/styles/                    Protected menu/reservation styles and shared reset
CRM/                           Private CRM, SQLite backend and functional tests
api/                           Existing hosted API and shared menu data
public/images/                 Retained genuine photos, labelled derivatives and menu imagery
public/media/                  Retained supplied cafe film
assets/food-vfx/                Preserved Blender source/studio; not loaded by the website
artifacts/mangosteen-clean-rebuild/  Inventory, contact sheets and regression evidence
artifacts/mangosteen-clean-rebuild-review/  New homepage motion recordings and verification
```

`/` contains the supplied burger animation, editorial story, horizontal menu
preview, craft composition, ingredient artwork and café visit section. `/about`,
`/locations` and `/contact` use the supplied supporting page designs.
`/menu`, `/menu/*` and `/m` retain their existing behaviour. Removed
`/experience`, `/reference-experience` and `/claude-vfx-lab` registrations now
fall back to the homepage. The previous food VFX and cinematic experiences
are not part of the active application.

Legacy source, shaders, generated layers, models and materials also remain in
`archives/rejected-frontends/complete-reset-2026-11-25/` locally. The earlier
cinematic archive is untouched. Previous branches and history are preserved.

Run `node scripts/verify-supplied-frontend-business.mjs after` with Vite running to check
protected browser workflows using a disposable CRM database. It never submits
test orders or reservations to production. The pre-existing phone-field pattern
warning is explicitly reported rather than silently changed by the reset.
`npm run build:vercel` checks the build and CRM client packaging without deployment.
Run `node scripts/review-supplied-frontend.mjs` with Vite on
`http://127.0.0.1:5173` for desktop/mobile motion recordings and checks.
Open `artifacts/supplied-frontend-review/index.html` for the current review.
The older `mangosteen-clean-rebuild-review` directory preserves the previous version.

See `artifacts/mangosteen-clean-rebuild/asset-inventory.html` for labelled photo
contact sheets. Stock food photographs and AI imagery are separated from the
supplied cafe source photographs. Existing `*-enhanced.jpg` images are AI-assisted
restorations, not camera originals. The supplied portrait cafe film and all
originals remain unchanged.

Cafe photos are from the public [Mangosteen Cafe Zomato gallery](https://www.zomato.com/indore/mangosteen-cafe-by-pass-road-north/photos). Menu names and indicative prices come from the [public 131-item listing](https://indiarestros.com/r/mangosteen-cafe-bhichaulimardana-2hgmr68h2t/menu), updated October 16, 2026; the cafe should confirm current prices before publication. Cafe facts are static values in `src/data/cafe.ts`.

The site also includes a real-photo gallery dialog, cafe overview and visit links,
and structured metadata. The seat selector in `src/components/ReservationDialog.tsx`
uses editable schematic positions in `src/data/seating.ts`. It collects guest contact
details, sends the selected area and seats to the CRM, and returns a reference number.
This remains a request, not live inventory or automatic confirmation. If the CRM is
unavailable, the website reports that the request was not sent and stores a local
fallback copy. A surveyed floor plan is still required before exact seat availability
can be promised. Preserved experimental models are not loaded by the new homepage.

## QR table ordering demo

`/menu` is a lightweight, mobile-first ordering page that reuses the shared menu catalogue without an introductory marketing experience. The physical Table 4 QR opens `/menu?table=4`. Guests can search, browse the category grid, add quantities, leave a kitchen note, and complete the clearly labelled demo payment. No real payment details are requested or processed. The resulting ticket is written to the CRM with `Kitchen` status and a `Demo UPI` or `Demo card` marker.

`npm run generate:qr` creates the separate physical assets `artifacts/table-4-order-qr.png` and `artifacts/table-4-order-qr.svg`; they are deliberately outside `public/` and are not displayed or served by the website. A guest can browse the generic menu, but ordering is enabled only from the recognized Table 4 URL and is validated again by the CRM API. Set `MENU_QR_URL` when generating the code for a different production domain. Confirm the public menu, prices, dietary labels, service-charge policy, and physical table identifier with the café before printing.
