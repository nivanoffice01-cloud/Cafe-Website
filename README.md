# Mangosteen Cafe

A React, TypeScript and Vite application with a clean temporary marketing
homepage and the approved digital menu. All rejected marketing experiments are
archived; no animation engine is installed. The menu and cafe facts remain
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

## Clean frontend foundation

Active branch: `mangosteen-clean-rebuild`.
Legacy backup: `mangosteen-legacy-frontend-backup` at `a89e67c`.

```text
src/app/                       Minimal route selection; no transition wrapper
src/features/marketing/        Isolated holding page and empty future boundaries
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
```

`/` contains only the existing logo, Explore Menu and Reserve a Table actions.
`/menu`, `/menu/*` and `/m` retain their existing behaviour. Removed
`/experience`, `/reference-experience` and `/claude-vfx-lab` registrations now
fall back to the holding page. The previous food VFX and cinematic experiences
are not part of the active application.

Legacy source, shaders, generated layers, models and materials also remain in
`archives/rejected-frontends/complete-reset-2026-11-25/` locally. The earlier
cinematic archive is untouched. Previous branches and history are preserved.

Run `node scripts/verify-clean-rebuild.mjs after` with Vite running to check
protected browser workflows using a disposable CRM database. It never submits
test orders or reservations to production. The pre-existing phone-field pattern
warning is explicitly reported rather than silently changed by the reset.
`npm run build:vercel` checks the build and CRM client packaging without deployment.

See `artifacts/mangosteen-clean-rebuild/asset-inventory.html` for labelled photo
contact sheets. Stock food photographs and AI imagery are separated from the
supplied cafe source photographs. Existing `*-enhanced.jpg` images are AI-assisted
restorations, not camera originals. The supplied portrait cafe film and all
originals remain unchanged.

Cafe photos are from the public [Mangosteen Cafe Zomato gallery](https://www.zomato.com/indore/mangosteen-cafe-by-pass-road-north/photos). Menu names and indicative prices come from the [public 131-item listing](https://indiarestros.com/r/mangosteen-cafe-bhichaulimardana-2hgmr68h2t/menu), updated October 16, 2026; the cafe should confirm current prices before publication. Cafe facts are static values in `src/data/cafe.ts`.

The site also includes a real-photo gallery dialog, cafe overview and visit links, structured metadata, and a branded scene loading screen. The seat selector in `src/components/ReservationDialog.tsx` uses editable schematic positions in `src/data/seating.ts`. It collects guest contact details, sends the selected area and seats to the CRM, and returns a reference number. This is still a request—not live inventory or automatic confirmation. If the CRM is unavailable, the website clearly reports that the request was not sent and stores a local fallback copy. The owner must still supply a surveyed floor plan before exact seat availability can be promised. Future selective GLB assets are documented in `public/assets/3d/README.md`; currently there are no authored café or food models in the repository.

## QR table ordering demo

`/menu` is a lightweight, mobile-first ordering page that reuses the shared menu catalogue without an introductory marketing experience. The physical Table 4 QR opens `/menu?table=4`. Guests can search, browse the category grid, add quantities, leave a kitchen note, and complete the clearly labelled demo payment. No real payment details are requested or processed. The resulting ticket is written to the CRM with `Kitchen` status and a `Demo UPI` or `Demo card` marker.

`npm run generate:qr` creates the separate physical assets `artifacts/table-4-order-qr.png` and `artifacts/table-4-order-qr.svg`; they are deliberately outside `public/` and are not displayed or served by the website. A guest can browse the generic menu, but ordering is enabled only from the recognized Table 4 URL and is validated again by the CRM API. Set `MENU_QR_URL` when generating the code for a different production domain. Confirm the public menu, prices, dietary labels, service-charge policy, and physical table identifier with the café before printing.
