# CareerProof OS — Milestone Tracker

**Document ID:** CP-TRK-001 (DEC-027) · **Last updated:** 2026-10-16 · **Physically accepted increments:** `0.1.3-alpha.4` CP-UX2 guided capture (retrospective UX201–UX207 PASS on alpha.5) and `0.1.3-alpha.5` CP-UX-Links (UX301–UX307 PASS) · **Separate pending gate:** CP-013B PA101–PA106

This is the authoritative per-feature progress record. It is updated in **every** PR. Module-level completion stages remain in [ROADMAP.md §5](ROADMAP.md); scope and acceptance criteria are defined in [ROADMAP.md](ROADMAP.md), [PRODUCT_SPEC.md](PRODUCT_SPEC.md), [DATA_ARCHITECTURE.md](DATA_ARCHITECTURE.md) and [CAREER_INTELLIGENCE.md](CAREER_INTELLIGENCE.md).

**2026-10-16 CP-UX-Links accepted (`v0.1.3-alpha.5`):** Existing related Experience, Role and Skill associations are tappable in the achievement story and experience page. Skills continue linking to supporting achievements. The exact skill, even when archived, expands on navigation. PR #36 merged; PR #37 subsequently merged to repair stale Playwright version expectations after the first build/test run failed. [Post-repair `main` build, tests and Pages deployment succeeded (run 38751956798)](https://github.com/YabaCodes/careerproof-os/actions/runs/38751956798). The user reported **UX301–UX307 all PASS on a physical iPhone on 2026-10-16**. No application model, scoring, IndexedDB schema or backup-format changes were made by this navigation increment. **This accepts CP-UX-Links only, not the whole v0.1.3 release**. CP-UX2 alpha.4 was merged in PR #35; **UX201–UX207 have subsequently passed retrospectively on alpha.5 (2026-10-16)**. CP-013B PA101–PA106 remain unreported.

### CP-UX-Links — Physical iPhone Gate (UX301–UX307)

| ID | Acceptance | Physical iPhone result (user-reported 2026-10-16) |
|---|---|---|
| UX301 | Linked Experience and Role buttons appear in achievement details; original story reading order remains intact | **PASS** |
| UX302 | Experience opens the correct page, Back returns, records/relationships unchanged | **PASS** |
| UX303 | Achievement → Skills opens the exact expanded skill, with existing evidence/proficiency kept distinct | **PASS** |
| UX304 | Experience → Skills → linked achievement works, including when multiple experiences share a skill | **PASS** |
| UX305 | Other linked experiences live under More Details; each opens accurately | **PASS** |
| UX306 | Missing links are not invented; archived skill links remain inspectable but do not alter archived status | **PASS** — Part A (unlinked record) and Part B (archived linked skill) |
| UX307 | 320–390px, touch/focus, dark/light, Reduce Motion, offline reopen and record/backup retention | **PASS** — layout, light/dark and Reduce Motion, offline reopening, record/data-health/backup integrity |

**Scope of evidence:** UX307 was performed on the user's actual iPhone, not on separate physical devices at every 320–390px viewport width. Responsive-width automated browser tests supplement the device result. The user did not report a destructive restore or changes to personal records. All seven results are accepted as user-reported; no full v0.1.3 release certification or general WCAG claim is implied.

### CP-UX2 — Retrospective Physical iPhone Gate (UX201–UX207)

