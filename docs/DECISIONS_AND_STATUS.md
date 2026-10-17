# CP-DRG-001 — Design Decisions, Actual Status and Codex Handover

**Last reviewed:** 2026-10-10. **Owner approval:** Product design and P0/P1 scope approved in the CareerProof planning conversation. **This document is the starting handover record, not an assertion that planned functionality has shipped.**

## 1. Current truth: repository and release state

### CP-UX2 retrospective acceptance checkpoint (2026-10-16)

- User confirmed **UX201–UX207 all PASS** for alpha.4 Guided Capture on installed **alpha.5**, after PR #35 merged and subsequent alpha.5 build/test/deployment succeeded. **UX201 caveat:** alpha.5 version, schema 3 and preserved data were verified; the historical alpha.4 version/update screen was not observed. UX205 A/B both passed. These are user-reported physical-iPhone results, not only browser CI.
- CP-UX-Links UX301–UX307 remain independently accepted. **PA101–PA106 proficiency testing remains unreported.** No full v0.1.3 final acceptance is implied. The later alpha.6/alpha.7 work and its separately defined gates are unaffected by this documentation correction.
- Acceptance source: [ACCEPTANCE_TESTS.md](ACCEPTANCE_TESTS.md); current feature status: [MILESTONE_TRACKER.md](MILESTONE_TRACKER.md).

### Historical verified state (2026-10-15, at CP-UX1)

