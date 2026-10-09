# CareerProof OS — v0.1.1-alpha.3 (CP-011A.2)

**Own your experience. Prove your impact.**

A privacy-first, local-only professional achievement PWA. This branch refines native iOS date controls, mobile navigation density and dialog spacing on top of the merged UI and recovery foundation. Approved branding and all data contracts are retained. The complete v0.1.1 feature milestone remains in progress; deployment requires user review and merge.

## Existing workflows retained
- Personal career profile: display name, headline, summary, professional email, location.
- Create achievements quickly; save as draft or complete record.
- Optional outcome and impact category; dates default to today's **local** date.
- View, search, filter, sort, edit, archive, restore, and permanently delete achievements.
- Dashboard with live statistics and recent achievements.
- IndexedDB local persistence with revision checks for conflicting writes.
- Portable, versioned JSON backup export and full-replacement restore with validation and preview.
- Responsive iPhone, iPad, and desktop layouts, light/dark/system themes, installable offline PWA.

## Deliberately not built yet
CP-011A adds P0 persistence contracts and the built-in taxonomy, schema-1 migration, full format-2 backups and legacy import. CP-011B–E will add employment timeline, credentials, projects, detailed evidence and the competency UI. Later increments add self-assessment, distinct evidence breadth, reviews, CVs and job matching. Planned future modules are **not** yet clickable.

## Run from source

Requires Node.js 20+ and npm. Browser tests also need the Chromium headless-shell runtime. The shipped app has no backend or runtime npm dependencies.

```bash
npm ci
npx playwright install --with-deps chromium --only-shell
npm test
npm run build
npm run preview
```

The compiled static site is in `dist/`. Open the preview URL (typically `http://127.0.0.1:4173`). Do not open `dist/index.html` directly as a `file://` URL: browser modules, service workers and persistence may not work as expected.

Generate alpha.2/alpha.3 comparison screenshots with `node scripts/ios-refinement-evidence.mjs after` (use `before` with `CP_TEST_ROOT` pointing to the matching compiled baseline). Regenerate selected platform icons with `npm run brand:assets`, the review sheet with `npm run brand:review`, and synthetic UI screenshots with `npm run audit:ui`.

## Review and deployment

Work on a feature branch and open a PR targeting main. PR checks build and run all automated tests without publishing. **The user reviews and merges**; do not deploy directly. After an approved merge, the existing GitHub Actions workflow deploys compiled dist/ to GitHub Pages. Pages must use GitHub Actions, not the repository root.

Generate disposable manual-test files with `npm run fixtures:backup`. See [device acceptance steps](docs/ACCEPTANCE_TESTS.md).

## Migration and recovery

Schema 2 preserves existing schema-1 IDs, content, exact dates, timestamps, revisions and archive states. Historical achievements migrate as Confidential. One authoritative PrecisionDate is stored; the current editor uses a compatibility projection.

Format 2 backs up all 12 P0 collections and theme. Format-1/schema-1 imports remain supported. Every restore replaces all local collections and preferences; a legacy backup also removes newer history/portfolio/custom competency records absent from that file. Preview explains this before confirmation. Invalid imports and failed transactions preserve existing data. Stale tabs must reload after another tab restores data.

Export/import limit: **12 MiB of UTF-8 JSON**, at most **100,000 records per collection**. Oversized exports fail explicitly; no records are silently omitted. See [CP-011A contracts](docs/CP_011A_MIGRATION_RECOVERY.md).

## Data safety

**Important:** All CareerProof data is stored locally in the browser's IndexedDB. Data entered on one device **does not sync** to another device. GitHub Pages holds only the application files, not your career data.

Browser data may be cleared or evicted; make backups using Settings → Export regularly. Exported JSON is unencrypted and may contain sensitive information. Save backups securely and avoid putting your real workplace information in GitHub.

Restoring a backup **replaces** all local career collections and portable preferences. The app validates the backup before replacing its database; exporting the current data before restore is recommended. The app does not yet support merging backups or cloud sync.

## Development conventions

- `src/domain`: stable record types, validation rules, application-independent logic.
- `src/data`: IndexedDB repositories and backup logic.
- `src/app`: UI, navigation and event management.
- `src/ui`: shared icons, action routing and dialog lifecycle.
- `styles.css`: centralized responsive design system.
- `public/`: PWA manifest, offline worker and platform icon assets.
- `tests/`: automated validation and backup-format tests.

App version `0.1.1-alpha.3` · database schema version `2` · JSON backup format `2` (also imports legacy format `1`).

## Next increment

CP-011B is paused until CP-011A.2 is reviewed, merged and explicitly verified on iPhone. See the [alpha.3 correction report and before/after screenshots](docs/IOS_FORM_NAV_REFINEMENT.md). Review the [UI audit](docs/UI_AUDIT_CP_011A_1.md), [screenshots](docs/UI_VISUAL_REVIEW.md), [branding](docs/BRANDING_REVIEW.md) and [test results](docs/UI_REGRESSION_REPORT.md).


**v0.1.1 — Professional Experience & Evidence:** roles/employers, education, credentials, portfolio, competency tags and related achievement links. Schema changes will use migrations and must preserve existing data.
