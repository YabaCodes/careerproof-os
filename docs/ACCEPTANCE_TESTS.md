## CP-011A.3 keyboard visibility — alpha.4 (iPhone UAT required)

User-reported after merged PR #6: **Outcome is covered when the keyboard opens and requires manual scrolling.** The CP-UI204 keyboard portion of alpha.3 was **not accepted**. The focused alpha.4 code attempts to repair this with viewport-settled modal-body scrolling; actual Safari verification remains pending.

- [ ] **CP-UI301 Outcome / keyboard:** On an actual iPhone in the current installation, focus Outcome. The label and first lines of the active textarea must appear above the keyboard without manual scrolling; type multiple lines and switch focus to Title, Contribution and Outcome. Footer actions remain reachable. Dismiss/reopen the keyboard. Report iPhone model/iOS/Safari vs installed PWA and any remaining manual-scroll requirement.
- [ ] **CP-UI302 Regression:** Compact navigation and date picker unchanged; after safe reload, prior records remain intact; synthetic achievement save/edit/offline work. Do not remove the PWA or clear data.

Automated coverage: new staged 700→550→430→360→300px keyboard tests (320/375/390/430px; light/dark) with synthetic VisualViewport and focus switching. See [CP-011A.3 root cause and limitations](IOS_KEYBOARD_OUTCOME_CP_011A_3.md). Do not claim real iOS acceptance from Chromium.

# CareerProof — Acceptance test plan

## CP-012A — Data Health (0.1.2-alpha.4, device gate)

Existing Home Screen app only; no reinstall or storage clearing.

- [ ] **U103/U104 (update path):** after the merge, opening or returning to the app shows *New version ready — version 0.1.2-alpha.4* with **Back up first** and **Restart app**, without tapping Check now. Back up first saves a file and keeps the banner; Restart app loads alpha.4 with records intact.
- [ ] **DH101:** Settings → Check data shows *Check passed* and *No critical problems* with your real records; nothing changes afterwards (same records, same Last export on Home).
- [ ] **DH102:** Suggestions match reality (for example *No backup exported* if you never exported; experiences with no achievements; profile headline). Wording reads as documentation advice, not judgement.
- [ ] **DH103:** Tapping a listed record opens the right editor; closing it returns to the app without changes.
- [ ] **DH104:** Export a backup, run Check data again: the backup suggestion disappears. Layout fits the screen in light and dark.


## CP-012.2 — navigation and design (0.1.2-alpha.3, device gate)

Existing Home Screen app only; no reinstall or storage clearing. This release is also the first chance to observe the alpha.2 update behaviour (U103–U104).

- [ ] **A101:** After merge, opening or switching back to CareerProof shows **New version ready — version 0.1.2-alpha.3** with **Back up first** and **Restart app** (U103/U104). After restart, Settings shows `0.1.2-alpha.3` and all records (work history, education, any achievements) are intact.
- [ ] **A102:** Bottom bar shows Home · Vault · Experience · Skills · Profile with equal spacing, no overlap with the home indicator, and one bold active tab. Settings and ＋ appear only in the header.
- [ ] **A103:** Home: the dark card shows one sensible next action; metrics read correctly (Last export says *Never* or the right age); Quick capture buttons open the right forms.
- [ ] **A104:** Vault: Filters opens and closes the detailed filters and shows the active count; status/sort labels are not cut off.
- [ ] **A105:** Experience and Skills open from their tabs; Skills shows *With examples* and *All*; Show archived toggles.
- [ ] **A106:** Quick Capture still opens full screen from the header ＋ with the accepted field order; the keyboard does not cover Outcome; light and dark themes both readable (dark ＋ is teal).


## CP-012.1 — update detection (0.1.2-alpha.2, device gate)

Existing Home Screen app only; no reinstall or storage clearing.

