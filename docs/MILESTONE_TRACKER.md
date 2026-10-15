# CareerProof OS — Milestone Tracker

**Document ID:** CP-TRK-001 (DEC-027) · **Last updated:** 2026-10-15 · **main:** `ffc72ef` (PR #33 merged; `0.1.3-alpha.2` deployed by main CI run 38684412367) · **In review:** `0.1.3-alpha.3` CP-UX1 (DEC-036)

This is the authoritative per-feature progress record. It is updated in **every** PR. Module-level completion stages remain in [ROADMAP.md §5](ROADMAP.md); scope and acceptance criteria are defined in [ROADMAP.md](ROADMAP.md), [PRODUCT_SPEC.md](PRODUCT_SPEC.md), [DATA_ARCHITECTURE.md](DATA_ARCHITECTURE.md) and [CAREER_INTELLIGENCE.md](CAREER_INTELLIGENCE.md).

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

**2026-10-15 CP-UX1 candidate:** `v0.1.3-alpha.3` is step 1 of the user-approved UX redesign (DEC-036).
- Experience becomes a role-grouped timeline with a page per experience, and the objective returns as Goal / Expected Result.
- Achievements read as a story with More Details. The Vault opens on Recorded with year headings.
- Dates are Month/Year/Exact day, and Profile is tap-to-edit with Delete in the editors.
- It also carries the #33 follow-ups.

No schema or backup-format change. 100 Node and 136 browser tests pass locally; CI is stated in the PR. **Not merged or accepted.** UX101–UX109 are pending, as are steps 2 (capture flow) and 3 (candidates → Expected Result, slimmer Home). The status of v0.1.2 final (#30 merged; #31 docs open with conflicts) and CP-013B PA101–PA106 (not yet reported) is unchanged by this PR.

## Progress summary (2026-10-11)

- **First-cycle releases:** v0.1.0 and v0.1.1 shipped (2 of the 8 numbered first-cycle versions v0.1.0–v0.1.7). v0.1.2 in progress: alpha.1–alpha.7 merged and accepted on iPhone (integrity hotfix, update detection, navigation/design, Data Health, controlled removal, Title Case + most-recent-first employment, Experience as a container). alpha.8 Home dashboard (CP-012C, #26) merged and accepted D101–D105 on 2026-10-11. CP-012D.1 accessibility/performance alpha.9 PR #27 merged and user-accepted AD101–AD105; CP-012D.2 alpha.10 accepted with AE105 exception; CP-012E alpha.11 merged and accepted (RE101–RE105/E220 passed); final v0.1.2 promotion PR in review.
- **Modules:** M01 Core Complete · M02 Core Complete · M03 Core Complete (container model, DEC-034) · M04 Partial · M05 Deferred · M06 Not started · M07 Not started · M08 Foundation.
- **Automated baseline:** alpha.8 PR #26 reported 74 Node / 121 browser local passes and a successful PR-head CI run. Alpha.9 PR #27 CI succeeded with 75 Node / 123 browser tests; user passed AD101–AD105. Alpha.10 validation focus and textarea coverage passed device gate AE101–AE104 (AE105 waived). Alpha.11 CP-012E PR-head CI run 38113988112 passed; user reported RE101–RE105/E220 all passed.
- **Open acceptance items:** v0.1.2 final post-promotion iPhone smoke F201–F204 (not yet due); AE105 waived/not tested on iPhone (automated coverage exists); legacy v0.1.1 final smoke F101–F102 superseded and CP-012.0 H102 optional. E219 synthetic-only destructive restore and E220 public-repo confirmation complete. Other v0.1.2 gates accepted 2026-10-11.

## Version ledger

| Version | Scope | Status | PRs | Device acceptance |
|---|---|---|---|---|
| v0.1.0 | Basic Profile, Quick Capture, Vault, IndexedDB, backup, PWA | Merged (superseded by v0.1.1) | initial, #1 | Hotfix input/nav accepted; remaining v0.1.0 checks superseded by v0.1.1 rc.1 E211–E218 |
| v0.1.1 | Career history, qualifications, Experience Portfolio, rich achievements, taxonomy/links, recovery, Check data | Device Testing | #4–#16 | rc.1 E211–E218 accepted; final F101–F102 pending |
| v0.1.2 | P0 reliability: Data Health, controlled deletion, dashboard, a11y/perf, recovery certification | Final promotion In Review (not merged or deployed); all alpha.11 P0/device gates accepted | #18–#29 merged; separate final promotion candidate | A101–A106, U103–U104, DH101–DH104, RM101–RM105, T101–T104, X101–X105, D101–D105, AD101–AD105, AE101–AE104 (AE105 waived), RE101–RE105/E220 accepted; final F201–F204 pending |
| v0.1.3 | Self-assessed L1–L4 proficiency + separate evidence breadth; CP-UX1 reading and scanning (DEC-036) | CP-013A accepted; CP-013B merged and deployed (alpha.2); CP-UX1 alpha.3 In Review | #32, #33 merged; CP-UX1 PR open | EB101/102/104/105 passed, EB103 not tested; PA101–106 not yet reported; UX101–UX109 pending |
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
| M03 Experience Portfolio | **UX-036** Experience tab as a role-grouped timeline (most recent role first, one row per experience, "Also" for multi-role, loose-achievement row) and a page per experience; objective shown as Goal / Expected Result (amends DEC-034) | CP-UX1, DEC-036 | P0 | In Review | 0.1.3-alpha.3 | CP-UX1 PR | timeline (9 Node); ux-reading timeline/page/keyboard; experience-portfolio, experience-container, removal, title-case-order updated | UX102–UX103 pending | Candidate drafts → Expected Result is step 3 | User review, merge, UX101–UX109 |
| M02 Achievement Vault | **UX-037** Achievement read as a story (Result → What I Did → Context → Skills; rest under More Details); draft notice names what is missing; Vault opens on Recorded with Drafts/Archived segments, year headings, date · context rows; "achievements" counts are recorded only everywhere | CP-UX1, DEC-036 | P0 | In Review | 0.1.3-alpha.3 | CP-UX1 PR | ux-reading story/Vault; compatibility, ios-refinement, ui-polish, home-dashboard, release-qualification updated | UX104–UX105 pending | Archive/Delete one tap deeper | User review, merge |
| M02 Achievement Vault | **UX-038** Achievement date as Month (default) / Year / Exact day; switching never invents a day or month | CP-UX1, DEC-036 | P0 | In Review | 0.1.3-alpha.3 | CP-UX1 PR | ux-reading dates; ios-refinement date geometry updated | UX106 pending | Guided Where → What → When capture is step 2 | User review, merge |
| M01 Career Profile | **UX-039** Tap a record's name to edit it; Delete inside the editor (also for experiences) | CP-UX1, DEC-036 | P0 | In Review | 0.1.3-alpha.3 | CP-UX1 PR | ux-reading Profile; career-history, removal updated | UX107 pending | — | User review, merge |
| M04 Competency Intelligence | **QA-040** #33 follow-ups: future assessment date refused; assessment dates formatted; skills with history show an archive-only note instead of a refused Delete | CP-013B follow-up | P1 | In Review | 0.1.3-alpha.3 | CP-UX1 PR | ux-reading #33 test | UX108 pending | — | User review, merge |

## Open user decisions

1. Report final v0.1.2 post-promotion smoke F201–F204 after final PR merges and deployment; older v0.1.1 F101–F102 superseded.
2. Create a `v0.1.1` Git tag / GitHub Release, or not.
3. ~~RM101–RM105, T101–T104, X101–X105, D101–D105~~: all accepted 2026-10-11. PRs #25–26 merged. AD101–AD105 accepted for alpha.9; AE101–AE104 passed and AE105 explicitly waived for alpha.10; RE101–RE105/E220 all passed for alpha.11.
4. v0.1.2 product choices: Data Health issue taxonomy and wording; unlink/reassign UX (done, DEC per CP-012B); dashboard summaries (proposed in DEC-035, PR #26); last-export wording kept as "generated on this device".
5. Later: 32-skill rubric authoring, CV templates, job-fit rule dictionary, navigation redesign.
6. ~~OQ-034 Achievement vs Experience~~: decided 2026-10-11, option B (DEC-034), implemented in PR #24.
7. CP-UX1 (DEC-036): review and merge step 1 (alpha.3). Steps 2 (guided capture, impact category out of the form, automatic primary experience) and 3 (move candidate drafts to Expected Result, slimmer Home) follow as separate PRs.

## Update procedure (every PR)

1. Move affected rows forward one status at a time with evidence (PR number, CI run, test counts).
2. Only the user's physical-device report moves a row to **Accepted**; record which check IDs.
3. Add new rows for newly discovered defects with an incident ID; never delete history.
4. Refresh the progress summary and the "Last updated" line.
