# Café typography system — 26 November 2026

Applied one consistent guest-facing hierarchy across the homepage, story, café, contact, digital menu, dish details and reservation experience.

- Lora variable regular/italic for warm editorial headings and restrained accents. Weight 400 replaces the previous very light display treatment.
- Existing Manrope for body text, navigation, dish names, labels and forms. More comfortable line heights and less widely tracked labels/buttons.
- Existing local Mangosteen Price font for the rupee symbol and digits together, preserving baseline alignment.
- Existing admin-panel signature logo artwork unchanged. The separate CRM/admin application was not restyled.

The shared rules live in src/styles/typography.css. Font family, heading weight/tracking, body leading and label tracking are reusable CSS tokens. Responsive sizes preserve the established page structure and recently approved mobile artwork placement. Content, prices, categories, routes, booking rules and backend logic are unchanged.

## Fonts and loading

Lora regular: 37,792 bytes; italic: 40,648 bytes. Both are self-hosted WebP-independent WOFF2 files under public/fonts/lora/. Their SIL Open Font License is included as OFL.txt. The original Google Fonts CSS responses are recorded in source-css.txt; official family: https://fonts.google.com/specimen/Lora and licence source: https://raw.githubusercontent.com/google/fonts/main/ofl/lora/OFL.txt.

The remote Google Fonts stylesheet/preconnects were removed from index.html. The primary local serif is preloaded; existing local font definitions now load with the application. Browser checks confirmed that all main-document font requests remain on the local origin.

## Verification

- Production build and TypeScript: passed, build.log.
- Existing tests: 9 passed, backend-tests.log. CRM JavaScript syntax check passed.
- 50 page/viewport combinations at 320 / 390 / 768 / 1024 / 1440px: no horizontal page overflow; Lora and Manrope loaded.
- Menu search, favourite action, detail sheet, My List totals and Table 4 QR context passed. No order submitted.
- Reservation opening, area switching, guest-count control and closing passed. No reservation submitted.
- No JavaScript errors or external main-document font requests. See results.json.
- Before/after screenshots for primary pages, plus final booking, selection and six cinematic frames on 393px and 320px phones. Physical Safari/Android hardware was not tested.

Recoverable checkpoint: checkpoint/before-cafe-typography-747a411 → 747a411. Existing untracked FullMenuDialog.tsx remains untouched.

## Storage recovery

Storage was blocking writes. Under the existing Batch A cache authorization, only the inactive Chrome Profile 9 HTTP Cache_Data directory was removed. Canonical path, lack of symlinks/open handles, standard Chromium cache headers and a single zero-byte entry were verified before removal. History, cookies, actual browser profiles/settings, databases and project assets were preserved. Observed free space increased from 146,919,424 to 980,062,208 bytes. See cache-cleanup.json for the exact path and measurements.

Local URL: http://localhost:5173/
Menu: http://localhost:5173/menu
Nothing deployed.
