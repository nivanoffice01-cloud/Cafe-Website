# Larger mobile cinematic artwork — 26 November 2026

The exploded burger was fitted against the union of every ingredient position across all three clips, inside a short mobile canvas region. This made the active stack much smaller than the available screen area.

Mobile framing now uses the bounds of the displayed frame and two neighbours on either side, with a larger upper-screen artwork region. The canvas itself stays full-height in portrait, avoiding repeated canvas reallocations as the camera interpolates. Opening/closing transforms preserve the preceding mobile composition. Desktop framing, source artwork, sprite frames, timings, navigation and business logic are unchanged.

The supporting headings remain together before their descriptions. Copy is aligned in a compact footer, with smaller spacing on short phones.

Evidence:
- before-393-layers.png vs 393-0.3.png: matching viewport and scroll progress.
- 393-0.52.png / 393-0.75.png: upgrade and assembly stages.
- 320-* screenshots: short-phone counterparts.
- playback.json: final forward/reverse frame checks at 393×852 and 320×568.
- regression/results.json: twelve viewport checks, live resizing, reversible playback, mobile navigation, reservation opening/closing and menu navigation.
- build.log: production build and TypeScript passed.

Existing earlier review artifacts were preserved. Menu, QR, reservation logic, CRM, database and APIs were not modified. No deployment.
