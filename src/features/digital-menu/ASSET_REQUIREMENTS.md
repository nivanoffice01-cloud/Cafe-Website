# Verified menu photography

The existing catalogue contains 131 dishes in 13 categories. No retained photograph has a verified match to an individual catalogue dish. No dietary or bestseller metadata exists; filters and badges for those claims are omitted.

The new menu uses a genuine retained food photograph as its unlabelled hero. Its dish identity is not established. Stock food, AI category portraits and the unverified mango-dish image are not used. Existing shared homepage mappings and source photographs remain untouched.

## Required captures

- Optional replacement hero: /images/menu-verified/hero.webp, 1920×1280 landscape WebP, genuine signature dish, subject to the right, left copy space, warm natural light. Provide matching 800×1000 crop only if the landscape crop is unsuitable. Verify dish identity before labelling.
- 13 category photographs: 1200×700 WebP, subject right with clear left copy space; centre-safe circular crop.
- 131 exact dish photographs: at least 800×800 WebP, actual portion and plating, no substitutes; neutral warm or botanical setting. No transparency required.

Full exact filenames, catalogue names, prices, descriptions and status are listed in [photography-audit.json](../../../artifacts/menu-premium-v3/photography-audit.json). Existing responsive crops are reused for the hero. Do not create new source copies unnecessarily.

## Registration

Register approved photographs in photography.ts: verifiedCategoryPhotos uses exact category names; verifiedDishPhotos uses category + | + exact dish name. Each entry accepts src, alt and optional srcSet. The same approved category photograph is cropped into its landing circle, category banner and category hero. Dish photos load lazily. Missing or failed photographs display a labelled neutral monogram, never another dish. This is an explicit visual limitation until verified captures are supplied.
