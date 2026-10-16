## v0.1.3-alpha.7 — CP-UX3: Slim Home and Plans as Expected Results (Review Candidate)

**Status:** Implementation PR for review; **not merged, deployed or physically accepted**. User authorized Redesign Step 3 after reporting the preceding app test was okay; that informal confirmation does not separately establish every UX401–UX408 result.

- **Home:** one compact row with Recorded, Draft, Experiences and Skills Shown; accurate generated-export status below. Last 12 Months and Recent keep the existing alpha.6 interaction. Complete Your Record and Achievements by Role become two expandable rows under **Your Record**, retaining the existing Data Health and role-filter drilldowns. Quick Add has three compact actions (Experience, Employer, Credential); header + still creates an Achievement. Five destination tabs remain Home / Vault / Experience / Skills / Profile; Studio is deferred until usable in v0.1.4.
- **Plans as Expected Results:** an active Draft explicitly offers "Hasn't happened yet?" and a user-editable preview on a chosen Experience. Conversion appends text below the existing `projects.objective`, archives (never deletes) the Draft, and preserves its links/metrics/evidence. Current Experience revision and Draft revision are checked in the same IndexedDB transaction; duplicate paragraphs, overlength text, stale data and status conflicts abort without partial updates. Completed Experiences require confirmation. Confidential Drafts require a Confidential Experience, avoiding silent privacy downgrades.
- **Undo:** after conversion, the Experience shows a same-session Undo that atomically restores the exact former objective and active Draft status only while both saved revisions remain unchanged. No Undo is promised after reload or after newer edits.
- **Data:** **no new fields or stores**; database schema **3**, backup format **3**, and proficiency history are unchanged. Conversion intentionally updates one Experience and one Draft in a single transaction, unlike presentation-only Step 1/2.
- **Testing:** Node integration and Playwright mobile cases introduced/updated for atomicity, stale/retry protection, archive/Undo, confidentiality, responsive Home, original drilldowns, offline-shell completeness and backup compatibility. Real iPhone UX301-S3 through UX309-S3 are still required after review/merge/deployment. Automated outcome is reported in the PR/CI, not presumed here.
- **Next:** v0.1.4 Studio remains a separately gated migration/recovery project. No review/CV document stores or PDF functionality in alpha.7.

## v0.1.3-alpha.6 — CP-UX-Fluid: feel, the recorded moment and the record timeline (review candidate)

**Status:** PR open, CI result stated in the PR; **not merged, deployed or accepted**. A user-approved increment (DEC-038) on top of `0.1.3-alpha.5` (CP-UX-Links, accepted UX301–UX307). Presentation only: no record, schema, backup-format or taxonomy change.

- **Motion and touch feedback:**
  - Buttons, tabs, chips and rows give a little under the finger (iOS gets `:active` through a passive touch listener); a tapped tab no longer keeps a hover tint.
  - Sheets slide up from the bottom on phones (and settle in on wider screens) **only when they open** — redrawing a sheet, or moving from an achievement to its editor, does not replay it. While a sheet is still rising, a tap on the dimmed area does not close it; after that the backdrop works exactly as before.
  - Capture steps slide forward on Next and back on Back. Moving between tabs eases the page in; opening an experience pushes in from the right and Back returns from the left. Nothing scrolls sideways while it moves.
  - Messages ease in when they appear (not on later redraws) and can carry a second line.
  - **Reduce Motion** turns all of it off; the result is identical, just immediate.
- **The recorded moment:**
  - Recording an achievement says where it went and what it adds, from the links just saved: e.g. "Achievement recorded. In Platform Migration · Adds an example to Planning and 1 more". A draft says what it still needs ("Add what you did and a date to record it."). Editing a recorded achievement still says "Achievement updated".
  - The new achievement glows briefly where it now appears (Home, Vault or the experience page), scrolled into view if needed, and its month on the Home timeline grows from its old height.
- **Tidy-ups:**
  - Home's Recorded card says "1 achievement", not "1 achievements".
  - **Skills:** search, **Filters** and **Add** share one row like the Vault and Experience (two rows only below 360px). Category and Show archived sit under Filters, which shows how many are on.
  - **Experience role headers:** "Current" sits beside the role title, and the details line breaks between its parts, never inside a date range or a count. Experience rows follow the same rule.