- [ ] **U101:** Reach alpha.2 (Settings → Check now → Restart app). Settings shows `0.1.2-alpha.2`; records intact.
- [ ] **U102:** Settings → Check for updates says it checks automatically and shows *Last checked* time. **Check now** reports the latest version available (v0.1.2-alpha.2).
- [ ] **U103 (at the next release):** About 3–12 minutes after the next merge, simply open or switch back to CareerProof. Without tapping Check now, a **New version ready** banner names the new version and shows **Back up first** and **Restart app** above the bottom navigation.
- [ ] **U104 (at the next release):** **Back up first** saves a JSON backup and the banner stays. **Restart app** loads the new version with all records intact. With an unsaved editor open, restart asks before discarding.


## CP-012.0 — Experience text integrity hotfix (0.1.2-alpha.1, device gate)

Use the existing Home Screen app; do not reinstall it or clear storage. Export a backup first.

- [ ] **H101:** Settings shows `0.1.2-alpha.1`; all existing records are present.
- [ ] **H102:** Create a synthetic Experience named `Test '24` with objective `from '12 to '9`. The card shows the text exactly; Edit shows it exactly; Save without changes, reopen, and it is still exact. Delete the synthetic Experience afterwards.
- [ ] **H103 (your real records):** Open each Experience where you may have typed an apostrophe directly before a number (for example `FY'25`, `'24`). If you see an unexpected symbol in its place (such as `པ`, `ཕ`, `༈`, `Ɖ`), retype the original text and save. The app cannot tell these apart from legitimate characters automatically.


## Final v0.1.1 release promotion — accepted rc.1 device gate

**Accepted on physical iPhone:** User reported all eight `v0.1.1-rc.1` checks passed after PR #15 was merged and deployed. These include version/data retention, verified backup download, read-only Check data, career and Experience linking, rich achievements/competencies/Vault filters, corrected Quick Capture keyboard/layout, and offline reopen.

**Final promotion PR #16:** Changed **only** version/package and service-worker cache identifiers from `0.1.1-rc.1` to `0.1.1`, exact-version regression expectations and docs. **Merged by the user 2026-10-10 and deployed** (main CI run 38021279551: 42/42 Node, 102/102 browser, Pages deploy successful). No release tag, schema or backup migration.

**Post-promotion smoke — open (user to report):**

- [ ] **F101:** Existing Home Screen PWA shows `v0.1.1` in Settings (use **Check now** / **Restart app** if still on rc.1; never reinstall or clear storage).
- [ ] **F102:** Previously stored employers, roles, Experiences, achievements, metrics, evidence and custom skills are all still present.

Do not restore a synthetic test backup over real records.

**Status reconciliation (2026-10-10):** Sections below are kept as originally written. Several historical device gates were later closed by broader evidence rather than by ticking each box: CP-011A.3 (CP-UI301/302) was accepted by the user on alpha.4; CP-011B was verified by the user before CP-011C was authorized, and the B.1 compact timeline is covered by rc.1 check E214; CP-011C was accepted before CP-011D; the alpha.10 overlap fix was confirmed ("fix works"); and the remaining CP-011D (D201–D209) and D.1 (D211–D215) feature checks were consolidated into rc.1 checks E215–E217, which passed. **CP-011B.2 Check now / Restart notice (CP-B222/B223) has no separately recorded device confirmation.** Authoritative per-feature status: [MILESTONE_TRACKER.md](MILESTONE_TRACKER.md).



## CP-011E — integrated release candidate v0.1.1-rc.1

**Status:** Eight physical iPhone checks E211–E218 accepted by user on deployed candidate. E219 remains a synthetic-only destructive-recovery check and E220 is separate public-data hygiene; do not imply either was performed on personal device.

- [x] E211: Existing Home Screen PWA updates without reinstall; version rc.1 and all existing data remain intact.
- [x] E212: Full JSON backup export is physically present in a secure location; it is not encrypted.
- [x] E213: Settings Check data passes online/offline without upload, replacement or mutation.
- [x] E214: Employer/role, education, credentials, Experience Portfolio, partial dates and relationships persist.
- [x] E215: Rich achievements, metric/evidence records, role/project/skill links, custom skill history and Vault filters work (also closes remaining CP-011D checks).
- [x] E216: Physical iPhone Quick Capture More details, Outcome keyboard and label spacing function in both themes.
- [x] E217: Compact five-slot navigation and no horizontal overflow.
- [x] E218: Installed PWA reopens offline with all four career modules and records.
- [ ] E219: Any destructive restore test is limited to an isolated, disposable synthetic dataset; NEVER replace real user records merely to test.
- [ ] E220: Public repository fixtures and commits contain no personal career or employer-sensitive information.

