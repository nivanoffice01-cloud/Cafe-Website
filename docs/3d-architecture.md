# Mangosteen cinematic experience

## Frontend foundation

React 19, TypeScript, Vite, and Three.js. There is no backend or router. HTML owns navigation, the searchable menu, gallery, reviews, location, accessibility, and search metadata. src/components/CinematicScene.tsx is the only WebGL scene. src/scene3d/filmAssets.ts defines its media paths and tunable camera keyframes.

## Arrival sequence

The opening uses a generated reconstruction based on the real exterior photograph as a shallow WebGL plane. Scroll moves a perspective camera toward it. A short covered cut changes to a generated reconstruction of the dining room and foreground table. The camera settles at a seated viewpoint; it does not place a modelled menu or fake food on the table.

The Take your seat control adds a brief camera push, covers a photographic match cut, reveals the real dish photograph, then opens the existing HTML menu. The food photo is loaded when the visitor chooses to sit rather than added as another 8K WebGL texture. The Menu navigation item opens the HTML menu directly. The menu remains keyboard accessible.

This is a photo-led depth treatment, not a venue scan, a continuous physical walkthrough, or a photoreal 3D reconstruction. The two location references depict different camera viewpoints; the covered cut makes that honest.

## Current photographs

The four user-supplied JPGs are copied byte-for-byte into public/images/highres/:

- mangosteen_original_4_8k.jpg (7680 × 4314): exterior and signage, reference and later editorial photography.
- mangosteen_original_1_8k.jpg (7680 × 5116): dining area and foreground table, reference and later editorial photography.
- mangosteen_original_2_8k.jpg (7680 × 5116): plated dish, match cut and menu imagery.
- mangosteen_original_3_8k.jpg (7680 × 5760): evening interior, editorial content.

The file dimensions are high, but some fine detail is soft in the source JPEGs. The opening now uses two AI-generated reconstructions in `public/images/experience/`: `mangosteen-exterior-reconstruction.png` (1673 × 940) and `mangosteen-table-reconstruction.png` (1536 × 1024). They have clearer perceived detail but are not pixel-identical to the real photographs or true 8K captures. The original photos remain unchanged.

## Performance and fallback

The two reconstructed opening images load for the WebGL journey. The exterior uses trilinear minification; the close image keeps its full texture level. The dish photo is requested when Take your seat is activated. Later editorial images use native lazy loading. Rendering pauses when the journey leaves the viewport, and textures, geometries, materials, and the renderer are disposed on unmount.

If WebGL is unavailable, the reconstructed exterior image and accessible menu control remain usable. Reduced-motion mode skips the camera push and food match cut, opening the menu directly.

## Future assets

No authored GLB models are currently loaded. A genuine café aerial can be added through filmAssets.aerial; the current exterior viewpoint is ground-level and should not be called an aerial. Selective Blender food models may be introduced later only if they match the real café photography and improve the experience. The current menu interaction has no physical menu-card asset or model slot.

The scroll and camera sequence should be checked visually on desktop and mobile. The acceptance path is: exterior → reconstructed dining room → table arrival → Take your seat → real food photograph → browsable HTML menu.
