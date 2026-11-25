# Mangosteen cinematic production pipeline

The homepage now loads eight reversible scroll-controlled chapters. The current delivery is a photographic 2.5D motion study: genuine Mangosteen architecture is used for the café scenes, while food and beverage plates are explicitly illustrative. It is not represented as documentary walkthrough footage.

## Source master locations

The renderer writes local MP4 masters to these Git-ignored paths. A café-approved or licensed master can replace any file at the same path and be reprocessed without changing the React components.

```text
cinematic-source/chapter-01-arrival/{desktop,mobile}/chapter-01-arrival-{desktop,mobile}.mp4
cinematic-source/chapter-02-interior/{desktop,mobile}/chapter-02-interior-{desktop,mobile}.mp4
cinematic-source/chapter-03-walkthrough/{desktop,mobile}/chapter-03-walkthrough-{desktop,mobile}.mp4
cinematic-source/chapter-04-coffee/{desktop,mobile}/chapter-04-coffee-{desktop,mobile}.mp4
cinematic-source/chapter-05-pizza/{desktop,mobile}/chapter-05-pizza-{desktop,mobile}.mp4
cinematic-source/chapter-06-mocktail/{desktop,mobile}/chapter-06-mocktail-{desktop,mobile}.mp4
cinematic-source/chapter-07-day-night/{desktop,mobile}/chapter-07-day-night-{desktop,mobile}.mp4
cinematic-source/chapter-08-closing/{desktop,mobile}/chapter-08-closing-{desktop,mobile}.mp4
```

Recommended replacement masters: desktop 1920×1080 or higher, 16:9, 8–12 seconds; mobile 1080×1920, 9:16, independently composed, 8–12 seconds. Use H.264/H.265 mezzanine, ProRes 422 HQ, or ProRes 4444 when alpha is required.

## Automated generation and processing

```bash
# Rebuild the current photographic motion studies (all eight chapters)
npm run cinematic:render-photo -- --duration 8 --fps 24 --crf 18

# Process one replacement master into WebP frames and update its manifest
npm run cinematic:process -- --chapter 1 --scene arrival --variant desktop --duration 8 --fps 12 --width 1600 --height 900 --quality 72 --scroll-vh 300 --cache 8

# Validate the Chapter 01 → Chapter 02 handoff
npm run cinematic:verify -- --variant desktop --threshold 0.82 --strict true
npm run cinematic:verify -- --variant mobile --threshold 0.82 --strict true

# Capture desktop/mobile checkpoints and forward/reverse WebM playback
npm run cinematic:qa -- --url http://127.0.0.1:5173/ --output artifacts/cinematic-qa/final --profile all
```

`cinematic:process` accepts `--input`, `--output`, `--duration`, `--fps`, `--frames`, `--width`, `--height`, `--quality`, `--scroll-vh`, and `--cache`. It uses FFmpeg's WebP encoder when available and otherwise falls back to lossless PNG extraction plus `cwebp`. The generated `sequence.json` is discovered through `public/cinematic/sequence-registry.json`.

## Current measured delivery

- 1,024 animation frames plus 16 posters: 68.13 MiB total.
- Desktop: 576 frames, 47.17 MiB, 83.9 KiB average frame.
- Mobile: 448 frames, 19.90 MiB, 45.5 KiB average frame.
- Chapters 01–02: 96 desktop frames at 1600×900/12 FPS and 80 mobile frames at 720×1280/10 FPS.
- Chapters 03–08: 64 desktop frames at 1440×810/8 FPS and 48 mobile frames at 640×1136/6 FPS.
- Decoded cache caps are 8/6 frames for Chapters 01–02 and 6/5 frames for Chapters 03–08. Inactive chapter caches and canvas buffers are released.

The current local continuity scores are 0.989374 desktop and 0.978843 mobile (SSIM, threshold 0.82). Visual review is still required whenever a master changes because SSIM cannot validate camera velocity or narrative continuity.
