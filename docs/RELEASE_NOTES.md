# CareerProof release notes

## 0.1.2-alpha.2 — CP-012.1 Faster, user-controlled update detection (review)

- **Why updates felt slow:** automatic update checks were throttled to once every 5 minutes, so returning to the app soon after a release did nothing until the throttle expired and the app was foregrounded again. On top of that, CI takes about 2.5 minutes to test and deploy, and GitHub Pages can serve a cached `sw.js` for up to about 10 minutes.
- Removes the time throttle. The app checks **every time it is opened, brought to the foreground or reconnects**; an in-flight guard merges simultaneous events into one request.
- **Restart stays your decision (DEC-028).** The banner now names the release ("Restart to load version 0.1.2-alpha.3") and offers **Back up first** (full JSON export) next to **Restart app**. Nothing reloads by itself; the unsaved-changes guard is unchanged.
- Settings → Check for updates now reports a real result: *latest version available*, *downloading*, or *update ready*, plus the last check time and the ~10-minute GitHub Pages caveat.
- `sw.js` answers a version request so the banner can name the incoming release.
- New tests: every foreground checks (no 5-minute throttle) and duplicate events merge; a simulated new deploy shows the banner with version, Back up first keeps it, Restart app loads the update with records unchanged, and the banner clears the bottom navigation at 320/375/430px. All three fail on the previous code.
- **Note:** this code takes effect from the *next* release. Moving to alpha.2 itself still uses the old path (Settings → Check now → Restart app).
- No schema, backup-format, record or navigation change.


## 0.1.2-alpha.1 — CP-012.0 Experience text integrity hotfix (review)

- **Fixes a data-corrupting defect present since 0.1.1-alpha.8 (CP-011C).** The Experience Portfolio used its own HTML-escaping helper that wrote `&#39` without the closing semicolon. Browsers decode an apostrophe followed by digits as a different character (`'24` → `པ`, `'12` → `༈`, `FY'25` → `FYཕ`). The card displayed the wrong text, and **opening Edit and saving, even unchanged, stored the corrupted text** in name, objective, scope, responsibilities, outcome and technologies.
- All templates now use one shared `escapeHtml` (`src/ui/html.ts`). A static test fails if another local escaping helper appears.
- New regression tests: a Node unit test that every character reference is terminated, and a browser test covering display, edit form value, unchanged save and stored value. The browser test fails on the previous code.
- **Existing records:** text is damaged only if an apostrophe directly before a digit was typed into an Experience field **and** that Experience was later edited and saved. The fix cannot safely reverse such characters automatically because the same code points can be legitimate text (for example, CJK characters). See acceptance check H103.
- No schema, backup-format, record or navigation change. App version, service-worker cache and the offline app shell (new `html.js` module) are updated.


## Documentation — v0.1.1 status reconciliation and milestone tracker (docs-only, no app version change)

