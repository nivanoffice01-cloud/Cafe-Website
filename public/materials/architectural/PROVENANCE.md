# Architectural asset provenance

Downloaded 25 November 2026 using `scripts/fetch-architectural-materials.mjs`. These are material/model assets, not photographs of Mangosteen.

| Local files | Source | Use |
|---|---|---|
| `wood-{color,normal,roughness}.jpg` | https://polyhaven.com/a/wood_table_001 | Timber material study; 1K diffuse, OpenGL normal, roughness |
| `stone-{color,normal,roughness}.jpg` | https://polyhaven.com/a/stone_tiles_02 | Floor material study; 1K diffuse, OpenGL normal, roughness |
| `/models/architectural/calathea/*` | https://polyhaven.com/a/calathea_orbifolia_01 | Five plant variants by Rico Cilliers (modelling) and Rob Tuytel (scanning), 1K textures, shared instanced geometry |

All three assets are CC0: https://polyhaven.com/license. Commercial use and redistribution are allowed. Scanned material textures are illustrative material choices, not scans taken at the café. Calathea placements and scale are inferred design choices.

`/images/architectural/brand-lockup.png` is an unchanged copy of the existing `CRM/dist/assets/mangosteen-brand-lockup.png`. It is existing Mangosteen brand artwork, not a third-party stock asset. The in-scene sign recolours its alpha silhouette in canvas without altering the source image.

Other architecture, furniture, planters, canopy, palm/frond and trailing-leaf geometry is authored in the isolated feature source. Procedural cane weave remains a study material. No AI-generated architectural imagery is mapped onto the scene.