The candidate passed automated CI and the user confirmed the eight installed-iPhone UAT checks. The version-promotion PR (#16) has since been merged and deployed; only the post-promotion smoke (F101–F102 above) remains. See [CP-011E plan](CP_011E_RELEASE_QUALIFICATION.md).



## CP-011D.1 — iPhone Quick Capture overlap correction, alpha.10

- [ ] D211: Settings reports alpha.10 after the existing installed Home Screen PWA updates. Previously saved records remain present; export backup first.
- [ ] D212: In the Capture Achievement modal, Achievement title, What did you do?, Occurrence date, Impact category and Outcome display in natural order with no text/control overlap. The optional More details control follows Outcome.
- [ ] D213: Tap More details, inspect expanded fields, collapse and repeat. No overlapping labels, clipped button text, or horizontal overflow; all controls remain tappable.
- [ ] D214: Repeat in light and dark mode with the native keyboard showing for Outcome; ensure keyboard does not cover active field.
- [ ] D215: Save a synthetic draft and edit an existing achievement without unexpected data changes. Original alpha.9 rich achievement/competency checks remain required.

Automated mobile Chromium viewport tests supplement, not replace, physical iPhone verification. Never uninstall the installed PWA or clear site data to force an update.


## CP-011D — rich achievements and competencies (alpha.9, device gate)

User confirmed that CP-011C Experience creation/editing, role association and linked achievement capture work on their physical iPhone before authorizing this checkpoint.

- [ ] D201: Settings alpha.9 and all previous source records remain intact.
- [ ] D202: Expand optional advanced achievement fields; the quick-entry path and Outcome keyboard remain usable.
- [ ] D203: Edit pre-existing achievement, metric and evidence; invalid URLs/numbers reject edits with no data loss.
- [ ] D204: Select employment role, multiple Experiences, primary project and competencies; linked examples remain correct after reload.
- [ ] D205: Browse seeded competency taxonomy, add/edit/archive custom skill; no proficiency claims.
- [ ] D206: Vault role/project/skill/date/status filters correctly narrow records without altering them.
- [ ] D207: Archive/restore maintains all links and evidence; destructive tests use synthetic records only.
- [ ] D208: Backup format 2 contains enriched achievements, metrics, evidence and links; never restore into live data merely to check.
- [ ] D209: Light/dark, 320–430px layout, keyboard, offline PWA and update controls pass.

See [CP-011D implementation and iPhone guide](CP_011D_ACHIEVEMENT_INTELLIGENCE.md). No Home Screen PWA reinstall, browser storage reset, or real employer information in public test fixtures.


## CP-011C Experience Portfolio — alpha.8, iPhone acceptance pending

The user accepted CP-011B education, credentials, exports and alpha.7 updates on the physical iPhone; next milestone CP-011C focuses on the Portfolio and cross-record integrity.

- [ ] CP-C201: Settings alpha.8 and all pre-existing career records remain intact.
- [ ] CP-C202: Profile → Experience Portfolio; compact five-slot navigation remains unchanged.
- [ ] CP-C203: Create a project, initiative and ongoing responsibility; compact two-line summaries and disclosure work.
- [ ] CP-C204: Precision date, status and privacy persist after save/reload.
- [ ] CP-C205: Employer and multiple role IDs are linked consistently; incompatible roles are rejected.
- [ ] CP-C206: Capture a synthetic achievement from a project and verify its project association survives reload.
- [ ] CP-C207: Linked project deletion is blocked; a synthetic unlinked project requires confirmation.
- [ ] CP-C208: Format-2 private backup includes projects and links; avoid restoring into live records.
- [ ] CP-C209: iPhone keyboard, theme, offline launch and update control checks.

See [CP-011C report](CP_011C_EXPERIENCE_PORTFOLIO.md). Do not remove the Home Screen PWA, reset browser storage, or commit real employment details to test fixtures.


## CP-011B.2 — installed PWA update behavior (alpha.7, iPhone UAT pending)

- [ ] **CP-B221:** With an internet connection, the *existing* iPhone Home Screen app eventually loads alpha.7 via service-worker activation and a restart. Do not remove the installed app; older app versions cannot retroactively show new Check now controls.
- [ ] **CP-B222:** In Settings, **Check now** reports an attempted update check. It must not clear IndexedDB, overwrite an achievement, or claim a specific newer version when none is confirmed.
- [ ] **CP-B223:** On a subsequent release, when a newer controller activates, a **New version ready** notice offers a user-initiated restart. No automatic reload while entering achievement/role/credential information.
- [ ] **CP-B224:** Confirm the restart action does not discard an unsaved form without the existing confirmation; do not interrupt pending saves. The banner appears above compact mobile navigation but beneath editing dialogs.
- [ ] **CP-B225:** Offline app launch retains the local dataset; update check with no connection produces a clear message. Safari and installed PWA may have separate local storage.

**Safety:** Export a current backup beforehand. Never reinstall the PWA, clear browser data, unregister workers, or delete caches merely to force an update. The PR's Chromium check cannot certify iOS WebKit update scheduling.


## CP-011B.1 — compact timeline (alpha.6) iPhone gate

After merging CP-011B, the user reported the employment history rendered full employer and role descriptions, making the timeline difficult to scan. Alpha.6 is a presentation-only correction; **CP-011B remains subject to iPhone acceptance**.

- [ ] **CP-B211 Compact overview:** Career Profile / Employment History immediately shows each employer and each role title, duration/current status, employment type and primary-role badge. Long descriptions use at most two visible lines with an ellipsis on mobile. Multiple roles can be scanned without scrolling through entire descriptions.
- [ ] **CP-B212 Expand/collapse:** Tap **… More** for an employer and a role. The complete description and optional secondary details appear; **Less** collapses the same record. Other entries do not unexpectedly expand. Brief descriptions do not offer a needless More control.
- [ ] **CP-B213 Data integrity:** Check existing saved roles/descriptions before and after expansion, a safe reload and backup export. Details are never truncated in IndexedDB or the backup; edits reopen full text.
- [ ] **CP-B214 Mobile:** Confirm 320–430px layouts, both themes, 44px touch targets, native keyboard behavior and no horizontal overflow. Navigation, date picker, and prior Outcome keyboard fix remain intact.
- [ ] **CP-B215 Offline:** Following successful alpha.6 PWA worker update, existing installation reopens offline and retains history and More/Less functionality. Do not reinstall the Home Screen PWA or clear website data.

Chromium tests simulate sizing but **do not certify iOS Safari**. CP-011C remains paused pending acceptance of this correction and the outstanding CP-011B workflow checks.


## CP-011B Career Profile — alpha.5 (iPhone UAT pending)

CP-011A.3 Outcome focus/keyboard issue was accepted by the user on a physical iPhone on v0.1.1-alpha.4. CP-011B is a distinct development increment and remains a draft PR until browser CI is green and user review is complete.

- [ ] **CP-B201:** Updated version, preexisting achievements, profile and local data remain intact.
- [ ] **CP-B202:** Add/edit employer; add two roles under one employer including overlapping/current roles.
- [ ] **CP-B203:** Save/edit/clear primary role without losing other records; test partial dates.
- [ ] **CP-B204:** Add/edit education and credential without expiration; verify URL errors.
- [ ] **CP-B205:** Referenced employer/role deletion blocks; unreferenced test records require confirmation.
- [ ] **CP-B206:** Export format-2 backup, verify counts without replacing actual data.
- [ ] **CP-B207:** iPhone forms keyboard/scroll/date inputs, theme, offline, compact navigation.

See [CP-011B report](CP_011B_HISTORY_QUALIFICATIONS.md). Use synthetic records for destructive tests and do not uninstall the PWA or clear storage.


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
