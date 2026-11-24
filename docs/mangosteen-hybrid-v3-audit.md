# Mangosteen Hybrid V3 — Stage 1 Audit

## Recovery decision

- Stable visual foundation: `8987e76` (`Separate mobile menu filter rows`).
- First experimental redesign: `09a8c80` (`Elevate luxury hospitality experience`).
- Preserved experimental state: `backup/mangosteen-experimental-03a6955`.
- Development branch: `mangosteen-hybrid-v3`.
- Production branch remains unchanged at `03a6955`.

The stable foundation retains the original cinematic arrival, ivory editorial section, dark signature-food treatment, menu architecture, gallery, reviews, location section, CRM, QR ordering, Vercel API routes, reservation logic, table selection, map integration and SEO structure.

## Functional changes retained from the later work

- Accurate public rating source, hours and price-range wording.
- Updated structured data and page description.
- Dish-specific menu imagery is distinguished from category imagery.
- Expanded genuine café gallery inventory.
- Reservation-area previews and clear preferred-table language.
- Existing ordering, reservation and CRM request logic is unchanged.

## Existing photographic assets suitable for Stage 2

| Asset | Dimensions | Intended use |
| --- | ---: | --- |
| `public/images/highres/mangosteen_original_4_8k.jpg` | 7680 × 4314 | Desktop hero architecture and warm evening light |
| `public/images/highres/mangosteen_original_1_8k.jpg` | 7680 × 5116 | Alternate golden-hour atmosphere |
| `public/images/highres/mangosteen_original_3_8k.jpg` | 7680 × 5760 | Alternate interior atmosphere |
| `public/images/experience/mangosteen-arrival-enhanced.jpg` | 1673 × 940 | Static fallback and compact desktop fallback |
| `public/images/mobile/mangosteen-arrival-mobile.jpg` | 1100 × 618 | Existing mobile fallback; landscape crop is not ideal for a full-height mobile hero |
| `public/images/gallery/cafe-06.png` | 1032 × 1282 | Portrait rooftop reference for later editorial sections |
| `public/images/gallery/cafe-07.jpg` | 1545 × 1030 | Interior reference for later editorial sections |
| `public/images/gallery/cafe-14.png` | 1960 × 1292 | Daylight atmosphere reference |

## Stage 2 asset constraint

The repository does not contain owner-supplied transparent botanical foreground photography. The generated leaf cutouts from the experimental branch are intentionally not restored because they read as pasted decoration and conflict with the hybrid brief.

Required future asset:

| Filename | Required dimensions | Format | Section | Transparency | Composition and lighting | Depth layer |
| --- | ---: | --- | --- | --- | --- | --- |
| `mangosteen-botanical-foreground-left.webp` | 1800 × 2200 minimum | WebP | Hero | Yes | Genuine tropical foliage photographed at Mangosteen, edge entering from upper-left, warm light from upper-right | Foreground |
| `mangosteen-botanical-foreground-right.webp` | 1600 × 2000 minimum | WebP | Hero | Yes | Genuine café foliage entering from lower-right, restrained silhouette, warm rim light | Foreground |
| `mangosteen-hero-mobile-portrait.webp` | 1440 × 1920 minimum | WebP/AVIF | Mobile hero | No | Genuine café architecture with clean negative space in the upper-left for headline copy | Background |

Until these genuine assets are supplied, the hybrid hero uses the greenery already present inside authentic café photography and restrained photographic depth. It does not fabricate architecture or add generic decorative leaves.
