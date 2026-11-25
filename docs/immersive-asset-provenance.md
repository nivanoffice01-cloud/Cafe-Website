# Immersive asset provenance

## Genuine Mangosteen photography used by `/experience`

| Asset | Use |
| --- | --- |
| `public/images/cinematic/arrival-desktop.webp` | Optimized genuine-photo facade projection |
| `public/images/cinematic/interior-transition.webp` | Optimized genuine-photo entrance interior projection |
| `public/images/highres/mangosteen_original_1_8k.jpg` | Long-table viewpoint |
| `public/images/highres/mangosteen_original_2_8k.jpg` | Dining viewpoint |
| `public/images/highres/mangosteen_original_3_8k.jpg` | Evening-room viewpoint / after dark |
| `public/images/highres/mangosteen_original_4_8k.jpg` | Facade viewpoint |
| `public/images/gallery/cafe-06.png`, `cafe-07.jpg`, `cafe-14.png`, `cafe-16.jpg` | Story and atmosphere details |
| `public/images/experience/mangosteen-table.jpg` | Closing invitation |

## Illustrative food photography

Dish imagery comes through the existing `menuPhotoFor` mapping. Its current source explicitly labels individual and AI category images as illustrative rather than Mangosteen’s exact plating. The immersive route preserves that disclosure and does not create new food claims.

## Missing capture coverage

- no equirectangular 360-degree panorama;
- no calibrated overlapping photo set for photogrammetry or Gaussian splatting;
- no LiDAR/depth capture;
- no architectural drawing or measured floor plan;
- no verified 3D model;
- no continuous entrance-to-interior video.

These gaps are why the implementation uses a photographic projection transition and discrete viewpoint graph instead of claiming a continuous reconstruction.
