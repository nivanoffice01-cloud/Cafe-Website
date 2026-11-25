# Cinematic source masters

Place café-approved production videos in the exact paths below. Video masters are ignored by Git and are never shipped by the website build.

- `chapter-01-arrival/desktop/chapter-01-arrival-desktop.mp4`
- `chapter-01-arrival/mobile/chapter-01-arrival-mobile.mp4`
- `chapter-02-interior/desktop/chapter-02-interior-desktop.mp4`
- `chapter-02-interior/mobile/chapter-02-interior-mobile.mp4`

`.mov`, `.mxf` and `.mkv` masters are also supported when passed explicitly with `--input`.

The last frame of both Chapter 01 masters must match the lens height, direction, exposure and camera velocity of the first frame of the corresponding Chapter 02 master.
