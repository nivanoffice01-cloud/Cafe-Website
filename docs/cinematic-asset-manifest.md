# Mangosteen cinematic asset manifest

All eight chapters have enabled desktop and mobile WebP sequences under `public/cinematic/`, registered by `public/cinematic/sequence-registry.json`.

| Chapter | Scene ID | Current visual source | Truth label |
|---|---|---|---|
| 01 Arrival | `arrival` | Genuine Mangosteen exterior and night interior photographs | Photographic 2.5D study; not a real continuous camera shot |
| 02 Interior | `interior` | Genuine night and day Mangosteen interior photographs | Photographic 2.5D study |
| 03 Walkthrough | `walkthrough` | Genuine Mangosteen interior photographs | Photographic 2.5D study; not documentary walkthrough footage |
| 04 Coffee | `coffee` | Genuine interior plus AI-created non-architectural coffee VFX plate | Illustrative coffee plate |
| 05 Pizza | `pizza` | Existing illustrative menu pizza plate | Illustrative food photography |
| 06 Mocktail | `mocktail` | Existing illustrative menu mocktail plate | Illustrative beverage photography |
| 07 Day to night | `day-night` | Genuine rooftop day and night photographs | Matched photographic transition study |
| 08 Closing | `closing` | Genuine rooftop and candlelit seating photographs | Photographic 2.5D study |

## Runtime map

- Registry and manifests: `public/cinematic/sequence-registry.json` and `public/cinematic/chapter-*/{desktop,mobile}/sequence.json`
- Automatic manifest loader: `src/cinematic/useRegisteredSequence.ts`
- Damped reversible progress: `src/cinematic/useCinematicProgress.ts`
- Progressive bounded cache: `src/components/cinematic/FrameSequence.tsx`
- Eight-chapter composition: `src/components/cinematic/CinematicExperience.tsx`
- Master renderer: `scripts/render-photographic-cinematics.mjs`
- FFmpeg/WebP processor: `scripts/process-cinematic-sequence.mjs`
- Continuity verifier: `scripts/verify-cinematic-continuity.mjs`
- Browser QA recorder: `scripts/capture-cinematic-qa.mjs`

For a true exterior-to-interior journey, replace Chapters 01–03 with genuine stabilized footage captured at Mangosteen using a matched lens, camera height, direction, exposure, and velocity. The processing and runtime pipeline already accepts those replacement masters.
