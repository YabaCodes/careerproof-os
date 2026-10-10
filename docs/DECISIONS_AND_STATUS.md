# CP-DRG-001 — Design Decisions, Actual Status and Codex Handover

**Last reviewed:** 2026-10-10. **Owner approval:** Product design and P0/P1 scope approved in the CareerProof planning conversation. **This document is the starting handover record, not an assertion that planned functionality has shipped.**

## 1. Current truth: repository and release state

### Verified current state (2026-10-10)

- `main` = `398f892974f3fab037656d8bc1d923df461c6397` (merge of PR #16). App **`v0.1.1`**, DB schema **2**, backup format **2** (legacy format 1 importable), taxonomy **1.0**, 12 P0 stores plus `meta`.
- PR #16 final promotion merged by the user; main CI run 38021279551 built, passed 42/42 Node and 102/102 browser tests, and deployed to GitHub Pages. Live service worker cache is `careerproof-v0.1.1`.
- Physical iPhone: the eight `v0.1.1-rc.1` checks were accepted by the user. A post-promotion smoke of the final `v0.1.1` is **not yet reported**. No Git tag/GitHub Release exists.
- No open PRs at handover. Next roadmap candidate: **v0.1.2** (P0 reliability), not started and awaiting explicit authorization.
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
