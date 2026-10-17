## CP-UX3 — Redesign Step 3, v0.1.3-alpha.7 (installed-iPhone gate)

**Status: PENDING until merged, deployed and explicitly user-accepted.** Do not uninstall the Home Screen PWA or clear storage. Export a secure current JSON backup before testing. Use disposable synthetic records for any destructive test; never replace real career data solely for testing. The conversion changes two existing records, although **schema 3 and backup format 3 remain unchanged**.

- [ ] **UX301-S3:** Home at 320/375/390/430px: one row with correct **Recorded / Draft / Experiences / Skills Shown** counts, legible typography and no sideways page overflow; honest last-generated-export line.
- [ ] **UX302-S3:** Header + creates an Achievement, Settings works, all five tabs (Home, Vault, Experience, Skills, Profile) remain functional. Quick Add offers Experience, Employer and Credential.
- [ ] **UX303-S3:** Last 12 Months remains tappable and swipeable, month list replaces Recent, and returning to Recent works; drafts, archived and year-only dates follow original rules. Reduce Motion works.
- [ ] **UX304-S3:** Expand Your Record → Complete Your Record, open a gap and Data Health; expand Achievements by Role and reach the role-filtered Vault. Collapsing/reopening does not remove content.
- [ ] **UX305-S3:** Open a synthetic Draft → Hasn't happened yet?; choose a linked Experience with an existing objective, edit expected text; confirm old objective survives with new paragraph appended; Draft appears in Vault → Archived with its original role/skills/metrics/evidence.
- [ ] **UX306-S3:** From resulting Experience use Undo before editing anything else; old objective returns exactly and Draft returns as active Draft. Attempting repeated conversion cannot duplicate paragraph.
- [ ] **UX307-S3:** Stale source edit, concurrent tab edit, repeated press, blank/overlength text and failed transaction must not partially archive/appended anything; show a clear error. Synthetic tests plus unit/integration failure injection qualify destructive conditions; do not force storage quota failures on personal data.
- [ ] **UX308-S3:** Convert a synthetic Draft again, reload installed app offline, verify objective and Archived Draft persist; Undo from before reload is unavailable; Settings / exported JSON still show format 3 and 13 stores.
- [ ] **UX309-S3:** Confidential synthetic Draft to standard-private Experience is blocked until target Experience is explicitly marked Confidential; completed Experience requires acknowledgement. Dark/light contrast, tap targets, keyboard and sheet/scroll safe areas verified.

**No item is automatically PASS solely from automated Chromium or GitHub CI.** Report individual results and any limitations before acceptance.

---

## CP-UX-Fluid — v0.1.3-alpha.6 feel, recorded moment and record timeline: physical iPhone checks (pending)

**Status:** review candidate (DEC-038). Run on the installed iPhone app after the user merges and the Pages deployment finishes (close and reopen the app, then Restart app when offered). Use your own records or a few synthetic ones; nothing here changes stored data. Report each as PASS or FAIL with a note.

- [ ] **UX401 — Press feedback:** Home quick actions, the header **+**, tabs, segmented controls, chips and list rows respond under your finger and settle when you lift it. No tab stays tinted after you move away from it.
- [ ] **UX402 — Sheets:** capture, an achievement and Settings slide up when opened. Opening an achievement and tapping **Edit** does not slide the sheet a second time. Tapping the dimmed area while a sheet is still rising does not close it; once it has settled, tapping the dimmed area closes it as before (and still asks first when there are unsaved changes).
- [ ] **UX403 — Capture steps:** Next slides the next step in from the right and Back from the left. Nothing wobbles or scrolls sideways. Typing on each step behaves as before (labels and fields stay above the keyboard, as in UX207).
- [ ] **UX404 — Recorded moment:** from Home, record an achievement in an experience with a skill ticked. The message names the experience and the skill, the new achievement glows in Recent, and its month on **Last 12 Months** grows. Save another as a draft: the message says what it still needs. Edit a recorded achievement: the message says "Achievement updated".
- [ ] **UX405 — Tidy-ups:** with exactly one recorded achievement, Home says "1 achievement". On **Skills**, search, Filters and Add sit in one row; Category and Show archived are under Filters, which shows how many are on; Add opens the custom skill editor. On **Experience**, "Current" sits beside the role title and the details line does not break inside a date range or a count.
- [ ] **UX406 — Last 12 Months:** bars follow when achievements happened (an older achievement entered today sits in its own month); drafts, archived and undated ones are not counted; a year-only achievement is mentioned in the note. Tapping a month lists it in place of Recent; ‹ › step one month; **Recent** returns; sliding a finger sideways across the bars picks months, while scrolling the page up or down over the chart does not. Leaving Home and coming back shows Recent. Nothing shows a target, streak or score.
- [ ] **UX407 — Reduce Motion:** with iPhone Settings → Accessibility → Motion → Reduce Motion on, nothing slides, grows or glows; every step above still works and messages still appear.
- [ ] **UX408 — Regression and data:** light and dark; offline reopen; Settings → Check data passes and an export still downloads; your records, Data Health suggestions and backup contents are unchanged by using these screens.

