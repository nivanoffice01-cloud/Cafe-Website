# Mangosteen digital menu — implementation and visual review

26 November 2026. Local implementation only; nothing deployed.

## Inspect

- Digital menu: http://localhost:5173/menu
- Table 4 QR flow: http://localhost:5173/menu?table=4 (opens categories directly)
- Visual review: http://localhost:5173/artifacts/menu-premium-v3/review.html
- [Screenshot review](review.html), including all nine required mobile screens, tablet, desktop and before/after captures.

## Implemented

The digital menu has a compact forest-green header, centred brand, favourites and My List controls; a genuine-food landing hero with an SVG cream curve; six initial category shortcuts; all-category banners; compact cream dish lists; a native mobile detail sheet; search; saved favourites; persistent selection; and equivalent desktop navigation. Mobile navigation has exactly the existing five destinations and safe-area spacing. The desktop layout uses larger compositions and multi-column dish lists rather than stretching a phone screen.

The authoritative catalogue remains 131 dishes in 13 categories. Every dish name, price and available description was compared against the existing dataset. No catalogue or business metadata was added. Dietary/bestseller filters and badges are omitted because the dataset provides no verified classifications.

Existing persistence keys, quantity limits, order payload, table identifiers, demo payment method, totals/service-charge calculation and submission API are retained. Direct category links, legacy dish query links, the /m QR alias, table context, search, back navigation and scroll restoration work. Sheet and drawer support Escape, focus containment, focus restoration and scroll locking. Reduced motion removes animations.

## Photographic limitations — visual approval remains open

The reference's photographic appearance is **not yet matched**. No retained food photograph has a verified match to an individual named menu dish or category. The existing category portraits are AI illustrations; five dish images are stock references; mango-dish.jpg has unverified provenance. None is used in this redesigned menu.

The landing hero uses the genuine retained story-food photograph without assigning it a dish name. Its composition differs from the reference burger/pasta hero. All 13 category images and all 131 dish images use explicitly labelled neutral placeholders until matched genuine photographs are available. There are no false bestseller badges or dietary labels. Decorative foreground greenery is not added without suitable photographic layers.

The placeholder geometry, category layout, cropping slots, responsive sources, lazy loading and image failure states are ready for approved photography. Register exact category/name matches in src/features/digital-menu/photography.ts. See [photography-audit.json](photography-audit.json) for each dish's exact source data and required filename, and [ASSET_REQUIREMENTS.md](../../src/features/digital-menu/ASSET_REQUIREMENTS.md) for dimensions and composition. No original photograph, homepage photo mapping or other website asset was altered.

## Verification

- Production build and TypeScript: passed via npm run check.
- Existing backend tests: all 9 passed; CRM JavaScript syntax check passed.
- Browser suite: scripts/verify-premium-menu.mjs; [results](browser-results.json).
- All 13 category routes and all 131 dish names, prices and descriptions verified.
- Search, favourites persistence/removal, selection quantities/reload/empty states, full descriptions, QR aliases and table context verified.
- Table 4 demo order sent through the real API to a disposable CRM database; owner login/order queue confirmed its actual receipt.
- Existing reservation interface selected the original seats and submitted a pending request to the same disposable CRM; reservation queue confirmed receipt. The real database was never used for these submissions.
- 72 route/viewport checks: 320×568, 360×800, 375×667, 390×844, 393×852, 414×896, 430×932, 768×1024, 1024×768, 1440×1000, 1920×1080 and 844×390. No horizontal page overflow, broken images, JavaScript errors, console errors or failed HTTP responses.
- Keyboard sheet/drawer containment, Escape, restored focus, back/scroll restoration and reduced motion verified.
- SHA-256 baseline confirms 273 existing non-menu files unchanged, including homepage, reservations, original assets, catalogue, APIs, CRM and authentication. Existing untracked FullMenuDialog.tsx remains untouched.

## Measured production-preview performance

Three cold runs per route. Chrome mobile emulation at 390×844, DPR 2, 4× CPU slowdown, 6 Mbps download / 2 Mbps upload / 80 ms latency. These are local lab results, not real-device or field Core Web Vitals. Preview serves uncompressed files; production CDN compression may differ.

| Metric | Menu landing | Table 4 direct categories |
|---|---:|---:|
| Observed LCP | 744–752 ms | 696–876 ms |
| Initial transferred bytes | 486,914 | 271,863–272,018 |
| CLS | 0.0666–0.0942 | 0.0016–0.0017 |
| 95th percentile frame interval | 16.7–16.8 ms | 16.7–16.8 ms |
| Sampled frame intervals over 33 ms | 0 | 0 |
| Longest measured interaction duration | 56 ms | 80 ms |
| Long tasks during tested interactions | 0 | 1 per run, maximum 59 ms |

Initial measurements taken while the viewport matrix ran had network/load outliers. The final measurements above were repeated after that load subsided. Do not extrapolate the present transfer/paint measurements to future full photographic content: category and dish slots currently use neutral placeholders. A real low-end mobile device, iOS Safari, Android Chrome and field INP remain unverified. [Raw measurements](performance.json), [summary](performance-summary.json). Reproduce with node scripts/measure-premium-menu.mjs against a local production preview on port 5181.

## Changes and recovery

Active branch: mangosteen-authentic-content.
Recoverable checkpoint: checkpoint/menu-redesign-before-2e741c3 → 2e741c3.

Modified existing source:
- src/pages/MenuExperiencePage.tsx

Added menu-only source/documentation:
- src/features/digital-menu/menu.css
- src/features/digital-menu/photography.ts
- src/features/digital-menu/ASSET_REQUIREMENTS.md

Added verification:
- scripts/verify-premium-menu.mjs
- scripts/measure-premium-menu.mjs
- artifacts/menu-premium-v3/ — screenshots, baseline hashes, photo audit, measurements, build/test logs and this report.

No dependencies, homepage, navigation outside the menu, reservation source, backend, databases, integrations or deployment configuration were changed. Visual review is pending, especially replacement of photographic placeholders.
