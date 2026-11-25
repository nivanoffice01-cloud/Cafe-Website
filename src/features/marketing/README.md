# Mangosteen marketing experience

The root route is a new implementation using original cafe photography. No rejected marketing components, shaders or controllers are imported.

- `pages/MarketingPage.tsx`: page composition, gallery viewer, existing reservation dialog integration and verified business links.
- `hooks/useMarketingMotion.ts`: one scoped GSAP/ScrollTrigger lifecycle, normalized SVG arch geometry and independent section timelines. Static reduced-motion and short-screen variants.
- `hooks/useMenuTransition.ts`: marketing-only outgoing curtain. Native document navigation/back/forward; direct QR and protected menu entry have no curtain or GSAP dependency.
- `sections/DiningTable.tsx`: independent plates, pointer/touch rotation, bounded inertia, snapping and existing menu data.
- `sections/GlassReveal.tsx`: on-demand canvas condensation and persistent soft-brush erasing, with an accessible alternative.
- `components/Navigation.tsx`: persistent contrast-aware header and animated mobile drawer with focus/scroll containment.
- `config/motion.ts`: shared timing/easing definitions.
- `styles/marketing.css`: marketing classes only. The existing reservation dialog renders outside this scope.

Original assets remain untouched. Optimized derivatives live in `public/marketing/`; named dish portraits reuse the existing licensed illustrative menu photos and are labelled accordingly. Missing genuine overhead portraits and isolated ingredient assets are documented in the review directory. No fictional architecture, dish data or detachable ingredients were generated.

Evidence: `artifacts/mangosteen-clean-rebuild-review/`.
Baseline: `checkpoint/clean-foundation-080966f`; implementation milestones remain in Git.

```sh
npm run check
# With dev server running; real API tests use a disposable CRM database:
node scripts/verify-marketing-business.mjs after
# With production preview on :4174:
node scripts/review-marketing-motion.mjs
```

The protected menu, reservation, CRM/admin and API source/configuration are unchanged. The local CRM-port conflict and phone-pattern warning predate this work; see the review report for their scope.