**Qualification boundaries:** automated Playwright checks (106 Node / 150 browser locally) cover the logic, layout at 320–390px and Reduce Motion, but they are **not** evidence of how the motion and touch feedback feel on a physical iPhone. Month columns on the Home timeline are narrower than 44px on phones (about 22px at 320px, 24px from about 346px); the 44px ‹ › buttons and a sideways slide are the precise alternatives. UX201–UX207 (CP-UX2) subsequently passed retrospectively on the installed alpha.5 build (UX201 does not certify the historical alpha.4 update screen); PA101–PA106 (CP-013B) remain separately unreported.

## CP-UX-Links — v0.1.3-alpha.5 contextual navigation: accepted on physical iPhone (2026-10-16)

**Release evidence:** [PR #36](https://github.com/YabaCodes/careerproof-os/pull/36) merged; [PR #37](https://github.com/YabaCodes/careerproof-os/pull/37) merged to correct stale version-specific browser assertions. The [post-repair main GitHub Actions run 38751956798](https://github.com/YabaCodes/careerproof-os/actions/runs/38751956798) completed **build, tests and Pages deployment successfully**. The user separately confirmed all seven checks PASS on their installed iPhone. This is **physical acceptance of alpha.5 context navigation**, not final v0.1.3 release sign-off.

- [x] **UX301 — Linked context:** Primary Experience and Role links appear in achievement details with the reading order intact. **PASS**.
- [x] **UX302 — Experience navigation:** Achievement → correct Experience page, Back/navigation and saved records preserved. **PASS**.
- [x] **UX303 — Achievement to skill:** Linked Skill opens the exact expanded skill with evidence breadth and self-assessed proficiency kept distinct. **PASS**.
- [x] **UX304 — Cross-module path:** Experience → Skill → linked Achievement works correctly. **PASS**.
- [x] **UX305 — Additional Experiences:** Secondary linked Experiences appear under More Details and open the intended records without changing relationships. **PASS**.
- [x] **UX306 — Missing and archived links:** Part A: no fabricated links on unlinked achievement (**PASS**). Part B: archived linked skill opens without changing its archived state (**PASS**). **Overall PASS**.
- [x] **UX307 — Final device verification:** Mobile layout/navigation **PASS**; light/dark appearance and Reduce Motion **PASS**; offline reopening/navigation **PASS**; saved data, Data Health and backup export **PASS**. **Overall PASS**.

**Qualification boundaries:** The user tested their own iPhone, not each possible 320–390px physical-device width. Playwright viewport checks supplement but do not replace device results. No destructive restore of the user's personal data was requested or performed. Existing IndexedDB schema 3 and backup format 3 remain unchanged by CP-UX-Links. **CP-UX2 alpha.4 UX201–UX207 passed retrospectively on alpha.5 (see below); CP-013B PA101–PA106 remain unreported**, even though those capabilities are present in the deployed build.

---

## CP-UX2 — v0.1.3-alpha.4 guided capture: accepted through retrospective physical-iPhone checks (2026-10-16)

**Accepted: UX201–UX207 all PASS**, individually reported by the user on 2026-10-16 using the **already-installed v0.1.3-alpha.5** app. Guided Capture was introduced in [merged PR #35](https://github.com/YabaCodes/careerproof-os/pull/35); the [post-repair alpha.5 main build/test/deployment run 38751956798](https://github.com/YabaCodes/careerproof-os/actions/runs/38751956798) succeeded. No downgrade, reinstall or IndexedDB reset was performed. This is **retrospective device qualification of alpha.4 guided-capture functionality**, not proof the original alpha.4 release screen or update prompt was tested.

- [x] **UX201 — Version and data retention (retrospective): PASS.** On installed `v0.1.3-alpha.5`, Settings showed schema **3**, and the user reported existing Vault achievements, Experiences, Roles and Skills retained. **Exception:** the original `v0.1.3-alpha.4` version label and installation transition were **not** physically verified; UX201 is not evidence of that historical update.
- [x] **UX202 (PASS) — Where:**
  - ＋ opens "Where did this happen?" with your five most recent experiences.
  - "Show all" and search find older ones, and Next without a choice asks you to choose.
  - "Not part of an experience" shows a role picker.
- [x] **UX203 (PASS) — What:**
  - The chosen experience shows at the top, and the title counter works.
  - "Add context" opens a context field.
  - Typing in the Result field keeps its label and box visible above the keyboard.
- [x] **UX204 (PASS) — When:**
  - Month is preselected. Skills already used in that experience appear as chips you can tap, and "Find another skill" searches all skills.
  - The Confidential switch is on.
  - Back keeps what you typed.
- [x] **UX205 (PASS) — Save:**
  - Record one real achievement (or a test draft you then delete). It appears in the Vault and on the experience's page, with the right role.
  - A draft saved from step 2 shows "No date".
- [x] **UX206 (PASS) — Edit:** Edit on an existing achievement shows the three sections on one page. Saving without changes keeps its experience and role.
- [x] **UX207 (PASS) — Layout:** Nothing is clipped or overlapping on any step, in light and dark mode. Footer buttons are easy to reach.


**Detailed device outcomes:** UX202 (Where selection/search/Role picker) PASS; UX203 (What fields, title counter, context, keyboard) PASS; UX204 (Month/Year/Exact-day controls, skill chips/search, Confidential, Back) PASS; UX205 **Part A recorded-save/Experience-Role relationships PASS** and **Part B undated draft showing No date PASS**; UX206 (unified edit and unchanged relationships after save/reopen) PASS; UX207 (Where/What/When layout, keyboard, light/dark mode, tap targets, cancel without unintended record) PASS. All user-reported; test device was one iPhone. Responsive-width automated tests supplement but do not establish physical testing at every width. No destructive backup restore was performed. Separate **PA101–PA106 proficiency assessment** is still pending; the complete `v0.1.3` release is not certified.
**Automated qualification:**
- Node tests cover role-by-date across two roles, most-recent fallback, no-role experiences and the Where order.
- Browser tests cover:
  - required choice, search and show-all, and role picker
  - primary-experience and role derivation for new captures and edits
  - other experiences, skill chips and search, the confidentiality switch, and the impact category carried through
  - no date for step-2 drafts, empty rows not saved
  - the per-step 320–430px light/dark geometry, focus order and the keyboard reveal

CI success alone is not iPhone acceptance; **UX201–UX207 have separate physical-iPhone PASS evidence recorded above.**

## CP-UX1 — v0.1.3-alpha.3 reading and scanning: physical-iPhone checks (all passed, user-reported 2026-10-15)

**Only after PR CI passes, the user merges, and GitHub Pages deploys.** Use the existing Home Screen app, with no reinstall and no cleared website data. Export a private backup first and keep it somewhere safe. These checks are **non-destructive**: cancel any Delete you open, and change a real record only if you actually want the change.

- [x] **UX101 — Update and data retention:** Settings shows `v0.1.3-alpha.3` and schema 3. The Vault's *Recorded · n* plus *Drafts · m* match your totals before the update. Experiences, roles and skills are all still there.
- [x] **UX102 — Experience timeline:**
  - Roles are listed most recent first, and the two most recent are open.
  - Each experience appears once. "Also: …" names the earlier role where an experience spans two.
  - Collapse one group, open an experience, then go Back. The group stays collapsed.
- [x] **UX103 — Experience page:**
  - Context, Goal or Expected Result, achievements with their result lines, and skills read clearly.
  - Edit opens the editor, with Delete at the bottom left. Cancel it.
  - The iPhone back gesture and the Back link both return to the timeline.
- [x] **UX104 — Achievement story:** Result comes first, then What I Did and Context. More Details opens the rest, including Archive and Delete. Don't delete anything.
- [x] **UX105 — Vault:**
  - It opens on Recorded, with your drafts under Drafts and year headings in order.
  - Search and Filters sit on one line, and Sort is inside Filters.
  - Tapping a row opens the story.
- [x] **UX106 — Date control:**
  - New achievement starts on Month with this month filled in. Year and Exact day switch the field, and the hint reads clearly.
  - Cancel without saving. Optionally, give one of your undated drafts the month or year it happened and record it.
- [x] **UX107 — Profile tap-to-edit:** Tapping an employer, role, qualification or credential name opens its editor with Delete at the bottom. Cancel. Cards no longer show Edit/Delete buttons, and Add role is still under each employer.
- [x] **UX108 — #33 follow-ups:**
  - Skills assessment rejects a date after today.
  - Assessment dates read like "Oct 12, 2026".
  - A skill with history says it can be archived but not deleted.
- [x] **UX109 — Offline and themes:** Reopen offline. All five tabs, an experience page and an achievement story load, with nothing clipped or overlapping in light and dark.

**Automated qualification:**
- Domain tests cover role grouping, the most recent role, "Also", ordering, recorded-versus-draft counts, loose achievements, contexts, years and no mutation.
- Browser tests cover:
  - the timeline, page, deep link, history Back/Forward, remembered groups and 320px layout
  - story order and folding, and draft notices
  - Vault segments, years, counts under search, sort and the one-line toolbar
  - date precision switching and saving at month/year/day
  - Profile tap-to-edit with an accessible name and description
  - the #33 fixes and keyboard use

CI success is not physical-iPhone acceptance.

## CP-013B — v0.1.3-alpha.2 proficiency assessment physical-iPhone gate (pending)

**Only after PR automated CI passes, the user reviews/merges, and GitHub Pages deploys.** Export the existing private career backup to a secure location **before** updating. Do not reinstall, clear Safari data, or restore over the real personal dataset for testing.

- [ ] **PA101 — Update / data retention:** Settings shows `v0.1.3-alpha.2` and schema 3 after safe Home Screen PWA update. Existing career/achievement counts, Experience and Skill links, contacts/preferences are unchanged.
- [ ] **PA102 — Unassessed vs L1:** Skills with no history read *Not assessed*, never automatically L1. Use a non-sensitive competency to create a user-chosen L1–L4 assessment with date and optional rationale.
- [ ] **PA103 — History persistence:** Add a second assessment on the same competency. Both remain visible after close/reopen; current label follows **assessment date**, not entry order. Historical self-ratings are not rewritten by Evidence Breadth changes.
- [ ] **PA104 — Evidence distinction:** Skills displays self-assessed level and separately the Evidence Breadth label/counts. It does not claim verification, readiness, or ability based on evidence gaps.
- [ ] **PA105 — Data integrity / recovery:** Settings → Check data passes, export a fresh format-3 private JSON backup, confirm it was saved, and verify it contains the new history. **Do not perform destructive restore on the user's real data.** Format-1/2 import and atomic rollback are covered by synthetic automated tests.
- [ ] **PA106 — Offline / mobile UI:** Reopen offline; Skills and all five tabs load normally with usable assessment form, correct keyboard/focus/scrolling and no clipped or overlapping controls. Check device light and dark themes if convenient.
- [ ] **EB103 carry-forward:** Draft/Archived-only linked achievements are not counted in Evidence Breadth. May remain *Not tested* when no suitable real record exists; never alter real records just to test.

**Automated qualification:** schema-2→3 forward upgrade preserves generation, source revision, theme, previous export and all 12 original record collections; v1→3, format-2→3 import, append-only history, deleted/archived skill protection, invalid rating/foreign reference rollback, format-3 export/restore, and cross-screen browser regressions. CI success ≠ physical-iPhone acceptance.

## CP-013A — v0.1.3-alpha.1 evidence-breadth physical iPhone checks (pending)

**Non-destructive** checks, only after PR CI passes, the user merges, and GitHub Pages deploys. Export the current private backup securely first; never clear data or restore real data for these tests.

- [ ] **EB101:** Installed PWA updates to v0.1.3-alpha.1 without uninstall, clearing site data or losing the current 16 Experiences / 29 Achievements.
- [ ] **EB102:** Skills → With examples → open a skill with recorded linked achievements. It shows Evidence breadth and its eligible recorded example, work context and stated outcome counts. The label is **not** described as proficiency or verified expertise.
- [ ] **EB103:** Check a skill linked to Draft-only or Archived-only achievements: breadth stays Not documented even if older linked examples appear. If no suitable skill exists, mark not tested rather than changing real data.
- [ ] **EB104:** Settings → Check data passes; export a fresh backup. No assessment values, extra stores, automatic edits, or data loss.
- [ ] **EB105:** Reopen offline. Skills breadth and other four tabs still work; no UI overlap around expanded skills on the device.

# CareerProof — Acceptance test plan

## v0.1.2 Final Release — post-promotion iPhone smoke gate

**Pending after the separate promotion PR is merged, CI has passed and GitHub Pages deployment has succeeded.** Do not mark the final release shipped until these checks are reported.

- [ ] **F201:** Existing installed Home Screen PWA updates to exactly `v0.1.2` (Settings), without uninstall, reinstall or clearing website data.
- [ ] **F202:** Previously saved employers, roles, Experience associations, achievements, competencies and preferences are still available after closing and reopening the app. **Do not restore a backup to test this.**
- [ ] **F203:** Settings → Check data reports no critical integrity errors; the exported alpha.11 backup remains available in secure Files storage. No imported or confirmed restore operation is required.
- [ ] **F204:** The five primary tabs, Capture and Settings open normally; optionally confirm offline reopening if convenient. Any failed critical check blocks final acceptance.

## CP-012E — Accepted recovery and upgrade certification (v0.1.2-alpha.11)

**Accepted on physical iPhone 2026-10-11:** User explicitly reported RE101–RE105 and E220 all passed. PR #29 was merged (merge SHA `3b9905c`); PR-head build/test run 38113988112 completed successfully after a test-only correction to the stale-restore error assertion. Destructive E219 used **only synthetic disposable IndexedDB**. The existing phone data was never replaced for qualification.


### Certification test procedure (completed)

**Do not restore any backup over your real CareerProof data.** Destructive recovery E219 runs exclusively in isolated synthetic fake-indexeddb and Playwright browser contexts. This release gate certifies the existing backup/restore and migration code; it does not authorize any personal-data import or storage reset.

Automated certification: E219 isolated full P0 synthetic format-2 export → close/reopen → mutate disposable dataset → explicitly preview/restore → close/reopen and compare all stores, links, confidential fields, preferences and generation. Also verify corrupt/future backup rejection, stale-preview protection, v1→v2 migration, and the existing quota/constraint rollback and browser restore-preview tests.

Physical iPhone **non-destructive** gate after merge/deploy:
- [x] **RE101:** Installed Home Screen app updates to alpha.11 without reinstall, clear-site-data or data loss.
- [x] **RE102:** Settings → Check data reports no critical integrity errors. Review any advisory gaps separately; incomplete career entries are not corruption.
- [x] **RE103:** Export a JSON backup to Files. Confirm the file is present, readable, and kept securely; it is unencrypted. Do not upload it to GitHub or this chat.
- [x] **RE104:** Confirm saved employers, roles, Experience links, achievements, metrics/evidence, skills and dates still display correctly after reopening the app.
- [x] **RE105:** In Settings select the valid exported backup only to inspect its restore preview/counts, then **cancel** without confirming restore. Verify the current records are unchanged.
- [x] **E220:** Confirm public GitHub repository and test fixtures contain no private employer/project data (repository scanning is separately documented; personal confirmation required).

**Release decision 2026-10-11:** P0 CP-012E qualification passed and final promotion authorized. Separate final-version PR CI, user merge, deployment and F201–F204 are still pending. No destructive test on a real iPhone.

## CP-012D.2 — Accessible validation and full-layout regression (0.1.2-alpha.10, device gate)

**User accepted on physical iPhone 2026-10-11:** AE101–AE104 passed. AE105 (Reduce Motion) was marked N/A/not tested and the user explicitly waived it for this milestone. Automated reduced-motion coverage exists; do not rewrite AE105 as passed.

### CP-012D.2 device test details

**Previously planned physical iPhone verification, now accepted with AE105 waived.** This is the second/final planned CP-012D slice. It expands 14-viewport/theme sweeps to textarea labeling/touch geometry and adds validation error focus tests; it is not a formal WCAG 2.2 AA certification or a measured iPhone performance benchmark.

- [x] **AE101:** Existing Home Screen app updates to alpha.10 without reinstalling, clearing data or losing any role/Experience/achievement links.
- [x] **AE102:** In Capture Achievement, leave the required title empty and tap Save achievement. A visible error appears; VoiceOver (if available) announces the error and focus moves to the error message without opening the keyboard.
- [x] **AE103:** Correct the title, enter a contribution, save and reopen the achievement. No data loss, blocked form, clipped error or stuck focus.
- [x] **AE104:** Recheck all five tabs, Settings, Experience editor and Capture in light/dark themes; no clipped fields or inaccessible buttons when the iOS keyboard is open.
- [ ] **AE105:** With Reduce Motion enabled in iOS accessibility settings (if available), error feedback and dialogs remain usable and do not require animation.

## CP-012D.1 — Keyboard accessibility and role-summary performance (0.1.2-alpha.9, device gate)

**Accepted on physical iPhone 2026-10-11:** User reported AD101–AD105 all passed after PR #27 merged. AD103 was optional for an external keyboard; the user marked it passed without specifying whether an external keyboard was used, so hardware-keyboard verification is not independently established. Automated Playwright covers arrow/Home/End semantics.

### CP-012D.1 device test details

**Previously planned physical iPhone verification, now accepted.** The narrow scope is the Settings theme radio keyboard interaction and unchanged responsive flows; browser tests separately cover keyboard/radio semantics and reduced motion, while Node tests exercise 800 roles and 8,000 synthetic achievements. A complete WCAG 2.2 AA audit and real-device performance benchmark are NOT claimed.

- [ ] **AD101:** Update to alpha.9 using the existing Home Screen app; confirm roles, achievements, experience links and backups remain available. Do not uninstall or clear website data.
- [ ] **AD102:** Settings → Appearance shows one selected theme. Tap System, Light and Dark; each updates the theme and selected state, including after leaving and reopening Settings.
- [ ] **AD103:** If an external keyboard is available: Tab into the theme selector (one stop), arrow keys cycle System/Light/Dark, Home/End choose endpoints, Tab advances to Export Career Backup without visiting all three radios.
- [ ] **AD104:** Home, Vault, Experience, Skills, Profile and capture remain usable and unclipped in both themes; Outcome stays above the keyboard when focused.
- [ ] **AD105:** With larger record lists if available, Home and Achievements by Role load smoothly; do not import a synthetic 8,000-record fixture into your personal app.

## CP-012C — Home dashboard (0.1.2-alpha.8, device gate)

**Accepted on physical iPhone 2026-10-11:** The user reported D101–D105 all passed after PR #26 was merged. This covers actual installed-app update/preservation, gap updates, role filtering, Data Health navigation and both theme layouts.


- [x] **D101:** The update banner names alpha.8; after restart all records are intact.
- [x] **D102:** Home → **Complete Your Record** lists gaps that match your records, for example achievements without an outcome. Expand one and tap a record to open it. Add the missing detail and save: the line updates on Home. A line you expanded stays open after closing the record.
- [x] **D103:** **Achievements by Role** shows your roles with the current one first and sensible counts. Tapping a role opens the Vault filtered to that role with the same number of achievements. A role with nothing recorded says "No achievements recorded yet".
- [x] **D104:** **Data Health →** opens Settings and runs the full check.
- [x] **D105:** Home fits the screen in light and dark mode, with no sideways scrolling.

ha.4 (iPhone UAT required)

User-reported after merged PR #6: **Outcome is covered when the keyboard opens and requires manual scrolling.** The CP-UI204 keyboard portion of alpha.3 was **not accepted**. The focused alpha.4 code attempts to repair this with viewport-settled modal-body scrolling; actual Safari verification remains pending.

- [ ] **CP-UI301 Outcome / keyboard:** On an actual iPhone in the current installation, focus Outcome. The label and first lines of the active textarea must appear above the keyboard without manual scrolling; type multiple lines and switch focus to Title, Contribution and Outcome. Footer actions remain reachable. Dismiss/reopen the keyboard. Report iPhone model/iOS/Safari vs installed PWA and any remaining manual-scroll requirement.
- [ ] **CP-UI302 Regression:** Compact navigation and date picker unchanged; after safe reload, prior records remain intact; synthetic achievement save/edit/offline work. Do not remove the PWA or clear data.

Automated coverage: new staged 700→550→430→360→300px keyboard tests (320/375/390/430px; light/dark) with synthetic VisualViewport and focus switching. See [CP-011A.3 root cause and limitations](IOS_KEYBOARD_OUTCOME_CP_011A_3.md). Do not claim real iOS acceptance from Chromium.

# CareerProof — Acceptance test plan

## CP-012.4 — Experience as a container (0.1.2-alpha.7, device gate)

**Accepted 2026-10-11:** the user reported all 14 combined alpha.5–alpha.7 checks passing on iPhone at the alpha.7 update (RM101–RM105, T101–T104, X101–X105), using synthetic Test Co / Test Role / Test Experience records that were then deleted.

Export a backup first. Use synthetic test records for anything you create.

- [x] **X101:** The update banner names alpha.7; after restart all records are intact, including any Experience text you entered before.
- [x] **X102:** Experience → Add experience shows the shorter form (Context instead of Objective / My Responsibilities / Outcome). If an existing experience had that text, its card and editor show it under **Earlier Notes**, unchanged.
- [x] **X103:** An experience with linked achievements lists them newest first with their outcomes and "N of M have a stated outcome"; tapping one opens it.
- [x] **X104:** ＋ → More details → Associated Experiences → **New experience** → type a test name → Add and link. It appears ticked as "New". Save the achievement: the experience appears on the Experience tab, linked to the achievement (and to the role, if you chose one).
- [x] **X105:** Discarding an achievement after adding a new experience creates nothing. Typing the name of an existing experience links that one instead of making a copy. Layout fits in light and dark.

## CP-012.3 — Title Case and employment order (0.1.2-alpha.6, device gate)

- [x] **T101:** The update banner names alpha.6 and offers Back up first / Restart app; after restart all records are intact.
- [x] **T102:** Profile → **Employment History**: your current employer is listed first and earlier employers follow in date order, even the one you entered after the current one. Inside an employer, the current role is first.
- [x] **T103:** Optional, synthetic only: add a test employer with an old ended role. It appears below your real employers (an employer with no role yet appears at the bottom until a role is added). Delete it afterwards with **Remove the links**.
- [x] **T104:** Titles read in Title Case on Home, Vault, Experience, Skills and Profile, in Settings and in the capture form. Your own entries (employer names, titles, notes) are unchanged.

## CP-012B — controlled removal (0.1.2-alpha.5, device gate)

Export a backup first. **Use synthetic test records only**: never delete real records just to test.

- [x] **RM101:** The update banner names alpha.5 and offers Back up first / Restart app; after restart all records are intact.
- [x] **RM102:** Create a test employer "Test Co" with a test role "Test Role" and a test experience linked to that role. Delete the role: the sheet lists the linked experience; **Move** offers only compatible roles; **Remove the links** explains the effect; Delete stays disabled until you choose and tick the confirmation.
- [x] **RM103:** Choose **Remove the links** → confirm. The role is gone; the test experience still exists. Then delete "Test Co": with no roles left, choose **Remove the links** (not Move, so no test data lands on a real employer); the test experience becomes independent.
- [x] **RM104:** Delete the test experience and an unused test credential: the sheet says nothing else links to them and deletes with one tap.
- [x] **RM105:** Layout fits the screen in light and dark (the selected option is visible in dark), and an expanded Experience card stays open after closing a dialog.


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
