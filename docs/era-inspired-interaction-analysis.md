# ERA-inspired interaction analysis

Reviewed on 25 November 2026 against the live ERA Residence reference and the project’s existing cinematic implementation.

## What makes the reference feel spatial

- A full-viewport architectural image remains the stable world while typography, botanical framing and navigation occupy separate depth planes.
- The first scroll removes the editorial layer before it moves the visitor into the next composition. This creates a clear foreground/midground/background hierarchy.
- Small architectural hotspots appear only after the hero copy clears, preserving the image as an explorable place rather than a poster.
- Pinned transitions use changes in scale, masking and perspective with a consistent camera direction. They do not repeat a generic fade-up animation.
- Navigation, progress and location remain sparse and persistent, so the visitor never loses orientation.
- Editorial sections deliberately change their motion language: circular masks, asymmetric photographs, oversized type and quiet still fields.

## Mangosteen translation

The new `/experience` route translates those principles rather than copying its visual identity:

1. A real WebGL perspective camera moves through four photographic facade planes toward an independently positioned interior projection.
2. The facade boundary passes outside the viewport as the camera crosses it; the transition is not implemented by scaling the page or crossfading two backgrounds.
3. The interior becomes a pause point with four connected, real photographed viewpoints.
4. Look Around is deliberately limited to a small image-coverage range and is labelled as such. No fake 360-degree panorama is claimed.
5. The architectural overview is explicitly schematic and is not presented as a floor plan or reservation map.
6. Story, culinary, atmosphere, moments, gallery and closing sections each use a different interaction and composition language.

## Known reference gap

The repository has no panoramic capture, depth map, LiDAR scan, photogrammetry set or verified architectural model. A physically exact continuous café walkthrough would therefore be misleading. The current engine is designed so those assets can replace the photographic projection and connected-viewpoint layers later without changing menu or reservation routes.
