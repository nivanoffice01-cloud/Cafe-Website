# Supplied Mangosteen frontend restoration

## Authentic photography update — 26 November 2026

The approved design is preserved on `mangosteen-authentic-content`. Its checkpoint
is `checkpoint/approved-design-d7a8e55` at `d7a8e55`. `authentic-photos.ts` now maps
the story, counter, rooftop lifestyle, façade, supporting pages and menu landing
to responsive crops of the retained Mangosteen photographs. Originals remain
unchanged in `public/images/highres/` and `public/images/gallery/`.

No matched genuine photograph was found for any named catalogue dish. Existing
food illustrations remain temporarily, as requested; each missing dish and all
13 category banners are listed in
`artifacts/mangosteen-authentic-content-review/missing-dish-assets.csv` and its
JSON companion. The authentic overhead meal photograph has no confirmed dish
identity and is used only as an unlabelled café food photograph.

The hero/sprite files, motion logic, styles, masks, dimensions, transitions,
navigation and reservation implementation are unchanged. Five sampled canvas
frames match the approved version exactly. The artwork does not match the listed
single chicken-and-egg burger; it remains a visual concept pending owner review.
Ingredient labels describe the artwork rather than claiming an actual recipe.

Business contact details, opening hours, rating provenance and the Maps pin were
checked against the public Zomato listing. The complete 131-item catalogue is
retained as an indicative published snapshot. Current owner-approved prices,
48 missing descriptions and dietary metadata still require confirmation.

Run `node scripts/review-authentic-content.mjs before|after` with Vite on port
5173 for the photographic comparison and animation checks. The review directory
contains the business regression results and source-preservation evidence.

The following notes describe the original design restoration and its provenance.

The active marketing entry restores the Chrome-saved Mangosteen design supplied on
26 November 2026. It reuses the supplied layout, typography, colour tokens,
photographs, poster framing, horizontal dish rail, canvas burger sequence,
scroll choreography, marquee and subpage compositions.

`SuppliedDesign.tsx` contains the extracted design components. Its short internal
symbols are retained from the supplied compiled application to avoid a broad
rewrite during restoration. React, GSAP and the exact Lenis 1.3.28 dependency
replace bundled library copies. Builder instrumentation, remote error collectors,
analytics, promotion injection and replacement business systems are excluded.

`supplied.css` is the original stylesheet scoped to `.saved-mangosteen` using
PostCSS. `icons.css` has the same scope. `fonts.css` and the icon font use local
files. The existing document-level Google Fonts link remains unchanged.

`SuppliedFrontendPage.tsx` owns integration and cleanup. The protected reservation
dialog renders outside the marketing scope. The mobile drawer gains keyboard
containment, Escape and scroll locking; the supplied mobile header overflow and
tablet overlap are corrected in `integration.css`.

`integration.tsx` uses ordinary same-origin navigation for marketing pages and the
approved menu. All menu CTAs lead to `/menu`, and each featured dish links to the
matching existing category/dish. Every reservation action opens the existing
reservation dialog. The contact page uses existing business facts and directions;
it does not submit to the supplied Readdy form/calendar endpoints.

`verified-content.ts` derives featured names, descriptions and prices from the
existing 131-dish catalogue. It replaces the reference's demo prices, placeholder
contacts, invented opening dates, preparation statistics and popularity claims.
The design's supplied imagery remains concept/illustrative imagery, and is not
independently verified as real Mangosteen photography or actual dish presentation.
The burger sequence is explicitly a visual concept, not an orderable extra.

The original supplied files remain on the user's Desktop. The previous homepage
remains recoverable at `checkpoint/before-supplied-frontend-c035d43` and in the
inactive `src/features/marketing/` feature. The untracked user file
`src/components/FullMenuDialog.tsx` was left untouched.

## Verification

```sh
npm run check
node scripts/verify-supplied-frontend-business.mjs after
node scripts/review-supplied-frontend.mjs
```

Both browser scripts expect Vite on `http://127.0.0.1:5173`. Business submissions
use an actual Python/SQLite server with a disposable database, never customer data.
Evidence is under `artifacts/supplied-frontend-review/`. Nothing was deployed.

Marketing subpages reproduce the source design's 750ms opacity transition using
the browser View Transition API and a small history adapter, without mounting a
second router. Browser back/forward restores recorded marketing scroll positions.
Unsupported browsers and reduced motion use immediate updates. The protected
menu and QR routes continue to use normal document navigation.

The original art asset and sprite atlas files are supplied/generated design
material. No new purchase or ownership/licence certification is claimed. Existing
camera originals and protected business assets remain unchanged.
