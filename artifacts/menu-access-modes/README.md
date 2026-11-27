# Website preview and table QR ordering

Checkpoint before this change: 44b99ad.

Normal website menu routes, including category/dish deep links, search, favourites and direct selection URLs, are browse-only. Add/quantity controls, My List navigation, selection summary and checkout are not rendered without a recognized table code. Direct selection URLs without a valid table redirect to categories. Search, favourites and full dish details remain available. Existing QR selections stay hidden and are not overwritten during normal browsing.

Recognized table QR routes retain the existing selection and ordering workflow. Both `/m?table=4` and `/menu?table=4` open categories directly with Table 4 context. QR context persists through category navigation, dish details, My List and the demo order request.

Verification: `node scripts/verify-menu-access.mjs` passed. 32 preview route/viewport combinations across 320/390/768/1440px; all 131 dishes retained; no horizontal overflow or browser errors. Search/favourites/detail/drawer checks pass. QR quantity changes, totals, reload persistence and a complete order submission pass using a temporary, disposable CRM database. No live order submitted. Matching 390px screenshots show preview versus QR controls.

`npm run build` passed, including public assets. `npm test` passed all 9 existing backend tests. Homepage, reservation, dataset, backend and API files were not changed. No deployment.

Storage: ENOSPC initially blocked edits. Cleared only 14,400 verified regenerable HTTP cache files (783,061,338 logical bytes) from `/Users/shekharchouhan/Library/Caches/Google/Chrome/Profile 3/Cache/Cache_Data`, covered by the previously approved Batch A. Exact canonical path, Chromium cache headers and no lsof handles verified first. Latest cache-file timestamp: 2026-10-13. Unknown `index` and `index-dir` skipped. Browser settings/history/cookies and all source/photos/databases retained. Observed free space increased from 116 MiB to 904 MiB before build/tests.
