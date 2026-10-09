## CP-011A.3 keyboard visibility — alpha.4 (iPhone UAT required)

User-reported after merged PR #6: **Outcome is covered when the keyboard opens and requires manual scrolling.** The CP-UI204 keyboard portion of alpha.3 was **not accepted**. The focused alpha.4 code attempts to repair this with viewport-settled modal-body scrolling; actual Safari verification remains pending.

- [ ] **CP-UI301 Outcome / keyboard:** On an actual iPhone in the current installation, focus Outcome. The label and first lines of the active textarea must appear above the keyboard without manual scrolling; type multiple lines and switch focus to Title, Contribution and Outcome. Footer actions remain reachable. Dismiss/reopen the keyboard. Report iPhone model/iOS/Safari vs installed PWA and any remaining manual-scroll requirement.
- [ ] **CP-UI302 Regression:** Compact navigation and date picker unchanged; after safe reload, prior records remain intact; synthetic achievement save/edit/offline work. Do not remove the PWA or clear data.

Automated coverage: new staged 700→550→430→360→300px keyboard tests (320/375/390/430px; light/dark) with synthetic VisualViewport and focus switching. See [CP-011A.3 root cause and limitations](IOS_KEYBOARD_OUTCOME_CP_011A_3.md). Do not claim real iOS acceptance from Chromium.

# CareerProof — Acceptance test plan

## CP-011A.2 automated evidence — alpha.3

On 2026-10-09: **37/37 Node and 52/52 Chromium tests passed**, zero skipped; separate typecheck, production build and diff whitespace check passed. Twenty-two focused cases add date/control alignment and appearance at 320/375/390/430px in both themes, exact compact navigation geometry and touch targets, label/footer reachability at reduced visual heights, synthetic safe-area accounting, precision/blank-draft edit and archive round-trips. All earlier recovery tests remain. Alpha.2-cache fixture → alpha.3 and offline native-date editing are tested. See [root cause, dimensions, comparisons and limits](IOS_FORM_NAV_REFINEMENT.md).

### CP-011A.2 iPhone acceptance — required before CP-011B

PR #5 is merged. Alpha.2 iPhone review found date-control overflow, premature form focus/context and excessive mobile density; these checks qualify alpha.3 separately. Chromium does not replace physical iPhone Safari/PWA verification. Keep a secure, verified backup before updating; use a disposable synthetic-data origin for imports. **Removing/reinstalling the iPhone Home Screen PWA may delete local data. Do not remove it solely to refresh its icon without first exporting, validating/previewing the backup (cancel before replacement), and securely storing it outside the app.**

- [ ] **CP-UI201 Update/branding/data:** Reopen/reload the existing installation online; Settings shows alpha.3 and schema 2. Approved CP/icon assets are unchanged. If existing records remain, compare IDs/dates/archive states in exports; do not reconstruct missing records, clear storage or import automatically.
- [ ] **CP-UI202 Native dates:** In light/dark, portrait/landscape and larger text, check visible title/date labels, equal left/right margins, 48px input/select treatment and left-aligned date. Tap the real native date control, select/edit/clear a synthetic value, close the picker and reopen the form. No extra border, zoom, clipping or modal dismissal. In an isolated synthetic dataset, verify imported year/month dates retain their precision and blank drafts stay blank.
- [ ] **CP-UI203 Compact navigation:** Home/Vault/Add/Profile/Settings remain equally spaced, icons/labels share alignment, Add is not raised. Confirm 60px content plus separate safe inset, 19–20px icons/24px frames/34px Add circle, subtle active state and reliable full-button taps; check no home-indicator overlap.
- [ ] **CP-UI204 Keyboard/context/footer:** Opening capture/profile should not automatically open the keyboard or hide the first label. Tap each field; focus retains label/context, keyboard does not zoom (16px text), final fields and footer remain reachable. Scroll long text normally; dismiss/reopen keyboard and rotate. Check both save buttons, Close, no background scrolling and no duplicated blank safe-area strip. Repeat Settings/restore preview reachability using synthetic data.
- [ ] **CP-UI205 Persistence/accessibility:** Save/edit/reload a synthetic exact-day achievement, clear/save/reopen a draft, archive/restore. Values and IDs persist. Check VoiceOver names/reading order and hardware Tab/Shift+Tab/Escape; cancelling dirty dismissal preserves input and close returns focus.
- [ ] **CP-UI206 Offline/update:** After alpha.3 worker activation, close/reopen the existing installed app offline. Data, Settings, compact nav, native date control and editing work. Real alpha.2 worker update and cold launch remain device checks; automated cache fixtures are separate evidence.

