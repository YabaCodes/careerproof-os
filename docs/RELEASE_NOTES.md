# CareerProof release notes

## 0.1.1-alpha.1 — CP-011A Database Migration & Recovery Foundation (PR review)

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
- No direct deployment or merge; user approval remains the release gate.

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
