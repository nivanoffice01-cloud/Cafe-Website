# Menu image update — 26 November 2026

Added responsive WebP imagery for all 13 category illustrations and the five exact-name dish references already available in the project. All six landing category circles and all three featured dishes now have images. The corresponding category banners, dish detail sheets, search results and selection cards use the same mapping.

Category images are visibly labelled “AI illustration”; the five licensed stock dish references are labelled “Reference photo”. None is represented as an actual Mangosteen serving. Other dishes remain neutral placeholders until matching images are available. Verified venue photographs always take precedence. Original images and their provenance/licence documentation are preserved.

36 responsive derivatives (320px and 800px). The pasta derivative is cropped to bring the bowl into focus. Lazy loading and responsive source selection remain active. No menu data, prices, order logic, homepage, reservations or backend files were changed.

Chrome checks: 320 / 390 / 768 / 1440px; loaded images, labels, no horizontal overflow or broken images; all 13 category banners; dish detail and My List image consistency; Table 4 context preserved. No browser errors. Production build and TypeScript pass. See results.json and build.log.

Local URL: http://localhost:5173/menu
Screenshots: landing-390.png (full page), featured-390.png (matching the requested section), plus 320/768/1440 variants.

No deployment.
