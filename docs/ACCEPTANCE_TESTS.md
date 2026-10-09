# CareerProof — Acceptance test plan

## CP-011A automated evidence (0.1.1-alpha.1)

All fixtures are synthetic. `npm test` runs the production build, 36 Node tests and 8 Chromium tests; `npm run typecheck` is a separate compile check. Local results on 2026-10-09: **36/36 Node and 8/8 Chromium tests passed**, production build and separate typecheck passed. CI must also pass on the PR commit; automation is not real-device acceptance.

| Gate | Automated coverage |
|---|---|
| CP-A01 / INT-01 | Schema-1 profile plus Draft/Recorded/Archived → schema 2; original content, IDs, dates, timestamps, revisions and archive state compared |
| CP-A02 / INT-02 | Strict types/enums/timestamps/precision, all 12 collection shapes, count/ID/link uniqueness, broken references and primary-project constraints |
| CP-A03 / UAT-09/11 | Full format-2 round-trip and portable theme; format-1 full replacement with new stores cleared and built-ins seeded |
| CP-A04 / GATE-02 | Invalid imports/revalidation, malformed JSON, unsupported versions, migration rollback, blocked upgrade and future-schema refusal |
| CP-A05 / INT-03 | Synchronous quota and asynchronous constraint failure rollback, preserving all data and recovery metadata |
| CP-A06 / INT-04 | Revision conflicts; persistent dataset-generation conflicts for stale edit/create/delete/profile/preferences/restore, including same ID/revision after restore |
| CP-A07 / INT-05 | Idempotent 4/32 taxonomy with custom preservation; safe parent blocks; achievement-only dependent deletion; archive retains links/evidence |
| CP-A08 / UAT-04/05 | Existing capture/profile editor compatibility, hidden-field preservation, blank/year/month/day dates |
| CP-A09 / UAT-10/12 | Mobile fields/selects, dirty dismissal, 320/375px nav centers, desktop Profile, actual download/import, cached offline reload and previous-worker cache cleanup |
| CP-A10 | 12 MiB UTF-8 boundary, oversize rejection without changes, oversized export refusal, every compiled module in offline shell |

## CP-011A real-device checks — pending after user merge

Generate the synthetic full/legacy/invalid files with `npm run fixtures:backup`; they appear in `test-results/manual-fixtures/` (excluded from git). Import the full synthetic backup into a disposable origin to set up newer-domain records for replacement checks.

These require iPhone Safari and preferably an installed PWA. Use a disposable **synthetic-data browser profile/origin** for destructive checks; do not overwrite real data. Preview checks may run locally without deployment; agents do not merge/deploy.

- [ ] **CP-A101 Migration:** Before upgrade, keep a format-1 synthetic backup and note draft/recorded/archived IDs, exact dates, revisions and timestamps. Upgrade the same origin without clearing browser storage. Compare all values in a new format-2 export; blank draft date remains blank.
- [ ] **CP-A102 Editor:** Capture, edit, archive/restore, reload and cold-reopen achievements. Tap every field/select/label without dismissal; clear the draft date, save, edit again. Confirm blank remains unspecified. Check keyboard reachability and safe areas.
- [ ] **CP-A103 Settings/Files:** Switch themes and reload. Export to iOS Files, verify the downloaded format-2 JSON and import it. Preview lists all collection counts and replacement scope; restored records and theme match.
- [ ] **CP-A104 Legacy restore:** With synthetic newer records in an isolated test origin, select format 1. Preview explicitly warns that newer history/portfolio/custom records will be removed. Cancel first; confirm nothing changed. Then replace and verify legacy content and 4/32 built-ins.
- [ ] **CP-A105 Negative recovery:** Select invalid JSON, array status, impossible date, duplicate ID, broken link, wrong counts and future version files. All reject without changing local records. Device quota/transaction interruption also needs safe-failure evidence; automated fault injection does not prove Safari quota behavior.
- [ ] **CP-A106 Stale tabs:** Open two tabs with the same record. Restore the same-ID/same-revision backup in one. Saving/editing/deleting from the other must report reload rather than overwrite. Reload permits new writes.
- [ ] **CP-A107 Upgrade coordination:** Keep a v0.1.0 tab/PWA open during update. If upgrade blocks, close other windows and retry without clearing storage. Confirm no loss and no mixed-version startup error after reload.
- [ ] **CP-A108 Offline/cache:** After online worker activation, close/reopen installed PWA offline. Confirm stored records, editor and Settings work. Validate the real prior-worker update on-device; Chromium uses a previous-cache fixture.
- [ ] **CP-A109 Layout/accessibility:** Check 320/375px, iPad and desktop; nav alignment, focus/Tab/Escape, readable theme contrast, long full-backup preview and no keyboard/bottom-bar overlap.

