# Premium header refinement — 26 November 2026

The existing marketing header now uses the exact Mangosteen signature artwork from CRM/dist/assets/mangosteen-brand-lockup.png. Original admin asset is unchanged. A transparent WebP derivative trims empty padding and reduces dimensions to 780×189; the ivory treatment uses the same monochrome CSS approach as the admin sidebar.

Refined forest-green surface, warm hairline border, restrained shadow, logo/caption spacing, link hover and active underlines, reservation button proportions and mobile menu treatment. Existing header height remains 76px, preserving hero and scroll offsets. Existing routes, page transitions, reservation entry and mobile keyboard handling are retained.

Chrome checks passed at 320, 390, 768, 1024, 1440 and 1920px. Logo loads at every width, no horizontal overflow, mobile menu opens/closes with Escape, Our Story navigation works and reservation entry opens. No JavaScript errors. Production build and TypeScript pass. See results.json and same-viewport before/after header screenshots.

Only header presentation, its stylesheet import and the derived logo changed. Menu, hero animation, reservation logic, CRM and backend remain unchanged. Nothing deployed.
