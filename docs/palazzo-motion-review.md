# Palazzo motion parity review — Mangosteen

25 November 2026. Route: http://localhost:5173/reference-experience

Stable production preview used for final verification: http://localhost:4174/reference-experience

Branch: `mangosteen-reference-experience`. Recoverable checkpoint: `checkpoint/palazzo-motion-1f699d1` → `1f699d1`. The checkpoint preserves the previous template; existing untracked research, Blender pipeline and review artifacts were left intact. No deployment or asset purchase.

## Inspection method and evidence

Palazzo was opened in installed Google Chrome through Playwright, at desktop 1440×1000 and touch-emulated mobile 390×844. Interaction recordings, not just DOM inspection, informed this implementation. The reference and Mangosteen were also opened in separate tabs in one Chrome context and recorded performing comparable table turns, forward/reverse scrolling and glass wiping.

Reference source: https://palazzo.framer.website/ . No proprietary implementation or assets were copied.

Evidence directory: `artifacts/palazzo-motion/`:

- `reference/navigation-and-table.webm`: initial load, actual drag, Menu page navigation, browser Back and Reservations page.
- `reference/desktop-scroll.webm`, `reference/mobile-scroll.webm`: forward/reverse scroll.
- `reference/mobile-nav-touch.webm`: coordinate-verified mobile menu opening/closing and touch drag.
- `reference/glass-and-card.webm`: glass wipe and card hover.
- `reference/navigation-contact.jpg`, `reference/mobile-motion-contact.jpg`, `reference/mobile-nav-contact.jpg`: sampled recording frames, including intermediate states.
- `before/desktop.webm`, `before/mobile.webm`: checkpoint behaviour before implementation.
- `after/desktop-complete.mp4`, `after/mobile-complete.mp4`: complete new journey, including reverse scrolling and reservation opening/closing.
- `after/page-transitions.mp4`: cover/reveal, cancellation, history, direct QR entry and rapid destination changes.
- `after/dining-table.mp4`: forward/reverse dragging and rapid selection.
- `after/glass-wiping.mp4`: persistent brush, resize and accessible reset.
- `after/comparison-side-by-side.mp4`: Palazzo on the left; Mangosteen on the right. Scroll is synchronized by normalized document progress, not identical section timestamps; their content lengths differ. Drag and brush actions are sequential between tabs.
- `after/motion-results.json`: assertions, errors, actual network/frame/long-task/LCP observations.
- `after/*-hero.png`, section screenshots and `mobile-glass-touch.png`: final layout checkpoints.

## Observed motion inventory

Durations below are **visual estimates**, sampled from recordings at 250–500 ms intervals. Asset delivery time is not animation duration. Exact proprietary easing curves and internal stagger values cannot be recovered from rendered output and are not claimed. “Ease-out-like” describes deceleration visible in the recording.