- Reconciles documentation that still described the `v0.1.1` final promotion (PR #16) as pending; it is merged and deployed.
- Adds [`docs/MILESTONE_TRACKER.md`](MILESTONE_TRACKER.md), the persistent per-feature tracker using the lifecycle **Not Started → Planned → In Development → In Review → Merged → Device Testing → Accepted**.
- No source, schema, backup-format, service-worker cache or version changes. The installed PWA will not see an update from this change.


## 0.1.1 — Professional Experience & Evidence (released 2026-10-10)

**Release state (verified 2026-10-10):** Final promotion [PR #16](https://github.com/YabaCodes/careerproof-os/pull/16) was **merged by the user** on 2026-10-10 (merge commit `398f892974f3fab037656d8bc1d923df461c6397`). PR CI [run 38020852674](https://github.com/YabaCodes/careerproof-os/actions/runs/38020852674) and post-merge main CI [run 38021279551](https://github.com/YabaCodes/careerproof-os/actions/runs/38021279551) both succeeded; the main run built, passed **42/42 Node and 102/102 browser tests**, and **deployed to GitHub Pages**. The live service worker serves cache `careerproof-v0.1.1`. The user explicitly accepted all eight `v0.1.1-rc.1` physical iPhone checks on the existing Home Screen PWA; a separate post-promotion smoke check of the final `v0.1.1` (Settings shows `v0.1.1`, existing records intact) has **not yet been reported**. **No Git tag or GitHub Release exists** for `v0.1.1`; creating one requires explicit user authorization.

*The bullets below are the original promotion-PR description, retained for history.*

- Promotes the already accepted `v0.1.1-rc.1` implementation to **`v0.1.1`**. There are no feature, database, record, manifest identity, or portable backup contract changes in the final promotion.
- Updates app/package version, service-worker cache name and exact release-specific automated test expectations.
- Documents the full delivered scope: career employers/roles and qualifications, compact Experience Portfolio, achievement metrics/evidence with typed links, competency library, Vault filters, data-integrity check, schema-1 upgrade and format-1 import compatibility, validated format-2 backup and restore, installed offline PWA.
- Final candidate CI baseline: **42/42 Node and 102/102 browser tests**, production build passed. Release PR must pass the full suite again on the final version strings before merge.
- Native iPhone candidate acceptance: eight checks confirmed, including existing data, downloaded backup, Settings Check data, employment/Experience records, rich achievement and competency workflows, iOS Quick Capture keyboard/layout, and offline reopening.
- Important limitations remain: **local-only IndexedDB** can be lost when browser/PWA data is removed; exported JSON is **not encrypted**; no cloud sync, external employer-document upload, proficiency scoring, performance-review generator, CV generator or job-fit tool.
- No automatic merge or release tag. GitHub Pages deploys only after the user merges the PR. After deployment, verify that Settings displays `v0.1.1` and existing records remain intact without reinstalling the PWA.


## 0.1.1-rc.1 — CP-011E Release Qualification (review candidate)

- Integrates Career Profile, Experience Portfolio, Vault, Competency Library and PWA workflows for final candidate qualification. Not GA until physical iPhone acceptance.
- Adds read-only **Settings → Check data**: validate complete source, links, privacy and portable preferences via a full in-memory format-2 backup round-trip. No upload, download or mutation; export a separate backup.
- Prevents stale restore confirmation from overwriting ordinary edits made after backup selection. User must review the current work and reselect the backup before replacing data.
- Adds Node and browser integration/recovery/offline tests and retains the previous mobile regression suite.
- Schema 2, backup format 2, taxonomy 1.0 and the existing installed PWA identity remain unchanged. Service-worker cache is updated.
- See [CP-011E qualification plan](CP_011E_RELEASE_QUALIFICATION.md). Final v0.1.1 requires a separate user-approved promotion.



## 0.1.1-alpha.10 — CP-011D.1 iPhone Quick Capture overlap correction (review)

- Corrects a confirmed physical iPhone alpha.9 regression: the optional More details control visually overlaid the What did you do? label in the achievement editor.
- Returns optional enrichment below the five core Quick Capture fields (after Outcome); uses a short More details / Optional control to avoid wrapping over primary content.
- Scopes explicit intrinsic grid-row sizing to the achievement form and removes stacking overrides responsible for painting optional controls above neighboring fields.
- Adds eight mobile width/theme geometry and interaction regression checks, verifying no overlap collapsed, expanded or after collapsing; original Outcome keyboard checks remain.
- Presentation-only release: no changes to IndexedDB schema 2, backup 2, career/achievement data, privacy, record links or installed PWA identity.
- Physical iPhone acceptance remains required after deployment. Do not reinstall the PWA to update.


## 0.1.1-alpha.9 — CP-011D Expanded Achievements & Competency Linking (review)

- Optional advanced achievement editor adds situation, actions, notes, explicit privacy, career role, multiple Experience and competency links, optional primary project, user-entered impact metrics and evidence references.
- Preserves fast default capture while validating numeric measurements and safe URL references; never claims independent verification or inferred proficiency.
- Saves achievement source, typed links, metrics and evidence in a single validated IndexedDB transaction, preserving stable IDs and revision checks; existing achievement and CP-011C project relationships remain supported.
- Competency Library lists the four seeded categories and 32 built-in skills with linked examples, and allows custom competency creation/edit/archive; no L1–L4 self-assessment or scores.
- Vault gains role, Experience, competency, date and status filtering. Mobile navigation and iOS Outcome keyboard treatment remain unchanged.
- Reuses database schema 2 and private backup format 2, extends offline app-shell cache, updates browser regression coverage. iPhone acceptance pending; [full CP-011D scope](CP_011D_ACHIEVEMENT_INTELLIGENCE.md).


## 0.1.1-alpha.8 — CP-011C Experience Portfolio (PR review)

- Adds a compact Profile-linked Experience Portfolio for projects, initiatives and ongoing responsibilities, with independent expandable details, search and type/status filters.
- Supports purpose/scope/personal responsibilities, outcomes, technologies, optional employer, precision-aware dates, and conservative Confidential-by-default records.
- Allows multiple employer-matched roles to associate through stable typed links, with atomic project-and-links transactions and no duplicate names or IDs.
- Shows previously linked achievements and permits starting a new achievement from project context; achievement/link creation is atomic.
- Blocks deletion of projects referenced by roles or achievements. No silent cascade, task tracking, timelines or vendor meeting features.
- Preserves schema 2, full private backup format 2, existing employer/role records, compact navigation, and iOS keyboard behavior. Adds browser regression checks; physical iPhone acceptance still required.
- [Scope and iPhone acceptance](CP_011C_EXPERIENCE_PORTFOLIO.md). CP-011D not authorized until user approval.


## 0.1.1-alpha.7 — CP-011B.2 Installed PWA update controls (review)

- Investigated an iPhone Home Screen PWA staying on alpha.5 for ~30 minutes while Safari already displayed alpha.6. The alpha.6 Pages deployment was successful; the app uses an offline cache-first service worker, without a controlled client update notification.
- Check the service worker on PWA launch, foreground return and pageshow (with five-minute throttle); register with HTTP-cache-bypassing update policy where supported.
- Add **Check now** in Settings and an optional **New version ready → Restart app** banner when a newer controller activates. Never automatically reload or remove the PWA; protect an unsaved editor with a confirmation and block during pending saves.
- During service-worker installation, fetch a fresh copy of each app-shell asset instead of accepting a stale browser HTTP-cache response. Continue serving the installed app cache-first while offline; preserve schema 2, backup format 2 and all existing career records. Bump app and offline shell to alpha.7.
- This is a prevention mechanism for future releases; it cannot retroactively make an old alpha.5 app expose a Check now button before its next update. Close/reopen the existing installed PWA to trigger the first update, not reinstall it.
- Physical Safari/Home Screen app verification remains required before accepting the hotfix.


## 0.1.1-alpha.6 — CP-011B.1 Compact Career Timeline (review)

- Addresses iPhone feedback that full employer descriptions and role responsibilities make Employment History too long to scan.
- Shows employer name, industry/location, role title, start/end/current dates, employment type and primary-role badge immediately. Each description is clamped to **two visible lines** by default.
- Adds an independent, keyboard-accessible **… More / Less** action only when the description is visibly truncated or the record has optional hidden details. Expansion reveals the complete original text and associated secondary details without opening a modal or modifying persisted data.
- Applies the same disclosure pattern to education descriptions and credential notes. Employer website, leadership scope, technologies, honors and verification details are available on expansion instead of crowding the overview.
- Preserves compact mobile navigation, approved branding, form input behavior, IndexedDB schema 2, JSON backup format 2, stable record IDs and all previously entered descriptions.
- Bumps app and service-worker cache to alpha.6; adds synthetic mobile/theme/regression coverage. Native iPhone acceptance is required before continuing CP-011C.


## 0.1.1-alpha.5 — CP-011B Career History & Qualifications (PR review)

- Adds employer/role history with multiple promotions/overlapping current roles, a primary-role setting, optional qualifications and credential data to Career Profile. No new mobile nav destination.
- Reuses existing schema-2 stores with precise year/month/day dates; preserves IDs/revisions, user data, old profile fields, and existing achievement capture/backup features.
- Primary-role changes save atomically alongside role updates. Referenced employer/role deletion is blocked instead of cascading. Credential URLs require supported http(s) schemes.
- Adds education, credential and employment browser checks, responsive styling and synthetic full-backup round trip tests.
- Updates PWA cache with the new compiled careerHistory module and app version. No migration or new backend.
- [Scope, data safeguards and pending iPhone acceptance](CP_011B_HISTORY_QUALIFICATIONS.md). CP-011C is not authorized until alpha.5 iPhone UAT passes.


## 0.1.1-alpha.4 — CP-011A.3 iPhone keyboard / Outcome visibility (PR review)

- Rechecks focused-field visibility after mobile VisualViewport CSS/layout changes and during late keyboard animation; scrolls only the modal-body instead of the background document.
- Handles textarea taller than the keyboard-visible region by revealing its label and an editable portion; retains browser-native caret scrolling as text grows.
- Tracks unobstructed viewport height in standalone mode, preserving pinch-zoom exclusion and safe-area behavior; uses the full visible mobile dialog height while keyboard is open.
- Adds synthetic staged-keyboard focus/typing/focus-switching regression tests and new CP-UI301 iPhone acceptance gate; physical Safari acceptance remains pending.
- Preserves schema 2, format-2/legacy-1 backup, record data, selected CP branding, compact navigation, date inputs, and all CP-011A data protection.
- [Root cause and manual checklist](IOS_KEYBOARD_OUTCOME_CP_011A_3.md). CP-011B remains paused until actual device acceptance.


## 0.1.1-alpha.3 — CP-011A.2 iOS Form & Navigation Refinement (PR review)

- Resets native date/month/time presentation to bounded border-box, left-aligned WebKit values and shared 48px/16px input treatment; retains native picker and existing date precision/blank-draft adapters.
- Matches Wealth OS's compact philosophy: 60px nav content, 19–20px glyphs, 24px frames, 10.5px labels, 34px Add circle and 1.8px strokes; five equal full-button targets, common icon/label alignment and subtle active state. Safe inset remains separate.
- Keeps initial phone focus on the named dialog, with body-only label-context scrolling. Reduces shared form/body/footer spacing, prevents narrow footer label splitting, and removes redundant bottom inset when a keyboard candidate reduces the visual viewport. Compact textareas remain internally scrollable.
- Preserves the approved monogram/platform assets, all schema-2/format-2/legacy-1 contracts, record IDs and precision, atomic recovery and stale-tab protection. No new modules, recovery attempt, automatic imports or production achievement seeding.
- App/package/worker cache move to alpha.3. Adds 22 focused mobile/theme/precision/viewport cases and alpha.2-cache upgrade/offline-style checks; actual local results **37 Node + 52 Chromium passed**, typecheck/build/diff check passed.
- Includes [root cause, Wealth OS dimensions, before/after screenshots and limits](IOS_FORM_NAV_REFINEMENT.md). Native iPhone picker/keyboard/safe areas/VoiceOver/offline cold-start remain manual; Chromium does not certify them.
- CP-011B is paused until separate PR review/merge and explicit iPhone acceptance (CP-UI201–206). No automatic merge/deployment.

## 0.1.1-alpha.2 — CP-011A.1 UI/UX Stabilization & Branding (merged in PR #5; iPhone findings require CP-011A.2)

- Consolidates shared typography, spacing, controls, cards, dialogs and light/dark contrast.
- Fixes phone Profile overflow, crowded Settings and the missing tablet navigation interval.
- Retains five evenly aligned phone positions: Home, Vault, Add, Profile, Settings; standardizes all vectors, including document Vault and gear Settings.
- Implements the user's selected Concept 1 Modern Monogram across sidebar/header/favicon/install assets. Includes editable SVG, 192/512 PNGs, separate maskable 512, opaque Apple touch 180 and favicon fallbacks.
- Keeps dialog chrome visible around a scrolling body; tracks the visual viewport for keyboards, locks/restores background scroll and restores focus to recreated invokers. Background is inert while a dialog is open.
- Preserves unsaved forms through hash changes, removes redundant navigation renders, shows bounded in-dialog notifications and pending-write busy states.
- Adds 14 responsive/theme matrix cases and focused interaction/contrast/loading/icon/offline-upgrade checks. Local results: 37 Node + 30 Chromium tests passed, typecheck and production build passed.
- Captures 252 screenshots per baseline/proposed version; zero proposed horizontal overflow, clipping, undersized controls or missing-navigation encounters. See [audit](UI_AUDIT_CP_011A_1.md), [visual evidence](UI_VISUAL_REVIEW.md), [branding](BRANDING_REVIEW.md), [test report](UI_REGRESSION_REPORT.md).
- App/cache version is alpha.2; IndexedDB schema 2 and backup format 2/legacy 1 are unchanged. No new modules or persistent data changes.
- The user merged PR #5; subsequent iPhone review led to CP-011A.2. CP-011B remains paused for that corrective checkpoint. Real-device checks remain in ACCEPTANCE_TESTS.md.

## 0.1.1-alpha.1 — CP-011A Database Migration & Recovery Foundation (merged; five iPhone smoke checks user-confirmed)

- Adds schema 2 with all 12 P0 collections; no P1 stores or CP-011B–E screens.
- Migrates v0.1.0 profile and achievements losslessly, including exact dates, timestamps, revisions and archive status. Blank draft dates remain unspecified.
- Stores one PrecisionDate and adapts the existing editor; historical/new achievements remain Confidential. Existing UI edits preserve rich fields not yet editable.
- Fixes malformed-backup type/enum coercion; validates every collection, date, metric, identifier, count and relationship before replacement.
- Exports complete format-2 backups with theme and accepts format-1 legacy imports. Legacy preview explains replacement of all newer collections/custom records.
- Adds atomic restore readback/rollback and persistent dataset generations, supplementing record-revision conflicts across tabs.
- Seeds four categories and all 32 stable built-in competencies idempotently; preserves custom records.
- Enforces matching 12 MiB UTF-8 export/import limits and 100,000 records per collection; oversized exports fail without truncation.
- Updates app/cache versions and offline module list. Retains capture, editing, archive/restore/delete, Profile, responsive navigation and direct-backdrop handling.
- Adds synthetic IndexedDB recovery tests and Chromium interaction/offline tests to npm test and PR CI.
- Automated results and pending iPhone/iPad checks are tracked in ACCEPTANCE_TESTS.md. This foundation is not acceptance of the full v0.1.1 release or complete P0 qualification.
- The user merged PR #4 and confirmed all five CP-011A iPhone smoke checks. Extended qualification and future checkpoints retain their separate gates.

## v0.1.0 — UI Hotfix 1 (input/nav accepted on iPhone; broader UAT pending)

- Fixed a delegated-click bug where interacting with inputs, labels and selectors inside dialogs closed them unexpectedly.
- Only a direct click on the modal backdrop dismisses the dialog; close buttons still work normally.
- Evenly aligned the five mobile bottom-navigation buttons and removed the raised center-button offset.
- Updated the offline service-worker cache identifier to refresh published UI assets.
- Added the new dialog-routing module to the offline cache, so the app still opens without a connection.
- Pull-request checks run in their own queue and can no longer cancel a live deploy.
- Added four automated UI-routing and layout regression checks, plus a check that every app module is cached for offline use.
- Enabled non-deploying build/test checks for new pull requests.
- Data model and database schema remain unchanged; no data migration required.

## 0.1.0 — Career Foundation (first usable implementation)

**Shipped:** Responsive three-destination PWA, career profile, Quick Capture, draft/recorded/archived achievements, Vault search and status/sort filters, achievement editing and deletion safeguards, IndexedDB persistence, versioned JSON backup with import validation and replacement preview, basic release status and themes.

**Not shipped:** Role/employer/project relationships, competency tagging/scoring, performance reviews, CV generation, job matching, AI, cloud sync.

**Known limitations:** Local per-device data only; generated JSON files are not encrypted; SVG install icons may vary in support across platforms; application upgrades need explicit migration tests before future schema changes.

**Versioned modules:** Profile (basic), Achievement Vault (core), Experience Portfolio (not started), Competency Intelligence (not started), Career Roadmap (planned), Performance Studio (planned), Job Readiness (planned), Analytics (basic dashboard only).