- `main` = `ffc72ef` (merge of PR #33). App **`0.1.3-alpha.2`** deployed by main CI run 38684412367 (success). DB schema **3**, backup format **3** (formats 1 and 2 importable), taxonomy **1.0**.
- v0.1.2 final was promoted in PR #30 (merged 2026-10-11). PR #31 (docs closing v0.1.2 after F201–F204) is open with merge conflicts. CP-013A (`0.1.3-alpha.1`, #32) accepted with EB103 not tested; CP-013B (`0.1.3-alpha.2`, #33) merged, PA101–PA106 not yet reported.
- **CP-UX1 (`0.1.3-alpha.3`, DEC-036)** merged in PR #34 (main `3fd7cb4`, CI run 38693021202 success, Pages deployment of `3fd7cb4` succeeded). The user reported UX101–UX109 all passed on iPhone (2026-10-15).
- **CP-UX2 (`0.1.3-alpha.4`, DEC-037)** guided capture is In Review on `feat/cp-ux2-guided-capture`. No schema or backup-format change.
- **2026-10-16:** CP-UX2 merged (PR #35; UX201–UX207 unreported). CP-UX-Links (`0.1.3-alpha.5`) merged (PR #36, test repair #37) and **accepted UX301–UX307**. **CP-UX-Fluid (`0.1.3-alpha.6`, DEC-038)** is In Review in PR #40 (`feat/cp-ux-fluid`): motion and touch feedback, the recorded moment, tidy-ups and Home's Last 12 Months. No schema or backup-format change.

### Earlier verified state (2026-10-10, updated at CP-012.3)

- `main` = `f14628bf9d68c9fd5d1dfc69ac0e4ce98af7e177` (merge of PR #24). App **`0.1.2-alpha.7`** deployed: main CI run 38098062177 (attempt 2) built, tested and deployed to GitHub Pages; the live service worker cache is `careerproof-v0.1.2-alpha.7`. DB schema **2**, backup format **2** (legacy format 1 importable), taxonomy **1.0**, 12 P0 stores plus `meta`.
- Physical iPhone: alpha.1–alpha.7 accepted by the user (RM101–RM105, T101–T104, X101–X105 on 2026-10-11). The v0.1.1 post-promotion smoke (F101–F102) is still unreported. No Git tag/GitHub Release exists.
- Merged and accepted: CP-012.3 (`0.1.2-alpha.6`, PR #23) and CP-012.4 (`0.1.2-alpha.7`, PR #24, DEC-034). Remaining v0.1.2: CP-012C dashboard, CP-012D accessibility/performance, CP-012E recovery certification.
- Per-feature status, PRs, tests and device evidence: [MILESTONE_TRACKER.md](MILESTONE_TRACKER.md).

### Historical status entries (superseded by the block above; kept for traceability)

- GitHub repository: **YabaCodes/careerproof-os**, default branch `main`.
- Deployment: GitHub Pages via **GitHub Actions**, build output `dist/`. Public URL: https://yabacodes.github.io/careerproof-os/
- Tech: TypeScript/DOM, compiled ES modules, CSS tokens, IndexedDB, service worker. Build/test: `npm test`; source modules under `src/`, `styles.css`, `public/`; CI at `.github/workflows/deploy.yml`.
- Deployed/main baseline before the CP-011A merge: **v0.1.0**; DB schema **1**; JSON export format **1**. Hotfix kept the 0.1.0 version.
- Implemented from README/source: basic Profile; Quick Capture (draft/recorded); Vault search/filter/sort/edit/archive/restore/delete; basic home stats; local persistence; JSON backup and restore; responsive themes/PWA shell.
- The original deployment selected **branch root** and served source `index.html` without compiled `app/app/main.js`, leaving users at 'Opening CareerProof…'. The GitHub Pages source was corrected to Actions, and the build/deploy completed successfully.
- Original v0.1.0 had dialog click-through behavior and visually uneven mobile navigation. **PR #1** (`v0.1.0 UI Hotfix 1: dialogs stay open while typing, even mobile nav`) was merged into `main` on 2026-10-09. It introduced scoped direct-backdrop interaction and nav alignment fixes plus regression tests and service-worker cache update.
- **iPhone hotfix acceptance (user-confirmed 2026-10-09):** Input fields in the achievement editor work, and the bottom navigation is aligned after merged PR #1. Those two defects can be closed. This is **not** confirmation of full v0.1.0 UAT; backup/restore, offline startup, archive/delete and broader device checks still need manual evidence.
- The user merged CP-011A in PR #4; it introduced 0.1.1-alpha.1, schema 2 and backup format 2/legacy 1. The user reported all five CP-011A iPhone smoke checks passed. Extended fault/quota/migration qualification retains separate evidence requirements.
- CP-011A.1 was merged in PR #5; current main is 0.1.1-alpha.2. The user's iPhone review found remaining date-field overflow, focus/context and navigation/footer density issues. CP-011A.2 is authorized on `fix/cp-011a2-ios-form-nav-density` as 0.1.1-alpha.3, preserving branding and all schema/backup/date/recovery contracts. CP-011B remains paused for review, merge and explicit iPhone acceptance. See [correction report](IOS_FORM_NAV_REFINEMENT.md).
- The user reported missing local records after removing the installed PWA; the cause is not independently verified. This correction performs no recovery/reset/import or achievement seeding. Removing/reinstalling the iPhone PWA may delete local data; first export, validate/preview without replacing, and securely store a backup outside the app before removing it solely to refresh its icon.

## 2. Decision register

| ID | Decision | Rationale / implementation implication |
|---|---|---|
| DEC-001 | Integrated CareerProof OS (combined achievements + growth + intelligence) | Do not build four disconnected apps or only a résumé generator |
| DEC-002 | Initial niche: technical professionals/engineers/TPMs/aspiring leaders | Realistic workflow, but preserve applicability outside projects |
| DEC-003 | Eight long-term modules with shared data | One achievement/project can serve multiple outputs |
| DEC-004 | P0 first, four limited P1 features in initial development cycle | Self-assessment, review, CV, pasted job match; AI optional/later |
| DEC-005 | Local-first PWA/IndexedDB on GitHub Pages | No local admin installs needed; low-cost initial build; no automatic sync |
| DEC-006 | Structured relational *logical* model with stable IDs and migrations | Preserve data and future backend portability |
| DEC-007 | Separate date precision from exact-day timestamps | Do not fabricate historical dates |
| DEC-008 | Keep proficiency, evidence breadth, and role fit separate | Explainable without false skill precision |
| DEC-009 | Four original proficiency levels with historical self-assessments | No automatic certification or skill score |
| DEC-010 | 32 original built-in competencies, four categories + custom | Stable taxonomy IDs, rubric versioning, custom expansions |
| DEC-011 | Editable source-linked CV/review snapshots | Preserve manual edits when source changes |
| DEC-012 | Job matching uses manually pasted descriptions and transparent requirement matrix | No live listing, ungrounded fit percentage or eligibility inference |
| DEC-013 | Confidential records excluded from externally shareable outputs by default | Distinguish private full backup from export intended for sharing |
| DEC-014 | Mobile-first and design-token consistency | Avoid crowding, overlapping layouts and inconsistent fonts |
| DEC-015 | Five final destinations: Home/Vault/Growth/Studio/Profile | Reveal only implemented destinations; global Quick Capture |
| DEC-016 | User controls merge/release; agents use branch + PR | No unsolicited direct changes to production |
| DEC-017 | First release must be useful, not empty app shell | v0.1.0 includes achievement capture and storage |
| DEC-018 | Honest testing: browser-device tests separate from automated build | Prior deployment and modal regressions demonstrate need for UAT |
| DEC-019 | Personal records never committed to public GitHub | Use generic synthetic data in docs and tests |
| DEC-021 | CP-011A includes complete recovery before new workflows | User approved strict import validation, additive schema 2, legacy adapter, atomic full replacement and persistent generations; CP-011B–E remain separate |
| DEC-022 | One persisted PrecisionDate; UI/legacy adapters | Exact historical days preserved; blank drafts null; hidden P0 fields survive existing UI edits |
| DEC-023 | Historical achievements migrate Confidential | No automatic external-sharing approval; full private backup still includes confidential data |
| DEC-024 | CP-011A.1 precedes CP-011B | Stabilize every existing screen, responsive tokens, dialogs and icons without changing schema/backup contracts |
| DEC-025 | User-selected Concept 1 Modern Monogram and supplied nav family | Latest selection supersedes earlier rejected concepts; editable vector plus platform PNG assets; no automatic merge/deploy |
| DEC-026 | CP-011A.2 precedes CP-011B; Wealth OS density reference | Native date presentation reset, compact 60px navigation, shared dialog context/spacing; preserve selected branding and every data contract; user verifies iPhone before B |
| DEC-020 | Use GitHub documentation as durable Codex source of truth | Do not assume Codex has full past chat history |
| DEC-028 | App updates stay user-controlled: check on every open/foreground, then **Back up first** or **Restart app**; never auto-reload | User decision 2026-10-10 ("restart button is good for safety; I might back up first"). Supersedes the 5-minute check throttle; keeps CP-011B.2's no-forced-reload rule |
| DEC-029 | Mobile navigation becomes Home · Vault · Experience · Skills · Profile; **＋ (capture) and Settings move to the header** | User decision 2026-10-10. Experience and Competency Library get their own tabs; Settings no longer duplicated. Supersedes the accepted Home/Vault/Add/Profile/Settings bar from alpha.3 onward; requires new geometry tests and iPhone acceptance. DEC-015's Growth/Studio target is revisited when Studio ships (v0.1.4) |
| DEC-030 | Adopt the Wealth OS design language (header, cards, tabs, buttons, segmented controls, ⋯ row menus, line icons) while keeping CareerProof navy/teal accents and the CP monogram app icon | User decision 2026-10-10; supersedes visual details of DEC-025/026 but not the brand mark |
| DEC-031 | Sequence: 0.1.2-alpha.2 update detection → alpha.3 redesign/navigation → CP-012A Data Health and the rest of v0.1.2 | User decision 2026-10-10, so Data Health UI is built once in the new style |
| DEC-032 | **Title Case** for app-authored titles and subtitles: page titles and subtitles, section and group headings, dialog titles, Settings row titles, form section headings (legends) and the Home next-action title. Minor words (a, an, and, as, at, but, by, for, from, in, into, nor, of, on, or, per, the, to, via, vs, with) stay lower case unless first, last or after a full stop. Sentences (descriptions, help text, messages, toasts), field labels, buttons and user-entered text keep their case | User request 2026-10-10 ("capitalized first letter for each word", e.g. "Employment History"). Standard title-case minor words chosen so headings stay readable; switching to every-word capitals is a one-line change if preferred |
| DEC-033 | Employment History is **most recent first**: current role first, then latest role end (start if no end), precision-aware; ties by later start, then name; employers without roles follow the dated timeline. Roles inside an employer use the same rule | User request 2026-10-10 (current employer entered first stayed below an earlier employer added later, because employers were sorted by name). Display order only; no stored data changes |
| DEC-035 | **Home dashboard (CP-012C)** adds two derived sections and no scores: *Complete Your Record* shows the Data Health completeness issues for recorded achievements, experiences and credentials (same rules and wording, shared code; drafts, profile and backup items stay in the next action, the export card and Data Health) with links to the records; *Achievements by Role* lists roles most recent first with active (recorded + draft) achievement, draft and experience counts, opening the Vault filtered to that role. Trends, targets and streaks are not shown | Implements CP-01 "missing-record prompts" and CP-FR-014 under the user's 2026-10-11 go-ahead ("honest summaries of what you've recorded and what's missing… No scores"). The last-export card wording is unchanged. Open to change on review |
| DEC-034 | **Experience is a container for achievements** (OQ-034 option B). The editor offers name, type, status, employer, dates, a short Context (`scope`), technologies, confidentiality and roles; objective / personal responsibility / outcome are not offered for new experiences but stay in the data, shown as Earlier Notes when non-empty, and are never cleared by an edit. The card rolls up linked achievements' outcomes. The achievement form can create an experience inline, saved atomically with the achievement and linked to its role and employer; same-named experiences are linked instead of duplicated | User decision 2026-10-11 ("Let's go with B"). Amends CP-06 / M03. No schema or backup-format change. Option C (Experience inside the Vault) not adopted |
| DEC-036 | **UX redesign R1: reading and scanning (CP-UX1).** (1) The **Experience** tab is a timeline of roles, most recent first (the two most recent start open; open/closed choices are kept). Each role lists its experiences as one-line rows, ongoing first and then by end date. An experience linked to several roles is listed once, under the most recent, with "Also: …"; experiences without a role are grouped by employer. A role's achievements that sit in no experience get one row that opens the Vault. (2) Each experience has its own **page** (`#/portfolio/<id>`): type and status, employer · roles · dates, context, goal, achievements with their results, skills shown, technologies, Earlier Notes. (3) **Amends DEC-034:** `objective` is offered again as an optional *Goal or expected result*. It is shown as **Expected Result** while the experience is not completed (with "It happened — record it as an achievement") and as **Goal** once completed, and is no longer listed under Earlier Notes. (4) An achievement reads as a **story**: Result (with metrics) → What I Did → Context → Skills Shown; detailed actions, notes, impact category, evidence, other experiences, privacy, record dates, Archive and Delete sit under **More Details**. A draft's notice names only what is still missing (what you did and/or a date). (5) The **Vault** opens on **Recorded**, with Drafts and (when used) Archived one tap away; rows are grouped under year headings and show date · experience (or role); Sort moves into Filters. Across the app, an "achievement" count means a recorded one and drafts are counted separately. (6) The achievement date is **Month** by default, with **Year** or **Exact day** when known; switching keeps what still fits and never invents a day or month. (7) **Profile:** a record's name opens its editor; Delete moves into the editor footer (the same for experiences). | User review of their own data on 2026-10-15 ("it looks so clustered… the recording is not very intuitive"); user agreed to recommendations A–D ("Agree with your recommendation"), approved the mockups ("Overall it looks better"; Profile unchanged apart from tap-to-edit) and authorised the build ("You can go ahead"). **No schema or backup-format change; no stored record is rewritten.** The impact category is now shown only under More Details; removing it from the capture form, the Where → What → When capture flow (step 2) and moving candidate drafts into an experience's Expected Result plus a slimmer Home (step 3) are separate increments |
| DEC-037 | **UX redesign R2: guided capture (CP-UX2).** A new achievement is captured in three steps. **Where did this happen?** lists experiences most recent first (five, then "Show all"; search), plus "New experience" (name, type and role) and "Not part of an experience" (a role, or none). The experience chosen becomes the **primary experience** automatically. The achievement's **role comes from that experience**: when the experience spans several roles, the one whose dates contain the achievement date wins, else the most recent linked role. An edit that keeps the same choice keeps the stored role. **What happened?** asks for the title, what you did and the result, with context on demand. **When did it happen?** has Month/Year/Exact day, **skill chips** suggested from the experience's recorded achievements (never pre-ticked, with "Find another skill"), optional measured numbers and evidence, a Confidential switch, and More details (detailed actions, notes, other experiences). The **impact category is no longer asked for**; stored values are carried through and still shown under More Details. Editing shows the same three sections on one page. A draft saved before the When step gets no date. A metric or evidence row opened but left completely empty is not saved | Approved mockups CaptureWhere / CaptureWhat / CaptureWhen ("Overall it looks better"); user agreed recommendation C (impact category out of the form, data kept); step 2 authorised 2026-10-15 ("Yes, continue"). No schema or backup-format change. Departures from the mockups: nothing is pre-selected under Where (a choice is required, to avoid misattribution), suggested skills are not pre-ticked, and Back sits at the top of the step |
| DEC-038 | **Interaction feel and the record over time (CP-UX-Fluid).** (1) **Motion follows changes, not redraws:** press feedback on buttons, tabs, chips and rows; a sheet slides up only when it opens (redraws and switching from an achievement to its editor do not replay it) and a tap on the dimmed area while it rises does not close it; capture steps slide forward/back; tabs ease in, an experience pushes in and Back returns; bars grow when Home opens and move from their old height after a change; messages ease in. Reduce Motion turns all of it off. (2) **The recorded moment:** the save message names the experience (or role) and the skills the achievement now gives an example of, taken from the links just saved; a draft says what it still needs; the record glows where it appears. (3) **Tidy-ups:** "1 achievement" on Home; Skills search, Filters (Category, Show archived) and Add on one row; role headers put Current beside the title and break between parts. (4) **Home – Last 12 Months (amends DEC-035's "trends are not shown"):** one bar per month for recorded achievements by the month they *happened*, counts above, drafts/archived/undated excluded, year-only dates in a note; a month (tap, sideways slide or ‹ ›) lists in place of Recent. **Counts only — no targets, averages, streaks, comparisons or scores** | User review of the Strength OS / Wealth OS interaction work and the CareerProof proposal; user approved all four items on 2026-10-16 ("I would say build all 1-4"). Presentation only: no schema, backup-format or stored-record change. Month columns are narrower than 44px on phones (≈22px at 320px, ≥24px from ≈346px); 44px ‹ › buttons and a sideways slide are the precise alternatives. Playwright suites now run with Reduce Motion on; motion has its own tests |
| DEC-039 | **UX redesign R3: Slim Home & guarded plans → Expected Results (CP-UX3).** Home: one four-count row (Recorded, Draft, Experiences, Skills Shown), separate generated-export wording, Last 12 Months and Recent retained, expandable *Your Record* card for existing completeness/role breakdowns, three compact Quick Add buttons while global header + stays New Achievement. Draft detail explicitly offers conversion to a selected Experience's Expected Result: user-edited future-oriented text is appended without replacing `projects.objective`, Draft is archived without deleting links or evidence, single atomic revision-checked transaction and same-session guarded Undo. Duplicate prevention, 6,000-character limit, completed-Experience acknowledgement and no Confidential → Standard Private downgrade. Schema 3 / backup 3 unchanged, fifth Profile tab remains until Studio is functional. | User approved implementation on 2026-10-16 after viewing mockups and testing preceding increment. **In Review** on `feat/cp-ux3-home-expected-results`. Distinguish user authorization from physical UX301-S3–UX309-S3 acceptance. Step 3 includes deliberate in-place data changes, but no schema migration; v0.1.4 remains separate. |
| DEC-027 | Persistent per-feature milestone tracker (`docs/MILESTONE_TRACKER.md`) with lifecycle Not Started → Planned → In Development → In Review → Merged → Device Testing → Accepted | User instruction at the 2026-10-10 development handover. Updated in every PR; a feature is Accepted only after the user's physical-device confirmation. Module-level completion vocabulary in ROADMAP §5 remains |

## 3. Design artifacts and precedence

These files reconstruct the product decisions from extensive discussions, including the formal design gate's amendments:

- `docs/PRODUCT_SPEC.md`: CP-FDS-001 functional + CP-UX-001 experience requirements.
- `docs/DATA_ARCHITECTURE.md`: CP-DDS-001 target schema, migration and backup contract.
- `docs/CAREER_INTELLIGENCE.md`: CP-CIF-001 competency/evidence/job matching logic.
- `docs/ROADMAP.md`: CP-DRG-001 scope, module tracker, acceptance gates.
- `AGENTS.md`: implementation and PR policies.

Precedence in a conflict:
1. Explicit latest **user-approved** decision or change request.
2. Signed-off requirement amendments in the decision register.
3. Current relevant specification (proposed requirements).
4. Existing tests and shipped implementation (**only** as evidence of current state, not as an override of intended functionality).

Do not silently reconcile contradictions when they affect persistent data or user expectations; raise a short question. Update the relevant documents with the chosen resolution in the PR.

## 4. Key design review corrections (CP-DRG-001)

1. CV requires additional optional contact fields in profile.
2. Use precision-aware historical dates for new role/project/achievement records; v0.1.0 achievement `occurredOn` must migrate losslessly.
3. Generated documents/analyses require source ID/revision snapshots and explicit stale warnings, not automatic regeneration.
4. Proficiency is *self-assessed*, evidence breadth is a *record count/context measure*, neither is independent skill verification.
5. Relationship operations/deletion require explicit impact view and transactional integrity.
6. Job requirements are not only skills: qualifications, credentials, experience, and eligibility require distinct interpretation.
7. Successful 'Export generated' ≠ protected off-device backup; no encryption or cross-device sync yet.
8. v0.1.0 captures achievements; v0.1.2 qualifies complete P0 recovery/integrity.
9. Studio/Growth screens are introduced when functional, not displayed empty in v0.1.0.
10. GitHub Pages deploys compiled `dist/`, not the source HTML files from the root.

## 5. Known limitations and outstanding validation

**Current implementation limitations:**
- Per-browser/device IndexedDB; no cross-device sync.
- JSON backups are unencrypted.
- No employer/role/project relationships, built-in competency intelligence, reviews, CVs or job matching at v0.1.0.
- Browser storage is not durable in all failure scenarios; backups are necessary.
- Platform PNG and Apple touch assets now accompany SVG in CP-011A.1; installed-icon refresh still needs real-device verification.
- UI hotfix automated tests do not prove keyboard/iPhone interaction.

**Accepted baseline**: The user confirmed the original input/navigation fixes and subsequently all five CP-011A iPhone smoke checks on alpha.1. This does not automatically close the expanded recovery/quota/stale-tab matrix or the newly changed UI/device checks in CP-011A.1. See [the implementation brief](V0.1.1_IMPLEMENTATION_BRIEF.md) for migration and acceptance safeguards.

**For v0.1.1**: CP-011A migration/recovery contracts were approved and implemented. Continue extended recovery and device acceptance, then CP-011B–E relationship workflows and qualification. Use [CP-IMP-011](V0.1.1_IMPLEMENTATION_BRIEF.md) as the approved implementation planning brief, not evidence of completed work.

**Later open implementation choices** (do not block documentation PR):
- CP-011A resolves precision-date/migration contracts; later UI may add an explicit precision picker.
- CP-011A adds generic validated persistence; later contextual unlink/reassignment workflows must disclose dependencies. Parent deletion currently blocks safely.
- Final authoring and review of all 32 competency-specific behavioral rubrics (only three exemplars explicitly specified).
- Usability study of Quick Capture (<60s target), product adoption, pricing and willingness-to-pay validation.
- Future encryption/cloud synchronization/security controls; out of current P0/P1 scope.

## 6. First Codex onboarding task (read-only)

Use this prompt after the documentation PR is merged:

> Read AGENTS.md and all linked CareerProof documentation. Inspect the current code, schemas, tests, README and merged PR history. Compare planned requirements with **actually implemented** functionality. Report your understanding of the eight modules, approved P0/P1 scope, current state and next implementable milestone. Flag any contradictions, migration risks or missing acceptance evidence. The user confirmed the two original iPhone UI defects are corrected, but broader backup, offline and deletion UAT remains unverified. **Do not modify any files yet.** We will confirm your assessment before authorizing v0.1.1.

## 7. Future workflow

Plan/review here in ChatGPT; sync approved design decisions into GitHub docs; use Codex to implement/test on a branch and open PR; user reviews/merges; GitHub Actions deploys; then test on an actual device. [CP-IMP-011](V0.1.1_IMPLEMENTATION_BRIEF.md) is complete (v0.1.1 released); the next candidate is v0.1.2 in [ROADMAP.md](ROADMAP.md), pending authorization. Keep this status document, ROADMAP.md and [MILESTONE_TRACKER.md](MILESTONE_TRACKER.md) updated as part of each feature PR.

## 8. Privacy reminder

Repository is public. Specifications may describe engineering skills and generic supplier workflows, but **must not** contain real confidential employer blueprints, machine defects, vendor negotiation records, contracts, internal names/IDs, or personal career/finance data. Keep sample records fictional.


## 2026-10-09 — CP-011A.3 remaining iPhone keyboard defect

After merging CP-011A.2 / PR #6, the user reported the Outcome textarea is covered by the iOS keyboard and requires manual scrolling. **The keyboard visibility criterion did not pass**; compact navigation/date improvements are separate. CP-011A.3 (proposed alpha.4) corrects focused-field scroll scheduling and short-viewport handling with no schema change. See [CP-011A.3 report](IOS_KEYBOARD_OUTCOME_CP_011A_3.md). Physical iPhone validation remains required before authorizing CP-011B.


## CP-011B — Career history and qualifications under review

The user confirmed CP-011A.3 iPhone keyboard/Outcome visibility on alpha.4. CP-011B uses preexisting schema-v2 employer/role/education/credential stores, with mobile-first Career Profile entry forms and transactional primary-role updates; currently a draft feature PR, not deployed. Do not mark it accepted until CI and the user's iPhone UAT in [CP-011B report](CP_011B_HISTORY_QUALIFICATIONS.md) pass. CP-011C remains on hold.


## 2026-10-09 — CP-011B.1 compact Career Profile correction

The user's physical iPhone CP-011B check found that expanded employer biographies and long role responsibilities made it impossible to glance at the full employment timeline. The corrective alpha.6 PR clamps the descriptions to two lines, keeps titles, dates, employment types and primary-role badges immediately visible, and adds scoped **… More / Less** expansion. All original content and data contracts remain intact. Physical iPhone acceptance and CP-011B sign-off remain pending, so CP-011C is not authorized yet.


## 2026-10-09 — CP-011B.2 iPhone PWA update visibility

PR #10 (alpha.6) deployed successfully, but the user's installed iPhone Home Screen PWA continued running an older version for roughly 30 minutes while Safari showed alpha.6. The app had no controlled update notification, explicit service-worker update check or user-safe restart action. Proposed alpha.7 adds resume/check/restart controls, without automatic page reload, data migration, schema or backup changes. This PR remains subject to CI and physical iPhone verification. Do not uninstall the installed PWA to update it.


## CP-011C — Experience Portfolio awaiting merge and device acceptance

The user verified CP-011B education, certification, backup export and installed PWA operation on their iPhone and authorized CP-011C. Proposed alpha.8 adds a compact Portfolio screen under Profile plus desktop navigation, precise Project/Initiative/Ongoing Responsibility forms, transactional role-project links and project-context achievement capture. It must not create duplicate employer names or expose confidential company data. Schema 2 and backup 2 remain unchanged. User merge and CP-C201–209 acceptance must precede CP-011D.


## CP-011D — Expanded Achievement and Competency Linking in review

The user accepted CP-011C on the physical iPhone and explicitly authorized CP-011D. Proposed alpha.9 exposes optional advanced achievement fields, metrics and self-reported evidence, canonical role/project/competency links, a read-only built-in competency taxonomy and custom skill management, plus Vault relational/date filters. A transaction-safe bundle operation preserves existing source, metric and link identities and rejects invalid partial writes. No database schema or backup-format change, cloud sync, rating, job score, PDF export or tasks. Pending CI, user merge and CP-D201–209 iPhone checks; CP-011E remains paused.


## 2026-10-10 — CP-011D.1 iPhone Quick Capture layout regression

Following alpha.9 release, a physical iPhone screenshot demonstrated More details, experience & evidence overlapping the What did you do? field label. The original UI placed the optional disclosure before the contribution field and used stacking overrides inside the independently scrolling capture grid. Corrective alpha.10 moves the disclosure after Outcome, shortens its text, uses intrinsic row sizing rather than elevated paint layers, and checks field geometry before and after expansion at 320, 375, 390 and 430px in light/dark. No schema, backup or data changes; corrective PR must pass all CI and iPhone acceptance before CP-011D closes.


## 2026-10-10 — CP-011E release candidate, awaiting review

The user accepted the alpha.10 iPhone Quick Capture overlap fix and authorized CP-011E. The proposed `v0.1.1-rc.1` candidate adds full-data read-only backup round-trip verification in Settings and guards against ordinary edits made after a backup preview was selected (both dataset generation and revision must match). No schema or backup format change. Remaining alpha.9 feature UAT is consolidated into the final physical iPhone gate, not assumed complete. Candidate CI, user merge and native-device UAT are pending; **do not tag or call it final v0.1.1**. See [CP-011E](CP_011E_RELEASE_QUALIFICATION.md).


## 2026-10-10 — v0.1.1 final version promotion authorized (not yet merged)

The user explicitly confirmed that **all eight final iPhone acceptance checks passed** for the deployed `v0.1.1-rc.1` candidate, including retained records and exported backup, read-only integrity check, Career Profile/Experience associations, enriched achievement metrics/evidence, competencies/Vault filters, corrected native keyboard/Quick Capture layout, and offline reopening. The merged candidate passed **42/42 Node and 102/102 browser tests**. The user then authorized a **separate final `v0.1.1` promotion PR with no automatic merge**.

The release promotion changes only app/package version strings, service-worker cache key, exact-version test expectations, README and release/acceptance documentation. **Do not migrate or clear IndexedDB, change backup format 2, reset the installed Home Screen PWA, create a release tag, or claim final deployment before the user merges and GitHub Pages reports success.** Final build/Node/browser CI remains a mandatory gate. After deployment, confirm `v0.1.1` is shown on the existing PWA and retained records remain accessible.

The future planned `v0.1.2` reliability/dashboard improvements and `v0.1.3+` competency assessment/review/CV/job-fit capabilities are not included in the v0.1.1 release.


## 2026-10-10 — v0.1.1 final merged and deployed; development handover

PR #16 (final `v0.1.1` promotion) was merged by the user at 03:38 UTC. Main CI run 38021279551 built, passed 42/42 Node and 102/102 browser tests and deployed to GitHub Pages; the live service worker serves `careerproof-v0.1.1`. The local test suite reproduces the same 42 + 102 baseline at `398f892`. The earlier entry headed "authorized (not yet merged)" is superseded.

Still open and **not** to be assumed: (1) a short post-promotion iPhone smoke of the final version (Settings shows `v0.1.1`, existing records intact, no reinstall); (2) whether to create a `v0.1.1` Git tag/GitHub Release, which is a user decision; (3) E219 synthetic-only destructive restore and E220 public-data hygiene confirmation by the user (an automated scan of branch tips and history for personal/employer-identifying terms found nothing).

Development continues with a new agent under the same governance: branch + PR, no automatic merge or tag, synthetic fixtures only, physical iPhone acceptance before a milestone is marked Accepted. A persistent per-feature tracker is introduced (DEC-027). **Known spec/code divergence, unchanged:** DEC-015 names target destinations Home/Vault/Growth/Studio/Profile, while the shipped and accepted mobile bar is Home/Vault/Add/Profile/Settings; the shipped layout stays until a navigation redesign is separately approved.


## 2026-10-10 — PR #17 merged; CP-012.0 Experience text integrity hotfix (0.1.2-alpha.1)

PR #17 (docs reconciliation and milestone tracker) was merged by the user; main CI run 38024672956 built, tested and deployed successfully (docs only, unchanged `dist/`).

A post-merge review found a data-corrupting defect in the Experience Portfolio: its private HTML escape helper emitted `&#39` without a semicolon, so an apostrophe followed by digits was decoded as another character on display and written back to IndexedDB on an unchanged edit/save. Reproduced with synthetic data (`Line '24 upgrade` → `Line པ upgrade` stored). Hotfix: one shared `escapeHtml` for all templates, a static guard against local copies, and display/edit/save regression tests. Released as `0.1.2-alpha.1` because it is P0 integrity work (GATE-01); it does **not** start the rest of v0.1.2, which still awaits authorization. Already-damaged text cannot be repaired automatically without risking legitimate characters; the user checks affected Experiences (H103).


## 2026-10-10 — PR #18 merged; update, navigation and design decisions

PR #18 (CP-012.0 Experience text integrity hotfix, `0.1.2-alpha.1`) was merged by the user; main CI run 38027577090 built, tested and deployed; the live `sw.js` serves `careerproof-v0.1.2-alpha.1` (a non-cache-busted fetch about 10 minutes after deploy still returned the previous file, confirming GitHub Pages edge caching adds delay). The user reports entering only work history and education; H103 applies only if Experience Portfolio entries exist. Device checks H101/H102 remain open.

Decisions DEC-028 to DEC-031 recorded above. CP-012.1 (`0.1.2-alpha.2`) implements DEC-028; CP-012.2 (`0.1.2-alpha.3`) will implement DEC-029/030.


## 2026-10-10 — CP-012.2 navigation and design implementation (0.1.2-alpha.3)

Implements DEC-029/030 as decided by the user: tabs Home · Vault · Experience · Skills · Profile; ＋ and Settings in the header (gear on phones only; sidebar on wider screens); Wealth OS layout language with CareerProof navy/teal and the CP icon. Deviation from the 2026-10-10 mockup, by design: rows keep their existing tap-to-open behaviour instead of ⋯ menus, and career-record Edit/Delete buttons are unchanged in this release (moving Delete into the editor is a candidate follow-up). Input borders keep CareerProof's darker control line for WCAG 1.4.11 contrast rather than Wealth OS's light grey. Supersedes the accepted Home/Vault/Add/Profile/Settings bar once the user accepts A101–A106 on the iPhone.


## 2026-10-10 — alpha.3 accepted on iPhone; CP-012A Data Health (0.1.2-alpha.4)

PRs #19 and #20 were merged by the user and deployed (main CI runs 38032685213 and 38033308166, build/test/deploy successful; live `sw.js` `careerproof-v0.1.2-alpha.3`). The user reported **"All good"** for the six alpha.3 checks (update and restart, version and data intact, five-tab bar with header ＋/Settings, Home, Vault/Experience/Skills, Quick Capture with keyboard): A101–A106 accepted. Because the two releases deployed 10 minutes apart, the phone moved from alpha.1 directly to alpha.3 and showed the previous banner; the alpha.2 banner (U103–U104) is first observable at alpha.4.

CP-012A proceeds per DEC-031 with the defaults proposed to the user and not objected to: (1) the proposed critical/advisory list; (2) **no** "request persistent storage" button — persistence is reported only; (3) drafts shown as a plain count, no age threshold. Additional choices: export staleness threshold 14 days (as in Wealth OS); no persisted health results; completeness suggestions consider Recorded achievements only. Known limitation: a database that fails validation stops the app at the startup error screen, so such problems cannot reach the Settings report; improving that screen (for example, an emergency raw export) is a candidate for CP-012E.


## 2026-10-10 — alpha.4 accepted on iPhone; CP-012B controlled removal (0.1.2-alpha.5)

PR #21 was merged by the user and deployed (main CI run 38039174416; live `sw.js` `careerproof-v0.1.2-alpha.4`). The user reported **"All good"** for the alpha.4 checks: the new update banner (U103–U104) and Data Health DH101–DH104. Accepted.

CP-012B implements the roadmap's controlled unlink/reassignment with these choices (handover open question E.2, decided without further input under the user's instruction to proceed; changeable on request):
- **One review sheet for every career-record delete.** It shows dependents first, then offers *Move to another …* (compatible targets only; duplicate links merged; one primary experience per achievement) or *Remove the links*. Dependents require an explicit choice plus a confirmation tick; records without dependents delete from the sheet with one tap.
- **No cascades.** Achievements, metrics and evidence are never deleted by removal; only the chosen record is deleted, and dependents are re-pointed or lose the link.
- **Employers:** roles must move to another employer (they cannot exist without one); experiences may move or become independent.
- **Primary role:** removing it explicitly clears or moves `primaryRoleId`, replacing the earlier "clear the primary flag before deleting" step. The sheet states the consequence.
- **Custom skills:** *Delete…* added beside Archive; the sheet notes that Archive keeps history.
- **Single-target moves only** (no splitting dependents across several targets) to keep the flow simple; revisit if needed.
- **Atomicity:** the plan is recomputed inside the write transaction, the record revision is re-checked, and the full dataset is validated before commit.


## 2026-10-10 — PR #22 merged; CP-012.3 Title Case and employment order (0.1.2-alpha.6)

PR #22 (CP-012B controlled removal) was merged by the user and deployed (main CI run 38055825278; live `sw.js` `careerproof-v0.1.2-alpha.5`). RM101–RM105 have not been reported yet, so CP-012B is in Device Testing.

CP-012.3 implements DEC-032 (Title Case) and DEC-033 (most-recent-first employment) at the user's request. Root cause of the ordering report: `careerSections` sorted employers alphabetically by name while education was already sorted by date, which is why education behaved as expected.

**Open question OQ-034 — Achievement vs Experience (user decision pending).** The user asked whether separate Achievement and Experience entries are redundant. Evaluation given 2026-10-10: the *concepts* are distinct and both are used downstream (an achievement is one dated, claimable result carrying metrics, evidence and skill links, and is the unit for CV bullets, review periods and interview stories; an experience is the project, programme or standing responsibility that groups several results, and is the "work context" for evidence breadth in CAREER_INTELLIGENCE §4). The *forms* overlap heavily: Experience's name, responsibilities, outcome, objective/scope, dates, employer/role and confidentiality restate what its achievements already hold, so the same story can be typed twice and drift. Options presented: (A) keep as is; (B, recommended) slim Experience into a light container (name, type, employer/role, dates, status, short context), roll up linked achievements' outcomes on the card instead of a separate Outcome field, and allow creating an experience inline from the achievement form, with existing text kept and shown, never deleted, and no schema change; (C) B plus moving Experience into the Vault as a segmented view, freeing a tab; (D) remove Experience (not recommended: loses grouping and the breadth context and would need a lossy migration). No structural change is made until the user decides.


## 2026-10-11 — OQ-034 decided: Experience as a container (0.1.2-alpha.7)

The user chose option B ("Let's go with B"). Recorded as DEC-034 and implemented as CP-012.4 on a branch stacked on PR #23, which was still open; #23 should be merged first.

Implementation choices beyond the option text, open to change: Technologies and Confidentiality stay on the experience form (technologies is not duplicated by achievements; confidentiality is a privacy control); an inline experience starts Active and Confidential with no dates; it takes its employer and a role link from the achievement's role at save time; the roll-up counts every linked achievement including archived ones (listed last and tagged). Experience cards still sort by last edited.


## 2026-10-11 — alpha.5–alpha.7 accepted on iPhone; QA-023 CI diagnostics

PR #23 merged (main CI run 38097710416 ✓, deployed alpha.6). PR #24 merged; its main CI run 38098062177 failed once in Build and test, so the deploy was skipped and alpha.6 stayed live. The merged tree was identical to the PR head that had passed, three full local runs and a stress run of the new specs passed, and the job log could not be downloaded from the agent environment (blocked host), so the failing test is unidentified (QA-023). The user re-ran the job; attempt 2 passed and deployed alpha.7 (verified live `sw.js`).

The user then reported all 14 combined device checks passing: RM101–RM105 (alpha.5), T101–T104 (alpha.6) and X101–X105 (alpha.7). Those rows are Accepted.

QA-023 mitigation (PR #25, CI configuration only, no app change): Playwright retries a failed test once in CI and adds the GitHub reporter, so failures and flaky tests appear as check annotations that can be read through the API. Local runs never retry. Trade-off: a retry can hide a truly intermittent defect, so flaky annotations are reviewed on every run and a repeating test is fixed rather than tolerated.


## 2026-10-11 — CP-012C Home dashboard (0.1.2-alpha.8)

Authorized by the user ("Yes proceed"). Implemented as DEC-035 on a branch stacked on PR #25. The completeness rules were split out of `assessDataHealth` into `completenessIssues`, so Home and Data Health share one implementation and stay consistent (a Node test checks parity). Expanded cards on any screen now persist through re-renders through one `data-keep-open` mechanism, which replaces the separate Experience and Skills handling. Known limitation: no trends or period views yet (later M08).


## 2026-10-11 — alpha.8 accepted; CP-012D.1 keyboard and large-history performance

User confirmed all five installed-iPhone tests D101–D105 passed for v0.1.2-alpha.8. PR #26 is merged (main SHA `d19e9a2`). This is CP-012C acceptance, not v0.1.2 final qualification.

The next authorized milestone is CP-012D accessibility/performance. Initial code audit found existing modal focus, touch-target, light/dark contrast and reduced-motion test coverage; the Settings appearance radiogroup nevertheless lacked arrow-key navigation and single roving Tab stop. The Home role-coverage algorithm also re-filtered achievement and relationship arrays for each role. The bounded alpha.9 candidate CP-012D.1 remedies both through targeted code/tests and an 800-role / 8,000-achievement synthetic fixture, without schema or backup changes. Physical iPhone checks AD101–AD105 are still required. Remaining CP-012D audit scope and CP-012E recovery certification stay open. No full WCAG certification claimed.


## 2026-10-11 — CP-012D.1 accepted; CP-012D.2 accessibility closeout candidate

PR #27 merged (`d8ee1be`), user reported all AD101–AD105 physical iPhone checks passed. No claim of separate external-keyboard hardware test: AD103 was conditional; keyboard semantics were covered in Playwright. Alpha.9 accessibility/performance slice accepted.

Remaining CP-012D.2 (alpha.10 candidate): ensure validation failures move keyboard/screen-reader focus to a visible role=alert summary without opening an iOS keyboard; respect Reduce Motion; include textarea accessible names/touch geometry in existing full responsive layout audit; add focused browser regression. No schema, privacy, data or backup changes. AE101–AE105 required on iPhone after PR CI, merge and deploy. Completion of this planned hardening milestone does not certify WCAG 2.2 AA or device performance across all hardware. CP-012E recovery/migration certification remains the last separate P0 qualification gate.


## 2026-10-11 — CP-012D accepted with AE105 exception; CP-012E authorized

User reported alpha.10 AE101–AE104 passed on physical iPhone; AE105 Reduce Motion N/A/not tested and explicitly waived. Automated reduced-motion tests exist; physical verification is not claimed. PR #28 merged at `a0d27ec`; CP-012D planned hardening is accepted with this exception, not WCAG-certified.

CP-012E is the remaining v0.1.2 P0 gate. E219 destructive recovery uses only isolated synthetic fake-indexeddb, never real PWA data. Test all P0 stores, preferences, links, confidentiality, stale generations and cold reopen. iPhone RE101–RE105 are non-destructive, exporting a secure backup and canceling restore preview. E220 public-repo hygiene needs confirmation. Final promotion requires separate user-reviewed PR.


## 2026-10-11 — CP-012E accepted; v0.1.2 final promotion candidate authorized

User reported six of six alpha.11 CP-012E acceptance outcomes as passed: RE101 installed-update preservation, RE102 read-only data health, RE103 external JSON backup present and securely kept, RE104 linked career records retained, RE105 restore preview inspected then **cancelled**, and E220 public-repository privacy confirmation. These are user-reported manual checks, not fabricated independent device observations. PR #29 merged at `3b9905c`; latest PR-head CI run [38113988112](https://github.com/YabaCodes/careerproof-os/actions/runs/38113988112) succeeded. E219 synthetic-only destructive recovery, cold-reopen data equivalence, format-1/format-2 upgrade, failed-input and stale-preview tests are included. AE105 from CP-012D remains not tested on iPhone and explicitly waived, with automated reduced-motion coverage. No full WCAG certification is claimed.

**Decision:** All v0.1.2 alpha.11 qualification gates met; prepare a separate version-only final promotion PR with no automatic merge, schema change, backup format change or IndexedDB reset. After a successful promotion-PR CI run, require user manual merge, GitHub Pages deployment, and non-destructive installed-iPhone smoke F201–F204. Do not tag/publish a GitHub Release without separate user approval. The immediately following user workflow is privately backfilling four-plus years of professional roles, Experiences, achievements and related evidence, without putting confidential records in the public repo.



### CP-013B (2026-10-12) — Candidate, awaiting CI and device testing
- Use schema 3 and full private backup format 3 to preserve append-only self-assessed proficiency histories. Keep format-1 and format-2 import compatibility with clearly destructive preview.
- Preserve old schema-2 dataset metadata through additive upgrade; no default skill rating, no inference from Evidence Breadth.
- Use original generic rubric v1.0 until distinct skill-specific rubrics are actually developed and reviewed. User records a calendar-day assessment, optional rationale/context/development note.
- Historical assessment entries are immutable; archive a custom competency with history rather than deleting or silently reassigning it.
- No merge/deploy or release acceptance until CI and PA101–PA106 physical-iPhone checks pass.

## 2026-10-15 — CP-UX1 step 1: reading and scanning (0.1.3-alpha.3)

The user reported that the app felt cluttered and that recording was not intuitive, and shared a private backup for review. The backup was analysed only in a private scratch area; it is not in the repository, tests or PR. Findings: the Experience tab listed long cards with repeated text, the achievement detail showed every field at once, the Vault mixed drafts with recorded work, and the date field asked for an exact day that the user often did not know (several real achievements were drafts only because they had no date). Several drafts were planned results ("candidates") rather than achievements.

The user agreed to: A, a role-grouped Experience timeline with a page per experience; B, planned results become an experience's Expected Result; C, the impact category leaves the form and lists while its data is kept; D, mockups first. Mockups (synthetic data) were approved. Recorded as **DEC-036**, built in three steps. Step 1 (this PR) covers the reading screens, the date control, Profile tap-to-edit and the #33 follow-ups:

- **#33 follow-ups:** an assessment date in the future is refused (a future date would stay "current" indefinitely); assessment dates are formatted like every other date; a skill with assessment history says it can be archived but not deleted, instead of offering a Delete that would be refused.
- **Data:** none of the user's records need conversion. `scope` is shown as Context, `objective` as Goal / Expected Result, `outcome` as Result, `contribution` as What I Did, `situation` as Context; detailed actions, notes and impact category are under More Details.
- **Not in step 1:** the guided capture flow, removing the impact category from the form, automatic primary experience, moving candidate drafts to Expected Result, and the slimmer Home. Achievements by Role on Home now counts recorded achievements and drafts separately to match the rest of the app.

## 2026-10-15 — CP-UX1 accepted; CP-UX2 guided capture (0.1.3-alpha.4)

PR #34 (CP-UX1) was merged by the user. Main CI run 38693021202 built, tested and deployed `3fd7cb4`. The user reported **UX101–UX109 all passed** on iPhone ("All good").

Step 2 (DEC-037) replaces the single long capture form with the approved Where → What → When flow. It also implements recommendation C: the impact category is no longer asked for, and existing values stay in the data. The role is now derived from the chosen experience and the achievement date. This matters while the user backfills several years of history across experiences that span more than one role.
- **Not in step 2:** moving candidate drafts to an experience's Expected Result, and the slimmer Home (step 3).
- **Known limitation:** the old rich-panel styles remain in `styles.css`, unused, for a later clean-up.

## 2026-10-16 — CP-UX-Fluid: feel, recorded moment and record timeline (0.1.3-alpha.6)

After the Strength OS (v2.18–v2.19) and Wealth OS (v1.16–v1.17) interaction work, the user asked for the same treatment in CareerProof. A review of the deployed alpha.5 at 320/390px light and dark (synthetic records only) found: no press feedback or motion anywhere; a save message that said only "Achievement saved."; "1 achievements" on Home; a Skills search/filter panel taller than the list it filters; role headers that wrapped "1 / experience" and pushed the Current pill into the details column; and no view of *when* the record's achievements happened. The user approved all four proposed items. Recorded as **DEC-038**.

- **Approved intent vs. earlier decisions:** DEC-035 said Home shows no trends, targets or streaks. Last 12 Months amends only the "trends" part: it is a factual count by month, with no target line, average, streak, comparison or score, and it is hidden when nothing can be shown. Step 3 of DEC-036 (candidate drafts → Expected Result, slimmer Home) is unchanged and still separate; the timeline's month list reuses the Recent slot so Home grows by one card only.
- **Data:** none. The timeline, messages and highlights are derived from existing records at render time.
- **Testing:** suites run with Reduce Motion on (Playwright `contextOptions`), so geometry checks measure finished layouts; `ux-fluid.spec` turns motion back on and logs animations to prove they follow changes and not redraws. Physical-iPhone feel cannot be proven by automation: UX401–UX408.
- **Known limitations:** month columns narrower than 44px on phones (alternatives above); sheets do not animate on close; long lists do not animate their rows.