| Interaction | Trigger / initial → final state | Direction, masking and scroll dependency | Observed timing / easing / stagger | Desktop / mobile |
| --- | --- | --- | --- | --- |
| Entrance | Document loads; header first, table surface/plates appear, blurred headline becomes sharp, description/actions follow | Table moves into composition; text sharpens/rises. Not scroll-dependent | Text resolves over roughly .5–.8s; stages overlap; ease-out-like. Cold reference assets sometimes arrive later than text | Same sequence with table below mobile copy |
| Table turn | Mouse/touch drag; current plate → next angular position | Real circular rotation; neighboring plates remain visible; release continues briefly then settles | Pointer-driven, release settles roughly .5–1s; decelerating. No slideshow or timed autoplay observed | Mouse and horizontal touch verified |
| Dish text | Table position crosses a dish region; old title/detail → new title/detail | Old text softens/disappears, new title sharpens in place; information grouped | Roughly .3–.6s; exact mask/curve not inferable | Both viewports |
| Page link | Menu click; home → distinct `/menu` page | New page layout appears and resolves; no branded curtain observed in captured run | Brief page replacement/reveal, network-dependent; no exact curve asserted | Separate menu and reservation pages observed |
| Mobile menu | Circle control; hero → full-screen navigation | Panel enters laterally from right; close retreats laterally, underlying hero retained | Approximately .25–.5s; ease-out-like. Item stagger not conclusively measurable | Mobile only; desktop inline links |
| Story statement | Scroll into oversized two-line statement | Blur/opacity resolves with progress; reverses on upward scroll | Scroll dependent rather than fixed playback | Mobile wraps into more lines |
| Menu section | Enter panel / hover rows | Heading/list resolves; dish preview appears on pointer interaction | Roughly .5–1s reveal; preview shorter | Desktop pointer preview; mobile avoids hover dependency |
| Café photograph | Scroll into image | Offset secondary photograph moves independently; text resolves over photo | Scroll-dependent parallax; no scroll hijack observed | Reduced composition on narrow viewport |
| Glass | Pointer sweeps over canvas | Clear trail follows pointer across blurred photo; previous cleared area persists | Immediate brush; spatial mask, not a crossfade | Desktop recorded; mobile glass equivalent implemented and tested |
| Invitation/card | Pointer over card | Card perspective shifts with pointer; returns on leave | Smooth damped movement, roughly .5–.8s settle | Desktop pointer; no forced tilt on touch |
| Booking | Book link / inline selections | Reference opens a separate reservation page; party/date/time update | Page reveal, selection response immediate | No reference reservation modal was observed |
| Footer | Scroll into footer, hover links | Editorial wordmark resolves, links remain conventional navigation | Short reveal; no custom cursor trail observed | Responsive columns |

## Parity checklist and implemented choreography

“Verified” means browser interaction/assertion or reviewed recording, not a claim of artistic approval or identical source curves.

