# Measured local playback

25 November 2026. Headed Chrome, ANGLE Metal, Apple M4. Desktop 1920×1080; mobile-sized viewport 390×844. Device scale factor 1. These are not physical-phone benchmarks. rAF intervals measure browser cadence; render CPU samples are not GPU completion timings. Recording was active during measurement.

| Viewport | Initial bytes | Full bytes | Median frame interval | P95 frame interval | Draw calls | Triangles |
|---|---:|---:|---:|---:|---:|---:|
| desktop | 5,237,184 | 5,237,184 | 8.30 ms | 8.50 ms | 29 | 271,042 |
| mobile | 5,237,084 | 5,237,084 | 8.30 ms | 9.00 ms | 29 | 271,042 |

Both captures passed 0/25/50/75/100% camera checkpoint assertions and reached over 99% during continuous forward/reverse playback. No console, page or asset errors were recorded. Initial/full transfer includes JavaScript, CSS, fonts and locally served PBR/model assets. It excludes the exported GLB, which is never a runtime scene download. Local response sizes are not a guarantee of production compressed transfer sizes or Core Web Vitals.

Earlier screenshots from a Chrome run that failed to advance through the path were replaced. Only the current progress-asserted measurements are reported here.
