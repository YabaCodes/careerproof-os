# CP-DRG-001 — CareerProof Release Roadmap, Traceability and Acceptance Gates

**Status:** Approved scope-based implementation plan. **Date:** 2026-10-09. No promised release dates.

## 1. Release policy and priorities

- **P0**: reliable individual career database, profile/employers/roles/qualifications, projects/experience, achievement capture and evidence links, competency taxonomy, search and privacy-aware local backup/restore. Full P0 qualification planned for v0.1.2.
- **P1**: four bounded enhancements within first development cycle: (1) rubric-based **self-assessed proficiency + separate evidence breadth**, (2) performance reviews, (3) CV generation, (4) pasted job-description comparison. Deliver sequentially, without AI dependence.
- **Later**: comprehensive career roadmap, advanced analytics, AI interpretation, interview coaching, cloud accounts/sync, subscriptions and live job APIs.

First-cycle end state: **record work once → link competencies → assess recorded evidence → create an editable review or CV → compare evidence with a job description**.

The first builds are useful but **not certified for irreplaceable data** until P0 recovery and migration tests are completed. No scope expansion may bypass integrity gates.

## 2. Development milestones

| Release | Deliverable | Exit criterion |
|---|---|---|
| v0.1.0 | Basic Profile, Quick Capture, Achievement Vault, IndexedDB, initial backup/import, mobile PWA | Save, reload, edit and restore an achievement; post-hotfix iPhone UAT must pass |
| v0.1.1 | Employer/role history, education/credentials, Experience Portfolio, expanded achievement details/evidence, competency taxonomy and links, search/filter refinements | Linked core records create/edit/delete consistently; **v1 migration preserves existing records** |
| v0.1.2 | Reliable full backup/validated restore, Data Health Check, controlled deletes, schema migration tests, dashboard and responsive/accessibility hardening | All P0 acceptance and destructive/recovery tests pass |
| v0.1.3 | Rubric-based proficiency history, distinct evidence breadth and explanations | All CIF proficiency/breadth test fixtures pass |
| v0.1.4 | Performance Review Studio: period/role and evidence selection, editable draft, source links, PDF export. **Also the CV Builder** (pulled forward from v0.1.5 by user request, DEC-040) and the Studio tab | Source-linked accurate editable review and CV with no re-entry; in review as `0.1.4-alpha.1` |
| v0.1.5 | ~~CV Builder~~ delivered with v0.1.4 (DEC-040); scope to be re-planned (e.g. Studio refinements from device testing) | To be agreed |
| v0.1.6 | Job Fit Analyzer: paste description, parse/classify, map, inspect sources and edit overrides | Transparent requirement matrix; explicit unknowns and qualifications |
| v0.1.7 | Cross-module integration, regression, migration compatibility, privacy, UX and release checks | No critical data loss, confidentiality or relationship defects; P0/P1 acceptance passed |

**v0.1.1 release acceptance (2026-10-10):** The user merged PRs #4–#15, completed CP-011A–E, accepted the targeted native iPhone fixes, and explicitly reported all **eight final physical iPhone checks** for `v0.1.1-rc.1` as passing. The accepted candidate passed **42 Node + 102 browser tests** and deployed through GitHub Pages. The separate version-only `v0.1.1` final promotion was **merged by the user in [PR #16](https://github.com/YabaCodes/careerproof-os/pull/16)** (`398f892`) and **deployed** by main CI run 38021279551 (42 Node + 102 browser passed). No schema 2 or backup format 2 changes. Outstanding: a short post-promotion iPhone smoke check of the final version, and no release tag exists (user decision). [CP-011E release qualification](CP_011E_RELEASE_QUALIFICATION.md).

**2026-10-11 v0.1.2 final-promotion readiness:** PR #29 CP-012E alpha.11 merged at `3b9905c`, with [successful PR-head build/test CI run 38113988112](https://github.com/YabaCodes/careerproof-os/actions/runs/38113988112). Synthetic-only destructive recovery E219 and upgrade/migration/rollback regressions verified; the user explicitly reported RE101–RE105 and E220 all passed on physical iPhone / public-repository privacy confirmation. CP-012D was accepted with AE105 Reduce Motion not tested (waived). All required alpha.11 gates are complete, and a **separate version-only final promotion PR** is eligible for user review. `v0.1.2` is **not yet shipped** until PR CI, user merge, Pages deployment and final installed-iPhone F201–F204 smoke checks pass. No schema 2 or backup format 2 change is authorized.