| Reference interaction | Checkpoint behaviour / gap | Implemented behaviour | Trigger, start → end, timing and easing | Verification / remaining difference |
| --- | --- | --- | --- | --- |
| Staged opening | Mostly generic simultaneous fade-up | One coordinated entrance timeline | Header y−12→0 (.55s, .055 stagger); table x6%→0 desktop or y28→0 mobile (1.1s); course label at .18s; headline bottom mask→open at .27s (.85s); supporting controls at .48s (.06 stagger); drag hint at .75s | Desktop/mobile recordings; essential controls remain usable throughout |
| Page navigation | Hard cut to menu | Forest-green cover, restrained brand, destination ready underneath, upward reveal | Click → cover rises from bottom (.32s `power2.inOut`); destination mount → reveal exits upward (.42s). No artificial hold | Cancellation/history/direct QR tests. Complementary Mangosteen transition, **not claimed to exist on Palazzo** |
| Interrupted navigation | No handling | Latest clicked destination wins; Escape cancels even during dynamic import | Single owned timeline; no stack of delayed navigations | Tested rapid two-link clicks, cancellation and no stranded overlay |
| Back/forward | Lazy route could lose scroll | Native navigation plus per-entry scroll restoration after route mount | Stored position → restored x/y on back/forward; BFCache cover reset | Back/Forward tests. Native traversal is preserved rather than overridden with a new router |
| Mobile navigation | Entrance-only CSS; instant removal | Lateral open and close, item stagger, current-section indicator | x100%→0 .42s `power3.out`; links y22→0/opacity .45s, .075 stagger; close x0→−100% .32s | Touch/menu recordings, Escape and focus tests. Item stagger is complementary |
| Internal section navigation | Immediate menu removal | Close navigation first, then native smooth section scroll | .32s panel exit; browser-native smooth scroll; reduced-motion uses instant scroll | No wheel interception, pinning or Lenis dependency |
| Physical table | Direct drag and fixed snap only | Velocity-filtered inertia, bounded coast, nearest-dish snap | Drag samples angular velocity; coast capped at .8 dish step; release .75–1.2s `power3.out`; keyboard .95s | Mouse/touch/reverse/rapid input verified; photographs counter-rotate to stay upright |
| Dish selection | Text replaced immediately | Old copy exits, new copy reveals inside same text region | Exit y0→−10 / bottom mask .24s; new y16→0 / top mask .72s `power3.out` | Rapid reversal recovery tested; numeral changes with displayed copy, prices remain actual menu values |
| Selected dish emphasis | No emphasis | Small brightness/scale emphasis | Image .45–.55s CSS interpolation | No new photographs or ingredients; whole independent plate elements remain present |
| Statement | One generic scroll treatment | Independent roman/italic line movement | Opacity .2→1, blur7→0, y12→0; scrub .45, staggered viewport thresholds | Forward/reverse recordings; no letter-by-letter effect |
| Menu heading/list | Generic fade-up | Masked heading plus individually revealed ruled rows | Heading bottom mask/y24; rows right mask/x12, .8s; trigger top92%, reverse on return | Desktop/mobile sections recorded; existing menu data unchanged |
| Photography | Basic inset parallax | Main photograph opens within its existing bounds; inset moves independently; text is masked | Photo inset9%→0 and scale1.06→1, scrub .6; inset y12%→−20% desktop/−8% mobile and rotation3→−4°, scrub .8 | Genuine photographs and layout retained; clip motion is complementary |
| Glass heading | Static title | Scroll-controlled lateral title reveal | Right mask100%→0, x−16→0, scrub .5 | Forward/reverse capture |
| Glass surface | Hard-edged wipe, resize lost marks | Soft radial brush, interpolated stroke, persistent resized mask, static droplets and faint reflection | Pointer-driven erasure; 48px mobile /73px desktop radius, fully clear inner65%; no continuous idle loop | Pixel-alpha tests, resize preservation, touch brush and reset verified |
| Glass accessibility | Clear toggle only | “Reveal café” accessible button; full condensation reset | Existing .8s opacity transition; reduced-motion removes it | Keyboard action and real interactive brush both retained |
| Cards / gatherings | Generic fade | Distinct image mask, lateral card-stage reveal and text grouping | .72s masks; title/body/tags y16, .65s and .09 stagger | Existing perspective tilt retained; tweens cleaned on unmount |
| Closing invitation | Generic fade | Masked headline, then supporting copy/action | .72s headline; .12s supporting stagger | Desktop/mobile capture |
| Booking section | Generic fade | Masked heading, sequential fields, CTA and note | .72s reveal; .075s field stagger | Existing party/date/time semantics retained |
| Reservation overlay | Immediate mount/unmount | Backdrop + dialog + field entrance; coordinated closing | Backdrop .3s; dialog y24→0 .55s; fields y10→0 .35s/.04 stagger; exit .24s | Existing dialog used unchanged; focus/body lock maintained through exit |
| Footer / links | Basic footer reveal | Column stagger and masked wordmark; subtle link underline | .72s columns with .075 stagger; wordmark y28 and bottom mask; link .3s underline | Existing destinations retained; no distracting cursor added |
| Header continuity | Constant transparency | Backdrop darkens through first section and section-aware indicators | `--ref-nav-shade` scrub; typography, geometry and palette unchanged | Improves contrast without recolouring content sections |
| Reduced motion | CSS fallback only | GSAP media context reverts, table stops/snaps when preference changes; direct navigation | No curtain; no masked hiding; no inertial coast | Startup and live preference paths supported; regression tested |
| Food VFX | No separated ingredient layers | No fabricated steam/beans/basil animation | Not applied without suitable assets | See asset requirements below; not reported as completed VFX |

## Architecture and safeguards