Record device/OS/browser, installed vs Safari mode, theme/orientation and results. **Do not start CP-011B until the user approves and verifies this corrective release.**

## CP-011A.1 automated evidence — alpha.2

On 2026-10-09: **37/37 Node and 30/30 Chromium tests passed**, plus separate typecheck and production build. The new 14-case viewport/theme matrix covers every existing destination and dialog, long/empty content, labels, focus, target sizes and overflow. Focus/scroll/hash/notification/busy-state tests, simulated keyboard geometry, contrast and platform assets augment all retained recovery tests. 252 before and 252 after screenshots are audited; proposed states have zero horizontal overflow, horizontal clipping, undersized targets or missing navigation. See [full evidence](UI_REGRESSION_REPORT.md) and [screenshots](UI_VISUAL_REVIEW.md).

### CP-011A.1 device acceptance — PR #5 merged; remaining checks carry forward

The user confirmed all five earlier CP-011A iPhone smoke checks on alpha.1. The following checks apply to the newly changed alpha.2 UI. Use synthetic fixtures on a disposable test origin for destructive restores; keep a securely saved real backup before updating an existing installation.

- [ ] **CP-UI101 Upgrade/branding:** Reopen installed iPhone PWA online; Settings shows alpha.2. Confirm profile, achievements, archive statuses and dates remain. Sidebar/header/favicon/install icon use the chosen CP monogram. Check Apple icon refresh by reopening/reloading the existing installed app without clearing browser storage. **Removing or reinstalling the iPhone Home Screen PWA may delete its locally stored data; do not remove it solely to refresh the icon without first exporting, verifying and securely storing a backup outside the app.** Verify through backup validation/preview, then cancel before confirming replacement.
- [ ] **CP-UI102 All windows:** Review Home, Vault, Profile, capture/edit/details, profile editor, Settings and both restore previews in light/dark. Check long title/contact/summary, no-results, empty states and validation. No horizontal drag or clipped controls.
- [ ] **CP-UI103 Keyboard/scroll:** Tap every achievement/profile field, including date and category. With keyboard open, scroll to Outcome/contact and reach both footer actions and Close. Confirm top/bottom safe areas in portrait/landscape and with large text. No background scroll or accidental dismissal.
- [ ] **CP-UI104 Navigation/focus:** All five nav positions and icon centers align. iPad portrait/landscape retains Home/Vault/Profile/Settings. With external keyboard, Tab/Shift+Tab remain in dialogs, Escape preserves dirty input when cancelled, and focus returns on close. Check VoiceOver names and reading order.
- [ ] **CP-UI105 CRUD/files/errors:** Save/edit/archive/unarchive/reload a synthetic achievement, edit Profile, export to Files, reject an invalid file and cancel a valid/legacy preview. Error text must remain visible without covering actions; export keeps Settings usable. In an isolated dataset, confirm both valid formats restore correctly.
- [ ] **CP-UI106 Offline/cold start:** After the new worker activates, close/reopen offline. App, icons, saved records, Settings and editors work. Reconnect/reload if an older open installation has mixed cached assets; do not clear data.

Safari keyboard resizing, safe-area insets, native discard/delete alerts, file-picker behavior, dynamic text and install-icon refresh are not proven by Chromium. Expanded CP-011A quota/interruption/blocked-upgrade recovery checks below remain separately tracked; the reported five smoke checks are not a blanket pass for every extended scenario.

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

## CP-011A extended device matrix — five smoke checks accepted; detailed evidence still tracked

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

The user confirmed the original hotfix and all five CP-011A smoke checks on alpha.1. These detailed extended cases are retained for traceable qualification; do not infer that every unreported fault scenario passed. New CP-011B–E employer/portfolio/linking screens are not part of CP-011A.

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
