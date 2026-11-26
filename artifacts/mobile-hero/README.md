# Responsive hero refinement — 26 November 2026

The existing hero now has a dedicated phone/tablet composition: heading and tagline above, the existing animated burger in a separate visual slot, and two touch-sized actions below. The hero and GSAP pin spacer follow the live viewport/container width. Canvas sizing responds to its own layout bounds. Short portrait screens and mobile landscape receive separate arrangements. The original admin-panel logo is retained.

Mobile/tablet navigation now shows a single hamburger control, with desktop links reserved for widths of 1024px and above. Story typography and spacing are more compact at smaller widths. The decorative scroll hint cannot intercept taps.

Existing burger assets, assembly frames, scroll synchronization and reversible playback are preserved. Desktop geometry remains unchanged at standard desktop sizes. No menu, QR, reservation business logic, CRM, database or API files were changed.

## Verification

Chrome screenshots and automated checks at 320×568, 360×800, 375×667, 390×844, 393×852, 414×896, 430×932, 768×1024, 844×390, 568×320, 1024×768 and 1440×900. No horizontal overflow; hero fills viewport width; both actions are fully visible and at least 44px high. Live resizing and rotation also passed without reloading.

Actual canvas output changes on forward scroll and returns to the identical initial frame on reverse scroll. Mobile navigation/Escape, reservation opening/closing and digital-menu navigation passed. No JavaScript errors. Production build and TypeScript pass. See results.json, build.log and screenshots. Tests use desktop Chrome viewport emulation; physical iOS/Safari devices were not tested.

Local inspection: http://localhost:5173/
Reproduce browser checks: node scripts/verify-mobile-hero.mjs

No deployment.
