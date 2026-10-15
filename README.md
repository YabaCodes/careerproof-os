# CareerProof OS — v0.1.3-alpha.5 (CP-UX-Links accepted)

**Own your experience. Prove your impact. Shape your future.**

CareerProof OS is a privacy-first, local-first professional career and achievement PWA. **`v0.1.3-alpha.5` CP-UX-Links was merged in PR #36, its version-specific CI assertions were repaired in PR #37, and the subsequent `main` build/test/deployment passed.** The user confirmed **UX301–UX307 all PASS on physical iPhone (2026-10-16)** for context navigation among existing achievements, experiences, roles and skills. Earlier `v0.1.3-alpha.4` CP-UX2 was merged in PR #35, but its separate UX201–UX207 acceptance is unreported. Current progress is in the [milestone tracker](docs/MILESTONE_TRACKER.md).

## v0.1.3-alpha.5 — Context Navigation (CP-UX-Links)

This **read-only** improvement makes saved associations tappable without inventing links or proficiency scores:
- Achievement detail → primary Experience and employment-role Vault filter; other Experiences remain under More Details and are now actionable.
- Achievement detail → linked Skills; the specific skill expands in the Skills page, including archived linked skills.
- Experience detail → Skills Shown Here. Tapping a chip opens the existing skill and its linked achievement examples/self-assessed proficiency.
- Skills continue to link back to achievement detail, closing the contextual loop.

The original Result → What I Did → Context → Skills reading order, Guided Capture flow, search/filter controls, IndexedDB schema **3**, backup format **3**, taxonomy and privacy rules remain unchanged. Navigation writes no records. Mobile controls target at least 44px, and scrolling honors Reduce Motion.

**Qualification:** CP-UX-Links alpha.5 **accepted** based on physical iPhone UX301–UX307 PASS. [Main CI build/test/deploy run 38751956798](https://github.com/YabaCodes/careerproof-os/actions/runs/38751956798) succeeded. This is acceptance of the contextual navigation increment only, **not final v0.1.3 release acceptance**. CP-UX2 alpha.4 UX201–UX207 and CP-013B PA101–PA106 results have not yet been reported.

## Capabilities in v0.1.2 (P0 shipped baseline)

- **Career Profile:** contact information, professional summary, employer history, overlapping job roles and promotions, precision-aware dates, education, credentials and certifications.
- **Experience Portfolio:** projects, initiatives and ongoing responsibilities with compact expandable cards, employer and employment-role associations, status, context and technologies. In v0.1.2 an experience is a container (DEC-034): its card rolls up the outcomes of its linked achievements, and an experience can be created while capturing an achievement.
- **Achievement Vault:** quick capture, drafts, recorded and archived achievements; advanced situation/actions/outcome notes; multiple Experience and competency links, including a primary Experience.
- **Evidence and impact:** measurable baseline/result values, units, source/context notes, user-entered evidence references and explicit confidential/private designations. Claims and references are not independently verified.
- **Competency Library:** four built-in categories and 32 seeded competencies with linked achievement examples, plus custom skill create/edit/archive/restore. No automatic proficiency scoring.
- **Search and filtering:** achievements by text, dates, role, Experience, competency and status.
- **Local data integrity:** Settings → **Check data** validates all 13 IndexedDB collections and their full version-3 backup-format round-trip without uploading, restoring or changing records.
- **Recovery:** full version-3 JSON export, validated full-replacement restore, support for legacy format-1 backups, transactional data-revision checks against stale restore previews. In v0.1.2 Settings → Check data includes a read-only **Data Health** report; deleting a linked record opens a review sheet to **move or unlink** its dependents. Achievements are never deleted as a side effect.
- **Installable offline PWA:** iPhone, iPad and desktop responsive layouts, light/dark/system themes, accessible mobile form controls and explicit update checks/restart controls.

**Since v0.1.3-alpha.4 (CP-UX2, merged, device acceptance pending):** a new achievement is captured as Where → What → When. The chosen experience is the primary one, and the role follows it by date. Skills are suggested as chips, and the impact category is no longer asked for.

**Since v0.1.3-alpha.3 (CP-UX1, accepted):**
- **Experience** lists roles most recent first, each with its experiences as one-line rows. Each experience has a page with its context, goal or expected result, achievements and skills.
- An achievement opens as Result → What I Did → Context → Skills, with everything else under More Details.
- The **Vault** opens on Recorded, with Drafts and Archived one tap away.
- Achievement dates are Month, Year or Exact day.
- In **Profile**, a record's name opens its editor, which holds Delete.

The v0.1.2 iPhone bottom navigation is **Home / Vault / Experience / Skills / Profile**, with **＋ (new achievement)** and **Settings** in each screen's header (DEC-029). The look follows the Wealth OS design language with CareerProof's navy/teal (DEC-030). Titles and subtitles use Title Case (DEC-032) and Employment History lists the most recent employer first (DEC-033). Home shows **Complete Your Record** and **Achievements by Role** (DEC-035): derived counts and links, no scores.

## Data ownership and safety

**Career data stays in the browser's IndexedDB.** GitHub Pages serves the application code, not the user's personal records. There is **no account, cloud sync, multi-device synchronization or automatic external backup**.

- Export regularly using **Settings → Export**, verify the JSON file really saved and keep a separate secure copy. Exported JSON is **not encrypted**.
- **Check data** is read-only and validates structure and backup compatibility. It **does not create a recoverable external backup**, validate the real-world truth of career claims or guarantee that device storage cannot be evicted.
- Restoring a backup is a **destructive full replacement** of local collections and portable preferences. Inspect the preview carefully. If records changed since the backup was selected, the operation stops without replacing anything; review/reselect the file before trying again.
- **Never uninstall the Home Screen PWA, clear Safari website data or reset browser storage to force an update.** Doing so may permanently remove unexported local records.
- Do not put real employer documents, confidential career details, or private backups in this public GitHub repository.

Database schema **3**, backup format **3** (also reads earlier formats **1** and **2**), taxonomy version **1.0**. Backup limit: **12 MiB UTF-8 JSON**, at most **100,000 records per collection**. Oversized backups fail rather than silently dropping records.

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

The next active increment is `v0.1.3`, beginning with CP-013A read-only evidence breadth and later persistent L1–L4 proficiency history with separately reviewed migration and restore compatibility. Later versions may add performance reviews, editable CV output, and deterministic pasted job-description comparison; these are **not included** in `v0.1.2`. The user's near-term priority is privately backfilling existing career history, Experiences and achievements within the current PWA—not expanding product scope. Each new feature increment requires separate approval; see the [roadmap](docs/ROADMAP.md) and [milestone tracker](docs/MILESTONE_TRACKER.md).