**2026-10-16: UX201–UX207 all PASS, reported individually by the user on the installed `v0.1.3-alpha.5` build.** The CP-UX2 guided-capture code was merged in [PR #35](https://github.com/YabaCodes/careerproof-os/pull/35); subsequent `main` build/test/Pages deployment is confirmed by [run 38751956798](https://github.com/YabaCodes/careerproof-os/actions/runs/38751956798). Alpha.4's own installation transition was **not** physically observed. This gate qualifies **alpha.4 functionality under alpha.5**, not the historical alpha.4 version label or the complete v0.1.3 release.

| ID | Scope | Physical iPhone result |
|---|---|---|
| UX201 | Application version, schema 3, and preserved career records | **PASS (retrospective):** alpha.5 version shown; **alpha.4 update/version screen untested** |
| UX202 | Where: Experience selection, search, Show all, required choice, Role picker | **PASS** |
| UX203 | What: context, title counter, Result visibility and text retention with keyboard | **PASS** |
| UX204 | When: date precision, skill suggestions/search, Confidential switch, Back navigation | **PASS** |
| UX205 | Saved achievement with correct Experience/Role and undated draft | **PASS** — Part A recorded/persisted; Part B No date draft |
| UX206 | Unified edit page and existing relationships unchanged after no-op save | **PASS** |
| UX207 | Three-step mobile layout, touch/keyboard, light/dark appearance and cancel | **PASS** |

**Evidence boundary:** Physical testing used one iPhone running alpha.5; automated Playwright width checks remain separate. No destructive restore or historical alpha.4 update verification is claimed. Any subfeature not explicitly part of UX201–UX207 remains supported by its automated coverage, not an invented device result. **PA101–PA106 proficiency testing still pending.**

## Status vocabulary

**Not Started → Planned → In Development → In Review → Merged → Device Testing → Accepted**

| Status | Meaning |
|---|---|
| Not Started | Long-term backlog; no approved version or scope yet |
| Planned | In the approved roadmap with a target version; implementation **not yet authorized** |
| In Development | Authorized; work on a feature branch |
| In Review | PR open; CI result stated in the PR |
| Merged | User merged; GitHub Pages deployment verified |
| Device Testing | Deployed; awaiting (or partially holding) the user's physical-iPhone confirmation |
| Accepted | User confirmed the relevant physical-device checks |

Rules: never mark a row Accepted without the user's device confirmation; never mark partial work complete; CI, merge, deploy and device acceptance are recorded separately.

**2026-10-12 CP-013A development candidate:** Read-only evidence breadth on Skills is prepared as \`v0.1.3-alpha.1\` for PR review. Deterministic CIF-02–07 labeling, synthetic tests and privacy-preserving local evaluation are included. No schema or backup-format change; no assessment history or user proficiency levels yet. **Not accepted until PR CI, user merge, deployment, and physical-iPhone checks.** This does not certify the full \`v0.1.3\` milestone.

**2026-10-12 CP-013B candidate:** v0.1.3-alpha.2 adds append-only self-assessed L1–L4 proficiency, generic rubric 1.0, historical assessments, indexed schema-3 storage, backup format 3 and validated compatibility for existing format-1/format-2 restores. Automated and device gates pending; **not accepted and not merged**. CP-013A alpha.1 is accepted on iPhone, with EB103 draft/archive-only manual scenario untested but synthetically covered. Do not mark v0.1.3 final shipped.

**2026-10-16 CP-UX2 accepted retrospectively:** `v0.1.3-alpha.4` is step 2 of the redesign (DEC-037).
- A new achievement is captured in three steps: Where → What → When.
- The chosen experience becomes the primary one, and the role is derived from it by date.
- Skills are chips suggested from the experience.
- The impact category leaves the form, and its data is kept.

No schema or backup change. **Merged via PR #35; UX201–UX207 all PASS on physical iPhone 2026-10-16** in a retrospective session on installed **alpha.5**. UX201 did **not** verify the historical alpha.4 version screen or update transition; see gate above.

**2026-10-15 CP-UX1 (accepted):** `v0.1.3-alpha.3` is step 1 of the user-approved UX redesign (DEC-036).
- Experience becomes a role-grouped timeline with a page per experience, and the objective returns as Goal / Expected Result.
- Achievements read as a story with More Details. The Vault opens on Recorded with year headings.
- Dates are Month/Year/Exact day, and Profile is tap-to-edit with Delete in the editors.
- It also carries the #33 follow-ups.

No schema or backup-format change. Historical alpha.3 PR validation reported 100 Node and 136 browser tests passing locally. **PR #34 merged and UX101–UX109 were accepted on iPhone 2026-10-15.** Step 2 (guided capture, PR #35) is now device-accepted retrospectively via UX201–UX207 on alpha.5. Step 3 (candidates → Expected Result, slimmer Home) remains separate. CP-013B PA101–PA106 are also unreported.

## Progress summary (updated 2026-10-16; historical milestones preserved)

- **First-cycle releases:** v0.1.0 and v0.1.1 shipped (2 of the 8 numbered first-cycle versions v0.1.0–v0.1.7). v0.1.2 in progress: alpha.1–alpha.7 merged and accepted on iPhone (integrity hotfix, update detection, navigation/design, Data Health, controlled removal, Title Case + most-recent-first employment, Experience as a container). alpha.8 Home dashboard (CP-012C, #26) merged and accepted D101–D105 on 2026-10-11. CP-012D.1 accessibility/performance alpha.9 PR #27 merged and user-accepted AD101–AD105; CP-012D.2 alpha.10 accepted with AE105 exception; CP-012E alpha.11 merged and accepted (RE101–RE105/E220 passed); final v0.1.2 promotion PR in review.
- **Current alpha.5 device qualification:** CP-UX-Links PR #36 + test-repair PR #37 merged; current `main` build/test/deploy successful (run 38751956798); UX301–UX307 all PASS on physical iPhone, reported 2026-10-16. Guided-capture **UX201–UX207 all PASS retrospectively**; proficiency **PA101–PA106 remain unreported**; v0.1.3 final is not accepted.
- **Modules:** M01 Core Complete · M02 Core Complete · M03 Core Complete (container model, DEC-034) · M04 Partial · M05 Deferred · M06 Not started · M07 Not started · M08 Foundation.
- **Automated baseline:** alpha.8 PR #26 reported 74 Node / 121 browser local passes and a successful PR-head CI run. Alpha.9 PR #27 CI succeeded with 75 Node / 123 browser tests; user passed AD101–AD105. Alpha.10 validation focus and textarea coverage passed device gate AE101–AE104 (AE105 waived). Alpha.11 CP-012E PR-head CI run 38113988112 passed; user reported RE101–RE105/E220 all passed.
- **Open acceptance items:** v0.1.2 final post-promotion iPhone smoke F201–F204 (not yet due); AE105 waived/not tested on iPhone (automated coverage exists); legacy v0.1.1 final smoke F101–F102 superseded and CP-012.0 H102 optional. E219 synthetic-only destructive restore and E220 public-repo confirmation complete. Other v0.1.2 gates accepted 2026-10-11.

## Version ledger

| Version | Scope | Status | PRs | Device acceptance |
|---|---|---|---|---|
| v0.1.0 | Basic Profile, Quick Capture, Vault, IndexedDB, backup, PWA | Merged (superseded by v0.1.1) | initial, #1 | Hotfix input/nav accepted; remaining v0.1.0 checks superseded by v0.1.1 rc.1 E211–E218 |
| v0.1.1 | Career history, qualifications, Experience Portfolio, rich achievements, taxonomy/links, recovery, Check data | Device Testing | #4–#16 | rc.1 E211–E218 accepted; final F101–F102 pending |
| v0.1.2 | P0 reliability: Data Health, controlled deletion, dashboard, a11y/perf, recovery certification | Final promotion In Review (not merged or deployed); all alpha.11 P0/device gates accepted | #18–#29 merged; separate final promotion candidate | A101–A106, U103–U104, DH101–DH104, RM101–RM105, T101–T104, X101–X105, D101–D105, AD101–AD105, AE101–AE104 (AE105 waived), RE101–RE105/E220 accepted; final F201–F204 pending |
| v0.1.3 | Self-assessed L1–L4 proficiency + separate evidence breadth; CP-UX1 reading and scanning (DEC-036); CP-UX2 guided capture (DEC-037); CP-UX-Links contextual navigation | **Incremental qualification:** alpha.5 CP-UX-Links accepted; alpha.4 guided capture accepted via retrospective physical iPhone UX201–UX207 on alpha.5; v0.1.3 final not accepted | #32–#36 merged; #37 test-only CI fix merged | EB101/102/104/105 passed (EB103 untested); PA101–PA106 unreported; UX101–UX109 passed; **UX201–UX207 passed retrospectively on alpha.5 2026-10-16 (alpha.4 version-screen check untested)**; **UX301–UX307 passed 2026-10-16** |
| v0.1.4 | Source-linked Performance Review Studio + PDF | Planned | — | — |
| v0.1.5 | CV Builder, two templates, variants + PDF | Planned | — | — |
| v0.1.6 | Pasted job-description requirement matrix (deterministic) | Planned | — | — |
| v0.1.7 | First-cycle integration and release qualification | Planned | — | — |
| Later (unversioned) | Career Roadmap, promotion cases, interview studio, advanced analytics, optional AI/cloud | Not Started | — | Separate design approval required |

## Feature tracker

| Module | Feature | Req ID | Phase | Status | Version | PR | Automated tests | Device acceptance | Outstanding issues | Next action |
|---|---|---|---|---|---|---|---|---|---|---|
| Platform | Schema 1→2 migration, backup format 2, legacy format-1 import, atomic restore | CP-011A, CP-FR-007 | P0 | Accepted | 0.1.1-alpha.1 | #4 | recovery, release-qualification (Node) | 5 alpha.1 smoke checks; E211–E212 | — | — |
| Platform | UI stabilization, CP monogram branding, icons | CP-011A.1 | P0 | Accepted | 0.1.1-alpha.2 | #5 | ui-polish, assets | Covered by rc.1 E211, E217 | — | — |
| Platform | iOS date controls, compact nav/footer | CP-011A.2 | P0 | Accepted | 0.1.1-alpha.3 | #6 | ios-refinement | Covered by rc.1 E214, E217 | — | — |
| Platform | Modal click-through fix, five-slot mobile nav | v0.1.0 hotfix | P0 | Accepted | 0.1.0 | #1 | ui-regression, ios-refinement | User confirmed 2026-10-09 | — | — |
| Platform | Installed-PWA update check, Check now, Restart notice | CP-011B.2 | P0 | Accepted | 0.1.1-alpha.7 | #11 | pwa-updates | Superseded by CP-012.1; restart notice confirmed via U103–U104 | — | — |
| Platform | Offline app shell / installed PWA | CP-FR-015 | P0 | Accepted | 0.1.1 | #11, #15 | compatibility, release-qualification | E218 | — | Re-verify each release (G7) |
| Platform | Read-only Settings → Check data | CP-FR-008 (part), CP-011E | P0 | Accepted | 0.1.1-rc.1 | #15 | CP-E101, CP-E201 | E213 | Not an external backup | Extend in CP-012A |
| Platform | Stale-restore protection (generation + revision) | CP-011E | P0 | Device Testing | 0.1.1-rc.1 | #15 | CP-E104, CP-E202 | — | E219 synthetic-only destructive restore not performed | User runs E219 on a disposable profile, or fold into CP-012E |
| Platform | v0.1.1 final version promotion | — | P0 | Device Testing | 0.1.1 | #16 | 42 Node / 102 browser | F101–F102 pending | — | User reports F101–F102 |
| Platform | v0.1.1 Git tag / GitHub Release | — | — | Not Started | 0.1.1 | — | — | — | No tag exists | User decision |
| Platform | Public-repo data hygiene | E220 | P0 | Device Testing | — | — | Agent scan of branch tips + history: no identifying terms | — | User confirmation pending | User confirms |
| Platform | Docs status reconciliation + this tracker | DEC-027 | — | Merged | docs only | #17 | CI run 38024672956 ✓ (build, tests, deploy) | n/a (docs) | — | — |
| Platform | **DATA-017** Experience text corrupted by unterminated `&#39` escape (apostrophe + digits) | CP-012.0 | P0 | Device Testing | 0.1.2-alpha.1 | #18 | html-escape (Node), experience-portfolio CP-012.0 (browser); main CI 38027577090 ✓ | H101 accepted (records intact through alpha.3); H102 optional; H103 n/a unless Experience entries exist | — | Optional H102 |
| Platform | **QA-018** busy-state test gated a save method the editor no longer uses (passed by timing) | CP-012.1 | P0 | Merged | 0.1.2-alpha.2 | #19 | ui-polish pending-save (10/10 repeats); main CI 38032685213 ✓ | n/a (test only) | — | — |
| Platform | Update detection: check on every open/foreground, banner with version, Back up first + Restart app (DEC-028) | CP-012.1 | P0 | Accepted | 0.1.2-alpha.2 | #19 | pwa-updates (3 cases, fail on old code); main CI 38032685213 ✓ | U103–U104 accepted at the alpha.4 update (2026-10-10) | Pages edge cache can still add ~10 min | — |
| Platform | Navigation (Home/Vault/Experience/Skills/Profile, ＋ and Settings in header) + Wealth OS design language (DEC-029/030) | CP-012.2 | P0 | Accepted | 0.1.2-alpha.3 | #20 | home-navigation, ui-polish sweep incl. Experience/Skills, ios-refinement nav geometry; main CI 38033308166 ✓ | A101–A106 accepted by user 2026-10-10 | Delete-in-editor follow-up: done in CP-UX1 (alpha.3, In Review) | — |
| M08 Career Analytics | **UX-019** Home "Export backup" left "Never" on screen until another redraw | CP-012.2 | P0 | Accepted | 0.1.2-alpha.3 | #20 | home-navigation | A103 accepted | — | — |
| M04 Competency Intelligence | **UX-020** archived-skills checkbox was a 19px tap target | CP-012.2 | P0 | Accepted | 0.1.2-alpha.3 | #20 | ui-polish sweep (Skills) | A105 accepted | — | — |
| M01 Career Profile | Profile basics | CP-FR-001 | P0 | Accepted | 0.1.0 | initial, #1 | domain, ui-regression | E211 | — | — |
| M01 Career Profile | Employers, roles, promotions, primary role | CP-FR-001, CP-011B | P0 | Accepted | 0.1.1-alpha.5 | #9 | career-history | User verified before CP-011C; E214 | — | — |
| M01 Career Profile | Compact 2-line timeline, More/Less | CP-011B.1 | P0 | Accepted | 0.1.1-alpha.6 | #10 | career-compact | E214 | — | — |
| M01 Career Profile | **UX-022** Employment History sorted employers by name, so an earlier employer added later could sit above the current one; now most recent first (DEC-033) | CP-012.3 | P0 | Accepted | 0.1.2-alpha.6 | #23 | chronology (5 Node), title-case-order spec (reported flow, 3 employers + promotion, reload); both fail on alpha.5; main CI 38097710416 ✓ | T102–T103 accepted 2026-10-11 | Experience cards still order by last edited (unchanged) | — |
| Platform | Title Case for app titles and subtitles (DEC-032) | CP-012.3 | P0 | Accepted | 0.1.2-alpha.6 | #23 | title-case-order sweep (5 screens + 7 dialogs; user text untouched); updated heading assertions; main CI 38097710416 ✓ | T101, T104 accepted 2026-10-11 | Sentences, field labels and buttons stay sentence case by design | — |
| M01 Career Profile | Education and credentials | CP-FR-002, CP-011B | P0 | Accepted | 0.1.1-alpha.5 | #9 | career-history | User verified; E214 | — | — |
| M02 Achievement Vault | Quick Capture, Draft/Recorded/Archived, Vault search | CP-FR-004, CP-FR-005 | P0 | Accepted | 0.1.0 | initial, #1 | ui-regression, release-qualification | E215, E217 | — | — |
| M02 Achievement Vault | Outcome visible above iOS keyboard | CP-011A.3 | P0 | Accepted | 0.1.1-alpha.4 | #7, #8 | ios-keyboard-outcome | User confirmed alpha.4; E216 | — | Keep geometry tests |
| M02 Achievement Vault | Rich fields, metrics, evidence references | CP-FR-005, CP-011D | P0 | Accepted | 0.1.1-alpha.9 | #13 | achievement-intelligence | E215 | Evidence is user-entered, not verified (by design) | — |
| M02 Achievement Vault | Quick Capture overlap fix | CP-011D.1 | P0 | Accepted | 0.1.1-alpha.10 | #14 | ios-refinement (8 geometry cases) | User: "fix works"; E216 | — | — |
| M02 Achievement Vault | Advanced Vault filters | CP-011D | P0 | Accepted | 0.1.1-alpha.9 | #13 | achievement-intelligence | E215, E217 | — | — |
| M02 Achievement Vault | Controlled unlink / move / delete for employers, roles, experiences, credentials, education, custom skills | CP-012B | P0 | Accepted | 0.1.2-alpha.5 | #22 | removal (8 Node incl. rollback + stale revision), removal spec (3 browser), career-history/experience-portfolio updated; main CI 38055825278 ✓ | RM101–RM105 accepted 2026-10-11 (run at the alpha.7 update with synthetic Test Co / Test Role / Test Experience records) | Single-target moves only | — |
| M03 Experience Portfolio | **UX-021** expanded Experience cards and skill entries collapsed whenever a dialog closed | CP-012B | P0 | Accepted | 0.1.2-alpha.5 | #22 | experience-portfolio (card stays open); main CI 38055825278 ✓ | RM105 accepted 2026-10-11 | — | — |
| M03 Experience Portfolio | Experience as a container (DEC-034): short Context, Earlier Notes kept, outcome roll-up from linked achievements, inline creation from the achievement form | CP-012.4, CP-06 amended | P0 | Accepted | 0.1.2-alpha.7 | #24 | experience-container (6 Node incl. atomic creation + rollback; 3 browser incl. 320px, discard, duplicates); experience-portfolio updated; main CI 38098062177 attempt 2 ✓ | X101–X105 accepted 2026-10-11 | Experience cards still sort by last edited | — |
| Platform | **QA-023** post-merge CI for #24 failed once in Build and test; identical tree passed the PR check, a re-run and 3 local full runs; the job log could not be read from the agent environment, so the failing test is unidentified | CP-012.4 follow-up | — | In Review | n/a (CI only) | #25 | Playwright in CI: one retry plus GitHub annotations for failures and flaky tests | n/a | Retries can hide a genuinely intermittent defect; flaky annotations are checked on every run | User review/merge; identify the test from the next flaky annotation |
| M03 Experience Portfolio | Project / Initiative / Ongoing Responsibility, role links, contextual capture | CP-FR-003, CP-011C | P0 | Accepted | 0.1.1-alpha.8 | #12 | experience-portfolio | User accepted before CP-011D; E214 | — | — |
| M04 Competency Intelligence | 4 categories / 32 built-in skills, links, custom skill CRUD/archive | CP-FR-006, CP-011A, CP-011D | P0 | Accepted | 0.1.1-alpha.9 | #4, #13 | achievement-intelligence, domain | E215, E217 | — | — |
| M04 Competency Intelligence | Self-assessed L1–L4 history | CP-FR-009 | P1 | Planned | 0.1.3 | — | — | — | Needs `proficiencyAssessments` store + schema/backup version design | After v0.1.2 |
| M04 Competency Intelligence | Evidence breadth (deterministic) | CP-FR-010 | P1 | Planned | 0.1.3 | — | — | — | CIF-02..07 fixtures to implement | After v0.1.2 |
| M04 Competency Intelligence | Behavioral rubrics for all 32 skills | CAREER_INTELLIGENCE | P1 | Not Started | — | — | — | — | Only exemplars authored; user review needed | Product decision |
| M05 Career Roadmap | Target roles, gaps, Document/Substantiate/Develop actions | — | Later | Not Started | — | — | — | — | Deferred; no committed version | Scope with user after first cycle |
| M06 Performance & Promotion | Source-linked Performance Review + PDF | CP-FR-011 | P1 | Planned | 0.1.4 | — | — | — | `careerDocuments`/`documentSources` stores; PDF approach | After v0.1.3 |
| M06 Performance & Promotion | Promotion case studio | — | Later | Not Started | — | — | — | — | — | Scope later |
| M07 Job Readiness & Interview | CV Builder + PDF | CP-FR-012 | P1 | Planned | 0.1.5 | — | — | — | Two templates to approve | After v0.1.4 |
| M07 Job Readiness & Interview | Job Fit Analyzer (pasted JD) | CP-FR-013 | P1 | Planned | 0.1.6 | — | — | — | Synonym dictionary/rule engine to approve; `jobAnalyses`/`jobRequirements` stores | After v0.1.5 |
| M07 Job Readiness & Interview | Interview story bank / practice | — | Later | Not Started | — | — | — | — | — | Scope later |
| M08 Career Analytics | Home dashboard: next action, truthful metrics, recent, quick capture | CP-FR-014 | P0 | Accepted | 0.1.2-alpha.3 | #20 | home-navigation | A103 accepted | Fuller dashboard (CP-012C) still planned | — |
| M08 Career Analytics | Truthful dashboard + record completeness: Home **Complete Your Record** (Data Health completeness rules, shared) and **Achievements by Role** (active counts per role, opens the filtered Vault) (DEC-035) | CP-FR-014, CP-01, CP-012C | P0 | Accepted | 0.1.2-alpha.8 | #26 | dashboard (2 Node incl. parity with Data Health), home-dashboard (3 browser incl. live update, kept-open gap, 320px); data-health spec scoped to the report | D101–D105 accepted 2026-10-11 | Trends deferred (later M08) | — |
| M08 Career Analytics | Advanced longitudinal analytics | — | Later | Not Started | — | — | — | — | — | Scope later |
| Platform | Data Health 2.0 (critical vs advisory, read-only, links to records) | CP-FR-008, CP-012A | P0 | Accepted | 0.1.2-alpha.4 | #21 | data-health (9 Node), data-health spec (3 browser); main CI 38039174416 ✓ | DH101–DH104 accepted 2026-10-10 | Problems that stop the app opening still show on the startup error screen | Emergency export in CP-012E |
| Platform | Accessibility / large-dataset performance hardening | CP-012D | P0 | Accepted (AE105 waived) | 0.1.2-alpha.10 | #27–#28 | Alpha.9: 75 Node/123 browser tests; alpha.10 validation-error focus, textarea layout/label audit and reduced-motion automated tests | AD101–AD105 and AE101–AE104 passed; AE105 not tested, user waived | Not formal WCAG certification or real-device performance benchmark | Completed with documented exception |
| Platform | P0 recovery / upgrade certification | CP-012E | P0 | Accepted | 0.1.2-alpha.11 | #29 merged at 3b9905c | Synthetic E219 cold-reopen full P0 restore, legacy migration, invalid/stale backup checks plus rollback; CI 38113988112 success | RE101–RE105 and E220 passed 2026-10-11 | No destructive restore on personal iPhone; backup JSON unencrypted | Separate final promotion PR + F201–F204 |
| Platform | First-cycle integration qualification | v0.1.7 | P1 | Planned | 0.1.7 | — | — | — | — | After v0.1.6 |
| Platform | Mobile navigation redesign (Growth/Studio) | DEC-015 | — | Not Started | — | — | — | — | Spec target differs from shipped 5-slot bar | Decide when Studio/Growth ship |
| Platform | Optional cloud sync / accounts / AI / commercial | — | Later | Not Started | — | — | — | — | Separate threat model and approval | None until requested |
| M03 Experience Portfolio | **UX-036** Experience tab as a role-grouped timeline (most recent role first, one row per experience, "Also" for multi-role, loose-achievement row) and a page per experience; objective shown as Goal / Expected Result (amends DEC-034) | CP-UX1, DEC-036 | P0 | Accepted | 0.1.3-alpha.3 | #34 | timeline (9 Node); ux-reading timeline/page/keyboard; experience-portfolio, experience-container, removal, title-case-order updated | UX102–UX103 passed 2026-10-15 | Candidate drafts → Expected Result is step 3 | — |
| M02 Achievement Vault | **UX-037** Achievement read as a story (Result → What I Did → Context → Skills; rest under More Details); draft notice names what is missing; Vault opens on Recorded with Drafts/Archived segments, year headings, date · context rows; "achievements" counts are recorded only everywhere | CP-UX1, DEC-036 | P0 | Accepted | 0.1.3-alpha.3 | #34 | ux-reading story/Vault; compatibility, ios-refinement, ui-polish, home-dashboard, release-qualification updated | UX104–UX105 passed 2026-10-15 | Archive/Delete one tap deeper | — |
| M02 Achievement Vault | **UX-038** Achievement date as Month (default) / Year / Exact day; switching never invents a day or month | CP-UX1, DEC-036 | P0 | Accepted | 0.1.3-alpha.3 | #34 | ux-reading dates; ios-refinement date geometry updated | UX106 passed 2026-10-15 | Guided Where → What → When capture is step 2 | — |
| M01 Career Profile | **UX-039** Tap a record's name to edit it; Delete inside the editor (also for experiences) | CP-UX1, DEC-036 | P0 | Accepted | 0.1.3-alpha.3 | #34 | ux-reading Profile; career-history, removal updated | UX107 passed 2026-10-15 | — | — |
| M04 Competency Intelligence | **QA-040** #33 follow-ups: future assessment date refused; assessment dates formatted; skills with history show an archive-only note instead of a refused Delete | CP-013B follow-up | P1 | Accepted | 0.1.3-alpha.3 | #34 | ux-reading #33 test | UX108 passed 2026-10-15 | — | — |
| M02 Achievement Vault | **UX-041** Guided capture Where → What → When; Where chooses the primary experience and the role comes with it (by date across roles); new experience with its role; "Not part of an experience" with a role or none | CP-UX2, DEC-037 | P0 | **Accepted** | 0.1.3-alpha.4 | #35 merged | timeline (+2 Node); ux-capture (7 browser); experience-container, experience-portfolio, compatibility, accessibility, ui-polish, title-case, ios-refinement updated | **UX201–UX206 PASS, retrospective on alpha.5, 2026-10-16**; alpha.4 version transition not checked | Candidate drafts → Expected Result is step 3 | Closed for tested CP-UX2 functionality |
| M04 Competency Intelligence | **UX-042** Skills shown as chips suggested from the experience's recorded achievements; "Find another skill" | CP-UX2, DEC-037 | P0 | **Accepted** | 0.1.3-alpha.4 | #35 merged | ux-capture chips/search | **UX204 PASS on alpha.5, 2026-10-16** | — | Closed for CP-UX2 |
| M02 Achievement Vault | **UX-043** Impact category removed from the capture form (stored values kept and shown); a step-2 draft gets no date; empty metric/evidence rows are not saved; keyboard reveal keeps label + field in view | CP-UX2, DEC-037 | P0 | **Accepted (UX205–UX207 scope)** | 0.1.3-alpha.4 | #35 merged | ux-capture edit; ios-refinement draft-date, per-step geometry and keyboard | **UX205–UX207 PASS on alpha.5, 2026-10-16**; impact-category/empty-row regression covered by browser tests, not individually reported on device | Old rich-panel CSS left unused | Closed for CP-UX2; keep automated regressions |

| M02/M03/M04 Cross-module navigation | **UX-044** Context links: achievement → primary/secondary Experience, Role filter, Skill; Experience → Skill; Skill → linked achievement; no fabricated links or archived-status mutation | CP-UX-Links | P0 | **Accepted** | 0.1.3-alpha.5 | #36 merged; #37 CI repair | ux-context-navigation (4 browser scenarios); main run [38751956798](https://github.com/YabaCodes/careerproof-os/actions/runs/38751956798) build/test/deploy ✓ | **UX301–UX307 all PASS on iPhone 2026-10-16** | Individual physical-device viewport coverage only; no destructive restore performed (not required for these read-only links) | Closed for alpha.5; v0.1.3 final still gated |

## Open user decisions

1. Report final v0.1.2 post-promotion smoke F201–F204 after final PR merges and deployment; older v0.1.1 F101–F102 superseded.
2. Create a `v0.1.1` Git tag / GitHub Release, or not.
3. ~~RM101–RM105, T101–T104, X101–X105, D101–D105~~: all accepted 2026-10-11. PRs #25–26 merged. AD101–AD105 accepted for alpha.9; AE101–AE104 passed and AE105 explicitly waived for alpha.10; RE101–RE105/E220 all passed for alpha.11.
4. v0.1.2 product choices: Data Health issue taxonomy and wording; unlink/reassign UX (done, DEC per CP-012B); dashboard summaries (proposed in DEC-035, PR #26); last-export wording kept as "generated on this device".
5. Later: 32-skill rubric authoring, CV templates, job-fit rule dictionary, navigation redesign.
6. ~~OQ-034 Achievement vs Experience~~: decided 2026-10-11, option B (DEC-034), implemented in PR #24.
7. CP-UX redesign: step 1 (DEC-036, alpha.3) accepted; step 2 (DEC-037, alpha.4) accepted retrospectively on installed alpha.5 via UX201–UX207 (historical alpha.4 update transition untested); CP-UX-Links (alpha.5) accepted UX301–UX307; step 3 (move candidate drafts to Expected Result, slimmer Home) remains a separate PR.

## Update procedure (every PR)

1. Move affected rows forward one status at a time with evidence (PR number, CI run, test counts).
2. Only the user's physical-device report moves a row to **Accepted**; record which check IDs.
3. Add new rows for newly discovered defects with an incident ID; never delete history.
4. Refresh the progress summary and the "Last updated" line.
