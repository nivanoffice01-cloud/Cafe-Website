# Food-centred mobile placement — 26 November 2026

The previous camera used bounds that included steam and floor reflections. These shifted the actual food off-centre even though the image bounds were mathematically centred.

The camera now uses lightweight, precomputed food guides derived from the original sprite artwork. Substantial warm food pixels define the visual focus; neutral steam and dark reflections are excluded. A five-frame neighbourhood keeps framing stable. Source artwork and atlas files are unchanged. There is no runtime pixel analysis, extra animation engine or new visual effect.

Visible-food measurements in matching screenshots: the 393px layers frame was 36px left of centre; the updated sampled frames are within 0–1.5px of centre. See visual-centering.json. Caption placement remains below the artwork, aligned to the same 20px page margin. Opening/closing composition and desktop rendering are preserved.

Checks passed at 320×568, 393×852 and 430×932: all three cinematic stages, caption alignment, horizontal fit and exact forward/reverse canvas restoration. No JavaScript errors. See checks.json and the eight screenshots.

TypeScript passed. Vite production code compilation passed with copyPublicDir:false, avoiding a duplicate copy of the public asset library. Storage initially prevented file writes; only the verified, untracked, regenerable root dist/ output was removed (60 MiB). CRM/dist, source files, genuine photographs and existing assets were protected. Local storage remains limited; full public-asset packaging was not repeated in this iteration.

Regenerate guides: python3 scripts/derive-mobile-food-framing.py
Local inspection: http://localhost:5173/

Menu, QR routes, reservation business logic, CRM and APIs were not modified. Nothing deployed.
