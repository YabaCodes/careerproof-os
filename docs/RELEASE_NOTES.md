# CareerProof release notes

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
