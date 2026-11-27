# Review of the supplied 5:24 PM recording

Source: `Screen Recording 2026-11-25 at 5.24.11 PM.mov`, supplied locally by the user. Actual duration 17.485 seconds, 1920×1080 screen capture; browser content approximately 1844×963. The video is the visual specification for this correction pass. It contains no additional task instructions.

Checkpoint: `checkpoint/recording-match-8e61d32` → `8e61d32`.

## What the recording demonstrates

| Time | Observed behaviour | Previous mismatch | Correction |
| --- | --- | --- | --- |
| 0–5s | Dining table physically turns, neighboring plates remain visible, copy changes during selection | Desktop plates were smaller; ≥1900px breakpoint shifted the whole composition | Larger desktop plates and continuous horizontal padding/table anchoring; existing inertial rotation retained |
| 5–8s | Two-line editorial statement with a small circular dish and oval photo embedded between phrases; reveal tracks scroll | Only text existed, aligned to a wider container | Two inline existing photographs with independent scale/rotation/opacity reveals; centred content proportions |
| 8–13s | One floating dish image follows the cursor across menu rows; old/new dishes overlap briefly; non-active rows dim | Thumbnail appeared at a fixed location on each row | A shared viewport-positioned preview follows the cursor with damped movement and image crossfades; inactive rows dim; keyboard focus alternative; touch remains straightforward |
| 8–13s | Left introduction remains visible as the longer list moves | Introduction scrolled normally | Sticky desktop introduction bounded by its own menu section; static on mobile |
| 14–15s | Large genuine kitchen photograph with independent detail image on the right | Core behaviour already existed, but text container was too wide | Content margins corrected; genuine Mangosteen imagery and existing inset parallax retained |
| 15–17.5s | Glass section follows the photo and clears along the pointer | Existing soft canvas brush covers this behaviour | Retained; included in the corrected interaction recording |

No waves, new products, invented dishes, copied photography or extra menu courses were introduced. The recording's apparent moving curved forms near section edges are not enough evidence to invent a new section-transition effect.

## Evidence and checks

`artifacts/recording-match/` contains the source contact sheet, full-resolution reference frames, corrected desktop/mobile screenshots, `corrected-interactions.mp4` and `results.json`.

Run `node scripts/review-recording-match.mjs` against the production preview at port 4174. It asserts cursor following, all five image mappings, leave/scroll cleanup, bounded sticky behaviour, and 320/390/768px overflow. The existing reference regression suite checks the approved menu, QR Table 4 context, search/favourites/selection and reservation defaults/prefill. `npm run check` runs the production build, TypeScript, CRM syntax check and nine backend tests.

## Remaining differences — not an exact visual match

Palazzo has eight professionally photographed overhead plate cutouts, radial walnut grain, a sharply resolved draped cloth image, and kitchen-action photography. Mangosteen currently has five individually mapped licensed illustrative food images with embedded backgrounds, the existing decorative cloth/wood, and genuine café interior photographs. Those differences remain visible in every motion comparison. Five actual dish highlights are retained rather than inventing an eight-course Mangosteen tasting menu or repeating unrelated photographs.

The matching interaction mechanics do not resolve this asset gap. Existing required cutout specifications remain in `docs/reference-experience-review.md`. No exact photographic parity or user visual approval is claimed. No production deployment was performed.
