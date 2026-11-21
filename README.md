# Mangosteen Cafe

A single-page cafe website built with React, TypeScript, Vite, and Three.js. The
menu, cafe facts and scene data are static frontend assets. Reservation requests
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

## Structure

```text
src/
  app/          App entry composition
  components/   Cinematic WebGL scene, accessible dialogs, gallery, and scroll reveal
  data/         Cafe details, gallery captions, and the full menu listing
  pages/        Single-page cafe experience
  scene3d/      Photographic media and camera keyframes
  styles/       Responsive site styles, motion, and reduced-motion rules
docs/           3D architecture and Blender handoff specification
public/images/highres/  Four supplied, unmodified 8K Mangosteen photographs
public/images/experience/  Two generated opening reconstructions based on supplied photos
public/assets/3d/ Optional GLB handoff paths and Blender export notes
CRM/          Local SQLite-backed guest CRM and operations documentation
```

The opening is a single scroll-driven film viewport. It begins in darkness, reveals a clearer generated reconstruction of the Mangosteen exterior, cuts to a similarly reconstructed dining room and table, then lets the visitor **Take your seat**. These two scenes use the supplied café photos as reference; they are interpretations, not exact documentary photographs. That action moves the WebGL camera closer, cuts to a real dish photograph, and opens the accessible searchable HTML menu. There is no physical menu-card model on the table. The remaining page sections retain the real café photography and information, with an opening-image fallback if WebGL is unavailable.

Cafe photos are from the public [Mangosteen Cafe Zomato gallery](https://www.zomato.com/indore/mangosteen-cafe-by-pass-road-north/photos). Menu names and indicative prices come from the [public 131-item listing](https://indiarestros.com/r/mangosteen-cafe-bhichaulimardana-2hgmr68h2t/menu), updated October 16, 2026; the cafe should confirm current prices before publication. Cafe facts are static values in `src/data/cafe.ts`.

The site also includes a real-photo gallery dialog, cafe overview and visit links, structured metadata, and a branded scene loading screen. The seat selector in `src/components/ReservationDialog.tsx` uses editable schematic positions in `src/data/seating.ts`. It collects guest contact details, sends the selected area and seats to the CRM, and returns a reference number. This is still a request—not live inventory or automatic confirmation. If the CRM is unavailable, the website clearly reports that the request was not sent and stores a local fallback copy. The owner must still supply a surveyed floor plan before exact seat availability can be promised. Future selective GLB assets are documented in `public/assets/3d/README.md`; currently there are no authored café or food models in the repository.
