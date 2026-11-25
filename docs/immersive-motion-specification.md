# Immersive motion specification

| Experience area | Motion language | Timing / behavior |
| --- | --- | --- |
| Arrival | Reversible perspective-camera translation through independent facade planes | Scroll-linked, damped at 0.075/frame |
| Arrival pointer | Limited camera offset before the threshold | Maximum 0.09 world units horizontal |
| Welcome | Editorial opacity and vertical settle | 500–700ms after 72% entrance progress |
| Viewpoints | Direct photographic node switch with spatial hotspot positions | User initiated; no autoplay |
| Look Around | Constrained object-position movement | Pointer/touch drag within verified image coverage |
| Story | Static asymmetric depth composition; typography and photos occupy different planes | Animation-independent layout remains complete |
| Culinary | Native horizontal scroll with snap, independent image scale on hover | No pinned scroll on mobile |
| Atmosphere | Directional image mask between genuinely different photographs | 650ms |
| Moments | Native draggable horizontal editorial gallery | No automatic movement |
| Gallery | Existing accessible full-screen gallery | Keyboard arrows and Escape supported |
| Closing | Static cinematic photograph with restrained content reveal | No compulsory animation |

All transitions honor `prefers-reduced-motion`. The feature does not hijack wheel or touch scrolling.
