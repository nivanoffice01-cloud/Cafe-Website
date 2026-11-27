# Dish-specific menu illustrations

The digital menu uses its five existing matched editorial reference photographs and newly generated illustrations for remaining exact catalogue identifiers. These are illustrative servings, not venue photographs or verified portion/plating references. Images do not supply dietary, ingredient, allergen or popularity metadata.

Each new illustration is generated separately from the exact catalogue name and its existing description, when available. For entries without a description, only a simple representative serving is requested. This includes add-ons such as cheese and extra bread. The café has not supplied genuine individual photographs for these remaining dishes.

Visual direction: a single clearly framed serving, warm natural side light, walnut surface, understated forest-green background, realistic food textures; no text, branding or watermarks. Individual image review and correction are recorded in the review contact sheets.

`source-manifest.json` records the selected original image paths saved by the built-in image-generation tool. Originals are retained at those paths. Committed, optimized 320px and 800px WebP derivatives live in `public/images/menu-dishes/`; the website never references a local original path. A clean checkout can run using these derivatives without access to the original generation directory.

`scripts/prepare-dish-illustrations.py` prepares missing derivatives and writes `src/features/digital-menu/generated-dish-photos.json`. Identifiers use exact category and item names, with a hashed filename to avoid collisions. Registrations are locked and manifests written atomically. Run it with Python 3 and Pillow. Optional first argument: a JSON object containing `category`, `name`, and selected original `source` path.

Display priority remains: matched genuine venue photography, existing matched reference photography, then exact-item AI illustration. The menu shows “AI illustration” labels on generated images and an explicit disclosure in dish details. Runtime errors still fall back safely rather than breaking browsing.

No originals, prices, dishes, descriptions, homepage photography or business rules are replaced by this asset collection.
