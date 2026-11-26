# Menu bottom-navigation removal

Removed the five-item fixed bottom navigation from the shared digital menu and its unused styles. Removed its reserved content spacing. The conditional My List subtotal remains available 12px above the mobile safe area. Existing header controls, hamburger drawer and desktop navigation retain all destinations.

Validation:
- TypeScript: `./node_modules/.bin/tsc -b` passed.
- Optimized Vite production code build passed with `copyPublicDir: false`, output `/private/tmp/mangosteen-navigation-build`. Public assets were not duplicated because storage is critically low. This was not a deployment or full asset-copy build.
- Image verification: 13 category shortcuts, 13 category banners, dish details, selection and Table 4 context passed at 320/390/768/1440px; no broken images or console errors.
- Focused navigation verification: all six menu screen types checked at the same four widths; bottom strip absent and no horizontal overflow. Categories/Search drawer navigation, header Favourites/My List, saved dish and selection controls passed.
- The initial position assertion ran before the existing summary entrance animation settled; the corrected check waits for the animation and verifies the final 12px offset.

Screenshots: `landing-390.png` (mobile full page), `categories-768.png` (tablet), `categories-1440.png` (desktop), with additional 320px evidence. No homepage, reservation, backend or dataset code changed. No reservation/order submissions made.
