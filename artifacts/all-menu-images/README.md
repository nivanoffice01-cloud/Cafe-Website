# Complete menu image update

Checkpoint: 6e8fea4. Scope: digital-menu imagery only.

All 131 catalogue entries now resolve to distinct, loaded, labelled images: 126 newly generated, item-specific illustrations and five retained matched reference photos. Existing category art is unchanged. Genuine venue food photos retain the highest priority when supplied. AI illustrations are disclosed on thumbnails and in dish details; none is presented as a genuine Mangosteen serving. Names, descriptions, prices and dietary/business metadata are unchanged. The authoritative catalogue Git blob is unchanged: `12f6c14c289e15cbb2a3ba5c918aaff91ec9f5c7`.

Visual review: three final contact sheets cover all 126 new selected images. Additional intermediate sheets document review. The initial Classic Chicken Sendwich output incorrectly resembled a burger; the selected v2 illustration uses sliced sandwich bread. The original output is retained, and the correction is registered in `assets/menu-illustrations/corrections.json`.

Browser verification (`node scripts/verify-all-dish-images.mjs`):
- All 131 exact catalogue entries, prices, independent image paths, disclosure labels and image decodes pass.
- All 126 new thumbnail hashes differ; no unrelated repeated category art substitutes for a named dish.
- List imagery is lazy by default; tests explicitly request all images to validate completeness.
- 320/390/768/1440px burger/sandwich layouts have no placeholders or horizontal overflow.
- Generated-image search, details and My List preserve Table 4 context and matched imagery.
- No JavaScript or console errors.

Screenshots: `burgers-390.png` is a full mobile category capture; `burgers-320.png`, `burgers-768.png`, and `burgers-1440.png` cover other sizes. `sandwich-details.png` shows the QR detail sheet. The existing menu access-mode screenshots were updated with the new pizza illustrations.

Regression (`node scripts/verify-menu-access.mjs`): 32 preview route/viewport combinations pass. Website entry remains browse-only. Both QR aliases retain selection, totals, persistence and a complete demo order submission using a disposable CRM. No live order submitted. `npm run build` passed, including all public images; `npm test` passed all 9 existing backend tests.

Delivery: responsive 320px/800px WebP files. Selected derivative total: 11,260,512 bytes across both sizes; median thumbnail: 14,999 bytes, maximum: 24,304 bytes. Median larger detail image: 70,589 bytes. These are file-size measurements, not Core Web Vitals claims; the browser does not load the complete library initially.

Storage cleanup: `cache-cleanup.json` records only verified, inactive HTTP cache files from Chrome Profiles 8 and 10, within previously authorized Batch A. Canonical paths, Chromium cache headers, age and absence of open handles were checked. Index files/directories were skipped. Original photographs, source code, Git history, databases, browser settings and existing website assets were preserved.

No homepage, reservation, CRM/backend, authentication or ordering rules changed. No deployment.