**2026-10-11 CP-012E checkpoint:** User accepted CP-012D alpha.10 after AE101–AE104 passed and waived AE105 (not tested; automated Reduce Motion coverage). CP-012E alpha.11 is a certification candidate: synthetic E219 destructive restore/cold-reopen and v1→v2 migration, invalid import/stale-preview protection, full existing recovery suite, non-destructive iPhone RE101–RE105 and E220 public-repo hygiene confirmation. No personal data restore or public fixture permitted. Final v0.1.2 promotion is a separate PR.

**2026-10-11 CP-012D checkpoint:** alpha.9 CP-012D.1 (#27) merged and user reported AD101–AD105 passed. Alpha.10 CP-012D.2 is a review candidate for keyboard/screen-reader validation-error focus and broader textarea/viewport audit, with AE101–AE105 still pending. If automated CI, review, deployment and device gates pass, CP-012D can be marked accepted with documented limitations (no formal WCAG certification or hardware performance certification). CP-012E recovery certification remains mandatory before final v0.1.2.

**2026-10-11 progress checkpoint:** v0.1.2-alpha.8 CP-012C (Home dashboard) was merged through PR #26 and the user passed physical-iPhone tests D101–D105. The alpha.9 CP-012D.1 candidate addresses theme-radio keyboard semantics and single-pass role-summary aggregation, with large synthetic fixtures. This does not complete CP-012D, the WCAG accessibility target, or CP-012E recovery/upgrade certification. The approved release sequence remains unchanged.

**Release boundary:** v0.1.1 provides the original professional-record foundation. v0.1.2's P0 Data Health, controlled removal, dashboard, accessibility and recovery scope has been implemented and qualified at alpha.11; only final promotion/installed-iPhone smoke remain. Career proficiency, CV, performance review and job-fit functionality is excluded until separately authorized. The later career studios, evidence/proficiency assessment and job-fit tools are not part of this release.

**2026-10-20 CP-STU checkpoint:** `0.1.4-alpha.1` (DEC-040) is In Review: Studio tab (Profile from the header initials, Settings inside Profile), Performance Review and CV Builder as editable source-linked snapshots with user-controlled outdated alerts, Confidential records left out by default, on-device PDF, schema 4 and backup format 4. Physical gate STU-01–STU-09.

**2026-10-12 CP-013A checkpoint:** Read-only evidence breadth implementation proposed as v0.1.3-alpha.1. Full 0.1.3 remains incomplete until separate L1–L4 proficiency persistence, history, migration and restoration gates are implemented and accepted.

**2026-10-16 CP-UX-Fluid candidate (DEC-038, `0.1.3-alpha.6`):** A user-approved polish increment to existing P0 modules, not new P0/P1 scope: motion and touch feedback (off with Reduce Motion), a recorded moment after capture, tidy-ups (Home count wording, a one-row Skills toolbar, role headers) and Home's **Last 12 Months** — recorded achievements by the month they happened, counts only. It amends DEC-035 for that one factual trend view; targets, streaks, averages and scores remain out of scope. DEC-036 step 3 is unchanged. No schema or backup change.

**2026-10-15 CP-UX2 candidate (DEC-037):** Step 1 (`0.1.3-alpha.3`, PR #34) is merged and accepted (UX101–UX109). Step 2 (`0.1.3-alpha.4`, guided capture) is in review. Step 3 follows. No schema or backup change.

**2026-10-15 CP-UX1 (DEC-036):** After reviewing the user's own records, the user approved a three-step UX redesign of existing P0 modules. This is not new P0/P1 scope.
- **Step 1, `0.1.3-alpha.3`, in review:** reading and scanning. That covers the Experience timeline and pages, the achievement story, Vault segments and years, Month/Year/Exact-day dates, and Profile tap-to-edit. It also carries the #33 follow-ups.
- **Step 2:** guided capture.
- **Step 3:** candidates → Expected Result, and a slimmer Home.

No schema or backup change. CP-013B (#33) is merged and deployed, with PA101–PA106 not yet reported.

**2026-10-12 CP-013B candidate:** The next increment implements explicit L1–L4 self-assessment history and related schema-3 / backup-format-3 recovery. This is **not yet merged or accepted**. The CP-013A evidence-breadth alpha.1 increment is user-accepted with EB103 manual coverage outstanding. v0.1.3 full release qualification remains separate.

## 3. Requirements traceability

| Functional ID | Capability | Main UI | Stores / services | Acceptance |
|---|---|---|---|---|
| CP-FR-001 | Career Profile and roles | CP-05 | profiles/employers/roles | UAT-02 |
| CP-FR-002 | Education and credentials | CP-05 | education/credentials | UAT-02A |
| CP-FR-003 | Projects and initiatives | CP-06 | projects/recordLinks | UAT-03 |
| CP-FR-004 | Quick Capture | CP-02 | achievements | UAT-04 |
| CP-FR-005 | Vault, metrics and references | CP-03/04 | achievements/impactMetrics/evidenceReferences | UAT-05/06 |
| CP-FR-006 | Competency mapping | CP-07 | competencyCategories/competencies/recordLinks | UAT-07 |
| CP-FR-007 | Backup and restore | CP-08 | all stores + validation | UAT-09/11 |
| CP-FR-008 | Data integrity health | CP-08 | all stores | INT-01..06 |
| CP-FR-009 | Self-assessed proficiency | CP-09 | proficiencyAssessments | CIF-01/08 |
| CP-FR-010 | Evidence breadth | CP-09 | achievements/recordLinks | CIF-02..07 |
| CP-FR-011 | Performance reviews | CP-10 | careerDocuments/documentSources | STU-01..04 |
| CP-FR-012 | CV builder | CP-11 | careerDocuments/documentSources + profile | STU-05..09 |
| CP-FR-013 | Job Fit Analyzer | CP-12 | jobAnalyses/jobRequirements | CIF-09..15 |
| CP-FR-014 | Dashboard and record completeness | CP-01 | derived local views | UAT-01/04 |
| CP-FR-015 | Offline responsive PWA | All | app shell/service worker | UAT-10/12 |

### Manual checks specifically for v0.1.0 hotfix

1. Open New Achievement and tap title, contribution textarea, date, category dropdown and outcome: **dialog stays open**, keyboard/input works.
2. Open Settings; tap theme dropdown, backup buttons and settings entries: dialog stays open unless explicitly dismissed.
3. Tap only dim backdrop: dismiss, subject to unsaved-change prompt; tap Cancel/Close: expected behavior.
4. Mobile bottom nav icons and labels have equal positions; center '+' does not visually raise/displace items, at both 375px and narrow widths.
5. Save achievement; reload; search, edit, archive, restore, delete; confirm data preservation.
6. Export valid backup; modify demo data; preview/restore; reject malformed JSON without losing data.
7. Open installed PWA offline after initial cache; confirm no missing actionRouting module.

The merged hotfix added automated regression tests; **iPhone input and nav alignment were subsequently confirmed by the user**. The other v0.1.0 manual scenarios are not automatically passed.

## 4. Multi-level quality gates

| Gate | Verification |
|---|---|
| GATE-01 Data Integrity | Record types/IDs, relationships, atomic writes, deletions, concurrency |
| GATE-02 Data Recovery | Backup round-trip, corrupt input rollback, schema migrations |
| GATE-03 Career Intelligence | Explainable assessment and matching deterministic fixtures |
| GATE-04 Document Accuracy | Source ID/revision traceability, user edits, PDF output, outdated snapshots |
| GATE-05 Privacy | Confidential data exclusions, safe inputs, no public employer records |
| GATE-06 UX & Accessibility | Phone/tablet/desktop, focus, keyboard, labels, no overlap |
| GATE-07 PWA Reliability | Install, offline launch, cache upgrade, new deployments |

Automated tests must use synthetic data, and manual browser/device tests are tracked separately. Release criterion for v0.1.7: 100% of agreed deterministic fixtures pass, zero unresolved critical privacy/integrity/recovery defects. Accessibility target is WCAG 2.2 AA verified by actual test evidence; do not assume compliance.

## 5. Eight-module completion tracker (update on each implementation PR)

Module-level summary below; per-feature lifecycle status is in [MILESTONE_TRACKER.md](MILESTONE_TRACKER.md).

| Module | Current repository evidence | Next planned development |
|---|---|---|
| M01 Profile | Core Complete: employer/role history, promotions, education and credentials; compact timeline and iPhone acceptance passed | Additional improvements after v0.1.1 |
| M02 Vault | Core Complete for v0.1.1: quick/advanced capture, impact metrics, user-provided evidence, atomic project/skill links, advanced filters, full local recovery; candidate UAT passed | Extended reporting and deletion controls v0.1.2 |
| M03 Experience Portfolio | Core Complete for v0.1.1: projects, initiatives and responsibilities with role/achievement associations; user accepted on iPhone. Own **Experience** tab from 0.1.2-alpha.3 | Container model (DEC-034, 0.1.2-alpha.7): short context, outcome roll-up from linked achievements. CP-UX1 (DEC-036, 0.1.3-alpha.3, in review): role-grouped timeline, a page per experience, Goal / Expected Result, inline creation from the achievement form |
| M04 Competency Intelligence | Partial: core v0.1.1 taxonomy and linked examples, custom skill create/edit/archive/restore accepted; own **Skills** tab with a with-examples view from 0.1.2-alpha.3; no user-assessed proficiency or evidence-breadth ratings | Assessments and evidence breadth v0.1.3 |
| M05 Career Roadmap | Deferred | Later release |
| M06 Performance & Promotion Studio | Partial (in review, 0.1.4-alpha.1): source-linked Performance Review with editable snapshot, outdated alerts, confidential exclusion and on-device PDF (DEC-040) | iPhone STU gate; promotion cases later |
| M07 Job Readiness & Interview Studio | Partial (in review, 0.1.4-alpha.1): CV Builder with two ATS-friendly templates, versions and PDF (DEC-040) | Job fit v0.1.6; interviews later |
| M08 Career Analytics & Insights | Foundation: basic dashboard and metadata, stable compact navigation and offline update controls; from 0.1.2-alpha.8 Home adds Complete Your Record and Achievements by Role (DEC-035); 0.1.3-alpha.6 (in review) adds Last 12 Months, a count of recorded achievements by the month they happened (DEC-038) | Advanced analytics later; no targets, streaks or scores |

**v0.1.1 delivery history:** CP-011A (PR #4, alpha.1) → A.1–A.3 UI/iOS corrections (PRs #5–#8) → CP-011B with B.1/B.2 (PRs #9–#11) → CP-011C (PR #12) → CP-011D with D.1 (PRs #13–#14) → CP-011E rc.1 (PR #15) → final promotion (PR #16). All merged by the user. Per-feature status, PRs, test baselines and device-acceptance evidence are in the [milestone tracker](MILESTONE_TRACKER.md), which is the authoritative progress record and must be updated in every PR.

**Module status vocabulary**: Not started / Foundation / Partial / Core Complete / Expanded / Deferred. Actual state follows merged code and acceptance evidence, not roadmap estimates.

## 6. Contribution workflow: ChatGPT → Codex → GitHub

1. Product discussions and change decisions happen in ChatGPT, then this repository's specifications/decision log are updated so agents can rely on a durable source of truth.
2. Codex reads `AGENTS.md` plus appropriate docs **before** touching files; inspects current code and PR history.
3. For each version, implement a small, self-contained change on a **separate branch**.
4. Run `npm test` (includes build) and relevant focused tests; state limitations of simulated tests.
5. Create PR against `main` describing scope, user-facing behavior, migrations/backups, tests, remaining manual UAT and affected modules.
6. **User reviews and merges**. GitHub Actions then deploys to Pages. No agent auto-merge without explicit instruction.
7. Update docs/RELEASE_NOTES.md, acceptance test plan, app version, module tracker and decision log in the PR.
8. Validate on actual iPhone before advancing, especially modal/navigation bugs and local persistence.

Keep implementation independent from a particular chat thread. If specs and code conflict, inspect the last accepted PR, the user-approved decisions and current tests, then raise discrepancies instead of guessing.

## 7. Risks and mitigation

| Risk | Control |
|---|---|
| Local data eviction/loss | Export/restore first; deliberate recovery testing; no misleading 'backed up' claims |
| Schema breakage | Migration from real v1 shape; independent export version and compatibility tests |
| Overcomplex capture | Minimal title/contribution, optional rich evidence later |
| Unjustified career scoring | Separate self-assessment/evidence breadth; transparent job matrix |
| Generic or inaccurate CV | Editable source-linked outputs; no made-up metrics |
| Confidentiality leakage | Default external-output exclusion including derived text |
| Too-large P1 scope | Bounded release increments, no AI dependency |
| Recurrent iOS dialog/layout bug | Event routing regression tests + real-device UAT |
