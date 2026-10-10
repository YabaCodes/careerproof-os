# CareerProof OS — v0.1.1

**Own your experience. Prove your impact.**

CareerProof OS is a privacy-first, local-first professional career and achievement PWA. The `v0.1.1 — Professional Experience & Evidence` milestone has passed automated release qualification and the user's physical iPhone acceptance on `v0.1.1-rc.1`. Final version promotion is performed through a separate user-reviewed PR; merge and GitHub Pages deployment remain explicit user-controlled steps.

## Capabilities in v0.1.1

- **Career Profile:** contact information, professional summary, employer history, overlapping job roles and promotions, precision-aware dates, education, credentials and certifications.
- **Experience Portfolio:** projects, initiatives and ongoing responsibilities with compact expandable cards, employer and employment-role associations, status, scope, contribution, technologies and outcomes.
- **Achievement Vault:** quick capture, drafts, recorded and archived achievements; advanced situation/actions/outcome notes; multiple Experience and competency links, including a primary Experience.
- **Evidence and impact:** measurable baseline/result values, units, source/context notes, user-entered evidence references and explicit confidential/private designations. Claims and references are not independently verified.
- **Competency Library:** four built-in categories and 32 seeded competencies with linked achievement examples, plus custom skill create/edit/archive/restore. No automatic proficiency scoring.
- **Search and filtering:** achievements by text, dates, role, Experience, competency and status.
- **Local data integrity:** Settings → **Check data** validates all 12 IndexedDB collections and their full version-2 backup-format round-trip without uploading, restoring or changing records.
- **Recovery:** full version-2 JSON export, validated full-replacement restore, support for legacy format-1 backups, transactional data-revision checks against stale restore previews and protected dependent-record deletions.
- **Installable offline PWA:** iPhone, iPad and desktop responsive layouts, light/dark/system themes, accessible mobile form controls and explicit update checks/restart controls.

The iPhone bottom navigation retains **Home / Vault / Add / Profile / Settings**; Experience Portfolio and Competency Library open from Profile.

## Data ownership and safety

**Career data stays in the browser's IndexedDB.** GitHub Pages serves the application code, not the user's personal records. There is **no account, cloud sync, multi-device synchronization or automatic external backup**.

- Export regularly using **Settings → Export**, verify the JSON file really saved and keep a separate secure copy. Exported JSON is **not encrypted**.
- **Check data** is read-only and validates structure and backup compatibility. It **does not create a recoverable external backup**, validate the real-world truth of career claims or guarantee that device storage cannot be evicted.
- Restoring a backup is a **destructive full replacement** of local collections and portable preferences. Inspect the preview carefully. If records changed since the backup was selected, the operation stops without replacing anything; review/reselect the file before trying again.
- **Never uninstall the Home Screen PWA, clear Safari website data or reset browser storage to force an update.** Doing so may permanently remove unexported local records.
- Do not put real employer documents, confidential career details, or private backups in this public GitHub repository.

Database schema **2**, backup format **2** (also reads legacy format **1**), taxonomy version **1.0**. Backup limit: **12 MiB UTF-8 JSON**, at most **100,000 records per collection**. Oversized backups fail rather than silently dropping records.

## Development and testing

Requires Node.js 20+ and npm. Browser tests use Playwright Chromium headless shell. There are no runtime npm dependencies or backend services.

```bash
npm ci
npx playwright install --with-deps chromium --only-shell
npm test
npm run build
npm run preview
```

Compiled static assets appear under `dist/`. Open the local HTTP preview (usually `http://127.0.0.1:4173`); do not load `dist/index.html` using `file://` because service workers and persistence require an HTTP context.

Optional development workflows: `npm run fixtures:backup` for synthetic disposable backups, `npm run brand:assets` for platform icons, `npm run brand:review` for the branding review sheet and `npm run audit:ui` for synthetic UI screenshots.

## Release and contribution process

1. Work on a dedicated branch and open a PR against `main`.
2. Run the automated build, Node tests, full browser suite, data recovery and offline PWA checks.
3. **The user reviews and merges the PR.** GitHub Actions deploys compiled `dist/` to GitHub Pages after merge.
4. Confirm the deployed version, local data retention, UI, keyboard and offline reopening on a physical iPhone.
5. Never automatically merge, tag a release or publish a new build without explicit authorization.

See the [release notes](docs/RELEASE_NOTES.md), [roadmap](docs/ROADMAP.md), [CP-011E final integration qualification](docs/CP_011E_RELEASE_QUALIFICATION.md), [acceptance history](docs/ACCEPTANCE_TESTS.md), [privacy/recovery contracts](docs/CP_011A_MIGRATION_RECOVERY.md), and [product specification](docs/PRODUCT_SPEC.md).

## Planned next increments

The next planned `v0.1.2` expands data health, controlled deletion, dashboard insights and reliability hardening. Future increments may add user-assessed proficiency (distinct from documented evidence), performance reviews, editable CV output and job-fit comparison. These features are **not included** in `v0.1.1`.