The user's prior iPhone acceptance covers the original achievement-input and navigation hotfix only. These new checks and broader v0.1.0 recovery/offline checks remain open. New CP-011B–E employer/portfolio/linking screens are not part of CP-011A.

## Original v0.1.0 manual plan

Run these checks at your deployed GitHub Pages URL, preferably first with **non-confidential demo data**. Each is a pass/fail scenario. The built-in automated tests validate model rules and asset consistency, but do not replace live-browser tests.

## Primary workflows

- [ ] **CP-101:** Open CareerProof from a clean browser; Home loads without errors and shows zero achievements.
- [ ] **CP-102:** From any screen, open New Achievement; save a recorded entry with title, contribution, date and outcome.
- [ ] **CP-103:** Reload the page; entry persists in Recent Achievements and Achievement Vault.
- [ ] **CP-104:** Search achievement title or contribution; correct results appear without losing keyboard focus.
- [ ] **CP-105:** Open achievement details; view full contribution, outcome, occurrence date and timestamps.
- [ ] **CP-106:** Edit achievement; updated values persist after navigation and reload.
- [ ] **CP-107:** Save a draft with a title only; confirm it shows as a Draft and can be completed later.
- [ ] **CP-108:** Attempt to record without a contribution; validation prevents save without destroying input.
- [ ] **CP-109:** Archive an achievement; verify it is excluded from Active filter, appears under Archived, and can be restored.
- [ ] **CP-110:** Delete an achievement; explicit confirmation appears, and the record disappears only after confirmation.
- [ ] **CP-111:** Edit profile with name, headline, summary and email; verify persistence after reload.
- [ ] **CP-112:** Switch theme between light, dark, and system; preference remains after reload.

## Backup and recovery

- [ ] **CP-201:** Settings → Export generates a JSON file with correct profile and achievement counts.
- [ ] **CP-202:** Add/change a demo entry, then import the earlier JSON; preview explains the replacement scope and counts.
- [ ] **CP-203:** Confirm restore; the original records return and newer changes are replaced.
- [ ] **CP-204:** Attempt a malformed JSON import; report an error without changing existing records.
- [ ] **CP-205:** Try importing a valid-looking backup with mismatched counts; validation prevents restore.
- [ ] **CP-206:** Confirm backup warning explains that exports are unencrypted and local records do not sync.

## Device and PWA

- [ ] **CP-301:** Test iPhone Safari at a narrow width. Bottom navigation is visible; no clipped inputs or horizontal scrolling.
- [ ] **CP-302:** Test iPad. Navigation and all modal forms remain readable and operable.
- [ ] **CP-303:** Test desktop Chrome or Edge. Sidebar, Home, Vault and Profile layouts remain consistent.
- [ ] **CP-304:** Install to the Home Screen; close and reopen. Local records remain.
- [ ] **CP-305:** After initial online visit and worker activation, disconnect from network and reopen. Cached shell and local records load.
- [ ] **CP-306:** Use keyboard-only navigation where available, including tabbing through forms and Escape to close dialogs.

## Release policy

v0.1.0 is the first usable **development increment**. It should not store irreplaceable career records until CP-201 through CP-205 have been manually verified. Full P0 data-integrity and recovery qualification remains the gate at v0.1.2.