- **Home: Last 12 Months** (DEC-038, amends DEC-035):
  - One bar per month for the **recorded** achievements that **happened** in it (by the achievement's date, not when it was entered), with the count above each bar. Drafts, archived and undated achievements are left out; achievements dated only by a year are counted in a note instead of being spread over months.
  - Tap a month (or slide a finger sideways across the months) to list that month in place of Recent; ‹ › step a month at a time; **Recent** goes back. Leaving Home goes back to Recent.
  - Counts only: no target line, average, streak, comparison or score. The section is hidden when nothing in the window can be shown by month.
  - On a 320px screen the month columns are about 22px wide (24px from about 346px up); a sideways slide adjusts the pick and the 44px ‹ › buttons step precisely.
- **Data:** unchanged. Schema 3, backup format 3, no migration; every new view is derived from existing records and nothing new is stored.
- **Tests (local):** `npm test` passes 106 Node and 150 browser tests.
  - New: `ux-fluid.test.mjs` (4 Node: month window across a year boundary, what is counted, timeline markup, saved messages) and `ux-fluid.spec.mjs` (7 browser: timeline and month list, sideways slide vs scroll, recorded moment, motion follows changes and Reduce Motion, press feedback and the rising-sheet backdrop, tidy-ups at 320 and 390px).
  - The Playwright configuration now runs the suites with Reduce Motion on, so layout checks measure finished layouts; motion is tested where `ux-fluid.spec` turns it back on. Two existing assertions were updated for the new wording and Filters panel.
- Pending: CI, user review and merge, Pages deployment and iPhone checks UX401–UX408.

## v0.1.3-alpha.4 — CP-UX2 guided capture (review candidate)

**Status:** PR open, CI result stated in the PR; **not merged, deployed or accepted**. Step 2 of the user-approved redesign (DEC-037). Step 1 (`0.1.3-alpha.3`, PR #34) is merged, deployed and accepted on iPhone (UX101–UX109).

- **New achievement in three short steps:** *Where did this happen?* → *What happened?* → *When did it happen?* A step counter and progress bar are at the top, Back is on steps 2 and 3, and Save draft is available from step 2.
- **Where:**
  - Your experiences are listed most recent first (five, then "Show all"), with search.
  - **New experience** asks for its name, type and role.
  - **Not part of an experience** records a role, or none.
  - A choice is needed to continue, so nothing is attributed by accident.
  - Started from an experience's page, capture opens on step 2 with that experience chosen.
- **The experience you choose is the primary one automatically, and the role comes with it.** If the experience spans two roles, the role at the achievement's date is used, otherwise the most recent one. Editing without changing the experience keeps the stored role.
- **What:** Title (with a counter), What did you do?, Result, and "Add context (why it was needed)" on demand.
- **When:**
  - Month, Year or Exact day.
  - **Skill chips**, suggested from the skills the experience's recorded achievements already show (never pre-ticked), plus "Find another skill".
  - "Add a measured number" and "Add evidence".
  - A **Confidential** switch (on by default).
  - **More details**: detailed actions, notes, other experiences.
- **Impact category** is no longer asked for. Stored values are kept and still shown under More Details.
- **Editing** shows all three sections on one page.
- **Safety:**
  - A draft saved before reaching the When step gets **no date**, rather than the pre-filled month.
  - A number or evidence row opened but left completely empty is not saved.
  - Searching the lists is not counted as an unsaved change.
- **Keyboard on iPhone:** while typing, the label and field stay in view even when a hint sits below the field.
- **Data:** unchanged. Schema 3, backup format 3, no migration. Only the role and primary-experience values that the user's own choice determines are written.
- **Tests (local):** `npm test` passes 102 Node and 139 browser tests.
  - New: 2 Node tests for role-by-date and the Where order, and `ux-capture.spec` (7 browser tests).
  - The old single-form layout checks were replaced by per-step geometry checks at 320–430px in light and dark.
  - Existing specs were updated for the step flow.
- **Not in this step:** moving "Candidate" drafts into an experience's Expected Result, and the slimmer Home (step 3).
- Pending: CI, user review and merge, Pages deployment and iPhone checks UX201–UX207.

## v0.1.3-alpha.3 — CP-UX1 reading and scanning (review candidate)

**Status:** PR open, CI result stated in the PR; **not merged, deployed or accepted**. Step 1 of the user-approved redesign (DEC-036), plus follow-ups to #33.

- **Experience is a timeline of roles.** Roles appear most recent first, and the two most recent start open. Each experience is one row with its type, dates and how many achievements and drafts it has. A dot marks experiences that are still running. An experience linked to several roles appears once, under the most recent, with "Also: …". Achievements on a role but in no experience get one row that opens the Vault. Search covers names, context and goals.
- **Each experience has its own page:** what it was, employer, roles and dates, context, the goal, its achievements with their results, the skills they show, technologies and any Earlier Notes. Edit is at the top and Delete is inside the editor. Back, the browser Back button and a direct link all work.
- **Goal / Expected result (amends DEC-034).** The experience's existing `objective` field is offered again as an optional goal. While the experience is running it reads *Expected Result* and links straight to recording it as an achievement. Once completed it reads *Goal*.
- **An achievement reads as a short story:** Result (with metrics), What I Did, Context, Skills Shown. Everything else, including Archive and Delete, is folded under **More Details**. A draft's notice names only what it still needs (what you did and/or a date).
- **The Vault opens on Recorded**, with Drafts and (when used) Archived one tap away. Rows sit under year headings and show the date and the experience or role. Search and Filters share one line, and Sort is inside Filters. An empty segment says so plainly rather than suggesting a failed search.
- **Counting is consistent:** an "achievement" count means a recorded achievement and drafts are counted on their own. This applies to the Vault, the Experience timeline and Achievements by Role on Home.
- **Dates you actually know.** An achievement date is **Month** by default, or **Year** or **Exact day**. Switching keeps what still fits and never invents a day or month.
- **Profile:** tap a record's name to edit it. Delete is in the editor footer, so the cards no longer carry Edit/Delete buttons.
- **#33 follow-ups:**
  - A self-assessment cannot be dated in the future.
  - Assessment dates are formatted like other dates.
  - A skill with assessment history explains that it can be archived but not deleted, instead of offering a Delete that is refused.
- **Data:** unchanged. Schema 3, backup format 3, no migration. No stored record is rewritten, and every field stays visible somewhere.
- **Tests (local):** 100 Node and 136 browser tests pass.
  - New: a timeline domain suite (9 Node tests) and `ux-reading.spec` (7 browser tests: timeline, page, story, Vault, dates, Profile, #33, keyboard).
  - 13 existing test files (12 browser specs and 1 Node suite) were updated for the new screens.
  - The timeline suite found and fixed an ordering bug ("Independent Experiences" must come after named employers).
- **Not in this step:**
  - The guided capture flow, and removing the impact category from the form (step 2).
  - Moving planned "candidate" drafts into an experience's Expected Result, and a slimmer Home (step 3).
- **Known limitations:**
  - Archive and Delete on an achievement now take one extra tap (More Details).
  - Browsers without a month picker (some desktop browsers) show a text box with a YYYY-MM hint.
- Pending: CI, user review and merge, Pages deployment and physical-iPhone checks UX101–UX109. Nothing merges automatically.

## v0.1.3-alpha.2 — CP-013B Self-Assessed Proficiency (review candidate)

**Status:** Development PR pending CI and user review; **not merged, deployed, or accepted**. CP-013A Evidence Breadth alpha.1 was accepted on iPhone with EB103 not manually tested (automated coverage).

- Skills now offers an explicit **L1–L4 self-assessed proficiency** editor, optional rationale, assessment context and development note, and full dated assessment history. No rating is inferred from skills, career history, achievements, years of experience or evidence breadth.
- The common rubric uses the original CareerProof Foundational / Developing / Proficient / Advanced descriptions. **This does not claim 32 distinct skill-specific rubrics.** Generic rubric version `1.0` is retained with each history entry.
- Appending a self-assessment never overwrites past ratings. Current display uses the latest assessment **date**, not the most recently entered record. Unassessed skills display *Not assessed*.
- **Forward-only physical IndexedDB schema 2→3:** add `proficiencyAssessments` store and competency/date index; preserve all prior career records, IDs, revisions, generation counters, local theme, and prior export metadata. New v1 installations also migrate directly to schema 3.
- Full private **backup format 3** now includes assessment history. Format-1 and format-2 backups remain importable after strict validation and in-memory conversion. Restoring an old format-2 backup is still **destructive full replacement**; the UI explicitly warns that newer assessment history would be removed.
- A custom skill with assessment history **cannot be deleted** (archive remains available); no reassignment or automatic deletion of historical assessments.
- Separate automated migration/recovery/negative tests and browser UI tests use **synthetic records only**. No account sync, external proof validation, unverifiable proficiency scoring, or personal test fixtures.
- Scope: M04 Competency Intelligence. Database and recovery platform affected. No change to core Profile/Vault/Experience features. CP-013A's EB103 remains a manual regression opportunity.
- Pending before release: CI tests, user review and merge, deployment and physical-iPhone checks **PA101–PA106**. No PR may merge automatically.

## 0.1.3-alpha.1 — CP-013A Evidence Breadth (review candidate)

- Adds read-only **Evidence Breadth** for every skill using the approved CIF-02–07 deterministic thresholds: Not documented, Emerging, Moderate, Broad.
- Counts unique **Recorded** linked achievements only; ignores Draft and Archived. Work context is a primary Experience, otherwise employment role, otherwise one shared unspecified context. Labels show number of eligible examples, distinct contexts and stated outcomes.
- No proficiency rating is inferred, no claim is independently verified, and confidential records remain local. Skill detail lists retain their original examples; the separate breadth calculation labels eligibility explicitly.
- Adds synthetic Node tests for all four thresholds, duplicate links, contextual diversity, confidential examples, missing outcomes and draft/archive exclusion; browser smoke verifies Skills displays the explanation without modifying data.
- Preserves **schema 2 / backup format 2**, all existing records, IDs and preferences. No persistent assessment storage and no data migration in this first increment.
- Pending: PR CI, user merge, Pages deployment and non-destructive physical-iPhone checks. Proficiency assessments and assessment-history schema/backup upgrades will be separately scoped in CP-013B.

# CareerProof release notes

## v0.1.2 — Final promotion candidate (awaiting separate PR approval)

**Status:** P0 acceptance passed in `v0.1.2-alpha.11`; the final-version PR is a review candidate only, not yet merged, deployed or accepted on a physical iPhone.

**What v0.1.2 delivers:** Data Health 2.0 (read-only checks and record-completeness guidance), controlled unlink/move/delete, revised mobile navigation and visual system, Experience-as-container workflow, Home role summaries and achievement navigation, accessibility/error-focus/large-dataset refinements, and validated recovery/upgrade certification.

**Qualification evidence (2026-10-11):**
- CP-012D alpha.9 AD101–AD105 passed on iPhone; alpha.10 AE101–AE104 passed, AE105 Reduce Motion not tested and explicitly waived. Automated reduced-motion coverage exists; this does not represent a formal WCAG certification.
- CP-012E [PR #29](https://github.com/YabaCodes/careerproof-os/pull/29) merged at `3b9905c`. Corrected PR-head CI [run 38113988112](https://github.com/YabaCodes/careerproof-os/actions/runs/38113988112) completed successfully; original CI failure was a test assertion too narrowly matching a valid stale-restore error message.
- E219 destructive recovery was executed on disposable synthetic IndexedDB only; it verified backup/restore, persistence after cold reopen, and intact P0 collections/links/preferences. Migration/invalid-import/rollback regressions remained mandatory.
- User reported RE101–RE105 and E220 **all passed** on physical iPhone / repository privacy confirmation. The actual exported JSON backup is unencrypted and must be stored securely.

**Final promotion change boundary:** Update only application/package version strings, service-worker cache key and exact-version test assertions; update README and release/acceptance documentation. No features, schema migrations, data resets, backup-format changes, automatic restore, background upload, Git tag or release publication.

**Outstanding final-version gate:** User reviews/merges the separate promotion PR **after CI passes**; verify GitHub Pages deployment, then report iPhone F201–F204 on the existing installation with no uninstall or cleared site data. Until then, do not claim v0.1.2 is released.


## 0.1.2-alpha.11 — CP-012E recovery/upgrade certification (PR review)

- Added dedicated, isolated fake-indexeddb certification for E219 destructive synthetic restore: full P0 backup, cold reopen, mutation, restore, another cold reopen, cross-store links, confidentiality, preferences and dataset generation.
- Added certification for invalid/future backup rejection, stale restore preview, and legacy v1→v2 migration plus format-2 round trip.
- Existing rollback, quota, constraint and browser restore-preview regressions remain mandatory. No storage schema, backup format or runtime recovery behavior change.
- Alpha.10 physical iPhone AE101–AE104 passed; AE105 Reduce Motion not tested, user waived. Reduced-motion automated coverage remains.
- iPhone RE101–RE105 are deliberately non-destructive; E220 repository data hygiene confirmation remains open. No final release promotion without certification and user approval.


## 0.1.2-alpha.10 — CP-012D.2 accessible validation and layout audit (PR review)

- On a failed form save, focus moves to the visible `role=alert` error summary, allowing keyboard and assistive-technology users to locate and correct the error without auto-focusing a field or opening the iOS keyboard.
- The error scroll respects Reduce Motion; existing iOS modal/viewport handling remains unchanged.
- Existing responsive/touch/accessible-name sweeps across 320–1440px, light/dark, all screens and dialogs now include textarea controls, not only buttons/inputs/selects.
- Two browser regressions check focus and recovery from a failed achievement save and reduced-motion error behavior. Full suite remains mandatory.
- No career data model, IndexedDB schema, backup format, privacy setting, or navigation change. Version/cache bumped to alpha.10.
- AE101–AE105 physical-iPhone acceptance pending; this slice does not constitute third-party WCAG certification.

## 2026-10-11 — v0.1.2-alpha.9 accepted on iPhone

- PR #27 merged at `d8ee1be`; user reported AD101–AD105 all passed. AD103 was external-keyboard optional; automated Playwright tested keyboard behavior, but the user's hardware keyboard setup was not independently confirmed.


## 0.1.2-alpha.9 — CP-012D.1 Keyboard accessibility and Home performance (PR review)

- **Keyboard accessibility:** Settings' three appearance options now behave as a single ARIA radio group. Only the selected theme is in the Tab order; arrow keys wrap between System / Light / Dark, and Home / End choose endpoints. The selected state, focus order, and saved theme stay in sync.
- **Dashboard efficiency:** Achievements by Role now counts active achievements/drafts and Experience links in single passes, rather than filtering whole collections once per role. Drafts and Archived remain classified exactly as before. Tests include a synthetic 800-role, 8,000-achievement fixture with a generous CI performance ceiling.
- **Regression tests:** a new Playwright keyboard + reduced-motion focused-control suite, plus a deterministic Node benchmark and count parity checks. Existing responsive/theme/keyboard tests remain in the full suite.
- **Device gates:** AD101–AD105 pending physical iPhone checks after user review/merge/deploy. No claim of full WCAG certification or full CP-012D completion.
- **Safety:** No IndexedDB schema, backup, record, privacy, or navigation change. Service-worker cache/version updated for safe PWA refresh.

## 2026-10-11 — v0.1.2-alpha.8 accepted on iPhone

- PR #26 merged at `d19e9a2`; user explicitly passed all five physical-iPhone gates D101–D105 (app/data, Home completeness, role filtering, Data Health link, light/dark layout). This acceptance is for alpha.8, not alpha.9.


## 0.1.2-alpha.8 — CP-012C Home dashboard (review)

- **Complete Your Record** on Home lists what is missing from your recorded work, using the same rules and wording as Data Health:
  - achievements without a stated outcome, without a metric or evidence reference, without a skill, or without a role or experience;
  - experiences with no linked achievements, and credentials past their recorded expiry.
  Each line expands to the records behind it, and tapping one opens it. A line disappears once its records are complete, and an expanded line stays open while you edit. When nothing is missing, Home says so plainly. **Data Health →** opens the full report, which also covers drafts, the profile and backups.
- **Achievements by Role** lists your roles most recent first, with their achievements (drafts noted) and linked experiences. Tapping a role opens the Vault filtered to that role, showing the same count. Roles with nothing recorded say so, and achievements without a role are counted separately.
- Counts describe what is documented, not ability: no scores, targets or streaks. Archived achievements are not counted.
- Expanded cards on Experience, Skills and Home now share one mechanism to stay open after a dialog closes.
- Tests: 2 Node (Home gaps match Data Health exactly; role counts, order, drafts, archived, without-role) and 3 browser (gaps open records and update after an edit, gap stays open, role row opens the filtered Vault, empty and complete states at 320px). The Data Health browser test now looks inside the report, because Home shows the same items behind the dialog.
- No schema or backup-format change. New modules `domain/dashboard.js` and `ui/homeDashboard.js` are in the offline app shell.

## Maintenance 2026-10-11 — device acceptance and CI diagnostics (no app change)

- alpha.5, alpha.6 and alpha.7 were accepted on iPhone (RM101–RM105, T101–T104, X101–X105).
- QA-023: after PR #24 merged, one CI run failed once and blocked the deploy until it was re-run. In CI, Playwright now retries a failed test once and reports failures and flaky tests as GitHub annotations. Local runs are unchanged. The app version stays `0.1.2-alpha.7`.

## 0.1.2-alpha.7 — CP-012.4 Experience as a container for achievements (review)

Implements the user's choice of option B for OQ-034 (DEC-034): achievements hold results; an experience groups them.
- **Shorter Experience form.** New experiences ask for name, type, status, employer, dates, a short **Context**, technologies, confidentiality and roles. The Objective, My Responsibilities and Outcome fields are no longer offered for new experiences, because the linked achievements hold that information.
- **Nothing you wrote is lost.** Experiences that already have objective, responsibility or outcome text show it as **Earlier Notes** on the card and in the editor, where you can keep, edit or clear it. Saving an experience never clears a field it does not show.
- **The card rolls up results.** Expanded cards list their linked achievements newest first (archived last), each with its stated outcome, a "No outcome stated yet" note when there is none, and its metric count, plus a line such as "2 of 3 have a stated outcome". The collapsed card shows how many achievements it holds. Tapping an achievement opens it.
- **Create an experience while capturing.** In the achievement form (More details → Associated Experiences), **New experience** adds a name and type without leaving the form. The new experience is created only when the achievement is saved, in the same transaction, linked to it, and (if you chose a role) linked to that role and its employer. Typing a name that already exists links the existing experience instead of creating a duplicate. Discarding the achievement or unticking the new experience creates nothing.
- Tests: 6 Node (container builder, earlier-notes listing, name matching, roll-up order and counts, atomic creation with and without a role, refusals and rollback on a storage failure) and 3 browser (container form and earlier-notes preservation, inline creation at 320px with duplicates and escaping, discard and untick). Existing Experience tests now use Context instead of Objective/Outcome.
- No schema or backup-format change. New module `domain/experience.js` is in the offline app shell.

## 0.1.2-alpha.6 — CP-012.3 Title Case headings and most-recent-first employment (review)

- **Employment History lists the most recent employer first**, however the records were entered. Previously employers were sorted alphabetically by name, so adding an earlier employer after the current one could put it on top (UX-022). Order now follows dates:
  - a current role ranks above any ended role;
  - otherwise an employer is as recent as the latest end date of its roles (start date when no end is recorded), precision-aware: "2022" counts as late as 31 Dec 2022;
  - ties go to the later start date, then the name; employers without any role yet have no dates and follow the dated timeline.
- Roles inside an employer use the same rule, so after a promotion the current role is listed first. Education and credentials keep their existing newest-first order.
- **Titles and subtitles use Title Case** (DEC-032): page titles and the line under them, section headings ("Employment History", "Certifications & Credentials", "Quick Capture"), dialog titles, Settings group and row titles, form section headings and the Home next-action title. Short joining words (a, an, and, of, the, to, with…) stay lower case unless they start or end the title.
- Sentences (dialog descriptions, help text, messages), form field labels, buttons and anything you typed keep their case. The Skills subtitle now reads "N of M Skills with Examples".
- Tests: 5 Node (ordering rules, entry-order independence, precision, purity, rendered order) and 2 browser (the reported flow with three employers and a promotion, persisted after reload; a Title Case sweep across all five screens and the main dialogs that leaves user text alone). The new tests fail against the alpha.5 sort and headings. Existing tests that quoted old headings updated.
- No schema or backup-format change; display order only, nothing stored is changed. New module `domain/chronology.js` is in the offline app shell.

## 0.1.2-alpha.5 — CP-012B Controlled unlink, move and delete (review)

- Deleting an **employer, role, experience, education entry, credential or custom skill** now opens one review sheet instead of either blocking ("Cannot delete…") or a browser confirm.
- The sheet lists what links to the record: achievements (marking a primary experience), roles, experiences, and your primary role. You then choose:
  - **Move them to another …**: links and references point to the record you pick. Only compatible targets are offered (a role's experiences must fit the new role's employer, and so on). Duplicate links are merged, and an achievement keeps exactly one primary experience.
  - **Remove the links**: dependents stay and only lose this link. The sheet says exactly what changes ("Your primary role will be cleared", "experiences become independent"). An employer with roles cannot be unlinked, because roles need an employer.
- Records with dependents also require ticking "I understand…". Records without dependents delete with one tap in the sheet. A link in the sheet offers **Export backup** first.
- **No achievement, metric or evidence reference is ever deleted** by these flows. The plan is computed from the data read inside the same IndexedDB transaction, the record revision is re-checked, the whole dataset is validated, and every change commits or aborts together.
- Custom skills gain **Delete…** next to Archive; the sheet notes that Archive keeps the history.
- Expanded Experience cards and skill entries stay open after a dialog closes.
- Tests: 8 Node (each record type and mode, compatibility filtering, primary merge, refusal cases, purity, revision bumps, stale-revision refusal, rollback when storage fails mid-transaction, backup still valid) and 3 browser (experience move, custom skill delete, 320px layout and export from the sheet). Existing deletion tests updated to the new flow.
- No schema or backup-format change. New modules `domain/removal.js` and `ui/removal.js` are in the offline app shell.


## 0.1.2-alpha.4 — CP-012A Data Health (review)

- **Settings → Data health → Check data** now adds a read-only report under the existing backup round-trip result. It separates **critical** problems (records or backup format fail validation; reported, never thrown or auto-repaired) from **suggestions**:
  - backup never exported from this device, last export more than 14 days ago, or records changed since the last export;
  - browser storage not marked persistent (shown only when the browser says so) and backups above 80% of the 12 MiB limit;
  - recorded achievements without a stated outcome, without any metric or evidence reference, without a skill link, or without a role or experience;
  - experiences with no linked achievements, a profile without headline or summary, drafts not yet recorded, credentials past their recorded expiry date (precision-aware).
- Each suggestion lists the records behind it; tapping one opens that achievement, experience, profile or credential editor. The report itself never edits, uploads, stores or scores anything.
- Wording describes documentation, not ability ("not linked to a skill", "This is about documentation, not your ability"). Draft and archived achievements are excluded from completeness suggestions; drafts appear as a plain count.
- Measured: 5,000 synthetic achievements assess in about 4 ms (Node), no persisted health state, no schema or backup-format change.
- New modules `domain/dataHealth.js` and `ui/dataHealth.js` are in the offline app shell; version and cache key updated.
- This is the first release delivered while the alpha.2 update code is running on the phone, so the new banner (version name, Back up first, Restart app) should appear.


## 0.1.2-alpha.3 — CP-012.2 Navigation and Wealth OS design language (review)

**Navigation (DEC-029)**
- The phone tab bar is now **Home · Vault · Experience · Skills · Profile**. Experience Portfolio and the Competency Library (now **Skills**) are their own tabs instead of links two taps deep under Profile; the "Back to Career Profile" links are gone.
- **＋ (new achievement) and Settings sit in the header** of every screen. Settings is no longer duplicated: the header gear appears on phones only; tablets and desktops use the sidebar.
- The desktop sidebar lists the same five destinations and drops the "Coming in future releases" teaser.

**Design language (DEC-030), keeping CareerProof navy/teal and the CP app icon**
- One compact header per screen (title + live subtitle) replaces the breadcrumb bar and the stacked caption/title/subtitle blocks.
- 20px cards, soft shadow, uppercase metric labels, flat line-icon tab bar (1.8 stroke, bold active tab), 12px controls, segmented controls for the theme and the Skills scope.
- **Home**: one deterministic *next action* (first achievement → finish a draft → export a backup if none in 14 days → add a headline → capture a recent win), four truthful metrics (Recorded, Experiences, Skills with examples, Last export), Recent list, Quick capture (Achievement, Experience, Employer, Credential). The marketing banner, duplicate capture buttons and "Build your record" card are removed.
- **Vault**: counts move to the header ("1 achievement · 0 drafts"); the five detailed filters collapse behind **Filters** (shows how many are active) and use the standard field style.
- **Skills**: opens on skills **with linked examples** once any exist, with **All** one tap away; searching always covers every skill; "Show archived" is a 44px toggle. Linked examples are still described as not a proficiency rating.
- **Profile**: the three shortcut cards are removed.
- In dark mode the ＋ button uses the teal accent so it stays visible.

**Fixes found during the redesign**
- Vault said "1 drafts" and called drafts "recorded contributions"; Skills said "1 skills"; sort labels were cut off on phones.
- The archived-skills checkbox was a 19px tap target (the screen was never covered by the layout sweep).
- After **Export backup**, Home kept showing "Never" until another screen redrew.

**Tests**
- Layout sweep now covers Experience and Skills at 320–1440px in both themes (tap targets, overflow, labels, clipping).
- New `home-navigation` spec: next-action order, export status refresh, truthful counts and plurals, five tabs with one active, header-only Settings and capture.
- Navigation geometry test rewritten for the new bar (five equal 60px slots, 21px icons, active 2.05 stroke, safe-area inset separate).
- No schema, backup-format or record change. Version, service-worker cache and version tests updated; no new modules.


## 0.1.2-alpha.2 — CP-012.1 Faster, user-controlled update detection (review)

- **Why updates felt slow:** automatic update checks were throttled to once every 5 minutes, so returning to the app soon after a release did nothing until the throttle expired and the app was foregrounded again. On top of that, CI takes about 2.5 minutes to test and deploy, and GitHub Pages can serve a cached `sw.js` for up to about 10 minutes.
- Removes the time throttle. The app checks **every time it is opened, brought to the foreground or reconnects**; an in-flight guard merges simultaneous events into one request.
- **Restart stays your decision (DEC-028).** The banner now names the release ("Restart to load version 0.1.2-alpha.3") and offers **Back up first** (full JSON export) next to **Restart app**. Nothing reloads by itself; the unsaved-changes guard is unchanged.
- Settings → Check for updates now reports a real result: *latest version available*, *downloading*, or *update ready*, plus the last check time and the ~10-minute GitHub Pages caveat.
- `sw.js` answers a version request so the banner can name the incoming release.
- New tests: every foreground checks (no 5-minute throttle) and duplicate events merge; a simulated new deploy shows the banner with version, Back up first keeps it, Restart app loads the update with records unchanged, and the banner clears the bottom navigation at 320/375/430px. All three fail on the previous code.
- **Note:** this code takes effect from the *next* release. Moving to alpha.2 itself still uses the old path (Settings → Check now → Restart app).
- **Test defect fixed (QA-018):** the "pending save shows busy state" browser test gated `saveAchievement`, which the editor stopped using in CP-011D (it saves through `saveAchievementBundle`). The gate never engaged, so the test passed only when the real save happened to be slow (3 of 8 runs failed on unchanged `main`). It now gates the real method and asserts the gate engaged; 10 of 10 repeated runs pass.
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
