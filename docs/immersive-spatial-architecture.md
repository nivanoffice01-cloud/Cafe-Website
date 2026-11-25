# Immersive spatial architecture

## Route isolation

The new experience is available only at `/experience`. It is lazy-loaded by `src/app/App.tsx`; the homepage, mobile menu, QR menu and reservation implementation remain on their existing routes and do not import Three.js through this feature.

Feature source lives under `src/features/immersive-experience/` and uses the `.mangosteen-immersive` CSS root to prevent style leakage.

## Entrance engine

`SpatialEntrance.tsx` uses a Three.js `PerspectiveCamera` and two photographic depths:

- four facade planes at world depth `z=0`, each carrying a cropped region of the genuine exterior photograph;
- one interior projection at `z=-4.4`, carrying a genuine Mangosteen interior photograph.

Scroll progress drives camera translation from `z=7.4` to `z=-1.05`. Passing the facade plane makes the independently positioned boundary move out of the field of view. Pointer input adds a damped, sub-degree arrival look offset. All geometry, textures, renderer resources and listeners are disposed on unmount.

This is photographic camera projection—not a claim of a measured 3D reconstruction. The central opening is a schematic transition based on the photographed open facade.

## Exploration engine

The viewpoint graph contains four verified photographic nodes: facade, long table, evening room and table detail. The user can:

- select connected viewpoint hotspots;
- use a constrained photographic look range of 42–58% horizontal and 44–56% vertical;
- use a schematic zone overview to move directly between nodes.

The existing reservation component remains separate and opens only from explicit Reserve actions.

## Fallbacks

- Reduced motion replaces the scroll camera with a static genuine arrival photograph.
- If WebGL texture loading fails, the canvas layer displays the genuine arrival image.
- Touch layouts use the same state and viewpoint graph with simplified movement and no hover dependency.
