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

## Verify

```sh
npm run check
```

This builds the website and runs the CRM integration tests against an isolated
temporary database.

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
public/images/experience/  Restored editorial exterior/table images, dish photo, and video poster
public/media/        Supplied portrait café film
public/assets/3d/ Optional GLB handoff paths and Blender export notes
CRM/          Local SQLite-backed guest CRM and operations documentation
```

The opening is a single scroll-driven film viewport. It begins in darkness, reveals a restored editorial version of the supplied Mangosteen exterior photo, cuts to a restored version of the supplied interior table photo, then lets the visitor **Take your seat**. That action moves the WebGL camera closer, cuts to a real dish photograph, and opens the accessible searchable HTML menu. There is no physical menu-card model on the table. The gallery retains the unmodified café photographs; the large opening, review, and visit visuals use the restored versions. A photographic fallback appears if WebGL is unavailable. Menu and Reserve shortcuts stay available during the sequence.

The supplied 30-second portrait video is in the gallery with a visitor-controlled Play/Pause button and no autoplay. Its 360×640 source is suited to a small frame, not a full-screen hero. The four new 141-pixel-wide JPG thumbnails were not used because they would blur at display size. The 8K photo files have large dimensions but limited original detail. The opening and large editorial placements use AI-assisted restorations made from the supplied exterior and table photos. These improve perceived clarity, but are 1673×940 and 1537×1023, respectively, and may reinterpret fine details. The original files remain available in `public/images/highres/` and in the gallery. A sharper exterior and table shoot would improve the opening most.

Cafe photos are from the public [Mangosteen Cafe Zomato gallery](https://www.zomato.com/indore/mangosteen-cafe-by-pass-road-north/photos). Menu names and indicative prices come from the [public 131-item listing](https://indiarestros.com/r/mangosteen-cafe-bhichaulimardana-2hgmr68h2t/menu), updated October 16, 2026; the cafe should confirm current prices before publication. Cafe facts are static values in `src/data/cafe.ts`.

The site also includes a real-photo gallery dialog, cafe overview and visit links, structured metadata, and a branded scene loading screen. The seat selector in `src/components/ReservationDialog.tsx` uses editable schematic positions in `src/data/seating.ts`. It collects guest contact details, sends the selected area and seats to the CRM, and returns a reference number. This is still a request—not live inventory or automatic confirmation. If the CRM is unavailable, the website clearly reports that the request was not sent and stores a local fallback copy. The owner must still supply a surveyed floor plan before exact seat availability can be promised. Future selective GLB assets are documented in `public/assets/3d/README.md`; currently there are no authored café or food models in the repository.

## QR table ordering demo

`/menu` is a lightweight, mobile-first ordering page that reuses the shared menu catalogue without loading the cinematic homepage. The physical Table 4 QR opens `/menu?table=4`. Guests can search, add quantities, leave a kitchen note, and complete a clearly labelled demo UPI or card payment. No real payment details are requested or processed. The resulting ticket is written to the CRM with `Kitchen` status and a `Demo UPI` or `Demo card` marker.

`npm run generate:qr` creates the separate physical assets `artifacts/table-4-order-qr.png` and `artifacts/table-4-order-qr.svg`; they are deliberately outside `public/` and are not displayed or served by the website. A guest can browse the generic menu, but ordering is enabled only from the recognized Table 4 URL and is validated again by the CRM API. Set `MENU_QR_URL` when generating the code for a different production domain. Confirm the public menu, prices, dietary labels, service-charge policy, and physical table identifier with the café before printing.
