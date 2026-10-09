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
| v0.1.4 | Performance Review Studio: period/role and evidence selection, editable draft, source links, PDF export | Source-linked accurate editable review with no re-entry |
| v0.1.5 | CV Builder: contact data, two templates, select/order/edit, save variants, PDF | Accurate editable CV exported without changing source |
| v0.1.6 | Job Fit Analyzer: paste description, parse/classify, map, inspect sources and edit overrides | Transparent requirement matrix; explicit unknowns and qualifications |
| v0.1.7 | Cross-module integration, regression, migration compatibility, privacy, UX and release checks | No critical data loss, confidentiality or relationship defects; P0/P1 acceptance passed |

**No new feature until v0.1.0 is manually verified after merged PR #1**. Read DECISIONS_AND_STATUS.md for the most recent status.

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

The merged hotfix added automated regression tests, **but iPhone manual results are still pending**; don't assert success without user verification.

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

| Module | Current repository evidence | Next planned development |
|---|---|---|
| M01 Profile | v0.1.0 basic identity/contact | Multi-role, employer, education/credentials in v0.1.1 |
| M02 Vault | v0.1.0 capture/view/edit/filter/archive and initial backups; PR #1 modal fix merged | Metrics, references, project and competency links v0.1.1 |
| M03 Experience Portfolio | Not shipped | v0.1.1 |
| M04 Competency Intelligence | Not shipped | Taxonomy/tagging v0.1.1; assessments v0.1.3 |
| M05 Career Roadmap | Planned only | Later release |
| M06 Performance & Promotion Studio | Not shipped | Reviews v0.1.4; full promotion features later |
| M07 Job Readiness & Interview Studio | Not shipped | CV v0.1.5, job fit v0.1.6; interviews later |
| M08 Career Analytics & Insights | v0.1.0 basic achievement dashboard only | Expanded P0 dashboard v0.1.2; advanced later |

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
