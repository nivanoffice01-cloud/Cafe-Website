# Storage audit — 25 November 2026

Read-only audit. **Nothing was deleted.** Free space fluctuated from about 305 MiB to 1.0 GiB during this session. The 30 GB working-storage target is not achieved. Sizes below are allocated filesystem blocks reported by `du -k`, converted to GiB; directory totals are not additive when nested. APFS snapshots, clones and other running apps can change actual recovered space.

## Proposed approval batch A: regenerable caches

Close the owning applications first. These are candidates for selective cache cleanup, not authorization to erase entire application profiles. Rebuilds and downloads will be needed afterwards.

| Exact path (`~` = `/Users/shekharchouhan`) | GiB | Conditions |
|---|---:|---|
| `~/Library/Caches/Google` | 5.17 | Browser caches only; keep `Application Support/Google/Chrome`, history, cookies, profiles and bookmarks |
| `~/Library/Caches/com.openai.codex` | 3.04 | Close Codex before a later cleanup; preserve `~/.codex/sessions` and active task state |
| `~/Library/Caches/Wallspace` | 1.09 | Regenerable app cache; downloaded content would need fetching again |
| `~/Library/Caches/ai.perplexity.macv3` | 0.99 | Close app; do not touch its persistent profile |
| `~/Library/Developer/Xcode/DerivedData` | 2.24 | Generated builds; rebuilding native apps will be slower |
| `~/Library/Developer/Xcode/DocumentationCache` | 0.50 | Documentation must be downloaded again |
| `~/Library/Application Support/Code/CachedExtensionVSIXs` | 0.86 | Cached extension installers; retain installed extensions/settings |
| `~/Library/Application Support/Claude/Cache` | 0.80 | Cache only, not VM bundle or sessions |
| `~/Library/Application Support/Claude/Code Cache` | 0.23 | Regenerable compiled cache |
| `~/Library/Application Support/Canva/Cache` | 0.33 | Cache only; preserve drafts/profile |
| `~/Library/Application Support/Canva/Code Cache` | 0.19 | Regenerable compiled cache |
| Repository root `dist/` | 0.074 | Vite output; explicitly NOT `CRM/dist/` |

**Batch A estimated ceiling: approximately 15.5 GiB (16.7 GB)**. These sizes are estimates of candidate contents, not guaranteed recoverable blocks. Approval is still required before cleanup. With current free space, this alone will not meet 30 GB.

## Batch B: dependencies in other projects — conditional, not yet safe to remove

Under `~/Documents/GitHub/Lookmefy-Unified-Backend/`:

| Relative path | GiB |
|---|---:|
| `Edu-nex_Final/appcopyai/node_modules` | 1.42 |
| `Edu-nex_Final/appcopyai/ios/Pods` | 1.21 |
| `Edu-nex_Final/edunex-f/marketing-web/node_modules` | 0.50 |
| `Lookmefy-Unified-Backend/fit-look-APP/mobile/node_modules` | 0.37 |
| `Lookmefy-Unified-Backend/node_modules` | 0.20 |
| `Lookmefy-Unified-Backend/fit-look-APP/mobile/ios/Pods` | 0.20 |
| `Edu-nex_Final/edunex-b/node_modules` | 0.17 |
| `Edu-nex_Final/tmp/guest-route-fix/release/edunex-b/node_modules` | 0.13 |

About 4.2 GiB of potential reinstallable dependencies. These projects are outside the café work scope. Verify lockfiles, custom edits/patches, offline dependencies and active development before proposing a concrete deletion. Native build `.cxx` copies were not included, avoiding nested double counting. Café `node_modules` is retained for current tests and tooling.

## Large items requiring preservation or external relocation

| Path | GiB | Decision |
|---|---:|---|
| `~/Library/Developer/CoreSimulator/Devices` | 23.39 | **Do not delete:** simulator app databases and test state may be valuable. `simctl` could not connect to its service, so no device was classified as safely obsolete. An approved, verified external archive is a possible space strategy. |
| `~/Library/Application Support/Claude/vm_bundles` | 9.04 | **Do not delete:** contains root filesystem and session disk images. Not a verified disposable download cache. |
| `~/.codex/sessions` | 4.67 | Preserve conversation/task history |
| Other-project `Lookmefy-Unified-Backend/output` | 2.37 | Contains iOS release archives; preserve signing/debug/release evidence |
| Café `.git` | 0.51 | Preserve all history including `2b1b923`; no pruning/history rewriting |
| Café `artifacts/` | 0.46 | Review screenshots and recordings, including 0.44 GiB architectural review; archive externally only with approval |
| Café `archives/rejected-frontends/2026-11-25` | 0.40 | Rejected cinematic source/assets, already outside active public build; retain recoverability |
| `/private/tmp/Cafe-Website-pre-architectural-reset-2026-11-25.tar.gz` | 0.43 | Recoverable full backup; retain until an approved replacement copy is verified |
| `/private/tmp/mangosteen-food-tools` | 0.78 | Installed Blender, required for this pipeline |

**Safest path to 30 GB:** approve a selective cache batch and use a writable external workspace, or separately authorize verified relocation of old simulator/review archives. Do not erase simulator databases merely to hit a capacity target. No destination drive has been approved. Moving within the same APFS volume does not free working space.

## Smaller audit findings

- `~/.cache/cycles`: about 60 MiB; keep compiled Metal kernels.
- `~/Library/Caches/ms-playwright`: about 586 MiB; keep browser automation.
- `~/.cache/puppeteer`: about 539 MiB; possible redundant browser, but other tools may depend on it. Not in batch A.
- `~/.cache/codex-runtimes`: about 1.26 GiB; retain active tool runtimes.
- `/private/tmp/mangosteen-entrance-study.glb`: about 33 MiB; possible duplicate, not deleted or counted without hash comparison.
- `/private/tmp/mangosteen-pizza-candidate.glb`: about 12 MiB; rejected external test download. Negligible against the target; not deleted.
- Café `public/`: about 75 MiB, protected genuine photos/menu/brand assets; no blanket deletion.
- Café `assets/food-vfx/pizza`: preserved unapproved studies, protected by `2b1b923`.
- `CRM/data/mangosteen_crm.sqlite3` and `CRM/backups/`: protected, excluded from every cleanup proposal.
- Downloads, original photography, source code, all Git histories and persistent browser/app profiles were excluded.

## Method and limits

Used scoped `du -x -k -d` directory inventories, `df -h`, Git status/commit checks and metadata-only file listings. No database contents or credentials were inspected. Some macOS paths deny access; no full-disk inventory or APFS snapshot accounting is claimed. No cache is labelled safe solely because its parent directory is large. Estimated batch totals exclude all protected items above.