- `motionConfig.ts`: shared motion timing/easing and reduced-motion query.
- `motion.ts`: scoped GSAP/ScrollTrigger lifecycle, distinct editorial timelines, interruptible dish-copy motion and overlay exit utility.
- `PageTransitions.tsx`: native multi-page navigation enhancement, async destination readiness, cancellation, current history-entry scroll restoration and BFCache cleanup. GSAP is dynamically imported; direct QR visitors do not load it for a curtain.
- `ReferenceExperiencePage.tsx`: pointer velocity/gesture discrimination, synchronized plate selection, canvas condensation/mask, focus-managed navigation and existing reservation wrapper.
- No Lenis, additional animation package, paid API, WebGL scene or Blender render was introduced.
- No global smooth-scroll hijacking. All section motion reverses or resolves naturally with native scrolling. Canvas draws only on load/resize/input. Contexts, observers, media listeners, pointer state and tweens are cleaned up.
- Approved menu browsing remains immediate. Its own internal category/search/favourites screens are intentionally not wrapped in cinematic curtains. Full-document navigation originating in `/reference-experience` is enhanced; unrelated entry routes and direct table QR browsing stay unchanged.
- `ReservationDialog.tsx`, menu implementation/data, QR table mappings, CRM and backend are unchanged by this motion task. No real order or reservation was submitted during browser testing.

## Food VFX asset requirements and visual limitations

The repository's featured food images are flattened photographs with embedded backgrounds. They contain no independently usable coffee steam, coffee beans, basil or liquid reflection layers. No coffee is added to this route's five verified highlights merely to justify an effect.

For a later, approved food VFX pass: supply an actual plated-dish overhead cutout (1600×1600 transparent WebP), a matching isolated basil leaf layer (600–1024px transparent WebP, consistent light), and, only for an existing coffee composition, a clean cup photo plus alpha steam footage (720×1080 WebM alpha or PNG sequence, 2–4 seconds). For drink reflections, use a separate alpha highlight/refraction layer matching the exact glass outline. These are requirements, not assets generated or effects claimed here.

Food-cutout perspective and tabletop materials remain the previous implementation's known photographic differences. This motion task does not disguise them or redesign the layout. Static condensation is an original canvas treatment, not physically simulated fluid. Touch wiping favors horizontal gestures so vertical movement still scrolls the page. No exact proprietary easing parity, physical-device FPS, Safari/Firefox certification or field Core Web Vitals claim is made.

## Tests and reproduction

```sh
npm run check
npm run preview -- --host 127.0.0.1 --port 4174
REVIEW_URL=http://localhost:4174 node scripts/review-reference-experience.mjs
REVIEW_URL=http://localhost:4174 node scripts/review-palazzo-motion.mjs
```

The production build/TypeScript, CRM JavaScript syntax check and nine existing backend tests pass. Browser regression covers 320, 360, 390, 768, 1024, 1440 and 1920px widths, overflow/images, menu search/favourites/selection, all 131 dishes/13 categories, Table 4 context, reservation prefill/defaults, Escape/focus/scroll lock and reduced motion. The dedicated motion suite additionally records actual animated interactions and checks history, cancellation, rapid input, touch scrolling, touch brush, persistent masks and reset.

Performance figures and test status are saved with the final recordings in `after/motion-results.json`; they must be interpreted as local Chrome measurements with video recording active, not remote production or a physical mobile device. The final evidence index links the raw measurements and all recordings. Visual approval remains a separate user review.

## Final measured results

| Measurement | Desktop | Mobile viewport |
| --- | ---: | ---: |
| Initial transferred data | 1.83 MB | 1.83 MB |
| Complete journey + reservation transfer | 3.25 MB | 3.73 MB |
| Animation frame samples | 1,802 | 1,802 |
| Median interval | 16.7 ms | 16.7 ms |
| 95th percentile | 16.7 ms | 16.8 ms |
| Intervals above 25 / 50 ms | 0 / 0 | 0 / 0 |
| Observed long tasks above 50 ms | 0 | 0 |
| Observed local LCP | 616 ms | 520 ms |

These are actual measurements from the final local production build on this Mac with Chrome recording enabled. They do not establish those results on cellular networks or physical phones. No FPS target is substituted for measurement. Fifteen motion assertions passed; no page JavaScript errors were recorded. Browser regression results are in `artifacts/reference-experience/local/test-results.json`; nine backend tests and the production build passed.
