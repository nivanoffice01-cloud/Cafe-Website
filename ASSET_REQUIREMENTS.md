# Mangosteen mobile menu — remaining photography

The mobile menu currently preserves all real menu data and clearly labels category-level image fallbacks. To replace those fallbacks without misrepresenting Mangosteen's plating, the café should supply the following genuine photography.

## Individual dish photographs

- **Filename:** `public/images/menu-dishes/<category-slug>/<dish-slug>.webp`
- **Quantity:** 126 remaining dishes (five dishes already have individual editorial references)
- **Dimensions:** 1200 × 1500 px minimum, 4:5 portrait
- **Format:** WebP or AVIF, quality 78–86
- **Components:** category dish cards, search results and dish-detail sheet
- **Composition:** dish centred slightly high, enough breathing room for 4:5 and square crops, no text or props crossing the plate edge
- **Lighting:** warm directional café light, restrained shadows, accurate food colour and consistent white balance
- **Transparency:** not required

## Category hero photographs

- **Filename:** `public/images/menu-categories/<category-slug>-hero.webp`
- **Quantity:** 13
- **Dimensions:** 1800 × 1100 px minimum
- **Format:** WebP or AVIF
- **Components:** dedicated category hero
- **Composition:** close editorial food scene with the primary subject in the upper/right two-thirds and clean darker space for lower-left copy
- **Lighting:** cinematic warm highlights with deep forest-green shadows
- **Transparency:** not required

## Featured dish cutouts

- **Filename:** `public/images/menu-featured/<dish-slug>-cutout.webp`
- **Quantity:** 5
- **Dimensions:** 1400 × 1400 px minimum
- **Format:** lossless WebP
- **Components:** featured carousel on the parchment landing section
- **Composition:** complete dish or glass, three-quarter angle, no clipped plate edges
- **Lighting:** warm directional light from upper left, natural contact shadow supplied separately if possible
- **Transparency:** required

## Data still required from café management

- Verified vegetarian/non-vegetarian status for every dish.
- Verified chef recommendations.
- Verified popularity ranking or sales-derived popular dishes.
- Verified ingredients and allergen notes.

These fields remain hidden or disabled until supplied; the interface does not infer or fabricate them.

---

# Mangosteen cinematic homepage — documentary upgrade requirements

The cinematic homepage now has eight working desktop/mobile photographic sequences. The current café scenes are 2.5D motion studies derived from genuine photographs; they must not be represented as continuous documentary footage. The following capture replaces the photographic Chapter 01–03 studies without component changes. See `docs/cinematic-asset-manifest.md` for the live implementation matrix.

## Chapter 01 — Arrival master capture

- **Desktop master:** `cinematic-source/chapter-01-arrival/desktop/chapter-01-arrival-desktop.mov`
- **Mobile master:** `cinematic-source/chapter-01-arrival/mobile/chapter-01-arrival-mobile.mov`
- **Delivery:** ProRes 422 HQ or ProRes 4444 master plus colour-managed reference still
- **Desktop:** 2560×1440, 16:9, 24 or 30 fps, 8–12 seconds
- **Mobile:** 1080×1920, 9:16, independently composed rather than centre-cropped
- **Camera movement:** single slow stabilized push from obscured foliage towards the entrance; no cuts, zoom ramps or handheld shake
- **Lighting:** blue-hour or evening exposure with warm practical lights protected from clipping
- **Focus:** deep enough to retain signage, with a controlled focus transition towards the entrance near the final third
- **Sequence export:** 120–180 numbered AVIF/WebP frames per breakpoint, consistent zero-padded filenames
- **Required continuity:** final exterior frame must match the first frame of the Chapter 02 interior threshold shot

## Foreground botanical depth plates

- **Filenames:** `arrival-foliage-left.webp`, `arrival-foliage-top.webp`, `arrival-foliage-right.webp`
- **Format:** lossless WebP or PNG
- **Dimensions:** minimum 2200px on the longest edge
- **Transparency:** required, with clean semi-transparent leaf edges and no baked background
- **Capture:** real foliage photographed at Mangosteen or café-approved botanical plates
- **Lighting:** same direction, colour temperature and contrast as the arrival master
- **Use:** independent 18–35px parallax, occlusion over signage and typography, subtle breeze deformation

## Atmosphere and lighting passes

- **Haze pass:** 2560×1440 and 1080×1920, 6–10 seconds, alpha or screen-ready black background
- **Dust/bokeh pass:** sparse particles only, no fantasy sparkles
- **Sign bloom pass:** isolated Mangosteen sign illumination, 16-bit TIFF/EXR sequence or ProRes 4444
- **Volumetric-light pass:** restrained architectural light shafts matched to the entrance practicals

## Chapter 02 transition plate

- **Desktop filename:** `cinematic-source/chapter-02-interior/desktop/chapter-02-interior-desktop.mov`
- **Mobile filename:** `cinematic-source/chapter-02-interior/mobile/chapter-02-interior-mobile.mov`
- **Desktop:** 2560×1440, 8–12 seconds
- **Mobile:** 1080×1920, independently framed
- **Camera:** continue the exact Chapter 01 lens height, direction and speed through the entrance
- **Requirement:** actual Mangosteen footage or an architecturally verified reconstruction; no fictional interior

## Performance delivery

- Supply poster frames for every sequence before the full frame set.
- Keep each desktop WebP/AVIF frame ideally below 180KB and each mobile frame below 120KB.
- Provide a shot LUT or graded reference so poster, frames and overlays remain colour-consistent.
- Do not derive hundreds of near-identical frames from a single still image.
