# CareerProof OS — Milestone Tracker

**Document ID:** CP-TRK-001 (DEC-027) · **Last updated:** 2026-10-10 · **Current released version:** `v0.1.2-alpha.3` (accepted on iPhone) · **main:** `85c5ca6` (PR #20)

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

## Progress summary (2026-10-10)

- **First-cycle releases:** v0.1.0 and v0.1.1 shipped (2 of the 8 numbered first-cycle versions v0.1.0–v0.1.7). v0.1.2 is in progress: alpha.1 integrity hotfix, alpha.2 update detection and alpha.3 navigation/design merged; alpha.3 accepted on iPhone; alpha.4 Data Health in review.
- **Modules:** M01 Core Complete · M02 Core Complete · M03 Core Complete · M04 Partial · M05 Deferred · M06 Not started · M07 Not started · M08 Foundation.
- **Automated baseline (alpha.4 branch):** 53/53 Node, 110/110 browser locally; main `85c5ca6` CI run 38033308166 ✓.
- **Open acceptance items:** v0.1.1 smoke (F101–F102, superseded by later releases), E219 synthetic destructive restore, E220 user hygiene confirmation, CP-012.0 H102 (optional synthetic apostrophe check), CP-012.1 U103–U104 and CP-012A DH101–DH104 at the alpha.4 update.

## Version ledger

| Version | Scope | Status | PRs | Device acceptance |
|---|---|---|---|---|
| v0.1.0 | Basic Profile, Quick Capture, Vault, IndexedDB, backup, PWA | Merged (superseded by v0.1.1) | initial, #1 | Hotfix input/nav accepted; remaining v0.1.0 checks superseded by v0.1.1 rc.1 E211–E218 |
| v0.1.1 | Career history, qualifications, Experience Portfolio, rich achievements, taxonomy/links, recovery, Check data | Device Testing | #4–#16 | rc.1 E211–E218 accepted; final F101–F102 pending |
| v0.1.2 | P0 reliability: Data Health, controlled deletion, dashboard, a11y/perf, recovery certification | In Development (alpha.1–alpha.3 merged; alpha.3 accepted; alpha.4 Data Health in review) | #18–#20, #21 | alpha.3 A101–A106 accepted 2026-10-10 |
| v0.1.3 | Self-assessed L1–L4 proficiency + separate evidence breadth | Planned | — | — |
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
| Platform | Installed-PWA update check, Check now, Restart notice | CP-011B.2 | P0 | Device Testing | 0.1.1-alpha.7 | #11 | pwa-updates | E211 (updated without reinstall) only | CP-B222/B223 not separately confirmed; superseded by CP-012.1 | Verify via U103–U104 |
| Platform | Offline app shell / installed PWA | CP-FR-015 | P0 | Accepted | 0.1.1 | #11, #15 | compatibility, release-qualification | E218 | — | Re-verify each release (G7) |
| Platform | Read-only Settings → Check data | CP-FR-008 (part), CP-011E | P0 | Accepted | 0.1.1-rc.1 | #15 | CP-E101, CP-E201 | E213 | Not an external backup | Extend in CP-012A |
| Platform | Stale-restore protection (generation + revision) | CP-011E | P0 | Device Testing | 0.1.1-rc.1 | #15 | CP-E104, CP-E202 | — | E219 synthetic-only destructive restore not performed | User runs E219 on a disposable profile, or fold into CP-012E |
| Platform | v0.1.1 final version promotion | — | P0 | Device Testing | 0.1.1 | #16 | 42 Node / 102 browser | F101–F102 pending | — | User reports F101–F102 |
| Platform | v0.1.1 Git tag / GitHub Release | — | — | Not Started | 0.1.1 | — | — | — | No tag exists | User decision |
| Platform | Public-repo data hygiene | E220 | P0 | Device Testing | — | — | Agent scan of branch tips + history: no identifying terms | — | User confirmation pending | User confirms |
| Platform | Docs status reconciliation + this tracker | DEC-027 | — | Merged | docs only | #17 | CI run 38024672956 ✓ (build, tests, deploy) | n/a (docs) | — | — |
| Platform | **DATA-017** Experience text corrupted by unterminated `&#39` escape (apostrophe + digits) | CP-012.0 | P0 | Device Testing | 0.1.2-alpha.1 | #18 | html-escape (Node), experience-portfolio CP-012.0 (browser); main CI 38027577090 ✓ | H101 accepted (records intact through alpha.3); H102 optional; H103 n/a unless Experience entries exist | — | Optional H102 |
| Platform | **QA-018** busy-state test gated a save method the editor no longer uses (passed by timing) | CP-012.1 | P0 | Merged | 0.1.2-alpha.2 | #19 | ui-polish pending-save (10/10 repeats); main CI 38032685213 ✓ | n/a (test only) | — | — |
| Platform | Update detection: check on every open/foreground, banner with version, Back up first + Restart app (DEC-028) | CP-012.1 | P0 | Device Testing | 0.1.2-alpha.2 | #19 | pwa-updates (3 cases, fail on old code); main CI 38032685213 ✓ | Phone went alpha.1 → alpha.3 directly, so the old banner was shown; U103–U104 observable at the alpha.4 update | — | Watch for the new banner at alpha.4 |
| Platform | Navigation (Home/Vault/Experience/Skills/Profile, ＋ and Settings in header) + Wealth OS design language (DEC-029/030) | CP-012.2 | P0 | Accepted | 0.1.2-alpha.3 | #20 | home-navigation, ui-polish sweep incl. Experience/Skills, ios-refinement nav geometry; main CI 38033308166 ✓ | A101–A106 accepted by user 2026-10-10 | Delete-in-editor follow-up (not started) | — |
| M08 Career Analytics | **UX-019** Home "Export backup" left "Never" on screen until another redraw | CP-012.2 | P0 | Accepted | 0.1.2-alpha.3 | #20 | home-navigation | A103 accepted | — | — |
| M04 Competency Intelligence | **UX-020** archived-skills checkbox was a 19px tap target | CP-012.2 | P0 | Accepted | 0.1.2-alpha.3 | #20 | ui-polish sweep (Skills) | A105 accepted | — | — |
| M01 Career Profile | Profile basics | CP-FR-001 | P0 | Accepted | 0.1.0 | initial, #1 | domain, ui-regression | E211 | — | — |
| M01 Career Profile | Employers, roles, promotions, primary role | CP-FR-001, CP-011B | P0 | Accepted | 0.1.1-alpha.5 | #9 | career-history | User verified before CP-011C; E214 | — | — |
| M01 Career Profile | Compact 2-line timeline, More/Less | CP-011B.1 | P0 | Accepted | 0.1.1-alpha.6 | #10 | career-compact | E214 | — | — |
| M01 Career Profile | Education and credentials | CP-FR-002, CP-011B | P0 | Accepted | 0.1.1-alpha.5 | #9 | career-history | User verified; E214 | — | — |
| M02 Achievement Vault | Quick Capture, Draft/Recorded/Archived, Vault search | CP-FR-004, CP-FR-005 | P0 | Accepted | 0.1.0 | initial, #1 | ui-regression, release-qualification | E215, E217 | — | — |
| M02 Achievement Vault | Outcome visible above iOS keyboard | CP-011A.3 | P0 | Accepted | 0.1.1-alpha.4 | #7, #8 | ios-keyboard-outcome | User confirmed alpha.4; E216 | — | Keep geometry tests |
| M02 Achievement Vault | Rich fields, metrics, evidence references | CP-FR-005, CP-011D | P0 | Accepted | 0.1.1-alpha.9 | #13 | achievement-intelligence | E215 | Evidence is user-entered, not verified (by design) | — |
| M02 Achievement Vault | Quick Capture overlap fix | CP-011D.1 | P0 | Accepted | 0.1.1-alpha.10 | #14 | ios-refinement (8 geometry cases) | User: "fix works"; E216 | — | — |
| M02 Achievement Vault | Advanced Vault filters | CP-011D | P0 | Accepted | 0.1.1-alpha.9 | #13 | achievement-intelligence | E215, E217 | — | — |
| M02 Achievement Vault | Controlled unlink / reassign / delete | CP-012B | P0 | Planned | 0.1.2 | — | — | — | UX decisions open (DECISIONS §5, handover E.2) | Authorize after CP-012A |
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
| M08 Career Analytics | Truthful dashboard + record completeness | CP-FR-014, CP-012C | P0 | Planned | 0.1.2 | — | — | — | Which summaries; backup-time honesty | Authorize within v0.1.2 |
| M08 Career Analytics | Advanced longitudinal analytics | — | Later | Not Started | — | — | — | — | — | Scope later |
| Platform | Data Health 2.0 (critical vs advisory, read-only, links to records) | CP-FR-008, CP-012A | P0 | In Review | 0.1.2-alpha.4 | #21 | data-health (9 Node incl. corruption + 5,000-record timing), data-health spec (3 browser) | DH101–DH104 pending | Problems that stop the app opening still show on the startup error screen, not in Settings | User review/merge |
| Platform | Accessibility / large-dataset performance hardening | CP-012D | P0 | Planned | 0.1.2 | — | — | — | Measure, don't assume | Within v0.1.2 |
| Platform | P0 recovery / upgrade certification | CP-012E | P0 | Planned | 0.1.2 | — | — | — | Includes E219-style synthetic restore | Within v0.1.2 |
| Platform | First-cycle integration qualification | v0.1.7 | P1 | Planned | 0.1.7 | — | — | — | — | After v0.1.6 |
| Platform | Mobile navigation redesign (Growth/Studio) | DEC-015 | — | Not Started | — | — | — | — | Spec target differs from shipped 5-slot bar | Decide when Studio/Growth ship |
| Platform | Optional cloud sync / accounts / AI / commercial | — | Later | Not Started | — | — | — | — | Separate threat model and approval | None until requested |

## Open user decisions

1. Report post-promotion smoke F101–F102 for `v0.1.1`.
2. Create a `v0.1.1` Git tag / GitHub Release, or not.
3. Review and merge CP-012A Data Health (PR #21), then run DH101–DH104 and watch for the new update banner (U103–U104).
4. v0.1.2 product choices: Data Health issue taxonomy and wording; unlink/reassign UX; dashboard summaries; how to show last-export time without implying a verified backup.
5. Later: 32-skill rubric authoring, CV templates, job-fit rule dictionary, navigation redesign.

## Update procedure (every PR)

1. Move affected rows forward one status at a time with evidence (PR number, CI run, test counts).
2. Only the user's physical-device report moves a row to **Accepted**; record which check IDs.
3. Add new rows for newly discovered defects with an incident ID; never delete history.
4. Refresh the progress summary and the "Last updated" line.
